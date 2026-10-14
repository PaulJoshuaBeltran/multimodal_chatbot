// src/lib/pineconeMongo/pinecone.ts
// src/lib/pineconeMongo/pinecone.ts
import { Pinecone } from "@pinecone-database/pinecone";
import { ollamaEmbed } from "../ollama";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "",
});

export default pinecone;

const UPSERT_BATCH_SIZE = 100;   // Pinecone caps request size (2MB); 100 records is the recommended batch
const DELETE_BATCH_SIZE = 1000;  // deleteMany accepts at most 1000 ids per call

function getIndex() {
  return pinecone
    .index({ host: process.env.PINECONE_HOST_NAME || "" })
    .namespace(process.env.PINECONE_NAMESPACE || "");
}

export function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break; // without this, a redundant tail chunk (already inside the last one) is emitted
    start += size - overlap;
  }
  return chunks;
}

// Pinecone document chunk upsert helper
export async function upsertDocumentChunks({
  documentId,
  userId,
  text,
  title,
  category,
}: {
  documentId: string;
  userId: string;
  text: string;
  title: string;
  category: string;
}) {
  const chunks = chunkText(text);
  if (chunks.length === 0) return 0;

  const vectors = await ollamaEmbed(chunks);
  const index = getIndex();

  const records = chunks.map((chunk, i) => ({
    id: `${documentId}::${i}`,
    values: vectors[i],
    metadata: {
      documentId,
      userId, // lets the RAG query filter per user
      title,
      category,
      chunkIndex: i,
      text: chunk,
    },
  }));

  for (let i = 0; i < records.length; i += UPSERT_BATCH_SIZE) {
    await index.upsert({ records: records.slice(i, i + UPSERT_BATCH_SIZE) });
  }

  return chunks.length;
}

// Pinecone document chunk delete helper
export async function deleteDocumentChunks(documentId: string) {
  const index = getIndex();
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

  for (let i = 0; i < ids.length; i += DELETE_BATCH_SIZE) {
    await index.deleteMany({ ids: ids.slice(i, i + DELETE_BATCH_SIZE) });
  }
  return ids.length;
}