"use client";

import { useRef, useState } from "react";
import { ArrowRight, Square } from "lucide-react";
import { deviceHeaders } from "@/lib/api";

type Props = {
  onImported: () => void;
};

export function UrlImport({ onImported }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleImport = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setProgress("Starting crawl...");
    setError("");

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
        setError(data.error || "Crawl failed");
        setLoading(false);
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
            setProgress(`${event.completed}/${event.total} — ${path}`);
          } else if (event.type === "complete") {
            setProgress(`Done — ${event.totalPages} pages, ${event.totalChunks} chunks indexed`);
            setUrl("");
            onImported();
          } else if (event.type === "error") {
            setError(event.message);
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
        setProgress("Crawl stopped — partial results indexed");
        onImported();
      } else {
        setError(err instanceof Error ? err.message : "Crawl failed");
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleImport();
  };

  return (
    <div className="px-4 py-4">
      <p className="text-xs font-semibold text-mutedForeground uppercase tracking-widest mb-3">
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
          className="flex-1 min-w-0 bg-card border border-border text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-mutedForeground transition-shadow"
        />
        <button
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-foreground text-primaryForeground disabled:opacity-25 hover:opacity-80 transition-opacity shrink-0"
          aria-label="Import URL"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {progress && (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-mutedForeground leading-snug flex-1 min-w-0">{progress}</p>
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
      )}
      {error && (
        <p className="mt-2 text-xs text-destructive leading-snug">{error}</p>
      )}
    </div>
  );
}
