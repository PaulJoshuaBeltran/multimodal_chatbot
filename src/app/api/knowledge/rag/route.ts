// src/app/api/chat/rag/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ollamaEmbed } from "@/lib/ollama";
import pinecone from "@/lib/pinecone";
import { rerank } from "@/lib/huggingFace";

// Pinecone RAG API route and HF BGE Reranking wrapped in langchain
export async function POST(req: NextRequest) {
  const { kbId, query, topK = 2 } = await req.json();

  const [queryVector] = await ollamaEmbed([query]);
  const index = pinecone.index({ host: process.env.PINECONE_HOST_NAME || "" }).namespace(kbId);

  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  const similaritySearch = results.matches
    .map((m) => ({ text: m.metadata?.text as string, score: m.score }))
    .filter(Boolean);
  const documents = similaritySearch.map((m) => m.text);

  const reranked = await rerank(query, documents);

  const rerankedMatches = reranked.map((r) => ({
    ...results.matches[r.index],
    rerankScore: r.score,
  }));

  return NextResponse.json({ similaritySearch, rerankedMatches });
}
