import { embed } from "@/lib/rag";
import pinecone from "@/lib/pinecone";
import { NextRequest, NextResponse } from "next/server";

// POST /api/chat/rag: RAG Usage
export async function POST(req: NextRequest) {
  const { kbId, query, topK = 5 } = await req.json();

  const [queryVector] = await embed([query]);
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME || "index-name").namespace(kbId);

  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  const context = results.matches
    .map((m) => m.metadata?.text as string)
    .filter(Boolean)
    .join("\n\n---\n\n");

  return NextResponse.json({ context, matches: results.matches });
}