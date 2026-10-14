// src/app/api/knowledge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/pineconeMongo/prisma'
import pinecone, { upsertDocumentChunks } from '@/src/lib/pineconeMongo/pinecone'
import { ChunkMetadata, KnowledgeChunk } from '@/src/types/knowledge'
import { getLocalUser } from '@/src/lib/getLocalUser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FETCH_BATCH_SIZE = 1000

export async function GET() {
  const user = await getLocalUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const docs = await prisma.knowledgeDocument.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  if (!docs.length) return NextResponse.json({ documents: [] })

  const index = pinecone
    .index({ host: process.env.PINECONE_HOST_NAME || '' })
    .namespace(process.env.PINECONE_NAMESPACE || '')

  const chunksByDocId = new Map<string, KnowledgeChunk[]>()

  await Promise.all(
    docs.map(async (doc) => {
      const ids: string[] = []
      let token: string | undefined
      do {
        const page = await index.listPaginated({ prefix: `${doc.id}::`, paginationToken: token })
        ids.push(...(page.vectors ?? []).map((v) => v.id!))
        token = page.pagination?.next
      } while (token)

      const chunks: KnowledgeChunk[] = []
      for (let i = 0; i < ids.length; i += FETCH_BATCH_SIZE) {
        const fetched = await index.fetch({ ids: ids.slice(i, i + FETCH_BATCH_SIZE) })
        for (const record of Object.values(fetched.records ?? {})) {
          const metadata = record.metadata as ChunkMetadata | undefined
          chunks.push({
            id: record.id,
            chunkIndex: metadata?.chunkIndex ?? Number(record.id.split('::')[1] ?? 0),
            preview: metadata?.text ?? '',
          })
        }
      }
      chunksByDocId.set(doc.id, chunks.sort((a, b) => a.chunkIndex - b.chunkIndex))
    })
  )

  const documents = docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    chunks: chunksByDocId.get(doc.id) ?? [],
  }))

  return NextResponse.json({ documents })
}

export async function POST(req: NextRequest) {
  const user = await getLocalUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, text, category } = await req.json()

  const doc = await prisma.knowledgeDocument.create({
    data: { title, category, status: 'processing', userId: user.id }, // from the session, never the body
  })

  try {
    const chunkCount = await upsertDocumentChunks({
      documentId: doc.id,
      userId: user.id,
      text,
      title,
      category,
    })
    await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: { status: 'ready', chunkCount },
    })
  } catch (err) {
    await prisma.knowledgeDocument.update({ where: { id: doc.id }, data: { status: 'failed' } })
    return NextResponse.json({ error: `Ingestion failed: ${err}` }, { status: 500 })
  }

  return NextResponse.json({ id: doc.id, status: 'ready' })
}