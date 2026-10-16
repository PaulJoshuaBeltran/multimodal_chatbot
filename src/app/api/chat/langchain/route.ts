// src/app/api/chat/langchain/route.ts
import path from "path";
import { invokeRagGraphWithOnlineEval } from "@/src/lib/langsmith/onlineEval";
import { uploadPathFromUrl } from "@/src/lib/uploads";
import { ALLOWED_EXT, type FileType } from "@/src/types/file_upload";
import type { GraphInput } from "@/src/types/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { query, fileUrl, fileName } = (await req.json()) as {
      query?: string; fileUrl?: string; fileName?: string;
    };
    if (!query?.trim() && !fileUrl) return Response.json({ error: "Missing 'query' or 'fileUrl'" }, { status: 400 });

    let input: GraphInput = { inputType: "text", query: query ?? "" };
    if (fileUrl) {
      const ext = path.extname(fileName ?? fileUrl).slice(1).toLowerCase();
      if (!ALLOWED_EXT.has(ext as FileType)) return Response.json({ error: `Unsupported file type "${ext}"` }, { status: 400 });
      input = { inputType: "document", query: query ?? "", filePath: uploadPathFromUrl(fileUrl), fileType: ext as FileType };
    }

    // Full graph incl. LLM node + LangSmith online evaluators
    return Response.json(await invokeRagGraphWithOnlineEval(input));
  } catch (err) {
    console.error(err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}