// lib/langchain.ts
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { JSONLoader } from "@langchain/classic/document_loaders/fs/json";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import * as XLSX from "xlsx";
import fs from "fs";
import { XMLParser } from "fast-xml-parser";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

type FileType = "pdf" | "txt" | "csv" | "json" | "xml" | "xlsx" | "docx";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

async function loadPdfAsDocuments(filePath: string): Promise<Document[]> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjs.getDocument({ data }).promise;
  const documents: Document[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);

    // Text, reconstructing line breaks on y-position changes
    const textContent = await page.getTextContent();
    const lines: string[] = [];
    let currentLine = "";
    let lastY: number | undefined;

    for (const item of textContent.items) {
      if (!("str" in item)) continue;
      const textItem = item as TextItem;
      const y = textItem.transform[5];
      if (lastY !== undefined && y !== lastY) {
        lines.push(currentLine);
        currentLine = "";
      }
      currentLine += textItem.str;
      lastY = y;
    }
    if (currentLine) lines.push(currentLine);

    // Images, same operator-list scan as your working version
    const ops = await page.getOperatorList();
    const imageNames: string[] = [];
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (
        fn === pdfjs.OPS.paintImageXObject ||
        fn === pdfjs.OPS.paintInlineImageXObject
      ) {
        imageNames.push(String(ops.argsArray[i][0]));
      }
    }

    documents.push(
      new Document({
        pageContent: lines.join("\n"),
        metadata: {
          source: filePath,
          pageNumber,
          totalPages: pdf.numPages,
          imageCount: imageNames.length,
          images: imageNames, // XObject names, e.g. "Im1" — not the image bytes themselves
        },
      })
    );
  }

  return documents;
}

// LOAD XML: UnstructuredLoader not working properly with bundler,
// so read file and imitate UnstructuredLoader behavior
function flattenXmlNode(node: unknown, prefix = ""): string {
  if (node === null || node === undefined) return "";
  if (typeof node !== "object") return `${prefix}: ${node}`;

  const parts: string[] = [];
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      value.forEach((v, i) => parts.push(flattenXmlNode(v, `${path}[${i}]`)));
    } else if (typeof value === "object") {
      parts.push(flattenXmlNode(value, path));
    } else {
      parts.push(`${path}: ${value}`);
    }
  }
  return parts.filter(Boolean).join(", ");
}

// LOAD XLSX: UnstructuredLoader not working properly with bundler,
// so read file and imitate UnstructuredLoader behavior
type CellValue = string | number | boolean | Date | null | undefined;
type SheetRow = Record<string, CellValue>;

function loadXlsxAsDocuments(
  filePath: string,
  pageContentColumn?: string
): Document[] {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const documents: Document[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: null });

    for (const row of rows) {
      const hasExplicitContent =
        pageContentColumn && row[pageContentColumn] != null;

      const pageContent = hasExplicitContent
        ? String(row[pageContentColumn as string])
        : Object.entries(row)
            .filter(([, v]) => v != null)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");

      const metadata = hasExplicitContent
        ? { ...row, [pageContentColumn as string]: undefined }
        : { ...row };

      documents.push(
        new Document({ pageContent, metadata: { ...metadata, sheet: sheetName } })
      );
    }
  }

  return documents;
}

function findRecordArray(node: unknown): unknown[] | null {
  if (node && typeof node === "object") {
    for (const value of Object.values(node)) {
      if (Array.isArray(value) && value.length > 1) return value;
    }
    for (const value of Object.values(node)) {
      const found = findRecordArray(value);
      if (found) return found;
    }
  }
  return null;
}

function loadXmlAsDocuments(filePath: string): Document[] {
  const xml = fs.readFileSync(filePath, "utf-8");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed: unknown = parser.parse(xml);

  const records = findRecordArray(parsed);
  const documents: Document[] = [];

  if (records) {
    records.forEach((record, i) => {
      documents.push(
        new Document({
          pageContent: flattenXmlNode(record),
          metadata: { source: filePath, recordIndex: i },
        })
      );
    });
  } else {
    documents.push(
      new Document({ pageContent: flattenXmlNode(parsed), metadata: { source: filePath } })
    );
  }

  return documents;
}

// Main functions
export async function readDocument(
  filePath: string,
  fileType: FileType
): Promise<Document<Record<string, unknown>>[] | undefined> {
  switch (fileType) {
    case "pdf": // has issue with bundling conflict
      // return await new PDFLoader(filePath).load();
      return await loadPdfAsDocuments(filePath);
    case "txt":
      return await new TextLoader(filePath).load();
    case "csv":
      return await new CSVLoader(filePath).load();
    case "json":
      return await new JSONLoader(filePath).load();
    case "xml":
      return loadXmlAsDocuments(filePath);
    case "xlsx":
      return loadXlsxAsDocuments(filePath);
    case "docx":
      return await new DocxLoader(filePath).load();
    default:
      return undefined;
  }
}

export async function splitChunkDocument<M extends Record<string, unknown>>(
  rawDocs: Document<M>[]
): Promise<Document<M>[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
  });
  return (await splitter.splitDocuments(rawDocs)) as Document<M>[];
}