// src/app/api/knowledge/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/pineconeMongo/prisma";
import { upsertDocumentChunks } from "@/lib/pineconeMongo/pinecone";

// Pinecone & MongoDB document chunk upsert helper
export async function POST(req: NextRequest) {
  const { title, text, category } = await req.json();

  const doc = await prisma.knowledgeDocument.create({
    data: { title, category, status: "processing" },
  });

  try {
    const chunkCount = await upsertDocumentChunks({
      documentId: doc.id,
      text,
      title,
      category,
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