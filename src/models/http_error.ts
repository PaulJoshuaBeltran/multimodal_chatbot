// src/models/http_error.ts
export class HttpError extends Error {
  status: number
  body?: string

  constructor(message: string, status: number, body?: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.body = body
  }
}