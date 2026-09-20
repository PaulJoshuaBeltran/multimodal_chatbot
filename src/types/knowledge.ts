// src/types/knowledge.ts
export interface KnowledgeChunk {
  id: string
  chunkIndex: number
  preview: string
}

export interface KnowledgeDocument {
  id: string
  title: string
  category: string
  status: string
  createdAt: string
  updatedAt: string
  chunks: KnowledgeChunk[]
}

export interface ChunkMetadata {
  chunkIndex?: number;
  text?: string;
}