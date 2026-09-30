import { supabase } from "@/src/lib/supabase"
// import postgres from 'postgres'

// Smoke test of supabase
export async function POST() {
  const { data, error } = await supabase
    .from('todos')
    .insert({ title: 'hello hosted' })
    .select()
  console.log(`Data: ${JSON.stringify(data)} | Error: ${JSON.stringify(error)}`)

  const { data: rows } = await supabase
    .from('todos')
    .select('*')
  console.log(rows)
}
export async function PATCH() {
  const { data, error } = await supabase
    .from('todos')
    .update({ title: 'hello hosted v2' })
    .eq('title', 'hello hosted')
  console.log(`Data: ${JSON.stringify(data)} | Error: ${JSON.stringify(error)}`)

  const { data: rows } = await supabase.from('todos').select('*')
  console.log(rows)
}
export async function DELETE() {
  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('title', 'hello hosted v2')
  console.log(`Data: ${JSON.stringify(data)} | Error: ${JSON.stringify(error)}`)

  const { data: rows } = await supabase.from('todos').select('*')
  console.log(rows)
}

// Direct SQL (transactions and savepoints)
// export async function POST() {
//   const sql = postgres(process.env.DATABASE_URL_POOLER!, { prepare: false })
  
//   await sql.begin(async (tx) => {
//     await tx`insert into todos (title) values (${'A'})` // tx means transaction
//   })
// }