// src/lib/toolcall/dbManagement.ts
import postgres from 'postgres'
import { randomUUID } from 'crypto'
import { supabase } from '@/src/lib/supabase'

// Types
type Sql = ReturnType<typeof postgres>
type Reserved = Awaited<ReturnType<Sql['reserve']>>

export type ToolResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

const ok = <T>(data: T): ToolResult<T> => ({ ok: true, data })
const fail = (e: unknown): ToolResult<never> => ({
  ok: false,
  error: e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e),
})

export type StructuredQuery = {
  table: string
  action: 'select' | 'insert' | 'update' | 'delete'
  columns?: string                       // select, default '*'
  values?: Record<string, unknown> | Record<string, unknown>[] // insert/update
  eq?: Record<string, string | number | boolean | null>        // filters (AND)
  limit?: number
}

export type ExecuteQueryInput = {
  // Raw SQL, use $1, $2... placeholders. Mutually exclusive with `structured`
  sql?: string
  params?: unknown[]
  // Run inside an open transaction. Without it, raw SQL is read-only
  transactionId?: string
  // Supabase-js (PostgREST) query. Respects RLS, no transaction support
  structured?: StructuredQuery
}

// Config / guards
// Tables the LLM may touch through `structured`. Edit to match your schema.
const ALLOWED_TABLES = new Set(['todos'])
const MAX_ROWS = 200
const TX_TTL_MS = 30_000 // auto-rollback abandoned transactions

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/
const READ_ONLY = /^\s*(select|with|explain|show)\b/i
const FORBIDDEN = /\b(drop|truncate|alter|grant|revoke|create|copy|vacuum)\b/i
const TX_CONTROL = /^\s*(begin|commit|end|rollback|savepoint|release|start\s+transaction)\b/i

function assertSingleStatement(sql: string) {
  const trimmed = sql.trim().replace(/;+\s*$/, '')
  if (trimmed.includes(';')) throw new Error('Only a single SQL statement is allowed')
  return trimmed
}

// Connection (cached across Next.js dev HMR)
type TxEntry = {
  conn: Reserved
  savepoints: string[]
  timer: ReturnType<typeof setTimeout>
}

const g = globalThis as unknown as {
  __sql?: Sql
  __tx?: Map<string, TxEntry>
}
const transactions = (g.__tx ??= new Map<string, TxEntry>())

function getSql(): Sql {
  if (!g.__sql) {
    const url = process.env.DATABASE_URL_POOLER
    if (!url) throw new Error('DATABASE_URL_POOLER is not set')
    g.__sql = postgres(url, { prepare: false, max: 5, idle_timeout: 20 })
  }
  return g.__sql
}

function getTx(id?: string): TxEntry {
  if (!id) throw new Error('transactionId is required')
  const tx = transactions.get(id)
  if (!tx) throw new Error(`No open transaction "${id}" (expired, committed or rolled back)`)
  return tx
}

async function closeTx(id: string) {
  const tx = transactions.get(id)
  if (!tx) return
  clearTimeout(tx.timer)
  transactions.delete(id)
  tx.conn.release()
}

// Tool functions
// Verifies both access paths: supabase-js (PostgREST) and direct SQL (pooler)
export async function connect_database(): Promise<
  ToolResult<{ rest: boolean; sql: boolean; openTransactions: number }>
> {
  try {
    const { error } = await supabase.from('todos').select('*', { head: true, count: 'exact' })
    const rest = !error

    let sqlOk = false
    try {
      await getSql()`select 1`
      sqlOk = true
    } catch {
      sqlOk = false
    }

    if (!rest && !sqlOk) return fail(error?.message ?? 'Could not connect')
    return ok({ rest, sql: sqlOk, openTransactions: transactions.size })
  } catch (e) {
    return fail(e)
  }
}

export async function execute_query(input: ExecuteQueryInput): Promise<ToolResult> {
  try {
    if (input.structured) return await runStructured(input.structured)
    if (!input.sql) throw new Error('Provide either `sql` or `structured`')

    const sql = assertSingleStatement(input.sql)
    if (TX_CONTROL.test(sql))
      throw new Error('Use start_transaction / commit_database / rollback_database / add_savepoint_database')
    if (FORBIDDEN.test(sql)) throw new Error('DDL and admin statements are not allowed')

    const inTx = !!input.transactionId
    if (!inTx && !READ_ONLY.test(sql))
      throw new Error('Writes require an open transaction: call start_transaction first')

    const runner = inTx ? getTx(input.transactionId).conn : getSql()
    const rows = await runner.unsafe(sql, (input.params ?? []) as never[])

    return ok({
      rowCount: rows.length,
      rows: rows.slice(0, MAX_ROWS),
      truncated: rows.length > MAX_ROWS,
    })
  } catch (e) {
    return fail(e)
  }
}

