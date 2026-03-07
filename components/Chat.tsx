"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

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

export function Chat() {
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 1 | -1>>({});
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const chatPayload = useMemo(() => {
    return messages.map((msg) => ({ role: msg.role, content: msg.content }));
  }, [messages]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;

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
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      if (!reader) {
        throw new Error("No response body");
      }

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
            ? {
                ...msg,
                content: error instanceof Error ? error.message : "Chat failed",
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (queryId: string, feedback: 1 | -1) => {
    setFeedbackGiven((prev) => ({ ...prev, [queryId]: feedback }));
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queryId, feedback }),
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Chat with your docs</CardTitle>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat}>
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div ref={scrollRef} className="space-y-4 max-h-[60vh] overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-mutedForeground">
              Ask a question about your uploaded documents.
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.role === "user"
                  ? "rounded-lg bg-muted p-3"
                  : "rounded-lg border bg-card p-3"
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-mutedForeground">
                  {msg.role === "user" ? "You" : "AskBase"}
                </span>
                {msg.role === "assistant" && msg.queryId && (
                  <div className="flex items-center gap-2">
                    {feedbackGiven[msg.queryId!] ? (
                      <span className="text-xs text-mutedForeground">
                        {feedbackGiven[msg.queryId!] === 1
                          ? "Thanks for the feedback!"
                          : "Thanks for letting us know. We'll improve!"}
                      </span>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(msg.queryId!, 1)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(msg.queryId!, -1)}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-li:my-0 prose-ul:my-1 prose-ol:my-1 prose-headings:my-2">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              {msg.sources && msg.sources.length > 0 && (() => {
                const unique = msg.sources.filter(
                  (s, i, arr) => arr.findIndex((x) => x.document_name === s.document_name) === i
                );
                return (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase text-mutedForeground">Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {unique.map((source, index) =>
                        source.source_url ? (
                          <a key={source.id} href={source.source_url} target="_blank" rel="noopener noreferrer">
                            <Badge className="text-xs cursor-pointer hover:opacity-80">
                              [{index + 1}] {source.document_name || "Document"}
                            </Badge>
                          </a>
                        ) : (
                          <Badge
                            key={source.id}
                            className="text-xs cursor-pointer hover:opacity-80"
                            onClick={() =>
                              setExpandedSource(expandedSource === source.id ? null : source.id)
                            }
                          >
                            [{index + 1}] {source.document_name || "Document"}
                          </Badge>
                        )
                      )}
                    </div>
                    {unique.map((source) =>
                      expandedSource === source.id && !source.source_url ? (
                        <div key={`expanded-${source.id}`} className="rounded bg-muted p-2 text-xs text-mutedForeground">
                          {source.content}
                        </div>
                      ) : null
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a question..."
            rows={3}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Thinking..." : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
