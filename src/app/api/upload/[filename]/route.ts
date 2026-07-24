// src/app/api/upload/[filename]/route.ts
import { MIME_TYPES } from '@/src/types/file_upload'
import { readFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } | Promise<{ filename: string }> }
) {
  const { filename } = await params
  const safeName = path.basename(filename) // prevent path traversal
  try {
    const buf = await readFile(path.join(UPLOAD_DIR, safeName))
    const mime = MIME_TYPES[path.extname(safeName).toLowerCase()] ?? 'application/octet-stream'
    return new Response(buf, {
      status: 200,
      headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}