// /src/app/api/chat/ollama/route.ts
import { ollama } from '@/lib/ollama'

export async function POST(req: Request) {
  try {
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
        try {
          for await (const chunk of stream) {
            const c = chunk as unknown as { message?: { content?: string }; content?: string; done?: boolean }
            const content = c.message?.content ?? c.content ?? ''
            controller.enqueue(enc.encode(content))
            if (c.done) controller.close()
          }
        } catch (streamErr: unknown) {
          const err = streamErr as Error
          controller.enqueue(enc.encode(`\n\n[Stream Error: ${err.message}]`))
          controller.close()
        }
      },
    })

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (err: unknown) {
    const error = err as Error
    return new Response(error.message || 'Failed to connect to the Ollama service.', { status: 500 })
  }
}