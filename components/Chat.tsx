"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThumbsDown, ThumbsUp } from "lucide-react";

export type Source = {
  id: string;
  document_id: string;
  document_name?: string | null;
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

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
      const sources = sourcesHeader ? (JSON.parse(sourcesHeader) as Source[]) : [];

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
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queryId, feedback }),
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Chat with your docs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <p className="text-sm text-mutedForeground">
              Ask a question about your uploaded PDFs.
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
                  </div>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase text-mutedForeground">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source, index) => (
                      <Badge key={source.id} className="text-xs">
                        [{index + 1}] {source.document_name || "Document"}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid gap-2">
                    {msg.sources.map((source, index) => (
                      <div key={source.id} className="rounded-md border bg-muted p-2 text-xs">
                        <span className="font-semibold">[{index + 1}]</span> {source.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
