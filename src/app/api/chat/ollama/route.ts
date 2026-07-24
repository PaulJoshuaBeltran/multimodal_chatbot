// /src/app/api/chat/ollama/route.ts
import { ollama } from '@/lib/ollama'
import { readFile } from 'fs/promises'
import { uploadPathFromUrl } from '@/lib/uploads'
import type { Attachment, ProcessedMessage } from '@/src/types/msg_conversation_model'

type IncomingMessage = {
  role: string
  content: string
  attachments?: Attachment[]
}

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

export async function POST(req: Request) {
  try {
    const { messages, model, system, temperature, top_p, top_k } = (await req.json()) as {
      messages: IncomingMessage[]
      model?: string
      system?: string
      temperature?: number
      top_p?: number
      top_k?: number
    }
    const modelToUse = model ?? process.env.DEFAULT_MODEL ?? 'gemma4:12b'

    const messagesWithAttachments = await Promise.all(
      messages.map(async (m) => {
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
          return { role: m.role, content: finalContent }
        }
        
        console.log('Processing', imageAttachments.length, 'images for message')
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

    console.log('Sending to Ollama model:', modelToUse, 'with', fullMessages.length, 'messages')
    const hasImages = fullMessages.some((m: ProcessedMessage) => m.images && m.images.length > 0)
    if (hasImages) {
      console.log('Request includes images')
    }

    // Stream response with timeout
    const stream = await ollama.chat({
      model: modelToUse,
      messages: fullMessages,
      stream: true,
      ...(Object.keys(options).length > 0 && { options }),
    }).catch((err: unknown) => {
      const error = err as Error & { response?: { data?: unknown } }
      console.error('Ollama chat error:', {
        message: error.message,
        response: error.response?.data,
        model: modelToUse,
        hasImages
      })
      throw error
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
          const err = streamErr as Error & { response?: { data?: unknown } }
          console.error('Stream error:', err.message, err.response?.data)
          
          const isImageError = err.message?.includes('Failed to load image') || 
                               err.message?.includes('image') || 
                               err.message?.includes('audio')
          
          if (isImageError) {
            const diagnostic = [
              '\n\n**⚠️ Image Processing Failed**',
              `Error from Ollama: ${err.message}`,
              '\nPossible causes:',
              '1. The image file format may not be supported',
              '2. The image may be corrupted or incomplete',
              '3. Try uploading a PNG or JPEG image instead',
              '4. Make sure the image file is not too large',
            ].join('\n')
            controller.enqueue(enc.encode(diagnostic))
          } else {
            controller.enqueue(enc.encode(`\n\n[Error: ${err.message}]`))
          }
          controller.close()
        }
      },
    })

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (err: unknown) {
    const error = err as Error & { message?: string }
    const errorMsg = error.message || 'Failed to connect to the Ollama service.'
    console.error('Chat endpoint error:', errorMsg)
    return new Response(errorMsg, { status: 500 })
  }
}