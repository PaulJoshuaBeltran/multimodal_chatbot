// src/app/api/upload/readFile/[filename]/route.ts
import { stat } from 'fs/promises'
import path from 'path'
import { UPLOAD_DIR } from '@/lib/uploads'
import { MIME_TYPES } from '@/src/types/file_upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    const metadata = await stat(filePath)

    return new Response(
      JSON.stringify({
        url: `/api/upload/viewMetadata/${filename}`,
        action: 'view metadata',
        file_type: file_type,
        metadata: metadata
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
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