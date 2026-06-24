// /src/app/api/chat/ollama/route.ts
import { ollama } from '@/lib/ollama'

export async function POST(req: Request) {
  try {
    const { messages, model, system, temperature, top_p, top_k } = await req.json()
    const modelToUse = model ?? process.env.DEFAULT_MODEL ?? 'gemma4:e4b'

    // Prepend system message if provided
    const fullMessages = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages

    // Build Ollama options — only include params that were explicitly sent
    const options: Record<string, number> = {}
    if (temperature !== undefined) options.temperature = temperature
    if (top_p !== undefined) options.top_p = top_p
    if (top_k !== undefined) options.top_k = top_k

    const stream = await ollama.chat({
      model: modelToUse,
      messages: fullMessages,
      stream: true,
      ...(Object.keys(options).length > 0 && { options }),
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