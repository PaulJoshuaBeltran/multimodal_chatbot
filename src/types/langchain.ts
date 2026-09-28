// src/types/langchain.ts
type CellValue = string | number | boolean | Date | null | undefined;
export type SheetRow = Record<string, CellValue>;