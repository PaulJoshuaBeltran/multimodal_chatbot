// src/app/api/chat/langgraph/route.ts
import { ragGraph } from "@/lib/langgraph/chatPromptRag";
import path from 'path'

export async function GET() {
  // const result = await ragGraph.invoke({
  //   inputType: "text",
  //   query: "How to close all assets and what are needed?"
  // });

  // const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads', 'document')
  // const result = await ragGraph.invoke({
  //   inputType: "document",
  //   query: "Whats the university project?",
  //   filePath: `${UPLOAD_DIR}\\Beltran_PaulJoshua_Cover_Letter.pdf`,
  //   fileType: "pdf",
  // });

  const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads', 'image')
  const result = await ragGraph.invoke({
    inputType: "image",
    query: "How to close all assets and what are needed?",
    imageBase64: `${UPLOAD_DIR}\\Binance.png`,
  });

  return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
}