// src/app/api/upload/[filename]/route.ts
import { UPLOAD_DIR } from '@/lib/uploads'
import { MIME_TYPES } from '@/src/types/file_upload'
import { readFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } | Promise<{ filename: string }> }
) {
  const { filename } = await params
  const safeName = path.basename(filename) // prevent path traversal
  const file_format = safeName.split('.').at(-1)
  const mime_type = MIME_TYPES[file_format ? `.${file_format}` : ''] || "unknown/file"
  const file_type = mime_type.startsWith('application/') ||
    mime_type.startsWith('text/') ? 'document' : mime_type.split('/')[0];
  console.log('[TEST 4] file_type:', file_type)

  try {
    const buf = await readFile(path.join(UPLOAD_DIR(file_type), safeName))
    const mime = MIME_TYPES[path.extname(safeName).toLowerCase()] ?? 'unknown/file'
    return new Response(buf, {
      status: 200,
      headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}