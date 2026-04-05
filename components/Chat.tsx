"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ThumbsDown, ThumbsUp } from "lucide-react";
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

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  queryId?: string;
};

const STORAGE_KEY = "askbase-chat-messages";

function loadMessages(): Message[] {
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

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 1 | -1>>({});
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = loadMessages();
    if (stored.length > 0) setMessages(stored);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const chatPayload = useMemo(
    () => messages.map((msg) => ({ role: msg.role, content: msg.content })),
    [messages]
  );

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: deviceHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ messages: [...chatPayload, userMessage] }),
      });

      const sourcesHeader = res.headers.get("x-sources");
      const queryIdHeader = res.headers.get("x-query-id") || undefined;
      let sources: Source[] = [];
      if (sourcesHeader) {
        try {
          sources = JSON.parse(atob(sourcesHeader)) as Source[];
        } catch {
          try {
            sources = JSON.parse(sourcesHeader) as Source[];
          } catch {
            // ignore
          }
        }
      }

      if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: data.response || "", sources: data.sources, queryId: data.queryId }
              : msg
          )
        );
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let done = false;
      let content = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          content += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id ? { ...msg, content } : msg
            )
          );
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, sources, queryId: queryIdHeader }
            : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: error instanceof Error ? error.message : "Chat failed" }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, chatPayload]);

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
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="font-display text-base font-semibold text-foreground">A</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Ask anything about your documents</p>
<<<<<<< HEAD
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
=======
              <p className="text-xs text-mutedForeground max-w-xs leading-relaxed">
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
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
<<<<<<< HEAD
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent transition-all"
=======
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-mutedForeground hover:text-foreground hover:border-foreground/30 hover:bg-accent transition-all"
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
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
                      <ReactMarkdown>{msg.content || (loading ? "..." : "")}</ReactMarkdown>
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (() => {
                      const unique = msg.sources.filter(
                        (s, i, arr) =>
                          arr.findIndex((x) => x.document_name === s.document_name) === i
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
<<<<<<< HEAD
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
=======
                                  className="text-xs text-mutedForeground hover:text-foreground transition-colors underline underline-offset-2"
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
                                >
                                  [{index + 1}] {source.document_name || "Document"}
                                </a>
                              ) : (
                                <button
                                  key={source.id}
                                  onClick={() =>
                                    setExpandedSource(
                                      expandedSource === source.id ? null : source.id
                                    )
                                  }
<<<<<<< HEAD
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
=======
                                  className="text-xs text-mutedForeground hover:text-foreground transition-colors underline underline-offset-2"
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
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
<<<<<<< HEAD
                                className="rounded-xl bg-muted border border-border px-3.5 py-2.5 text-xs text-muted-foreground leading-relaxed"
=======
                                className="rounded-xl bg-muted border border-border px-3.5 py-2.5 text-xs text-mutedForeground leading-relaxed"
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
                              >
                                {source.content}
                              </div>
                            ) : null
                          )}
                        </div>
                      );
                    })()}

                    {/* Feedback */}
                    {msg.queryId && (
                      <div className="mt-2.5 flex items-center gap-2">
                        {feedbackGiven[msg.queryId] ? (
                          <span className="text-xs text-muted-foreground">
                            {feedbackGiven[msg.queryId] === 1
                              ? "Thanks!"
                              : "Thanks for letting us know."}
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleFeedback(msg.queryId!, 1)}
<<<<<<< HEAD
                              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
=======
                              className="text-mutedForeground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
                              aria-label="Thumbs up"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.queryId!, -1)}
<<<<<<< HEAD
                              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
=======
                              className="text-mutedForeground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
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
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t px-5 py-4 bg-card shrink-0">
        <div className="flex items-end gap-2.5 max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question... (Enter to send, Shift+Enter for newline)"
            rows={1}
<<<<<<< HEAD
            className="flex-1 resize-none overflow-hidden bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground leading-relaxed transition-shadow"
=======
            className="flex-1 resize-none overflow-hidden bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-mutedForeground leading-relaxed transition-shadow"
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
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
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
<<<<<<< HEAD
            className="shrink-0 h-[44px] w-[44px] flex items-center justify-center rounded-xl bg-foreground text-primary-foreground disabled:opacity-25 hover:opacity-80 transition-opacity"
=======
            className="shrink-0 h-[44px] w-[44px] flex items-center justify-center rounded-xl bg-foreground text-primaryForeground disabled:opacity-25 hover:opacity-80 transition-opacity"
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
