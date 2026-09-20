import { deleteDocumentChunks, upsertDocumentChunks } from "@/lib/pineconeMongo/pinecone";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/pineconeMongo/prisma";

// Pinecone and MongoDB document chunk update
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { title, text, category } = await req.json();
  const { id } = await params;

  await prisma.knowledgeDocument.update({
    where: { id },
    data: { status: "processing" },
  });

  await deleteDocumentChunks(id);
  const chunkCount = await upsertDocumentChunks({
    documentId: id,
    text,
    title,
    category,
  });

  const doc = await prisma.knowledgeDocument.update({
    where: { id },
    data: { title, category, status: "ready", chunkCount },
  });

  return NextResponse.json(doc);
}

// Pinecone and MongoDB document chunk delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  await deleteDocumentChunks(id);
  await prisma.knowledgeDocument.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
