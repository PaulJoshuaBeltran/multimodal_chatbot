import { deleteDocumentChunks, upsertDocumentChunks } from "@/lib/pinecone";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import pinecone from "@/lib/pinecone";

// List all documents from Pinecone and MongoDB
export async function GET(
  _req: NextRequest,
  { params }: { params: { kbId: string; docId: string } }
) {
  const doc = await prisma.knowledgeDocument.findUnique({
    where: { id: params.docId },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const index = pinecone.index({ host: process.env.PINECONE_HOST_NAME || "" }).namespace(params.kbId);

  // Pull chunk IDs by prefix, then fetch the actual records for preview/metadata
  const ids: string[] = [];
  let paginationToken: string | undefined;
  do {
    const page = await index.listPaginated({
      prefix: `${params.docId}::`,
      paginationToken,
    });
    ids.push(...(page.vectors ?? []).map((v) => v.id!));
    paginationToken = page.pagination?.next;
  } while (paginationToken);

  let chunks: { id: string; chunkIndex: number; preview: string }[] = [];

  if (ids.length) {
    // const fetched  = await index.fetch(ids);
    const fetched  = await index.fetch({ ids: ids.map((id) => id) });

    chunks = fetched.records
      ? Object.values(fetched.records).map((record) => ({
          id: record.id,
          chunkIndex: (record.metadata?.chunkIndex as number) ?? 0,
          preview: ((record.metadata?.text as string) ?? "").slice(0, 200),
        }))
      : [];
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  return NextResponse.json({
    ...doc,
    chunks: {
      count: chunks.length,
      items: chunks,
    },
  });
}

// Pinecone and MongoDB document chunk update
export async function PATCH(
  req: NextRequest,
  { params }: { params: { kbId: string; docId: string } }
) {
  const { title, text } = await req.json();
  const { kbId, docId } = await params;

  await prisma.knowledgeDocument.update({
    where: { id: docId },
    data: { status: "processing" },
  });

  await deleteDocumentChunks(kbId, docId);
  const chunkCount = await upsertDocumentChunks({
    kbId: kbId,
    documentId: docId,
    text,
    title,
  });

  const doc = await prisma.knowledgeDocument.update({
    where: { id: docId },
    data: { title, status: "ready", chunkCount },
  });

  return NextResponse.json(doc);
}

// Pinecone and MongoDB document chunk delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { kbId: string; docId: string } }
) {
  const { kbId, docId } = await params;
  await deleteDocumentChunks(kbId, docId);
  await prisma.knowledgeDocument.delete({ where: { id: docId } });
  return NextResponse.json({ deleted: true });
}