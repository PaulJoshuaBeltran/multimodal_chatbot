export interface KnowledgeChunk {
    id: string;
    values: number[];
    metadata: {
        documentId: string;
        title: string;
        chunkIndex: number;
        text: string;
    };
}