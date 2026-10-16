// src/types/chat_parts.ts
export type TextPart = { type: 'text'; text: string }
export type ImagePart = { type: 'image'; url: string; fileName: string; mimeType: string; size: number }
export type DocumentPart = { type: 'document'; url: string; fileName: string; mimeType: string; size: number }
export type VisualizationPart = { type: 'visualization'; name: string; args: Record<string, unknown> }

/** Structured assistant output: an ordered list. */
export type ChatPart = TextPart | ImagePart | DocumentPart | VisualizationPart

/** NDJSON stream events: text deltas, parts as they happen, then done/error. */
export type StreamEvent =
  | ChatPart
  | { type: 'done'; parts: ChatPart[] }
  | { type: 'error'; message: string }