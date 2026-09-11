import { ollamaEmbed } from "@/lib/ollama";
import pinecone from "@/lib/pinecone";
import { NextRequest, NextResponse } from "next/server";

// Pinecone RAG API route and HF BGE Reranking wrapped in langchain
export async function POST(req: NextRequest) {
  const { kbId, query, topK = 5 } = await req.json();

  const [queryVector] = await ollamaEmbed([query]);
  const index = pinecone.index({ host: process.env.PINECONE_HOST_NAME || "" }).namespace(kbId);

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

// Pinecone RAG API route with Langchain wrapper