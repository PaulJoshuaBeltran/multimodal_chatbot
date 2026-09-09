// src/app/api/knowledge/[kbId]/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertDocumentChunks } from "@/lib/rag";

export async function POST(req: NextRequest, { params }: { params: { kbId: string } }) {
  const { title, text } = await req.json();
  const { kbId } = await params;

  const doc = await prisma.knowledgeDocument.create({
    data: { kbId: kbId, title, status: "processing" },
  });

  try {
    const chunkCount = await upsertDocumentChunks({
      kbId: kbId,
      documentId: doc.id,
      text,
      title,
    });
    await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: { status: "ready", chunkCount },
    });
  } catch (err) {
    await prisma.knowledgeDocument.update({ where: { id: doc.id }, data: { status: "failed" } });
    return NextResponse.json({ error: `Ingestion failed: ${err}` }, { status: 500 });
  }

  return NextResponse.json({ id: doc.id, status: "ready" });
}

export async function GET(_req: NextRequest, { params }: { params: { kbId: string } }) {
  const docs = await prisma.knowledgeDocument.findMany({
    where: { kbId: params.kbId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}