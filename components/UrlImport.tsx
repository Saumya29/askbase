"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  onImported: () => void;
};

export function UrlImport({ onImported }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setProgress("Starting crawl...");
    setError("");

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
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

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (!value) continue;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const match = line.match(/^data: (.+)$/);
          if (!match) continue;

          const event = JSON.parse(match[1]);

          if (event.type === "progress") {
            const host = new URL(event.currentUrl).pathname;
            setProgress(`Crawling page ${event.completed}/${event.total} - ${host}`);
          } else if (event.type === "complete") {
            setProgress(`Done! ${event.totalPages} pages, ${event.totalChunks} chunks indexed.`);
            setUrl("");
            onImported();
          } else if (event.type === "error") {
            setError(event.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crawl failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import URL</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com or sitemap.xml URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          <Button onClick={handleImport} disabled={loading || !url.trim()}>
            {loading ? "Crawling..." : "Import"}
          </Button>
        </div>
        {progress && <p className="text-sm text-mutedForeground">{progress}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>
    </Card>
  );
}
