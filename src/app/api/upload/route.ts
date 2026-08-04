// src/app/api/upload/route.ts
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { auth } from '@clerk/nextjs/server'
import { UPLOAD_DIR, classifyAndValidate, uploadErrorMessage } from '@/lib/uploads'
import { MIME_TYPES } from '@/src/types/file_upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return new Response(JSON.stringify({ error: 'Malformed upload request.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const file = form.get('file') as File | null
    if (!file) {
      return new Response(JSON.stringify({ error: uploadErrorMessage('NO_FILE') }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const validation = classifyAndValidate(file)
    if (!validation.ok) {
      const status = validation.error === 'TOO_LARGE' ? 413 : 400
      return new Response(JSON.stringify({ error: uploadErrorMessage(validation.error) }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const file_format = file.name.split('.').at(-1)
    const mime_type = MIME_TYPES[file_format ? `.${file_format}` : ''] || "unknown/file"
    const file_type = mime_type.startsWith('application/') ||
      mime_type.startsWith('text/') ? 'document' : mime_type.split('/')[0];
    console.log('[TEST 3] file_type:', file_type)

    try {
      await mkdir(UPLOAD_DIR(file_type), { recursive: true })
    } catch {
      return new Response(JSON.stringify({ error: 'Server could not prepare storage for the upload.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const ext = path.extname(file.name)
    const safeName = `${randomUUID()}${ext}`

    let buffer: Buffer
    try {
      buffer = Buffer.from(await file.arrayBuffer())
    } catch {
      return new Response(JSON.stringify({ error: 'Could not read the uploaded file.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      await writeFile(path.join(UPLOAD_DIR(file_type), safeName), buffer)
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to save the file. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        url: `/api/uploads/${safeName}`,
        fileName: file.name,
        fileType: validation.fileType,
        mimeType: file.type || 'unknown/file',
        size: file.size,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Upload failed:', err)
    return new Response(JSON.stringify({ error: 'Unexpected error while uploading.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}