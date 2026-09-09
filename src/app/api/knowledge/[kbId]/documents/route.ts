// src/app/api/knowledge/[kbId]/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertDocumentChunks } from "@/lib/rag";

// Pinecone & MongoDB document chunk upsert helper
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

// List all documents from MongoDB
export async function GET(_req: NextRequest, { params }: { params: { kbId: string } }) {
  const { kbId } = await params;
  const docs = await prisma.knowledgeDocument.findMany({
    where: { kbId: kbId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}