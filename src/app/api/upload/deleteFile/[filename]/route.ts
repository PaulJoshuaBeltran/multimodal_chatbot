import { rm } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { auth } from '@clerk/nextjs/server'
import { UPLOAD_DIR, uploadErrorMessage } from '@/lib/uploads'
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
      return new Response(JSON.stringify({ error: 'Malformed delete request.' }), {
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

    const file_format = file.name.split('.').at(-1)
    const mime_type = MIME_TYPES[file_format ? `.${file_format}` : ''] || "unknown/file"
    const file_type = mime_type.startsWith('application/') ||
      mime_type.startsWith('text/') ? 'document' : mime_type.split('/')[0];

    const ext = path.extname(file.name)
    const safeName = `${randomUUID()}${ext}`

    try {
      await rm(path.join(UPLOAD_DIR(file_type), safeName))
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to delete the file. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        url: `/api/upload/deleteFile/${safeName}`,
        action: 'deleted'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Delete failed:', err)
    return new Response(JSON.stringify({ error: 'Unexpected error while deleting.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}