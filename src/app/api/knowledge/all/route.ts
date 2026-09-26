import { NextResponse } from "next/server";
import { prisma } from "@/lib/pineconeMongo/prisma";
import pinecone from "@/lib/pineconeMongo/pinecone";
import { ChunkMetadata, KnowledgeChunk } from "@/src/types/knowledge";

const FETCH_BATCH_SIZE = 1000;

// EVENTUALLY, REMOVE FOLDERS NAMELY ALL AND DOCUMENT

export async function GET() {
  const docs = await prisma.knowledgeDocument.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (!docs.length) {
    return NextResponse.json({ documents: [] });
  }

  const index = pinecone
    .index({ host: process.env.PINECONE_HOST_NAME || "" })
    .namespace(process.env.PINECONE_NAMESPACE || "");

  const chunksByDocId = new Map<string, KnowledgeChunk[]>();

  const idsInNamespace: string[] = [];
  let paginationToken: string | undefined;
  do {
    const page = await index.listPaginated({ paginationToken });
    idsInNamespace.push(...(page.vectors ?? []).map((v) => v.id!));
    paginationToken = page.pagination?.next;
  } while (paginationToken);

  for (let i = 0; i < idsInNamespace.length; i += FETCH_BATCH_SIZE) {
    const batchIds = idsInNamespace.slice(i, i + FETCH_BATCH_SIZE);
    const fetched = await index.fetch({ ids: batchIds });

    for (const record of Object.values(fetched.records ?? {})) {
      const [mongoDocId, chunkIndexStr] = record.id.split("::");
      const metadata = record.metadata as ChunkMetadata | undefined;

      const chunk: KnowledgeChunk = {
        id: record.id,
        chunkIndex: metadata?.chunkIndex ?? Number(chunkIndexStr) ?? 0,
        preview: metadata?.text ?? "",
      };

      const existing = chunksByDocId.get(mongoDocId) ?? [];
      existing.push(chunk);
      chunksByDocId.set(mongoDocId, existing);
    }
  }

  const documents = docs.map((doc) => {
    const chunks = (chunksByDocId.get(doc.id) ?? []).sort(
      (a, b) => a.chunkIndex - b.chunkIndex
    );
    return {
      id: doc.id,
      title: doc.title,
      category: doc.category,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      chunks,
    };
  });

  return NextResponse.json({ documents });
}
