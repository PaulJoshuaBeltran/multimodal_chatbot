// src/app/api/knowledge/rag/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ollamaEmbed } from "@/lib/ollama";
import pinecone from "@/lib/pineconeMongo/pinecone";
import { rerank } from "@/lib/huggingFace";

// Pinecone RAG API route and HF BGE Reranking wrapped in langchain
export async function POST(req: NextRequest) {
  const { query, topK } = await req.json();

  const [queryVector] = await ollamaEmbed([query]);

  const index = pinecone.index({ host: process.env.PINECONE_HOST_NAME || "" })
                        .namespace(process.env.PINECONE_NAMESPACE || "");

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

  return NextResponse.json({ results, similaritySearch, rerankedMatches });
}
