// /src/app/api/chat/ollama/route.ts
import { ollama } from '@/lib/ollama'

export async function POST(req: Request) {
  const { messages, model } = await req.json()
  const modelToUse = model ?? process.env.DEFAULT_MODEL ?? 'gemma4:e4b'

  const stream = await ollama.chat({
    model: modelToUse,
    messages,
    stream: true,
  })

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      for await (const chunk of stream) {
              const c = chunk as unknown as { message?: { content?: string }; content?: string; done?: boolean }
              const content = c.message?.content ?? c.content ?? ''
              controller.enqueue(enc.encode(content))
              if (c.done) controller.close()
            }
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}