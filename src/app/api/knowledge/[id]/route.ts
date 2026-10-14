// src/app/api/knowledge/[id]/route.ts
import { deleteDocumentChunks, upsertDocumentChunks } from '@/src/lib/pineconeMongo/pinecone'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/pineconeMongo/prisma'
import { getLocalUser } from '@/src/lib/getLocalUser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

async function requireOwnedDoc(id: string) {
  const user = await getLocalUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const doc = await prisma.knowledgeDocument.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!doc) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  return { user }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const check = await requireOwnedDoc(id)
  if (check.error) return check.error

  const { title, text, category } = await req.json()

  await prisma.knowledgeDocument.update({ where: { id }, data: { status: 'processing' } })
  await deleteDocumentChunks(id)
  const chunkCount = await upsertDocumentChunks({
    documentId: id,
    userId: check.user!.id,
    text,
    title,
    category,
  })
  const doc = await prisma.knowledgeDocument.update({
    where: { id },
    data: { title, category, status: 'ready', chunkCount },
  })
  return NextResponse.json(doc)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const check = await requireOwnedDoc(id)
  if (check.error) return check.error

  await deleteDocumentChunks(id)
  await prisma.knowledgeDocument.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}