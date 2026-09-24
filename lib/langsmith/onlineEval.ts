// lib/langsmith/onlineEval.ts
import { Client } from "langsmith";
import { traceable, getCurrentRunTree } from "langsmith/traceable";
import { ragGraph } from "@/lib/langgraph/chatPromptRag";
import { ollama } from "@/lib/ollama";
import type { RagInputType } from "@/lib/langgraph/chatPromptRag";
import { FileType } from '@/src/types/file_upload'

const client = new Client(); // reads LANGSMITH_API_KEY / LANGSMITH_ENDPOINT

interface GraphInput {
  query: string;
  inputType: RagInputType;
  filePath?: string;
  fileType?: FileType;
  imageBase64?: string;
}

interface GraphOutput {
  response: string;
  context: string;
  isFallback: boolean;
  guardrailFlags?: string[];
}

type FeedbackResults = [
  { key: string; score: number } | null,
  { key: string; score: number } | null,
  { key: string; score: number; value: { flags: string[] } } | null
];

interface FinalResult {
  promptResult: GraphOutput;
  feedbackResult: FeedbackResults;
}

// ---------- Individual online evaluators (all reference-free) ----------
async function groundednessEvaluator(output: GraphOutput) {
  if (output.isFallback || !output.context) return null; // nothing to ground against

  const judged = await ollama.chat({
    model: process.env.GUARD_MODEL || process.env.OLLAMA_DEFAULT_MODEL || "",
    messages: [
      {
        role: "user",
        content: [
          "Rate 0-1 how well the ANSWER is supported by the CONTEXT.",
          "Reply with only the number, nothing else.",
          `CONTEXT:\n${output.context}`,
          `ANSWER:\n${output.response}`,
        ].join("\n\n"),
      },
    ],
    stream: false,
  });
  // Change this to structured output eventually

  const score = Number.parseFloat(judged.message?.content ?? "");
  return Number.isNaN(score) ? null : { key: "groundedness", score };
}

function citationFormatEvaluator(output: GraphOutput) {
  if (output.isFallback) return null;
  return { key: "has_citation", score: /\[\d+\]/.test(output.response) ? 1 : 0 };
}

function guardrailEvaluator(output: GraphOutput) {
  const flags = output.guardrailFlags ?? [];
  return { key: "guardrail_clean", score: flags.length === 0 ? 1 : 0, value: {flags} };
}

let sessionIdPromise: Promise<string> | null = null;
function getSessionId(): Promise<string> {
  if (!sessionIdPromise) {
    sessionIdPromise = client
      .readProject({ projectName: process.env.LANGSMITH_PROJECT || "default" })
      .then((p) => p.id);
  }
  return sessionIdPromise;
}

async function runOnlineEvaluators(runId: string, output: GraphOutput): Promise<FeedbackResults> {
  const sessionId = await getSessionId();

  const results: FeedbackResults = await Promise.all([
    groundednessEvaluator(output),
    Promise.resolve(citationFormatEvaluator(output)),
    Promise.resolve(guardrailEvaluator(output)),
  ]);

  await Promise.all(
    results
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map((r) =>
        client.createFeedback(runId, r.key, {
          score: r.score,
          value: "value" in r ? r.value : undefined,
          sessionId,
        })
      )
  );
  return results;
}

// ---------- Traced wrapper around your existing graph ----------
export const invokeRagGraphWithOnlineEval = traceable(
  async (input: GraphInput): Promise<FinalResult> => {
    const promptResult: GraphOutput = await ragGraph.invoke(input);
    const runTree = getCurrentRunTree();
    
    const feedbackResult = runTree ? await runOnlineEvaluators(runTree.id, promptResult).catch((err) =>
      console.error("online eval failed:", err)
    ) : [null, null, null];

    const finalResult = {
      promptResult,
      feedbackResult
    }
    return finalResult as FinalResult;
  },
  { name: "ragGraph.invoke", run_type: "chain" }
);