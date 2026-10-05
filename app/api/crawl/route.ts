import { crawlSite } from "@/lib/crawl";
import { chunkText } from "@/lib/chunking";
import { embedTexts } from "@/lib/embeddings";
import { getSupabaseAdmin } from "@/lib/supabase";
import { env } from "@/lib/env";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const url = body?.url;

  if (typeof url !== "string" || !url.trim()) {
    return new Response(JSON.stringify({ error: "URL is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase || !env.openaiApiKey) {
    return new Response(JSON.stringify({ error: "URL import is temporarily unavailable. Please try again later." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        // Create parent document
        const deviceId = req.headers.get("x-device-id") || null;

        const { data: parentDoc, error: parentError } = await supabase
          .from("documents")
          .insert({
            name: parsedUrl.hostname,
            source_type: "url",
            source_url: parsedUrl.toString(),
            size: 0,
            chunk_count: 0,
            device_id: deviceId,
          })
          .select("id")
          .single();

        if (parentError || !parentDoc) {
          send({ type: "error", message: parentError?.message || "Failed to create document" });
          return;
        }

        const parentId = parentDoc.id;
        let totalPages = 0;
        let totalChunks = 0;

        for await (const page of crawlSite(parsedUrl.toString(), { signal: req.signal })) {
          if (req.signal.aborted) break;
          totalPages++;

          send({
            type: "progress",
            completed: totalPages,
            total: totalPages + page.queued,
            currentUrl: page.url,
          });

          // Chunk and embed
          const chunks = chunkText(page.text);
          if (chunks.length === 0) continue;

          const embeddings = await embedTexts(chunks.map((c) => c.content));

          // Create child document
          const { data: childDoc, error: childError } = await supabase
            .from("documents")
            .insert({
              name: page.title,
              source_type: "url",
              source_url: page.url,
              parent_id: parentId,
              size: page.text.length,
              chunk_count: chunks.length,
              device_id: deviceId,
            })
            .select("id")
            .single();

          if (childError || !childDoc) throw new Error("Could not save the imported page. Please retry the import.");

          // Insert chunks
          const chunkRows = chunks.map((chunk, i) => ({
            document_id: childDoc.id,
            content: chunk.content,
            embedding: JSON.stringify(embeddings[i]),
            metadata: JSON.stringify({ url: page.url, title: page.title }),
          }));

          const { error: chunkError } = await supabase.from("chunks").insert(chunkRows);
          if (chunkError) throw new Error("Could not index the imported page. Please retry the import.");

          totalChunks += chunks.length;

          send({
            type: "page_done",
            title: page.title,
            url: page.url,
            chunkCount: chunks.length,
          });
        }

        // Update parent chunk_count
        const { error: updateError } = await supabase
          .from("documents")
          .update({ chunk_count: totalChunks })
          .eq("id", parentId);
        if (updateError) throw new Error("Could not finish saving the import. Please retry.");
        if (!totalChunks) throw new Error("No readable text was found. Try a public page with text content.");

        send({
          type: "complete",
          documentId: parentId,
          totalPages,
          totalChunks,
        });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Crawl failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
