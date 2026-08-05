import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import fs from "node:fs";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
).toString();

const filename = "./documents/sample.pdf";

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

export async function GET(req: Request) {
  const url = new URL(req.url)
  const filepath = url.searchParams.get('filepath') || undefined
  const pdf_result = filepath ? await readPDF(filepath) : { error: 'Filepath not provided' };
  return new Response(JSON.stringify(pdf_result), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

readPDF(filename).catch(console.error);