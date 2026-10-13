// src/app/api/chat/ollama/route.ts
import { ollama } from '@/src/lib/ollama'
import { readFile } from 'fs/promises'
import { uploadPathFromUrl } from '@/src/lib/uploads'
import type { Message as OllamaMessage } from 'ollama'
import type { ProcessedMessage } from '@/src/types/msg_conversation_model'
import { IncomingMessage } from '@/src/types/chat'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function loadImageBase64(url: string): Promise<string | null> {
  try {
    const filePath = uploadPathFromUrl(url)
    console.log('Loading image from:', filePath, '| raw url was:', url)
    const buf = await readFile(filePath)
    console.log('Image loaded successfully, size:', buf.length, 'bytes')

    // Clean raw base64 string (no data URI header, no newlines)
    return buf.toString('base64').replace(/[\r\n\s]+/g, '')
  } catch (err) {
    console.error('Failed to load image:', url, err)
    return null
  }
}

// Runner crash recovery
type ChatChunk = { message?: { content?: string }; content?: string; done?: boolean }

const startChat = (
  model: string,
  messages: OllamaMessage[],
  options: Record<string, number>
) =>
  ollama.chat({
    model,
    messages,
    stream: true,
    ...(Object.keys(options).length > 0 && { options }),
  })
type OllamaStream = Awaited<ReturnType<typeof startChat>>

const RUNNER_CRASH =
  /llama-server process has terminated|runner process has terminated|0xc0000409|CUDA error/i

// Tried in order. The runner respawns on the next request, so a plain retry often works.
const FALLBACKS: { label: string; override: Record<string, number>; capCtx?: number }[] = [
  { label: 'same options', override: {} },
  { label: 'reduced ctx/batch', override: { num_batch: 128 }, capCtx: 4096 },
  { label: 'CPU only', override: { num_gpu: 0 }, capCtx: 4096 },
]

/**
 * Starts the stream AND pulls the first chunk before returning. A crash while the
 * model loads can surface either from ollama.chat() or from the first iteration,
 * so both are covered. No tokens have been sent to the client at this point, so
 * retrying is safe. Crashes after the first chunk are reported by the stream handler.
 */
async function chatWithRecovery(
  model: string,
  messages: OllamaMessage[],
  baseOptions: Record<string, number>
): Promise<{ chunks: AsyncGenerator<ChatChunk>; abort: () => void }> {
  let lastErr: unknown

  for (let i = 0; i < FALLBACKS.length; i++) {
    const { label, override, capCtx } = FALLBACKS[i]
    const options = { ...baseOptions, ...override }
    if (capCtx) options.num_ctx = Math.min(baseOptions.num_ctx ?? capCtx, capCtx)

    let stream: OllamaStream | undefined
    try {
      if (i > 0) console.warn(`Retrying Ollama (attempt ${i + 1}/${FALLBACKS.length}: ${label})`)
      stream = await startChat(model, messages, options)
      const it = stream[Symbol.asyncIterator]()
      const first = await it.next() // crash during model load surfaces here

      const active = stream
      async function* chunks(): AsyncGenerator<ChatChunk> {
        if (!first.done) yield first.value as ChatChunk
        while (true) {
          const n = await it.next()
          if (n.done) return
          yield n.value as ChatChunk
        }
      }
      return { chunks: chunks(), abort: () => active.abort() }
    } catch (err) {
      lastErr = err
      try { stream?.abort() } catch { /* already closed */ }
      const msg = (err as Error)?.message ?? ''
      if (!RUNNER_CRASH.test(msg) || i === FALLBACKS.length - 1) throw err
      console.warn(`Ollama runner crashed (${label}):`, msg)
      await new Promise((r) => setTimeout(r, 1500)) // give the runner time to respawn
    }
  }
  throw lastErr
}