export async function start_transaction(): Promise<ToolResult<{ transactionId: string; expiresInMs: number }>> {
  try {
    const conn = await getSql().reserve()
    try {
      await conn`begin`
    } catch (e) {
      conn.release()
      throw e
    }

    const transactionId = randomUUID()
    const timer = setTimeout(async () => {
      const entry = transactions.get(transactionId)
      if (!entry) return
      try {
          await entry.conn`rollback`
      } catch {
          /* connection already gone */
      }
      await closeTx(transactionId)
    }, TX_TTL_MS)

    transactions.set(transactionId, { conn, savepoints: [], timer })
    return ok({ transactionId, expiresInMs: TX_TTL_MS })
  } catch (e) {
    return fail(e)
  }
}

export async function commit_database(transactionId: string): Promise<ToolResult<{ committed: true }>> {
  try {
    const tx = getTx(transactionId)
    try {
      await tx.conn`commit`
    } finally {
      await closeTx(transactionId)
    }
    return ok({ committed: true })
  } catch (e) {
    return fail(e)
  }
}

// Without `savepoint`: roll back the whole transaction. With it: roll back to that savepoint and keep the tx open
export async function rollback_database(
  transactionId: string,
  savepoint?: string
): Promise<ToolResult<{ rolledBack: 'transaction' | string }>> {
  try {
    const tx = getTx(transactionId)

    if (savepoint) {
      if (!IDENT.test(savepoint)) throw new Error('Invalid savepoint name')
      const idx = tx.savepoints.indexOf(savepoint)
      if (idx === -1) throw new Error(`Unknown savepoint "${savepoint}"`)
      await tx.conn.unsafe(`rollback to savepoint ${savepoint}`)
      tx.savepoints.length = idx + 1 // later savepoints are discarded by Postgres
      return ok({ rolledBack: savepoint })
    }

    try {
      await tx.conn`rollback`
    } finally {
      await closeTx(transactionId)
    }
    return ok({ rolledBack: 'transaction' })
  } catch (e) {
    return fail(e)
  }
}

export async function add_savepoint_database(
  transactionId: string,
  name: string
): Promise<ToolResult<{ savepoint: string; savepoints: string[] }>> {
  try {
    if (!IDENT.test(name)) throw new Error('Savepoint name must be a plain identifier (letters, digits, _)')
    const tx = getTx(transactionId)
    if (tx.savepoints.includes(name)) throw new Error(`Savepoint "${name}" already exists`)
    await tx.conn.unsafe(`savepoint ${name}`)
    tx.savepoints.push(name)
    return ok({ savepoint: name, savepoints: [...tx.savepoints] })
  } catch (e) {
    return fail(e)
  }
}

// Structured (supabase-js) path
// Minimal structural types: avoids supabase-js's deeply generic builder types
type QueryResult = { data: unknown[] | null; error: { message: string } | null }
type QB = PromiseLike<QueryResult> & {
  eq(column: string, value: unknown): QB
  limit(count: number): QB
  select(): QB
}
type TableHandle = {
  select(columns: string): QB
  insert(values: unknown): QB
  update(values: unknown): QB
  delete(): QB
}

async function runStructured(q: StructuredQuery): Promise<ToolResult> {
  if (!ALLOWED_TABLES.has(q.table)) throw new Error(`Table "${q.table}" is not allowed`)

  const t = supabase.from(q.table) as unknown as TableHandle

  const applyEq = (builder: QB): QB => {
    for (const [col, val] of Object.entries(q.eq ?? {})) {
      if (!IDENT.test(col)) throw new Error(`Invalid column "${col}"`)
      builder = builder.eq(col, val)
    }
    return builder
  }
  const requireFilter = () => {
    if (!q.eq || Object.keys(q.eq).length === 0)
      throw new Error(`${q.action} requires at least one \`eq\` filter`)
  }

  let res: QueryResult

  switch (q.action) {
    case 'select':
      res = await applyEq(t.select(q.columns ?? '*')).limit(Math.min(q.limit ?? MAX_ROWS, MAX_ROWS))
      break
    case 'insert':
      if (!q.values) throw new Error('insert requires `values`')
      res = await t.insert(q.values).select()
      break
    case 'update':
      if (!q.values || Array.isArray(q.values)) throw new Error('update requires an object in `values`')
      requireFilter()
      res = await applyEq(t.update(q.values)).select()
      break
    case 'delete':
      requireFilter()
      res = await applyEq(t.delete()).select()
      break
    default:
      throw new Error(`Unknown action "${q.action}"`)
  }

  if (res.error) return fail(res.error.message)
  return ok({ rowCount: res.data?.length ?? 0, rows: res.data ?? [] })
}