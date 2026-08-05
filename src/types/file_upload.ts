export const MIME_TYPES: Record<string, string> = {
  '.png':   'image/png',
  '.jpg':   'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif':   'image/gif',
  '.webp':  'image/webp',
  '.svg':   'image/svg+xml',
  '.pdf':   'application/pdf',
  '.txt':   'text/plain',
  '.csv':   'text/csv',
  '.json':   'application/json',
  '.docx':  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // '.zip':   'application/zip',
  '.mp3':   'audio/mpeg',
  '.wav':   'audio/wav',
  '.ogg':   'audio/ogg',
  '.m4a':   'audio/mp4',
  '.aac':   'audio/aac',
  '.flac':   'audio/flac',
}

export type UploadValidationError =
  | 'NO_FILE'
  | 'EMPTY_FILE'
  | 'UNSUPPORTED_TYPE'
  | 'TOO_LARGE'