// Main function route handler
export async function POST(req: Request) {
  try {
    const { messages, model, system, temperature, top_p, top_k, num_ctx, num_predict } = (await req.json()) as {
      messages: IncomingMessage[]
      model?: string
      system?: string
      temperature?: number
      top_p?: number
      top_k?: number
      num_ctx?: number
      num_predict?: number
    }
    const modelToUse = model ?? process.env.DEFAULT_MODEL ?? 'gemma4:12b'

    const messagesWithAttachments = await Promise.all(
      messages.map(async (m, idx) => {
        const imageAttachments = (m.attachments ?? []).filter((a) => a.fileType === 'image')
        const documentAttachments = (m.attachments ?? []).filter((a) => a.fileType === 'document')
        const audioAttachments = (m.attachments ?? []).filter((a) => a.fileType === 'audio')

        let finalContent = m.content

        // Add metadata for documents and audio to the content
        if (documentAttachments.length > 0) {
          const docInfo = documentAttachments
            .map((doc) => `[Document: ${doc.fileName} (${doc.mimeType})]`)
            .join('\n')
          finalContent = finalContent ? `${finalContent}\n\n${docInfo}` : docInfo
        }

        if (audioAttachments.length > 0) {
          const audioInfo = audioAttachments
            .map((audio) => `[Audio: ${audio.fileName}]`)
            .join('\n')
          finalContent = finalContent ? `${finalContent}\n\n${audioInfo}` : audioInfo
        }

        if (imageAttachments.length === 0) {
          // Helps diagnose "image missing on regenerate": a user turn with no attachments here
          if (m.role === 'user') console.log(`Message #${idx} (user): no image attachments`)
          return { role: m.role, content: finalContent }
        }

        console.log(`Message #${idx} (${m.role}): processing`, imageAttachments.length, 'images')
        const images = (
          await Promise.all(imageAttachments.map((a) => loadImageBase64(a.url)))
        ).filter((b): b is string => b !== null)

        console.log('Successfully loaded', images.length, 'images')

        if (images.length === 0) {
          console.warn('No images were successfully loaded')
          return { role: m.role, content: finalContent }
        }

        return { role: m.role, content: finalContent, images }
      })
    )

    const fullMessages = system
      ? [{ role: 'system', content: system }, ...messagesWithAttachments]
      : messagesWithAttachments

    const options: Record<string, number> = {}
    if (temperature !== undefined) options.temperature = temperature
    if (top_p !== undefined) options.top_p = top_p
    if (top_k !== undefined) options.top_k = top_k
    if (num_ctx !== undefined) options.num_ctx = num_ctx
    if (num_predict !== undefined) options.num_predict = num_predict

    console.log('Sending to Ollama model:', modelToUse, 'with', fullMessages.length, 'messages')
    const hasImages = fullMessages.some((m: ProcessedMessage) => m.images && m.images.length > 0)
    if (hasImages) {
      console.log('Request includes images')
    }

    // Stream response (with crash recovery)
    const { chunks, abort } = await chatWithRecovery(
      modelToUse,
      fullMessages as OllamaMessage[],
      options
    ).catch((err: unknown) => {
      const error = err as Error & { response?: { data?: unknown } }
      console.error('Ollama chat error:', {
        message: error.message,
        response: error.response?.data,
        model: modelToUse,
        hasImages,
      })
      throw error
    })

    // Client disconnected / Stop pressed -> stop generating on the Ollama side too
    req.signal.addEventListener('abort', () => abort(), { once: true })

    const readable = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder()
        try {
          for await (const c of chunks) {
            const content = c.message?.content ?? c.content ?? ''
            if (content) controller.enqueue(enc.encode(content))
          }
          controller.close() // close after the loop, not only when `done` arrives
        } catch (streamErr: unknown) {
          if (req.signal.aborted) {
            try { controller.close() } catch { /* already closed */ }
            return
          }

          const err = streamErr as Error & { response?: { data?: unknown } }
          console.error('Stream error:', err.message, err.response?.data)

          const isImageError = err.message?.includes('Failed to load image') ||
                               err.message?.includes('image') ||
                               err.message?.includes('audio')

          if (isImageError) {
            const diagnostic = [
              '\n\n**⚠️ Image Processing Failed**',
              '\nPossible causes:',
              '1. The image file format may not be supported',
              '2. The image may be corrupted or incomplete',
              '3. Try uploading a PNG or JPEG image instead',
              '4. Make sure the image file is not too large',
            ].join('\n')
            controller.enqueue(enc.encode(diagnostic))
          }

          // Always end with the sentinel line. The client regex /\n\n\[Error: (.+)\]$/
          // uses it to flag the message as an error and keep it out of future context.
          controller.enqueue(enc.encode(`\n\n[Error: ${err.message}]`))
          try { controller.close() } catch { /* already closed */ }
        }
      },
      cancel() {
        abort()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: unknown) {
    const error = err as Error & { message?: string }
    const errorMsg = error.message || 'Failed to connect to the Ollama service.'
    console.error('Chat endpoint error:', errorMsg)
    return new Response(errorMsg, { status: 500 })
  }
}