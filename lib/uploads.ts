// src/lib/uploads.ts
import { ALLOWED_DOCUMENT_MIME_TYPES, UploadValidationError } from '@/src/types/file_upload'
import { fileType } from '@/src/types/msg_conversation_model'
import path from 'path'

export const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
export const MAX_AUDIO_SIZE = 50 * 1024 * 1024 // 50MB — audio files run bigger

export const ALLOWED_MIME_PREFIXES = ['image/', 'audio/']


export function classifyAndValidate(
  file: { type: string; size: number; name: string }
): { ok: true; fileType: fileType } | { ok: false; error: UploadValidationError } {
  if (file.size === 0) return { ok: false, error: 'EMPTY_FILE' }

  const isImage = file.type.startsWith('image/')
  const isAudio = file.type.startsWith('audio/')
  const isDocument = ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type)

  if (!isImage && !isAudio && !isDocument) {
    return { ok: false, error: 'UNSUPPORTED_TYPE' }
  }

  const limit = isAudio ? MAX_AUDIO_SIZE : MAX_FILE_SIZE
  if (file.size > limit) return { ok: false, error: 'TOO_LARGE' }

  return { ok: true, fileType: isImage ? 'image' : isAudio ? 'audio' : 'document' }
}

export function uploadErrorMessage(error: UploadValidationError): string {
  switch (error) {
    case 'NO_FILE': return 'No file was provided.'
    case 'EMPTY_FILE': return 'That file is empty.'
    case 'UNSUPPORTED_TYPE': return "That file type isn't supported."
    case 'TOO_LARGE': return 'That file is too large.'
  }
}

export function uploadPathFromUrl(url: string): string {
  const pathnameOnly = url.split(/[?#]/)[0]
  const filename = decodeURIComponent(path.basename(pathnameOnly))
  return path.join(UPLOAD_DIR, filename)
}