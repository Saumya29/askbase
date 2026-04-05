"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { ArrowUp, RotateCcw, Square, ThumbsDown, ThumbsUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { deviceHeaders } from "@/lib/api";

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

const STORAGE_KEY = "askbase-chat-messages";

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const SUGGESTED_PROMPTS = [
  "Summarize the document",
  "What are the key points?",
  "List the main topics",
];

function getMessageText(message: ChatMessage) {
  return message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("") ?? "";
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
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {normalizedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="font-display text-base font-semibold text-foreground">A</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Ask anything about your documents</p>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Upload a PDF or import a URL from the sidebar, then start asking questions.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent transition-all"
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
                  <div className="max-w-[68%] bg-muted border border-border px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[82%]">
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0 prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:my-2 prose-headings:font-semibold prose-headings:font-display">
                      <ReactMarkdown>{msg.content || (isLoading ? "..." : "")}</ReactMarkdown>
                    </div>

                    {msg.metadata?.sources && msg.metadata.sources.length > 0 && (() => {
                      const unique = msg.metadata!.sources!.filter(
                        (s, i, arr) => arr.findIndex((x) => x.document_name === s.document_name) === i
                      );
                      return (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                            {unique.map((source, index) =>
                              source.source_url ? (
                                <a
                                  key={source.id}
                                  href={source.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                                >
                                  [{index + 1}] {source.document_name || "Document"}
                                </a>
                              ) : (
                                <button
                                  key={source.id}
                                  onClick={() => setExpandedSource(expandedSource === source.id ? null : source.id)}
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                                >
                                  [{index + 1}] {source.document_name || "Document"}
                                </button>
                              )
                            )}
                          </div>
                          {unique.map((source) =>
                            expandedSource === source.id && !source.source_url ? (
                              <div
                                key={`expanded-${source.id}`}
                                className="rounded-xl bg-muted border border-border px-3.5 py-2.5 text-xs text-muted-foreground leading-relaxed"
                              >
                                {source.content}
                              </div>
                            ) : null
                          )}
                        </div>
                      );
                    })()}

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

            {error && (
              <div className="text-xs text-destructive">{error.message}</div>
            )}
          </div>
        )}
      </div>

      <div className="border-t px-5 py-4 bg-card shrink-0">
        <div className="flex items-end gap-2.5 max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question... (Enter to send, Shift+Enter for newline)"
            rows={1}
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

          {lastAssistantMessage && !isLoading && (
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
      </div>
    </div>
  );
}
