// /src/app/api/file/management/[filename]/route.ts
import { readFile, rm } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { auth } from '@clerk/nextjs/server'
import { UPLOAD_DIR, uploadErrorMessage } from '@/src/lib/uploads'
import { MIME_TYPES } from '@/src/types/file_upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Delete file
export async function DELETE(req: Request) { // Before: POST
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

// Read file
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  try {
    // Prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/')) {
      return new Response(JSON.stringify({ error: 'Invalid filename' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const file_format = filename.split('.').at(-1)
    const mime_type = MIME_TYPES[file_format ? `.${file_format}` : ''] || "unknown/file"
    const file_type = mime_type.startsWith('application/') ||
      mime_type.startsWith('text/') ? 'document' : mime_type.split('/')[0];

    const filePath = path.join(UPLOAD_DIR(file_type), filename)
    const buffer = await readFile(filePath)

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // 1 year cache for immutable uploads
      },
    })
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException
    if (error?.code === 'ENOENT') {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    console.error('File retrieval failed:', err)
    return new Response(JSON.stringify({ error: 'Failed to retrieve file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}