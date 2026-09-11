import { Attachment } from "./msg_conversation_model";

export type IncomingMessage = {
  role: string
  content: string
  attachments?: Attachment[]
}

export interface RerankResult {
  index: number;
  score: number;
  text: string;
}