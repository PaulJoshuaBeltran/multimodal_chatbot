// src/app/api/knowledge/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// List all documents from MongoDB
export async function GET() {
  const docs = await prisma.knowledgeDocument.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}