// src/types/chat.ts
import { Attachment } from "./msg_conversation_model";
import { FileType } from '@/src/types/file_upload'

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

export interface GraphInput {
  query: string;
  inputType: RagInputType;
  filePath?: string;
  fileType?: FileType;
  imageBase64?: string;
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