// src/app/api/upload/route.ts
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { verifyToken } from '@/lib/auth'
import { UPLOAD_DIR, classifyAndValidate, uploadErrorMessage } from '@/lib/uploads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization')?.split(' ')[1]
    const payload = verifyToken(auth)
    if (!payload) {
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

    try {
      await mkdir(UPLOAD_DIR, { recursive: true })
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
      await writeFile(path.join(UPLOAD_DIR, safeName), buffer)
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
        mimeType: file.type || 'application/octet-stream',
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