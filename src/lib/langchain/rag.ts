// src/lib/langchain/rag.ts
import path from "path";
import { traceable } from "langsmith/traceable";
import { ragGraph } from "@/src/lib/langgraph/chatPromptRag";
import { uploadPathFromUrl } from "@/src/lib/uploads";
import { ALLOWED_EXT, type FileType } from "@/src/types/file_upload";
import type { DocumentRagResult, IncomingAttachment } from "@/src/types/chat";

const MAX_DOC_CHARS = Number(process.env.CHAT_MAX_DOC_CHARS ?? 8000);

// Retrieval only (skipLlm): loader -> chunk -> embed -> Pinecone -> rerank -> gate.
const retrieve = traceable(
  async (input: { query: string; filePath: string; fileType: FileType }) => {
    const s = await ragGraph.invoke({ ...input, inputType: "document", skipLlm: true });
    return { uploadedContent: s.uploadedContent, context: s.context, isFallback: s.isFallback };
  },
  { name: "chat.retrieval", run_type: "chain" },
);

export async function retrieveForDocument(
  att: IncomingAttachment,
  query: string,
): Promise<DocumentRagResult | null> {
  const ext = path.extname(att.fileName).slice(1).toLowerCase();
  if (!ALLOWED_EXT.has(ext as FileType)) return null; // e.g. .doc/.zip: metadata line only
  const r = await retrieve({ query, filePath: uploadPathFromUrl(att.url), fileType: ext as FileType });
  return { fileName: att.fileName, ...r };
}

export function formatDocumentContext(results: DocumentRagResult[]): string {
  if (!results.length) return "";
  const docs = results.map((r) => {
    const body = r.uploadedContent.length > MAX_DOC_CHARS
      ? `${r.uploadedContent.slice(0, MAX_DOC_CHARS)}\n...[truncated]`
      : r.uploadedContent;
    return `Uploaded document "${r.fileName}" (this turn):\n${body}`;
  });
  const kb = [...new Set(results.map((r) => r.context).filter(Boolean))].join("\n\n");
  const fallback = results.every((r) => r.isFallback);
  return [
    "Use the uploaded document content below to answer.",
    ...docs,
    kb
      ? `Knowledge base context (cite inline as [n]):\n${kb}`
      : fallback
        ? "No relevant knowledge-base context was found; say so if you rely on general knowledge."
        : "",
  ].filter(Boolean).join("\n\n");
}