import { PDFParse } from "pdf-parse";
import { getPath } from "pdf-parse/worker";

PDFParse.setWorker(getPath());

export async function extractPdfText(data: Uint8Array) {
  const parser = new PDFParse({ data: new Uint8Array(data) });
  try {
    return await parser.getText();
  } finally {
    await parser.destroy();
  }
}
