import { deleteDocumentChunks, upsertDocumentChunks } from "@/lib/rag";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import pinecone from "@/lib/pinecone";
import { KnowledgeChunk } from "@/src/types/knowledge";

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

  const index = pinecone.index(process.env.PINECONE_INDEX_NAME || "index-name").namespace(params.kbId);

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
    const fetched : KnowledgeChunk[] = await index.fetch(ids);
    chunks = Object.values(fetched ?? {})
      .map((record) => ({
        id: record.id,
        chunkIndex: (record.metadata?.chunkIndex as number) ?? 0,
        preview: ((record.metadata?.text as string) ?? "").slice(0, 200),
      }))
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  return NextResponse.json({
    ...doc,
    chunks: {
      count: chunks.length,
      items: chunks,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { kbId: string; docId: string } }
) {
  const { title, text } = await req.json();

  await prisma.knowledgeDocument.update({
    where: { id: params.docId },
    data: { status: "processing" },
  });

  await deleteDocumentChunks(params.kbId, params.docId);
  const chunkCount = await upsertDocumentChunks({
    kbId: params.kbId,
    documentId: params.docId,
    text,
    title,
  });

  const doc = await prisma.knowledgeDocument.update({
    where: { id: params.docId },
    data: { title, status: "ready", chunkCount },
  });

  return NextResponse.json(doc);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { kbId: string; docId: string } }
) {
  await deleteDocumentChunks(params.kbId, params.docId);
  await prisma.knowledgeDocument.delete({ where: { id: params.docId } });
  return NextResponse.json({ deleted: true });
}