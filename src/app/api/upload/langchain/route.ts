// src/app/api/uploader/langchain/route.ts
import { readDocument, splitChunkDocument } from '@/lib/langchain/documentLoader'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { ALLOWED_EXT, FileType } from '@/src/types/file_upload'

const UPLOAD_DIR = path.join(process.cwd(), 'data', '.uploads')

export async function POST(req: Request) {
  console.log('content-type:', req.headers.get('content-type'))
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').at(-1)?.toLowerCase()
    if (!ext || !ALLOWED_EXT.has(ext as FileType)) {
      return Response.json({ error: `Unsupported file type: ${ext}` }, { status: 400 })
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    // Never trust file.name for the on-disk path — generate our own
    const safeName = `${randomUUID()}.${ext}`
    const serverPath = path.join(UPLOAD_DIR, safeName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(serverPath, buffer)

    const rawDocs = await readDocument(serverPath, ext as FileType)
    const chunkedDocs = await splitChunkDocument(rawDocs || [])

    return Response.json({ content: chunkedDocs }, { status: 200 })
  } catch (err: unknown) {
    console.error('File retrieval failed:', err)
    return Response.json({ error: 'Failed to retrieve file' }, { status: 500 })
  }
}