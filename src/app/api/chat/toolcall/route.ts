// src/app/api/chat/toolcall/route.ts
import { ollama } from "@/lib/ollama";
import type { Message } from "ollama";

type ToolName = 'add' | 'multiply'

function add(a: number, b: number): number {
  return a + b
}

function multiply(a: number, b: number): number {
  return a * b
}

const availableFunctions: Record<ToolName, (a: number, b: number) => number> = {
  add,
  multiply,
}

const tools = [
  {
    type: 'function',
    function: {
      name: 'add',
      description: 'Add two numbers',
      parameters: {
        type: 'object',
        required: ['a', 'b'],
        properties: {
          a: { type: 'integer', description: 'The first number' },
          b: { type: 'integer', description: 'The second number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'multiply',
      description: 'Multiply two numbers',
      parameters: {
        type: 'object',
        required: ['a', 'b'],
        properties: {
          a: { type: 'integer', description: 'The first number' },
          b: { type: 'integer', description: 'The second number' },
        },
      },
    },
  },
]

async function agentLoop(userPrompt: string): Promise<string> {
  const messages: Message[] = [{ role: 'user', content: userPrompt }]
  const MAX_ITERATIONS = 8

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await ollama.chat({
      model: process.env.OLLAMA_DEFAULT_MODEL ?? "",
      messages,
      tools,
      think: true,
    })

    const toolCalls = response.message.tool_calls ?? []

    messages.push(response.message)

    if (!toolCalls.length) {
      return response.message.content
    }

    for (const call of toolCalls) {
      const fn = availableFunctions[call.function.name as ToolName]
      if (!fn) {
        messages.push({
          role: 'tool',
          tool_name: call.function.name,
          content: `Error: unknown tool "${call.function.name}"`,
        })
        continue
      }

      const args = call.function.arguments as { a: number; b: number }
      let result: number
      try {
        result = fn(args.a, args.b)
      } catch (err) {
        messages.push({
          role: 'tool',
          tool_name: call.function.name,
          content: `Error executing ${call.function.name}: ${(err as Error).message}`,
        })
        continue
      }

      console.log(`Called ${call.function.name}(${args.a}, ${args.b}) -> ${result}`)
      messages.push({ role: 'tool', tool_name: call.function.name, content: String(result) })
    }
    console.log(`Messages: ${messages.map((m) => `\n${JSON.stringify(m)}`)}`)
    console.log("-----------------------------------------------------------")
  }

  throw new Error(`Agent loop did not converge after ${MAX_ITERATIONS} iterations`)
}

export async function GET() {
  try {
    const answer = await agentLoop('What is (11434+12341)*412?')
    return Response.json({ answer })
  } catch (err) {
    console.error(err)
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}