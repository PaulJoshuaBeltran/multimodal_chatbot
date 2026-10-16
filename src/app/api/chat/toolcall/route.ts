// src/app/api/chat/toolcall/route.ts
import { ollama } from "@/src/lib/ollama";
import type { Message } from "ollama";
import { allToolDefinitions, executeTool, type Args } from "@/src/lib/toolcall/registry";
import type { VisualizationPart } from "@/src/types/chat_parts";

export const dynamic = "force-dynamic";

const MAX_ITERATIONS = 8;

async function agentLoop(userPrompt: string) {
  const model = process.env.OLLAMA_DEFAULT_MODEL;
  if (!model) throw new Error("OLLAMA_DEFAULT_MODEL is not set");

  const think = process.env.OLLAMA_THINK !== "false";
  const messages: Message[] = [{ role: "user", content: userPrompt }];
  const visualizations: VisualizationPart[] = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await ollama.chat({ model, messages, tools: allToolDefinitions, think });
    messages.push(response.message);

    const toolCalls = response.message.tool_calls ?? [];
    if (!toolCalls.length) return { answer: response.message.content, visualizations };

    for (const call of toolCalls) {
      const name = call.function.name;
      const out = await executeTool(name, (call.function.arguments ?? {}) as Args);
      for (const p of out.parts) if (p.type === "visualization") visualizations.push(p);
      console.log(`Called ${name} -> ${out.content}`);
      messages.push({ role: "tool", tool_name: name, content: out.content });
    }
  }
  throw new Error(`Agent loop did not converge after ${MAX_ITERATIONS} iterations`);
}

export async function GET() {
  try {
    return Response.json(await agentLoop("What is (11434+12341)*412?"));
  } catch (err) {
    console.error(err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt?: string };
    if (!prompt?.trim()) return Response.json({ error: "Missing 'prompt'" }, { status: 400 });
    return Response.json(await agentLoop(prompt));
  } catch (err) {
    console.error(err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}