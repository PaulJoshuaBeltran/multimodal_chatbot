// src/app/api/chat/langsmith/route.ts
import { invokeRagGraphWithOnlineEval } from "@/lib/langsmith/onlineEval";
import { GraphInput } from "@/src/types/chat"


export async function GET() {
  const input: GraphInput = {
    inputType: "text",
    query: "How to close all assets and what are needed?"
  }

//   const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads', 'document')
//   const input: GraphInput = {
//     inputType: "document",
//     query: "Whats the university project?",
//     filePath: `${UPLOAD_DIR}\\Beltran_PaulJoshua_Cover_Letter.pdf`,
//     fileType: "pdf",
//   };

//   const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads', 'image')
//   const input: GraphInput = {
//     inputType: "image",
//     query: "How to close all assets and what are needed?",
//     imageBase64: `${UPLOAD_DIR}\\Binance.png`,
//   };

  const result = await invokeRagGraphWithOnlineEval(input);
  return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
}