"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  Square,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { deviceHeaders } from "@/lib/api";

type Props = {
  onImported: () => void;
};

type CrawlStatus = {
  type: "idle" | "connecting" | "crawling" | "done" | "stopped" | "error";
  message: string;
  completed?: number;
  total?: number;
};

export function UrlImport({ onImported }: Props) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<CrawlStatus>({
    type: "idle",
    message: "",
  });
  const abortRef = useRef<AbortController | null>(null);

  const loading = status.type === "connecting" || status.type === "crawling";

  const progressPercent =
    status.type === "crawling" && status.total && status.total > 0
      ? Math.round((status.completed! / status.total) * 100)
      : 0;

  const handleImport = async () => {
    if (!url.trim()) return;

    setStatus({ type: "connecting", message: "Connecting..." });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: deviceHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus({
          type: "error",
          message: data.error || "Crawl failed",
        });
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let done = false;
      let buffer = "";

      const processLines = (text: string) => {
        for (const line of text.split("\n\n")) {
          const match = line.match(/^data: (.+)$/);
          if (!match) continue;

          const event = JSON.parse(match[1]);

          if (event.type === "progress") {
            const path = new URL(event.currentUrl).pathname;
            setStatus({
              type: "crawling",
              message: `Indexing ${path}`,
              completed: event.completed,
              total: event.total,
            });
          } else if (event.type === "complete") {
            setStatus({
              type: "done",
              message: `${event.totalPages} pages, ${event.totalChunks} chunks indexed`,
            });
            setUrl("");
            onImported();
            setTimeout(
              () => setStatus({ type: "idle", message: "" }),
              4000
            );
          } else if (event.type === "error") {
            setStatus({ type: "error", message: event.message });
          }
        }
      };

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (!value) continue;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        processLines(lines.join("\n\n"));
      }

      if (buffer.trim()) {
        processLines(buffer);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus({
          type: "stopped",
          message: "Crawl stopped. Partial results indexed",
        });
        onImported();
      } else {
        setStatus({
          type: "error",
          message: err instanceof Error ? err.message : "Crawl failed",
        });
      }
    } finally {
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleImport();
  };

  return (
    <div className="px-4 py-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Import URL
      </p>
      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="flex-1 min-w-0 bg-card border border-border text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground transition-shadow"
        />
        <button
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-foreground text-primary-foreground disabled:opacity-25 hover:opacity-80 transition-opacity shrink-0"
          aria-label="Import URL"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Status indicator */}
      {status.type !== "idle" && (
        <div className="mt-3 space-y-2">
          {/* Progress bar */}
          {loading && (
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  status.type === "connecting"
                    ? "bg-foreground/40 animate-pulse w-[15%]"
                    : "bg-foreground/60"
                }`}
                style={
                  status.type === "crawling"
                    ? { width: `${Math.max(progressPercent, 10)}%` }
                    : undefined
                }
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Status icon */}
            {loading && (
              <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin shrink-0" />
            )}
            {status.type === "done" && (
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            )}
            {status.type === "error" && (
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
            {status.type === "stopped" && (
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            )}

            {/* Status text */}
            <p
              className={`text-xs leading-snug flex-1 min-w-0 ${
                status.type === "error"
                  ? "text-destructive"
                  : status.type === "done"
                  ? "text-emerald-600"
                  : status.type === "stopped"
                  ? "text-amber-600"
                  : "text-muted-foreground"
              }`}
            >
              {status.message}
              {status.type === "crawling" &&
                status.total &&
                ` (${status.completed}/${status.total})`}
            </p>

            {/* Stop button */}
            {loading && (
              <button
                onClick={() => abortRef.current?.abort()}
                className="text-xs text-destructive hover:opacity-70 transition-opacity shrink-0 flex items-center gap-1"
                aria-label="Stop crawl"
              >
                <Square className="h-3 w-3" />
                Stop
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
