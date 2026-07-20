// src/app/api/uploads/[filename]/route.ts
import { readFile } from 'fs/promises'
import path from 'path'
import { UPLOAD_DIR } from '@/lib/uploads'

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

    const filePath = path.join(UPLOAD_DIR, filename)
    const buffer = await readFile(filePath)

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'

    if (ext === '.png') contentType = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.gif') contentType = 'image/gif'
    else if (ext === '.webp') contentType = 'image/webp'
    else if (ext === '.mp3') contentType = 'audio/mpeg'
    else if (ext === '.wav') contentType = 'audio/wav'
    else if (ext === '.pdf') contentType = 'application/pdf'
    else if (ext === '.txt') contentType = 'text/plain'
    else if (ext === '.csv') contentType = 'text/csv'

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
