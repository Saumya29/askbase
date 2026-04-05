"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload as UploadIcon,
  Globe,
  ArrowRight,
  Square,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  AlertTriangle,
} from "lucide-react";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { Chat } from "@/components/Chat";
import { deviceHeaders } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type Toast = {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
};

type UploadPhase = "idle" | "uploading" | "processing";
type CrawlPhase = "idle" | "connecting" | "crawling";

// ─── Toast Component ─────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-card border text-sm animate-slide-up ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : toast.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-card border-border text-foreground"
          }`}
        >
          {toast.type === "success" && <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
          {toast.type === "error" && <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
          {toast.type === "warning" && <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
          {toast.type === "info" && <Loader2 className="h-4 w-4 shrink-0 mt-0.5 animate-spin" />}
          <p className="flex-1 text-xs leading-relaxed">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Modal Backdrop ──────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-2xl shadow-demo max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function HomeClient() {
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);

  // Upload state
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadFileName, setUploadFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  // Crawl state
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlPhase, setCrawlPhase] = useState<CrawlPhase>("idle");
  const [crawlProgress, setCrawlProgress] = useState({ completed: 0, total: 0, path: "" });
  const abortRef = useRef<AbortController | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((type: Toast["type"], message: string, duration = 4000) => {
    const id = String(++toastIdRef.current);
    setToasts((prev) => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const crawlProgressPercent =
    crawlProgress.total > 0
      ? Math.round((crawlProgress.completed / crawlProgress.total) * 100)
      : 0;

  // ── Upload handler ──────────────────────────────────────────────────────

  const processFile = async (file: File) => {
    setUploadFileName(file.name);
    setUploadPhase("uploading");
    setShowUploadModal(false);

    addToast("info", `Uploading ${file.name}...`, 0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadPhase("processing");
      // Remove the "uploading" toast and show processing
      setToasts((prev) => prev.filter((t) => !t.message.startsWith("Uploading ")));
      addToast("info", `Processing ${file.name}: chunking & embedding...`, 0);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: deviceHeaders(),
        body: formData,
      });
      const data = await res.json();

      // Clear info toasts
      setToasts((prev) => prev.filter((t) => t.type !== "info"));

      if (!res.ok) {
        addToast("error", data.error || "Upload failed");
      } else if (data.warning) {
        addToast("warning", data.warning);
        setRefreshKey((k) => k + 1);
      } else {
        addToast("success", `${file.name} indexed successfully`);
        setRefreshKey((k) => k + 1);
      }
    } catch (error) {
      setToasts((prev) => prev.filter((t) => t.type !== "info"));
      addToast("error", error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadPhase("idle");
      setUploadFileName("");
    }
  };

  // ── Crawl handler ───────────────────────────────────────────────────────

  const handleCrawl = async () => {
    if (!crawlUrl.trim()) return;

    const urlToCrawl = crawlUrl.trim();
    setCrawlPhase("connecting");
    setShowUrlModal(false);

    const infoId = addToast("info", `Connecting to ${urlToCrawl}...`, 0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: deviceHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ url: urlToCrawl }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        dismissToast(infoId);
        addToast("error", data.error || "Crawl failed");
        setCrawlPhase("idle");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      // Switch to crawling phase
      dismissToast(infoId);
      setCrawlPhase("crawling");

      let done = false;
      let buffer = "";
      let currentInfoId = addToast("info", "Crawling pages...", 0);

      const processLines = (text: string) => {
        for (const line of text.split("\n\n")) {
          const match = line.match(/^data: (.+)$/);
          if (!match) continue;
          const event = JSON.parse(match[1]);

          if (event.type === "progress") {
            const path = new URL(event.currentUrl).pathname;
            setCrawlProgress({
              completed: event.completed,
              total: event.total,
              path,
            });
            // Update toast
            dismissToast(currentInfoId);
            currentInfoId = addToast(
              "info",
              `Crawling: ${event.completed}/${event.total} pages (${path})`,
              0
            );
          } else if (event.type === "complete") {
            dismissToast(currentInfoId);
            addToast(
              "success",
              `Done: ${event.totalPages} pages, ${event.totalChunks} chunks indexed`
            );
            setCrawlUrl("");
            setRefreshKey((k) => k + 1);
          } else if (event.type === "error") {
            dismissToast(currentInfoId);
            addToast("error", event.message);
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
      if (buffer.trim()) processLines(buffer);
    } catch (err) {
      setToasts((prev) => prev.filter((t) => t.type === "info"));
      if (err instanceof DOMException && err.name === "AbortError") {
        addToast("warning", "Crawl stopped. Partial results indexed");
        setRefreshKey((k) => k + 1);
      } else {
        addToast("error", err instanceof Error ? err.message : "Crawl failed");
      }
    } finally {
      abortRef.current = null;
      setCrawlPhase("idle");
      setCrawlProgress({ completed: 0, total: 0, path: "" });
    }
  };

  return (
    <div className="app-shell flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center h-14 border-b bg-card px-5 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mr-3"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="font-display text-base font-semibold tracking-tight">AskBase</span>

        <div className="flex-1 min-w-4" />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUrlModal(true)}
            disabled={crawlPhase !== "idle"}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            <Globe className="h-3.5 w-3.5" />
            Import URL
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={uploadPhase !== "idle"}
            className="flex items-center gap-1.5 text-xs font-medium bg-foreground text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            Upload PDF
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r flex flex-col overflow-hidden shrink-0 bg-surface">
          <div className="flex-1 overflow-y-auto">
            <DocumentsPanel refreshKey={refreshKey} />
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <Chat />
        </main>
      </div>

      {/* Upload Modal */}
      <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)}>
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Upload PDF</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a PDF file to index. It will be chunked, embedded, and made searchable.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file?.type === "application/pdf") processFile(file);
            }}
            className={`w-full flex flex-col items-center gap-3 py-10 rounded-xl border-2 border-dashed text-sm transition-all cursor-pointer ${
              dragging
                ? "border-foreground bg-accent text-foreground"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <UploadIcon className="h-6 w-6" />
            <span>Drop a PDF here or click to browse</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </Modal>

      {/* URL Import Modal */}
      <Modal open={showUrlModal} onClose={() => setShowUrlModal(false)}>
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Import URL</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Paste a URL to crawl. All linked pages will be extracted, chunked, and indexed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://example.com"
              value={crawlUrl}
              onChange={(e) => setCrawlUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
              autoFocus
              className="flex-1 min-w-0 bg-background border border-border text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground transition-shadow"
            />
            <button
              onClick={handleCrawl}
              disabled={!crawlUrl.trim()}
              className="h-10 w-10 flex items-center justify-center rounded-lg bg-foreground text-primary-foreground disabled:opacity-25 hover:opacity-80 transition-opacity shrink-0"
              aria-label="Start crawl"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Modal>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
