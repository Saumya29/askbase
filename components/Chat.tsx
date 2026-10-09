"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { ArrowUp, RotateCcw, Square, Loader2, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { deviceHeaders } from "@/lib/api";
import { SourceCitations } from "@/components/SourceCitations";

export type Source = {
  id: string;
  document_id: string;
  document_name?: string | null;
  source_url?: string | null;
  similarity: number;
  content: string;
};

type ChatMetadata = {
  sources?: Source[];
  queryId?: string;
};

type ChatMessage = UIMessage<ChatMetadata>;
type LegacyMessage = {
  id?: string;
  role?: "user" | "assistant";
  content?: string;
  sources?: Source[];
  queryId?: string;
};

const STORAGE_KEY = "askbase-chat-messages";

function normalizeStoredMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((message): ChatMessage | null => {
      if (!message || typeof message !== "object") return null;

      const maybeMessage = message as Partial<ChatMessage> & LegacyMessage;

      if (Array.isArray(maybeMessage.parts) && typeof maybeMessage.role === "string") {
        const hasVisibleText = maybeMessage.parts.some(
          (part) => part.type === "text" && typeof part.text === "string" && part.text.trim().length > 0
        );
        const hasMetadata = Boolean(maybeMessage.metadata?.sources?.length || maybeMessage.metadata?.queryId);
        if (!hasVisibleText && !hasMetadata) return null;
        return maybeMessage as ChatMessage;
      }

      if ((maybeMessage.role === "user" || maybeMessage.role === "assistant") && typeof maybeMessage.content === "string") {
        const content = maybeMessage.content.trim();
        const hasMetadata = Boolean(maybeMessage.sources?.length || maybeMessage.queryId);
        if (!content && !hasMetadata) return null;

        return {
          id: maybeMessage.id || crypto.randomUUID(),
          role: maybeMessage.role,
          parts: content ? [{ type: "text", text: content }] : [],
          metadata:
            maybeMessage.role === "assistant"
              ? {
                  sources: maybeMessage.sources,
                  queryId: maybeMessage.queryId,
                }
              : undefined,
        } as ChatMessage;
      }

      return null;
    })
    .filter((message): message is ChatMessage => message !== null);
}

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeStoredMessages(JSON.parse(stored)) : [];
  } catch {
    return [];
  }
}

const SUGGESTED_PROMPTS = [
  "What did the Harbour AI pilot achieve?",
  "Which targets did the pilot miss?",
  "What needs to happen before a public launch?",
];

function getMessageText(message: ChatMessage) {
  return message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("") ?? "";
}

function getChatErrorMessage(error: Error) {
  try {
    const body = JSON.parse(error.message);
    if (typeof body.error === "string") return body.error;
  } catch {
    // Streaming errors already contain a readable message.
  }
  return error.message === "Failed to fetch" ? "Connection interrupted. Retry your question." : error.message;
}

