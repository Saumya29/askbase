import { convertToModelMessages, safeValidateUIMessages, streamText, createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { embedTexts } from "@/lib/embeddings";
import { matchChunks } from "@/lib/retrieval";
import { getSupabaseAdmin } from "@/lib/supabase";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const CHAT_MODEL = "gpt-4o-mini";
const MAX_SOURCES = 4;

type ChatMetadata = {
  sources?: Array<{
    id: string;
    document_id: string;
    document_name?: string | null;
    source_url?: string | null;
    similarity: number;
    content: string;
  }>;
  queryId?: string;
};

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
  const validated = await safeValidateUIMessages<UIMessage<ChatMetadata>>({ messages: body?.messages });
  if (!validated.success) return Response.json({ error: "Invalid chat messages" }, { status: 400 });
  const messages = validated.data;
  const lastUser = [...messages].reverse().find((msg) => msg.role === "user");

  const lastUserText =
    lastUser?.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("") || "";

  if (!lastUserText.trim()) {
    return new Response(JSON.stringify({ error: "Missing user message" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const deviceId = req.headers.get("x-device-id") || undefined;
  const supabase = getSupabaseAdmin();
  if (!env.openaiApiKey || !supabase) {
    return Response.json({ error: "Chat is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  let sources: Awaited<ReturnType<typeof matchChunks>>;
  try {
    const [queryEmbedding] = await embedTexts([lastUserText]);
    sources = await matchChunks(queryEmbedding, MAX_SOURCES);
  } catch (error) {
    console.error("[chat] retrieval error", error);
    return Response.json({ error: "Could not search the documents. Please try again." }, { status: 502 });
  }

  if (!sources.length) {
    return createUIMessageStreamResponse({
      stream: createUIMessageStream<UIMessage<ChatMetadata>>({
        execute: ({ writer }) => {
          writer.write({ type: "start", messageId: crypto.randomUUID(), messageMetadata: { sources: [] } });
          writer.write({ type: "text-start", id: "no-sources" });
          writer.write({ type: "text-delta", id: "no-sources", delta: "I couldn't find any source passages. Upload a PDF or import a public URL, then ask again." });
          writer.write({ type: "text-end", id: "no-sources" });
          writer.write({ type: "finish" });
        },
      }),
    });
  }

  const queryInsert = supabase
    ? await supabase
        .from("queries")
        .insert({
          question: lastUserText,
          response: "",
          sources: sources,
          device_id: deviceId || null,
        })
        .select("id")
        .single()
    : null;

  const queryId = queryInsert?.data?.id;

  const modelMessages = await convertToModelMessages(messages);
  const result = streamText({
    model: openai(CHAT_MODEL),
    messages: [
      { role: "system", content: buildSystemPrompt(sources) },
      ...modelMessages.filter((msg) => msg.role !== "system"),
    ],
  });

  return result.toUIMessageStreamResponse<UIMessage<ChatMetadata>>({
    originalMessages: messages,
    generateMessageId: () => crypto.randomUUID(),
    messageMetadata: () => ({
      sources,
      queryId,
    }),
    onFinish: async () => {
      const fullResponse = await result.text;
      if (supabase && queryId) {
        await supabase
          .from("queries")
          .update({ response: fullResponse, sources })
          .eq("id", queryId);
      }
    },
    onError: (error) => {
      console.error("[chat] stream error", error);
      return "An error occurred while generating the answer.";
    },
  });
}
