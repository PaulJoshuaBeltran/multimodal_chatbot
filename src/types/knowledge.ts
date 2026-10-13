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

// TEMPORARY
export interface ToolDocument {
  id: string
  title: string
  description: string
  category: string
  createdAt: string
  updatedAt: string
}

export interface ChunkMetadata {
  chunkIndex?: number;
  text?: string;
}