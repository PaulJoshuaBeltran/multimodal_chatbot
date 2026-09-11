// lib/huggingFace.ts
import { RerankResult } from "@/src/types/rag";
export async function rerank(
  query: string,
  documents: string[],
  topN: number = 5,
): Promise<RerankResult[]> {
  const scores = await Promise.all(
    documents.map(async (doc) => {
      const res = await fetch(
        "https://router.huggingface.co/hf-inference/models/BAAI/bge-reranker-base",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: [{ text: query, text_pair: doc }],
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`HF Inference API error: ${res.status} ${await res.text()}`);
      }

      const output: { label: string; score: number }[][] = await res.json();
      return output[0]?.[0]?.score ?? 0;
    }),
  );

  return scores
    .map((score, index) => ({ index, score, text: documents[index] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}