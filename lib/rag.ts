// src/lib/rag.ts
import { ollama } from "@/lib/ollama"; // your existing ollama client
import pinecone from "@/lib/pinecone";

export function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    start += size - overlap;
  }
  return chunks;
}

export async function embed(texts: string[]): Promise<number[][]> {
  const results = await Promise.all(
    texts.map((t) =>
      ollama.embeddings({ model: process.env.EMBED_MODEL || "nomic-embed-text", prompt: t })
    .then((r) => r.embedding)
    )
  );
  return results;
}

export async function upsertDocumentChunks({
  kbId,
  documentId,
  text,
  title,
}: {
  kbId: string;
  documentId: string;
  text: string;
  title: string;
}) {
  const chunks = chunkText(text);
  const vectors = await embed(chunks);
  const index = pinecone.index({
    host: process.env.PINECONE_HOST_NAME || ""
  });

  await index.upsert({
    records: chunks.map((chunk, i) => ({
      id: `${documentId}::${i}`,
      values: vectors[i],
      metadata: {
        documentId,
        title,
        chunkIndex: i,
        text: chunk
      },
    }))
  });

  return chunks.length;
}

export async function deleteDocumentChunks(kbId: string, documentId: string) {
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME || "index-name").namespace(kbId);
  const ids: string[] = [];
  let paginationToken: string | undefined;

  do {
    const page = await index.listPaginated({
      prefix: `${documentId}::`,
      paginationToken,
    });
    ids.push(...(page.vectors ?? []).map((v) => v.id!));
    paginationToken = page.pagination?.next;
  } while (paginationToken);

  if (ids.length) await index.deleteMany(ids);
  return ids.length;
}