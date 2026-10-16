// src/app/api/chat/ollama/route.ts
import { ollama } from '@/src/lib/ollama'
import { loadImageBase64 } from '@/src/lib/uploads'
import type { Message as OllamaMessage, Tool, ToolCall } from 'ollama'
import type { ProcessedMessage } from '@/src/types/msg_conversation_model'
import type { IncomingMessage, GraphOutput } from '@/src/types/chat'
import type { ChatPart, StreamEvent } from '@/src/types/chat_parts'
import { retrieveForDocument, formatDocumentContext } from '@/src/lib/langchain/rag'
import { evaluateAnswer } from '@/src/lib/langsmith/onlineEval'
import { chatToolDefinitions, executeTool, type Args } from '@/src/lib/toolcall/registry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_TOOL_ROUNDS = 4
const TOOLS_UNSUPPORTED = /does not support tools/i
const VIZ_HINT =
  'When the user asks to chart, plot, tabulate or diagram data, call the matching visualize_* tool ' +
  'instead of describing it in text, then add at most a short comment. Do not repeat the data afterwards.'

type ChatChunk = {
  message?: { content?: string; tool_calls?: ToolCall[] }
  content?: string
  done?: boolean
}

const startChat = (
  model: string,
  messages: OllamaMessage[],
  options: Record<string, number>,
  tools?: Tool[],
) =>
  ollama.chat({
    model,
    messages,
    stream: true,
    ...(tools?.length && { tools }),
    ...(Object.keys(options).length > 0 && { options }),
  })
type OllamaStream = Awaited<ReturnType<typeof startChat>>

const RUNNER_CRASH =
  /llama-server process has terminated|runner process has terminated|0xc0000409|CUDA error/i

const FALLBACKS: { label: string; override: Record<string, number>; capCtx?: number }[] = [
  { label: 'same options', override: {} },
  { label: 'reduced ctx/batch', override: { num_batch: 128 }, capCtx: 4096 },
  { label: 'CPU only', override: { num_gpu: 0 }, capCtx: 4096 },
]

async function chatWithRecovery(
  model: string,
  messages: OllamaMessage[],
  baseOptions: Record<string, number>,
  tools?: Tool[],
): Promise<{ chunks: AsyncGenerator<ChatChunk>; abort: () => void }> {
  let lastErr: unknown
  for (let i = 0; i < FALLBACKS.length; i++) {
    const { label, override, capCtx } = FALLBACKS[i]
    const options = { ...baseOptions, ...override }
    if (capCtx) options.num_ctx = Math.min(baseOptions.num_ctx ?? capCtx, capCtx)

    let stream: OllamaStream | undefined
    try {
      if (i > 0) console.warn(`Retrying Ollama (attempt ${i + 1}/${FALLBACKS.length}: ${label})`)
      stream = await startChat(model, messages, options, tools)
      const it = stream[Symbol.asyncIterator]()
      const first = await it.next()

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
      await new Promise((r) => setTimeout(r, 1500))
    }
  }
  throw lastErr
}

// Models without tool support reject `tools`: retry the same request without them.
async function startWithOptionalTools(
  model: string,
  messages: OllamaMessage[],
  options: Record<string, number>,
  tools: Tool[],
) {
  try {
    return { ...(await chatWithRecovery(model, messages, options, tools)), toolsOn: tools.length > 0 }
  } catch (err) {
    if (tools.length && TOOLS_UNSUPPORTED.test((err as Error)?.message ?? '')) {
      console.warn('Model has no tool support, continuing without tools')
      return { ...(await chatWithRecovery(model, messages, options)), toolsOn: false }
    }
    throw err
  }
}

function pushText(parts: ChatPart[], text: string) {
  const last = parts[parts.length - 1]
  if (last?.type === 'text') last.text += text
  else parts.push({ type: 'text', text })
}

