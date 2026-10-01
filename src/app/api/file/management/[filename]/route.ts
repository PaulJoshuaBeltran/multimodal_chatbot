// /src/app/api/file/management/[filename]/route.ts
import { readFile, rm, open } from 'fs/promises'
import path from 'path'
import { auth } from '@clerk/nextjs/server'
import { classifyAndValidate, UPLOAD_DIR, uploadErrorMessage } from '@/src/lib/uploads'
import { MIME_TYPES } from '@/src/types/file_upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SAFE_NAME = /^[0-9a-f-]{36}(\.[A-Za-z0-9]+)?$/i

type Ctx = { params: Promise<{ filename: string }> }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Error no entry
const isENOENT = (err: unknown) => (err as NodeJS.ErrnoException)?.code === 'ENOENT'

function resolveFilePath(filename: string) {
  const ext = path.extname(filename).toLowerCase()
  const mime = MIME_TYPES[ext] || 'unknown/file'
  const fileType =
    mime.startsWith('application/') || mime.startsWith('text/')
      ? 'document'
      : mime.split('/')[0]
  return path.join(UPLOAD_DIR(fileType), filename)
}

// Read file
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { filename } = await params
    if (!SAFE_NAME.test(filename)) return json({ error: 'Invalid filename' }, 400)

    const buffer = await readFile(resolveFilePath(filename))
    const ext = path.extname(filename).toLowerCase()

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // PATCH busts this via ?v=
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    if (isENOENT(err)) return json({ error: 'File not found' }, 404)
    console.error('File retrieval failed:', err)
    return json({ error: 'Failed to retrieve file' }, 500)
  }
}

// Edit file (replace contents)
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { userId } = await auth()
    if (!userId) return json({ error: 'Unauthorized' }, 401)

    const { filename } = await params
    if (!SAFE_NAME.test(filename)) return json({ error: 'Invalid filename' }, 400)

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return json({ error: 'Malformed edit request.' }, 400)
    }

    const file = form.get('file') as File | null
    if (!file) return json({ error: uploadErrorMessage('NO_FILE') }, 400)

    if (path.extname(file.name).toLowerCase() !== path.extname(filename).toLowerCase()) {
      return json({ error: 'Replacement file must have the same extension as the original.' }, 415)
    }

    const validation = classifyAndValidate(file)
    if (!validation.ok) {
      const status = validation.error === 'TOO_LARGE' ? 413 : 400
      return json({ error: uploadErrorMessage(validation.error) }, status)
    }

    let buffer: Buffer
    try {
      buffer = Buffer.from(await file.arrayBuffer())
    } catch {
      return json({ error: 'Could not read the uploaded file.' }, 400)
    }

    try {
      // 'r+' opens an existing file and throws ENOENT if missing,
      const handle = await open(resolveFilePath(filename), 'r+')
      try {
        await handle.truncate(0)
        await handle.writeFile(buffer)
      } finally {
        await handle.close()
      }
    } catch (err) {
      if (isENOENT(err)) return json({ error: 'File not found' }, 404)
      console.error('Edit failed:', err)
      return json({ error: 'Failed to update the file. Please try again.' }, 500)
    }

    return json({
      url: `/api/file/management/${filename}?v=${Date.now()}`, // busts the 1-year cache
      fileName: file.name,
      fileType: validation.fileType,
      mimeType: file.type || 'unknown/file',
      size: file.size,
      action: 'updated',
    })
  } catch (err) {
    console.error('Edit failed:', err)
    return json({ error: 'Unexpected error while editing.' }, 500)
  }
}

// Delete file
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { userId } = await auth()
    if (!userId) return json({ error: 'Unauthorized' }, 401)

    const { filename } = await params
    if (!SAFE_NAME.test(filename)) return json({ error: 'Invalid filename' }, 400)

    try {
      await rm(resolveFilePath(filename))
    } catch (err) {
      if (isENOENT(err)) return json({ error: 'File not found' }, 404)
      console.error('Delete failed:', err)
      return json({ error: 'Failed to delete the file. Please try again.' }, 500)
    }

    return new Response(null, { status: 204 })
  } catch (err) {
    console.error('Delete failed:', err)
    return json({ error: 'Unexpected error while deleting.' }, 500)
  }
}