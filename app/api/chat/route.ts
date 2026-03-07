import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { embedTexts } from "@/lib/embeddings";
import { matchChunks } from "@/lib/retrieval";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const CHAT_MODEL = "gpt-4o-mini";
const MAX_SOURCES = 4;

function buildSystemPrompt(sources: { document_name?: string | null; content: string }[]) {
  if (!sources.length) {
    return "You are AskBase, a helpful assistant. If you do not have enough context, say you do not know.";
  }
  const formatted = sources
    .map((source, index) => {
      const name = source.document_name ? `(${source.document_name})` : "";
      return `[${index + 1}] ${name} ${source.content}`.trim();
    })
    .join("\n\n");

  return `You are AskBase, a helpful assistant. Use the sources below to answer the user.\n\nRules:\n- Cite sources with [number] after the sentence.\n- If the answer is not in the sources, say you do not know.\n\nSources:\n${formatted}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const messages = body?.messages ?? [];
  const lastUser = [...messages].reverse().find((msg: any) => msg?.role === "user");

  if (!lastUser?.content) {
    return NextResponse.json({ error: "Missing user message" }, { status: 400 });
  }

  const deviceId = req.headers.get("x-device-id") || undefined;
  const supabase = getSupabaseAdmin();
  const openai = getOpenAIClient();

  const [queryEmbedding] = await embedTexts([lastUser.content]);
  const sources = await matchChunks(queryEmbedding, MAX_SOURCES, deviceId);
  const systemPrompt = buildSystemPrompt(sources);

  const queryInsert = supabase
    ? await supabase
        .from("queries")
        .insert({
          question: lastUser.content,
          response: "",
          sources: sources,
          device_id: deviceId || null,
        })
        .select("id")
        .single()
    : null;

  const queryId = queryInsert?.data?.id;

  const trimmedSources = sources.map((source) => ({
    ...source,
    content: source.content.slice(0, 240),
  }));

  if (!openai) {
    const fallbackText = "OpenAI is not configured. Add OPENAI_API_KEY to enable chat responses.";
    if (supabase && queryId) {
      await supabase
        .from("queries")
        .update({ response: fallbackText, sources: trimmedSources })
        .eq("id", queryId);
    }
    return NextResponse.json({ response: fallbackText, sources: trimmedSources, queryId });
  }

  const stream = await openai.chat.completions.create({
    model: CHAT_MODEL,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.filter((msg: any) => msg.role !== "system"),
    ],
  });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            fullResponse += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
      } catch (error) {
        controller.enqueue(encoder.encode("\n\n[Stream interrupted]"));
      } finally {
        controller.close();
        if (supabase && queryId) {
          await supabase
            .from("queries")
            .update({ response: fullResponse, sources: trimmedSources })
            .eq("id", queryId);
        }
      }
    },
  });

  const encodedSources = Buffer.from(JSON.stringify(trimmedSources)).toString("base64");
  const headers = new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "x-sources": encodedSources,
  });
  if (queryId) {
    headers.set("x-query-id", queryId);
  }

  return new Response(readable, { headers });
}
