// src/app/api/models/ollama-all/route.ts
import { ollama } from '@/lib/ollama'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim().toLowerCase() || undefined

  let models
  try {
    ;({ models } = await ollama.list())
  } catch (err) {
    console.error('[api/models/ollama] ollama.list() failed:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to reach Ollama', detail: String(err) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const mapped = models.map((m) => ({
    name: m.name,
    modelId: m.model ?? m.name,
    parameterSize: m.details?.parameter_size,
    family: m.details?.family,
    size: m.size,
  }))

  const filtered = q
    ? mapped.filter((m) => m.name.toLowerCase().includes(q) || m.modelId.toLowerCase().includes(q))
    : mapped

  return new Response(JSON.stringify(filtered), { status: 200, headers: { 'Content-Type': 'application/json' } })
}