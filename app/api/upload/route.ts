import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { chunkText } from "@/lib/chunking";
import { embedTexts } from "@/lib/embeddings";
import { getSupabaseAdmin } from "@/lib/supabase";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const BATCH_SIZE = 64;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Please use a PDF smaller than 10 MB." }, { status: 413 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase || !env.openaiApiKey) {
      return NextResponse.json({ error: "PDF upload is temporarily unavailable. Please try again later." }, { status: 503 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = await pdfParse(buffer, { version: "v2.0.550" });
    const text = parsed.text || "";

    const chunks = chunkText(text);

    if (!chunks.length) {
      return NextResponse.json({ error: "This PDF has no readable text. Try a text-based PDF rather than a scan." }, { status: 422 });
    }

    const deviceId = req.headers.get("x-device-id") || null;

    // Create embeddings before the document so an API failure cannot leave an empty entry.
    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE).map((chunk) => chunk.content);
      const vectors = await embedTexts(batch);
      embeddings.push(...vectors);
    }

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        name: file.name,
        size: file.size,
        chunk_count: chunks.length,
        device_id: deviceId,
      })
      .select()
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: docError?.message || "Insert failed" }, { status: 500 });
    }

    const chunkRows = chunks.map((chunk, index) => ({
      document_id: doc.id,
      content: chunk.content,
      embedding: embeddings[index],
      metadata: { index: chunk.index },
    }));

    if (chunkRows.length) {
      const { error: chunkError } = await supabase.from("chunks").insert(chunkRows);
      if (chunkError) {
        return NextResponse.json({ error: chunkError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, document: doc, chunks: chunkRows.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
