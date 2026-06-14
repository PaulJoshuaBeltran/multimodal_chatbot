// src/utils/api.ts
export async function fetchJson<T = unknown>(url: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = { ...(options.headers as Record<string, string> | undefined) } as Record<string, string>

  // default JSON header for non-FormData bodies
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { ...options, headers })

  if (res.status === 204) return null as unknown as T
  const text = await res.text()
  const ct = res.headers.get('content-type') || ''

  if (!res.ok) {
    let msg = text || res.statusText
    try {
      const j = JSON.parse(text)
      msg = j?.error ?? JSON.stringify(j)
    } catch {}
    throw new Error(msg)
  }

  if (ct.includes('application/json')) {
    try { return JSON.parse(text) as T } catch { return text as unknown as T }
  }

  return text as unknown as T
}
