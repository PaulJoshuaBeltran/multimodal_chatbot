// src/app/api/knowledge/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/pineconeMongo/prisma";
import pinecone from "@/lib/pineconeMongo/pinecone";

interface Chunk {
  id: string;
  chunkIndex: number;
  preview: string;
}

interface ChunkMetadata {
  chunkIndex?: number;
  text?: string;
}

const FETCH_BATCH_SIZE = 1000;

export async function GET() {
  const docs = await prisma.knowledgeDocument.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (!docs.length) {
    return NextResponse.json({ documents: [] });
  }

  const index = pinecone.index({ host: process.env.PINECONE_HOST_NAME || "" });

  // 1. Discover all namespaces
  const stats = await index.describeIndexStats();
  const namespaceNames = Object.keys(stats.namespaces ?? {});

  const chunksByDocId = new Map<string, Chunk[]>();

  // 2. List + fetch within EACH namespace
  for (const ns of namespaceNames) {
    const nsIndex = index.namespace(ns);

    const idsInNamespace: string[] = [];
    let paginationToken: string | undefined;
    do {
      const page = await nsIndex.listPaginated({ paginationToken });
      idsInNamespace.push(...(page.vectors ?? []).map((v) => v.id!));
      paginationToken = page.pagination?.next;
    } while (paginationToken);

    if (!idsInNamespace.length) continue;

    for (let i = 0; i < idsInNamespace.length; i += FETCH_BATCH_SIZE) {
      const batchIds = idsInNamespace.slice(i, i + FETCH_BATCH_SIZE);
      const fetched = await nsIndex.fetch({ ids: batchIds });

      for (const record of Object.values(fetched.records ?? {})) {
        const [mongoDocId, chunkIndexStr] = record.id.split("::");
        const metadata = record.metadata as ChunkMetadata | undefined;

        const chunk: Chunk = {
          id: record.id,
          chunkIndex: metadata?.chunkIndex ?? Number(chunkIndexStr) ?? 0,
          preview: metadata?.text ?? "",
        };

        const existing = chunksByDocId.get(mongoDocId) ?? [];
        existing.push(chunk);
        chunksByDocId.set(mongoDocId, existing);
      }
    }
  }

  // 3. Match to Prisma docs
  const documents = docs.map((doc) => {
    const chunks = (chunksByDocId.get(doc.id) ?? []).sort(
      (a, b) => a.chunkIndex - b.chunkIndex
    );
    return { id: doc.id,
      title: doc.title,
      kbId: doc.kbId,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      chunks};
  });

  return NextResponse.json({ documents });
}