// lib/langgraph/chatPromptRag.ts
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import type { Document } from "@langchain/core/documents";
import { readDocument, splitChunkDocument } from "@/lib/langchain/documentLoader";
import { ollama, ollamaEmbed } from "@/lib/ollama";
import pinecone from "@/lib/pineconeMongo/pinecone";
import { rerank } from "@/lib/huggingFace";

import { ALLOWED_EXT, FileType } from '@/src/types/file_upload'
import path from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'
import { loadImageBase64 } from "@/src/app/api/chat/ollama/route";

// ---------- Types ----------
export type RagInputType = "text" | "image" | "document";

export interface ChatTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RetrievedMatch {
  text: string;
  score: number;
  rerankScore?: number;
  metadata?: Record<string, unknown>;
}

const RELEVANCE_THRESHOLD = Number(process.env.RAG_RELEVANCE_THRESHOLD ?? 0.01);
const MAX_RETRIES = Number(process.env.RAG_MAX_RETRIES ?? 1);
const TOP_K = Number(process.env.PINECONE_TOP_K ?? 8);
const MAX_UPLOADED_CHARS = Number(process.env.RAG_MAX_UPLOADED_CHARS ?? 6000);

// ---------- Graph state ----------
const RagState = Annotation.Root({
  // Inputs, set by the caller before invoking the graph
  inputType: Annotation<RagInputType>,
  query: Annotation<string>({ reducer: (_, n) => n, default: () => "" }),
  filePath: Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  fileType: Annotation<FileType | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  imageBase64: Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  history: Annotation<ChatTurn[]>({ reducer: (_, n) => n, default: () => [] }),

  // Derived from the input-type branches, all converge here
  extractedText: Annotation<string>({ reducer: (_, n) => n, default: () => "" }),
  chunks: Annotation<Document[]>({ reducer: (_, n) => n, default: () => [] }),
  embeddingQuery: Annotation<string>({ reducer: (_, n) => n, default: () => "" }),
  uploadedContent: Annotation<string>({ reducer: (_, n) => n, default: () => "" }),

  // Retrieval
  candidateMatches: Annotation<RetrievedMatch[]>({ reducer: (_, n) => n, default: () => [] }),
  rerankedMatches: Annotation<RetrievedMatch[]>({ reducer: (_, n) => n, default: () => [] }),
  hasRelevantData: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),
  retryCount: Annotation<number>({ reducer: (_, n) => n, default: () => 0 }),
  retryExhausted: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),

  // Prompt construction + output
  context: Annotation<string>({ reducer: (_, n) => n, default: () => "" }),
  isFallback: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),
  prompt: Annotation<string>({ reducer: (_, n) => n, default: () => "" }),
  response: Annotation<string>({ reducer: (_, n) => n, default: () => "" }),
});

type RagStateType = typeof RagState.State;

