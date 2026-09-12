// lib/ollama.ts
import { Ollama } from 'ollama'

export const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL,
})

export async function ollamaEmbed(texts: string[]): Promise<number[][]> {
  const results = await Promise.all(
    texts.map((t) =>
      ollama.embeddings({ model: process.env.OLLAMA_EMBED_MODEL || "", prompt: t })
    .then((r) => r.embedding)
    )
  );
  return results;
}