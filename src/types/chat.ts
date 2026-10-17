// src/types/chat.ts
import { ollama } from "../lib/ollama";
import { Attachment } from "./msg_conversation_model";
import { FileType } from '@/src/types/file_upload'
import type { Message as OllamaMessage, Tool, ToolCall } from 'ollama'

export type RagInputType = "text" | "image" | "document";

export interface ChatTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

export type IncomingMessage = {
  role: string
  content: string
  attachments?: Attachment[]
}

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

export interface GraphInput {
  query: string;
  inputType: RagInputType;
  filePath?: string;
  fileType?: FileType;
  imageBase64?: string;
  skipLlm?: boolean;
}

export type IncomingAttachment = NonNullable<IncomingMessage["attachments"]>[number];

export interface DocumentRagResult {
  fileName: string;
  uploadedContent: string;
  context: string;
  isFallback: boolean;
}

export interface RerankResult {
  index: number;
  score: number;
  text: string;
}

export interface RetrievedMatch {
  text: string;
  score: number;
  rerankScore?: number;
  metadata?: Record<string, unknown>;
}

export type ChatChunk = {
  message?: { content?: string; tool_calls?: ToolCall[] }
  content?: string
  done?: boolean
}

export interface GraphOutput {
  response: string;
  context: string;
  isFallback: boolean;
  guardrailFlags?: string[];
}

export type FeedbackResults = [
  { key: string; score: number } | null,
  { key: string; score: number } | null,
  { key: string; score: number; value: { flags: string[] } } | null
];

export interface FinalResult {
  promptResult: GraphOutput;
  feedbackResult: FeedbackResults;
}

const startChat = (
  model: string,
  messages: OllamaMessage[],
  options: Record<string, number>,
  tools?: Tool[],
) =>
  ollama.chat({
    model,
    messages,
    stream: true,
    ...(tools?.length && { tools }),
    ...(Object.keys(options).length > 0 && { options }),
  })

export type OllamaStream = Awaited<ReturnType<typeof startChat>>