export async function POST(req: Request) {
  try {
    const { messages, model, system, temperature, top_p, top_k, num_ctx, num_predict } =
      (await req.json()) as {
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

    // 1. Documents on the latest user turn -> langchain (loader + graph retrieval)
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf('user')
    const lastUser = messages[lastUserIdx]
    const docAtts = (lastUser?.attachments ?? []).filter((a) => a.fileType === 'document')
    const settled = await Promise.allSettled(docAtts.map((a) => retrieveForDocument(a, lastUser.content ?? '')))
    settled.forEach((r, i) => {
      if (r.status === 'rejected') console.warn(`RAG failed for ${docAtts[i].fileName}:`, r.reason)
    })
    const ragResults = settled.flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []))
    const docContext = formatDocumentContext(ragResults)

    // 2. Build Ollama messages (text, images, document/audio metadata)
    const messagesWithAttachments = await Promise.all(
      messages.map(async (m, idx) => {
        const imageAttachments = (m.attachments ?? []).filter((a) => a.fileType === 'image')
        const documentAttachments = (m.attachments ?? []).filter((a) => a.fileType === 'document')
        const audioAttachments = (m.attachments ?? []).filter((a) => a.fileType === 'audio')

        let finalContent = m.content

        if (documentAttachments.length > 0) {
          const docInfo = documentAttachments
            .map((doc) => `[Document: ${doc.fileName} (${doc.mimeType})]`)
            .join('\n')
          finalContent = finalContent ? `${finalContent}\n\n${docInfo}` : docInfo
        }
        if (audioAttachments.length > 0) {
          const audioInfo = audioAttachments.map((a) => `[Audio: ${a.fileName}]`).join('\n')
          finalContent = finalContent ? `${finalContent}\n\n${audioInfo}` : audioInfo
        }
        // Server-side only: extracted text + KB context for the latest turn
        if (idx === lastUserIdx && docContext) {
          finalContent = finalContent ? `${finalContent}\n\n${docContext}` : docContext
        }

        if (imageAttachments.length === 0) return { role: m.role, content: finalContent }

        const images = (await Promise.all(imageAttachments.map((a) => loadImageBase64(a.url))))
          .filter((b): b is string => b !== null)
        if (images.length === 0) {
          console.warn('No images were successfully loaded')
          return { role: m.role, content: finalContent }
        }
        return { role: m.role, content: finalContent, images }
      })
    )

    const systemText = [system?.trim(), VIZ_HINT].filter(Boolean).join('\n\n')
    const fullMessages = [{ role: 'system', content: systemText }, ...messagesWithAttachments]

    const options: Record<string, number> = {}
    if (temperature !== undefined) options.temperature = temperature
    if (top_p !== undefined) options.top_p = top_p
    if (top_k !== undefined) options.top_k = top_k
    if (num_ctx !== undefined) options.num_ctx = num_ctx
    if (num_predict !== undefined) options.num_predict = num_predict

    const hasImages = fullMessages.some((m) => (m as ProcessedMessage).images?.length)
    console.log('Sending to Ollama model:', modelToUse, 'with', fullMessages.length, 'messages', { hasImages, docs: ragResults.length })

    // 3. Start streaming (HTTP 500 on failure to start, as before)
    let current = await startWithOptionalTools(
      modelToUse, fullMessages as OllamaMessage[], options, chatToolDefinitions,
    ).catch((err: unknown) => {
      const error = err as Error & { response?: { data?: unknown } }
      console.error('Ollama chat error:', { message: error.message, response: error.response?.data, model: modelToUse, hasImages })
      throw error
    })

    let abortCurrent = current.abort
    req.signal.addEventListener('abort', () => abortCurrent(), { once: true })

    const readable = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder()
        const emit = (ev: StreamEvent) => controller.enqueue(enc.encode(JSON.stringify(ev) + '\n'))
        const parts: ChatPart[] = []
        const convo = [...fullMessages] as OllamaMessage[]

        try {
          for (let round = 0; ; round++) {
            let text = ''
            const calls: ToolCall[] = []

            for await (const c of current.chunks) {
              const delta = c.message?.content ?? c.content ?? ''
              if (delta) {
                text += delta
                pushText(parts, delta)
                emit({ type: 'text', text: delta })
              }
              if (c.message?.tool_calls?.length) calls.push(...c.message.tool_calls)
            }

            if (!calls.length || !current.toolsOn || round >= MAX_TOOL_ROUNDS) break

            convo.push({ role: 'assistant', content: text, tool_calls: calls })
            for (const call of calls) {
              const name = call.function.name
              const out = await executeTool(name, (call.function.arguments ?? {}) as Args, 'chat')
              for (const p of out.parts) { parts.push(p); emit(p) }
              convo.push({ role: 'tool', tool_name: name, content: out.content })
            }

            current = await startWithOptionalTools(modelToUse, convo, options, chatToolDefinitions)
            abortCurrent = current.abort
          }

          emit({ type: 'done', parts })
          controller.close()

          // Fire-and-forget LangSmith evaluators on the streamed answer (only when RAG ran)
          const context = ragResults.map((r) => r.context).filter(Boolean).join('\n\n')
          if (ragResults.length && !req.signal.aborted) {
            const response = parts.filter((p) => p.type === 'text').map((p) => p.text).join('')
            const output = {
              context,
              response,
              isFallback: ragResults.every((r) => r.isFallback),
              guardrailFlags: [],
            } as GraphOutput
            void evaluateAnswer(output)
          }
        } catch (streamErr: unknown) {
          if (req.signal.aborted) {
            try { controller.close() } catch { /* already closed */ }
            return
          }
          const err = streamErr as Error & { response?: { data?: unknown } }
          console.error('Stream error:', err.message, err.response?.data)

          const isImageError = /Failed to load image|image|audio/.test(err.message ?? '')
          const hint = isImageError
            ? ' (image/audio processing failed: try a PNG or JPEG, check the file is intact and not too large)'
            : ''
          emit({ type: 'error', message: `${err.message}${hint}` })
          try { controller.close() } catch { /* already closed */ }
        }
      },
      cancel() { abortCurrent() },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err: unknown) {
    const errorMsg = (err as Error).message || 'Failed to connect to the Ollama service.'
    console.error('Chat endpoint error:', errorMsg)
    return new Response(errorMsg, { status: 500 })
  }
}