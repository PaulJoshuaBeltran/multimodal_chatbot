// src/types/knowledge.ts
export interface KnowledgeChunk {
  id: string
  chunkIndex: number
  preview: string
}

export interface KnowledgeDocument {
  id: string
  kbId: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
  chunks: KnowledgeChunk[]
}