// ---------- Helpers ----------
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n...[truncated, ${text.length - maxChars} more characters — full content is searchable via the knowledge base]`;
}

// ---------- Branch nodes (Input type: document / image / text) ----------
async function documentLoaderNode(state: RagStateType) {
  if (!state.filePath || !state.fileType) {
    throw new Error("documentLoaderNode: filePath and fileType are required for document input");
  }

  const ext = path.extname(state.filePath).slice(1).toLowerCase()
  if (!ext || !ALLOWED_EXT.has(ext as FileType)) {
    throw new Error(`documentLoaderNode: unsupported file type "${ext}"`)
  }

  const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads', 'document')
  await mkdir(UPLOAD_DIR, { recursive: true })
  const safeName = `${randomUUID()}.${ext}`
  const serverPath = path.join(UPLOAD_DIR, safeName)

  const buffer = await readFile(state.filePath)
  await writeFile(serverPath, buffer)
  console.log(`Written ${serverPath}`)

  const rawDocs = await readDocument(serverPath, state.fileType);
  if (!rawDocs) throw new Error(`documentLoaderNode: unsupported file type "${state.fileType}"`);

  const chunks = await splitChunkDocument(rawDocs);
  const extractedText = chunks.map((d) => d.pageContent).join("\n\n");

  // If the user also typed a question about the doc, keep it as the query;
  // otherwise the document content itself becomes the thing we search/embed for.
  const embeddingQuery = state.query || extractedText;
  return { chunks, extractedText, embeddingQuery, uploadedContent: extractedText };
}

async function visionOcrNode(state: RagStateType) {
  if (!state.imageBase64) {
    throw new Error("visionOcrNode: imageBase64 is required for image input");
  }

  const ext = path.extname(state.imageBase64).slice(1).toLowerCase()
  if (!ext || !ALLOWED_EXT.has(ext as FileType)) {
    throw new Error(`documentLoaderNode: unsupported file type "${ext}"`)
  }

  const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads', 'image')
  await mkdir(UPLOAD_DIR, { recursive: true })
  const safeName = `${randomUUID()}.${ext}`
  const serverPath = path.join(UPLOAD_DIR, safeName)

  const buffer = await readFile(state.imageBase64)
  await writeFile(serverPath, buffer)
  console.log(`Written ${serverPath}`)

  const base64 = await loadImageBase64(serverPath);
  if (!base64) {
    throw new Error(`visionOcrNode: failed to load image from "${serverPath}"`);
  }

  const visionModel = process.env.OLLAMA_DEFAULT_MODEL || "llava";
  const result = await ollama.chat({
    model: visionModel,
    messages: [
      {
        role: "user",
        content:
          "Extract all readable text from this image verbatim. If there is no text, describe the salient visual content instead.",
        images: [base64],
      },
    ],
    stream: false,
  });

  const extractedText = result.message?.content ?? "";
  const embeddingQuery = state.query ? `${state.query}\n\n${extractedText}` : extractedText;
  return { extractedText, embeddingQuery, uploadedContent: extractedText };
}

function passthroughTextNode(state: RagStateType) {
  // No file/image attached — nothing to echo back as "uploaded content".
  return { extractedText: state.query, embeddingQuery: state.query };
}

// ---------- Embedding model query ----------
async function embedQueryNode(state: RagStateType) {
  // No-op guard: an empty query short-circuits straight past retrieval.
  if (!state.embeddingQuery.trim()) {
    return { candidateMatches: [], rerankedMatches: [] };
  }
  // Embedding itself happens inside semanticSearchNode (Pinecone's client wants
  // the vector alongside the query call); this node exists as its own graph step
  // so it shows up as a distinct traced span, matching the diagram.
  return {};
}

// ---------- Semantic search + reranking (Pinecone -> cross-encoder) ----------
async function semanticSearchNode(state: RagStateType) {
  if (!state.embeddingQuery.trim()) {
    return { candidateMatches: [], rerankedMatches: [] };
  }

  const [queryVector] = await ollamaEmbed([state.embeddingQuery]);

  const index = pinecone
    .index({ host: process.env.PINECONE_HOST_NAME || "" })
    .namespace(process.env.PINECONE_NAMESPACE || "");

  const results = await index.query({ vector: queryVector, topK: TOP_K, includeMetadata: true });

  const candidateMatches: RetrievedMatch[] = results.matches
    .map((m) => ({
      text: m.metadata?.text as string,
      score: m.score ?? 0,
      metadata: m.metadata as Record<string, unknown>,
    }))
    .filter((m) => Boolean(m.text));

  if (candidateMatches.length === 0) {
    return { candidateMatches, rerankedMatches: [] };
  }

  const documents = candidateMatches.map((m) => m.text);
  const reranked = await rerank(state.embeddingQuery, documents);

  const rerankedMatches: RetrievedMatch[] = reranked.map((r) => ({
    ...candidateMatches[r.index],
    rerankScore: r.score,
  }));

  return { candidateMatches, rerankedMatches };
}

// ---------- Has relevant data? ----------
function relevanceGateNode(state: RagStateType) {
  const top = state.rerankedMatches[0];
  const hasRelevantData = Boolean(top && (top.rerankScore ?? 0) >= RELEVANCE_THRESHOLD);
  return { hasRelevantData };
}

// ---------- Yes branch: retrieve relevant data & history ----------
function assembleGroundedContextNode(state: RagStateType) {
  const context = state.rerankedMatches
    .filter((m) => (m.rerankScore ?? 0) >= RELEVANCE_THRESHOLD)
    .map((m, i) => `[${i + 1}] ${m.text}`)
    .join("\n\n");
  return { context, isFallback: false };
}

// ---------- No branch: retry, or fall back to general knowledge if it persists ----------
function retryOrFallbackNode(state: RagStateType) {
  if (state.retryCount < MAX_RETRIES) {
    // Widen the query and loop back into embedding + search once before giving up.
    const widenedQuery = `${state.embeddingQuery} (related terms, broader phrasing)`;
    return { embeddingQuery: widenedQuery, retryCount: state.retryCount + 1 };
  }
  // Retry budget spent, still nothing relevant in the KB -> no vector-store context,
  // but this says nothing about the uploaded doc/image itself, which still reaches
  // the prompt via uploadedContent regardless of this outcome.
  return { context: "", isFallback: true, retryExhausted: true };
}

// ---------- Prompt construction ----------
function promptConstructionNode(state: RagStateType) {
  const historyText = state.history.map((h) => `${h.role}: ${h.content}`).join("\n");
  const userQuery = state.query || state.extractedText;

  const uploadedLabel = state.inputType === "image" ? "Uploaded image content" : "Uploaded document content";
  const uploadedSection = state.uploadedContent
    ? `${uploadedLabel} (this turn):\n${truncate(state.uploadedContent, MAX_UPLOADED_CHARS)}`
    : "";

  const kbSection = state.isFallback
    ? "No relevant knowledge-base context was found after retrying with a widened query."
    : state.context
      ? `Knowledge base context (cite inline as [n]):\n${state.context}`
      : "";

  const instructions = state.isFallback
    ? [
        "Prioritize the uploaded content above if present and relevant to the question.",
        "Otherwise, answer from general knowledge and explicitly tell the user this part of the answer isn't grounded in retrieved knowledge-base documents.",
      ].join(" ")
    : "Answer using the uploaded content and the knowledge base context above. Cite knowledge-base sources inline as [n]; the uploaded content does not need a citation number.";

  const prompt = [instructions, uploadedSection, kbSection, historyText ? `Conversation history:\n${historyText}` : "", `User query: ${userQuery}`]
    .filter(Boolean)
    .join("\n\n");

  return { prompt };
}

// ---------- LLM response ----------
async function llmResponseNode(state: RagStateType) {
  const model = process.env.OLLAMA_DEFAULT_MODEL || "";
  const result = await ollama.chat({
    model,
    messages: [{ role: "user", content: state.prompt }],
    stream: false,
  });
  return { response: result.message?.content ?? "" };
}

// ---------- Conditional edge routers ----------
function routeInputType(state: RagStateType): RagInputType {
  return state.inputType;
}

function routeRelevance(state: RagStateType): "relevant" | "not_relevant" {
  return state.hasRelevantData ? "relevant" : "not_relevant";
}

function routeRetry(state: RagStateType): "retry_search" | "fallback" {
  return state.retryExhausted ? "fallback" : "retry_search";
}

// ---------- Graph assembly ----------
const graph = new StateGraph(RagState)
  .addNode("documentLoader", documentLoaderNode)
  .addNode("visionOcr", visionOcrNode)
  .addNode("passthroughText", passthroughTextNode)
  .addNode("embedQuery", embedQueryNode)
  .addNode("semanticSearch", semanticSearchNode)
  .addNode("relevanceGate", relevanceGateNode)
  .addNode("assembleGroundedContext", assembleGroundedContextNode)
  .addNode("retryOrFallback", retryOrFallbackNode)
  .addNode("promptConstruction", promptConstructionNode)
  .addNode("llmResponse", llmResponseNode)

  .addConditionalEdges(START, routeInputType, {
    document: "documentLoader",
    image: "visionOcr",
    text: "passthroughText",
  })

  // All three input branches converge on embedding
  .addEdge("documentLoader", "embedQuery")
  .addEdge("visionOcr", "embedQuery")
  .addEdge("passthroughText", "embedQuery")

  .addEdge("embedQuery", "semanticSearch")
  .addEdge("semanticSearch", "relevanceGate")

  .addConditionalEdges("relevanceGate", routeRelevance, {
    relevant: "assembleGroundedContext",
    not_relevant: "retryOrFallback",
  })

  // Retry loops back into embedding with a widened query; once exhausted it
  // proceeds to prompt construction with isFallback=true instead.
  .addConditionalEdges("retryOrFallback", routeRetry, {
    retry_search: "embedQuery",
    fallback: "promptConstruction",
  })

  .addEdge("assembleGroundedContext", "promptConstruction")
  .addEdge("promptConstruction", "llmResponse")
  .addEdge("llmResponse", END);

export const ragGraph = graph.compile();