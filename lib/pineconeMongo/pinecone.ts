// lib/pinecone.ts
import { Pinecone } from "@pinecone-database/pinecone";
import { ollamaEmbed } from "../ollama";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "",
});

export default pinecone;

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

// Pinecone document chunk upsert helper
export async function upsertDocumentChunks({
  documentId,
  text,
  title,
  category,
}: {
  documentId: string;
  text: string;
  title: string;
  category: string;
}) {
  const chunks = chunkText(text);
  const vectors = await ollamaEmbed(chunks);
  const index = pinecone
    .index({ host: process.env.PINECONE_HOST_NAME || "" })
    .namespace(process.env.PINECONE_NAMESPACE || "");

  await index.upsert({
    records: chunks.map((chunk, i) => ({
      id: `${documentId}::${i}`,
      values: vectors[i],
      metadata: {
        documentId,
        title,
        category,
        chunkIndex: i,
        text: chunk,
      },
    })),
  });

  return chunks.length;
}

// Pinecone document chunk delete helper
export async function deleteDocumentChunks(documentId: string) {
  const index = pinecone
    .index({ host: process.env.PINECONE_HOST_NAME || "" })
    .namespace(process.env.PINECONE_NAMESPACE || "");
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

  if (ids.length) await index.deleteMany({ ids });
  return ids.length;
}
