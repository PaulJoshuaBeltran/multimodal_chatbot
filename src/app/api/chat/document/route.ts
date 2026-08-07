import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import fs from "node:fs";
import { readFile } from "node:fs/promises";
import mammoth from "mammoth";
import Papa from "papaparse";
import * as XLSX from "xlsx";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
).toString();

async function readPDF(filename: string): Promise<Record<string, string>[]> {
    const data = new Uint8Array(fs.readFileSync(filename));

    const pdf = await pdfjs.getDocument({ data }).promise;

    const result: Record<string, string>[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        result.push({"page": pageNumber.toString()});

        // ------------------------
        // Positioned Text
        // ------------------------

        const text = await page.getTextContent();

        for (const item of text.items) {
            // Skip marked-content items
            if (!("str" in item)) continue;

            const textItem = item as TextItem;

            const [, , , fontSize, x, y] = textItem.transform;

            result.push({
                "type" : "text",
                "text": textItem.str,
                "x": x,
                "y": y,
                "width": `${textItem.width}`,
                "height": `${textItem.height}`,
                "fontSize": `${fontSize}`,
                "fontName": `${textItem.fontName}`
            });
        }

        // ------------------------
        // Positioned Images
        // ------------------------
        const ops = await page.getOperatorList();

        for (let i = 0; i < ops.fnArray.length; i++) {
            const fn = ops.fnArray[i];
            const args = ops.argsArray[i];

            if (
                fn === pdfjs.OPS.paintImageXObject ||
                fn === pdfjs.OPS.paintInlineImageXObject
            ) {
                result.push({
                    "image": `${args[0]}`
                });
            }

            if (fn === pdfjs.OPS.transform) {
                const [a, , , d, x, y] = args as [ number, number, number, number, number, number];
                result.push({
                    "type": "Transform",
                    "x": `${x}`,
                    "y": `${y}`,
                    "width": `${a}`,
                    "height": `${d}`
                });
            }
        }
    }
    return result;
}

async function readDOCX(filename: string): Promise<string> {
    const buffer = await fs.readFileSync(filename);
    const result = await mammoth.convertToHtml({
        buffer
    });
    return result.value;
}

async function readTXT(filename: string): Promise<string> {
    const data = await readFile(filename, 'utf-8');
    return data;
}

async function readCSV(filename: string): Promise<Papa.ParseResult<unknown>> {
    const csv = await readFile(filename, "utf8");
    const result = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
    });
    return result;
}

async function readJSON(filename: string): Promise<unknown> {
    const read_json = await readFile(filename, "utf8");
    const json = JSON.parse(read_json);
    return json;
}

async function readXLSX(filename: string): Promise<Record<string, unknown[]>> {
    const buffer = fs.readFileSync(filename);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const result: Record<string, unknown[]> = {};
    for (const name of workbook.SheetNames) {
        result[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
    }
    return result;
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const filepath = url.searchParams.get('filepath') || undefined

  // http://localhost:3000/api/chat/document?filepath=C:/Users/PaulJoshua/Downloads/Chatbot_sample_files/Options 2.txt
  if (filepath && filepath.endsWith('.txt')) {
    const txt_result = await readTXT(filepath);
    return new Response(JSON.stringify({ content: txt_result }), { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  // http://localhost:3000/api/chat/document?filepath=C:/Users/PaulJoshua/Downloads/Chatbot_sample_files/redis_df_af5.csv
  else if (filepath && filepath.endsWith('.csv')) {
    const csv_result = await readCSV(filepath);
    return new Response(JSON.stringify({ content: csv_result }), { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  // http://localhost:3000/api/chat/document?filepath=C:/Users/PaulJoshua/Downloads/Chatbot_sample_files/RFT_grading_results.json
  else if (filepath && filepath.endsWith('.json')) {
    const json_result = await readJSON(filepath);
    return new Response(JSON.stringify({ content: json_result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  // http://localhost:3000/api/chat/document?filepath=C:/Users/PaulJoshua/Downloads/Chatbot_sample_files/UPNL Fix.xlsx
  else if (filepath && filepath.endsWith('.xlsx')) {
    const xlsx_result = await readXLSX(filepath);
    return new Response(JSON.stringify({ content: xlsx_result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  // http://localhost:3000/api/chat/document?filepath=C:/Users/PaulJoshua/Downloads/Chatbot_sample_files/Developer_Mock_Exam_Detailed_Final.docx
  else if (filepath && filepath.endsWith('.docx')) {
    const docx_result = await readDOCX(filepath);
    return new Response(JSON.stringify({ content: docx_result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  // http://localhost:3000/api/chat/document?filepath=C:/Users/PaulJoshua/Downloads/Chatbot_sample_files/Beltran_PaulJoshua_Cover_Letter.pdf
  else if (filepath && filepath.endsWith('.pdf')) {
    const pdf_result = await readPDF(filepath);
    return new Response(JSON.stringify({ content: pdf_result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ error: 'Unsupported file type. Only .pdf and .docx are supported.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
}