export function Chat() {
  const [input, setInput] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 1 | -1>>({});
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hydrated = useRef(false);

  const {
    messages,
    setMessages,
    sendMessage,
    stop,
    regenerate,
    status,
    error,
  } = useChat<ChatMessage>({
    messages: [],
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: deviceHeaders(),
    }),
  });

  useEffect(() => {
    if (hydrated.current) return;
    const stored = loadMessages();
    if (stored.length > 0) setMessages(stored);
    hydrated.current = true;
  }, [setMessages]);

  useEffect(() => {
    if (hydrated.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, [setMessages]);

  const sendCurrentMessage = useCallback(async () => {
    if (!input.trim() || status === "submitted" || status === "streaming") return;
    const text = input.trim();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage({ text });
  }, [input, sendMessage, status]);

  const handleFeedback = async (queryId: string, feedback: 1 | -1) => {
    setFeedbackGiven((prev) => ({ ...prev, [queryId]: feedback }));
    await fetch("/api/feedback", {
      method: "POST",
      headers: deviceHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ queryId, feedback }),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendCurrentMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const isLoading = status === "submitted" || status === "streaming";
  const latestMessage = messages.at(-1);
  const lastUserMessage = [...messages].reverse().find(msg => msg.role === "user");
  const lastAssistantMessage = [...messages].reverse().find((msg) => msg.role === "assistant");

  const normalizedMessages = useMemo(
    () =>
      messages.map((msg) => ({
        ...msg,
        content: getMessageText(msg),
        metadata: msg.metadata,
      })),
    [messages]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {normalizedMessages.length === 0 ? (
          <div className="askbase-empty-state">
            <div className="askbase-empty-icon"><Sparkles size={19} /></div>
            <div className="askbase-empty-copy">
              <span>TRY THE SAMPLE DOCUMENTS</span>
              <h1>Ask about Harbour AI</h1>
              <p>Explore a fictional support copilot through its product brief, safety policy and pilot results. Open a citation to check each answer.</p>
            </div>
            <div className="askbase-prompt-list">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    void sendMessage({ text: prompt });
                  }}
                  className="askbase-prompt"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
            {normalizedMessages.map((msg) => (
              <div
                key={msg.id}
                className={msg.role === "user" ? "flex justify-end" : "flex flex-col gap-2"}
              >
                {msg.role === "user" ? (
                  <div className="askbase-user-message max-w-[90%] sm:max-w-[68%] bg-muted border border-border px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-full sm:max-w-[90%]">
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0 prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:my-2 prose-headings:font-semibold prose-headings:font-display">
                      <ReactMarkdown>{msg.content || (isLoading ? "..." : "")}</ReactMarkdown>
                    </div>

                    {msg.metadata?.sources && msg.metadata.sources.length > 0 && /\[\d+\]/.test(msg.content) && (
                      <SourceCitations
                        sources={msg.metadata.sources}
                        expandedSource={expandedSource?.startsWith(`${msg.id}:`) ? expandedSource.slice(msg.id.length + 1) : null}
                        onToggle={(id) => { const key = `${msg.id}:${id}`; setExpandedSource(expandedSource === key ? null : key); }}
                      />
                    )}

                    {msg.metadata?.queryId && (
                      <div className="mt-2.5 flex items-center gap-2">
                        {feedbackGiven[msg.metadata.queryId] ? (
                          <span className="text-xs text-muted-foreground">
                            {feedbackGiven[msg.metadata.queryId] === 1
                              ? "Thanks!"
                              : "Thanks for letting us know."}
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleFeedback(msg.metadata!.queryId!, 1)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                              aria-label="Thumbs up"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.metadata!.queryId!, -1)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                              aria-label="Thumbs down"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && <div role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding a supported answer…
            </div>}
            {error && (
              <div role="alert" className="rounded-xl border border-border p-3 text-xs flex items-center justify-between gap-3">
                <span>{getChatErrorMessage(error)}</span>
                {lastUserMessage && <button disabled={isLoading} onClick={() => void regenerate({ messageId: lastUserMessage.id })}
                  className="shrink-0 font-medium underline underline-offset-4 disabled:opacity-40">Retry question</button>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="askbase-composer border-t px-5 py-4 bg-card shrink-0">
        <div className="flex items-end gap-2.5 max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about these documents…"
            rows={1}
            aria-label="Ask about your documents"
            className="flex-1 resize-none overflow-hidden bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground leading-relaxed transition-shadow"
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors pb-2.5 shrink-0"
            >
              Clear
            </button>
          )}

          {lastAssistantMessage && latestMessage?.role === "assistant" && !error && !isLoading && (
            <button
              onClick={() => void regenerate({ messageId: lastAssistantMessage.id })}
              className="shrink-0 h-[44px] px-3 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Regenerate response"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          {isLoading ? (
            <button
              onClick={stop}
              className="shrink-0 h-[44px] px-3 flex items-center gap-1.5 justify-center rounded-xl bg-muted text-foreground hover:bg-accent transition-colors"
              aria-label="Stop generating"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs font-medium">Stop</span>
            </button>
          ) : (
            <button
              onClick={() => void sendCurrentMessage()}
              disabled={!input.trim()}
              className="shrink-0 h-[44px] w-[44px] flex items-center justify-center rounded-xl bg-foreground text-primary-foreground disabled:opacity-25 hover:opacity-80 transition-opacity"
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="askbase-composer-hint">Enter to ask <span>·</span> Shift + Enter for a new line</p>
      </div>
    </div>
  );
}
