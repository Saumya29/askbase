"use client";

import { useCallback, useRef, useState } from "react";
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
} from "lucide-react";
import { DocumentsPanel, type PendingDocument } from "@/components/DocumentsPanel";
import { Chat } from "@/components/Chat";
import { deviceHeaders } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type Toast = {
  id: string;
  type: "success" | "error";
  message: string;
};

type UploadPhase = "idle" | "uploading" | "processing" | "success" | "error";
type CrawlPhase = "idle" | "connecting" | "crawling" | "done" | "error";

// ─── Toast ───────────────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl shadow-card border text-sm animate-slide-up ${
            toast.type === "success"
              ? "bg-card border-emerald-200/60 text-emerald-800"
              : "bg-card border-red-200/60 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <p className="flex-1 text-xs leading-relaxed font-medium">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 p-1 rounded-lg opacity-40 hover:opacity-100 hover:bg-muted transition-all"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  closeable = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  closeable?: boolean;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/15 backdrop-blur-sm"
        onClick={closeable ? onClose : undefined}
      />
      <div className="relative bg-card border border-border rounded-2xl shadow-demo max-w-md w-full mx-4 animate-slide-up">
        {closeable && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({
  percent,
  indeterminate = false,
}: {
  percent?: number;
  indeterminate?: boolean;
}) {
  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      {indeterminate ? (
        <div className="h-full bg-foreground/40 rounded-full w-1/3 animate-indeterminate" />
      ) : (
        <div
          className="h-full bg-foreground/50 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(percent || 0, 5)}%` }}
        />
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function HomeClient() {
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);

  // Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);

  // Upload state
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);

  // Crawl state
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlPhase, setCrawlPhase] = useState<CrawlPhase>("idle");
  const [crawlProgress, setCrawlProgress] = useState({ completed: 0, total: 0, path: "" });
  const [crawlResult, setCrawlResult] = useState({ pages: 0, chunks: 0 });
  const [crawlError, setCrawlError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((type: Toast["type"], message: string, duration = 5000) => {
    const id = String(++toastIdRef.current);
    setToasts((prev) => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const addPendingDocument = useCallback((doc: PendingDocument) => {
    setPendingDocuments((prev) => [doc, ...prev.filter((item) => item.id !== doc.id)].slice(0, 4));
  }, []);

  const clearPendingDocument = useCallback((id: string) => {
    setPendingDocuments((prev) => prev.filter((doc) => doc.id !== id));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const uploadLoading = uploadPhase === "uploading" || uploadPhase === "processing";
  const crawlLoading = crawlPhase === "connecting" || crawlPhase === "crawling";

  const MAX_CRAWL_PAGES = 25;
  const crawlProgressPercent =
    crawlProgress.completed > 0
      ? Math.round((crawlProgress.completed / MAX_CRAWL_PAGES) * 100)
      : 0;

  // ── Upload handler ──────────────────────────────────────────────────────

  const processFile = async (file: File) => {
    const pendingId = `upload:${file.name}:${Date.now()}`;
    setUploadFileName(file.name);
    setUploadPhase("uploading");
    setUploadError("");
    addPendingDocument({
      id: pendingId,
      name: file.name,
      source_type: "pdf",
      detail: "Indexing PDF...",
    });

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadPhase("processing");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: deviceHeaders(),
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        clearPendingDocument(pendingId);
        setUploadPhase("error");
        setUploadError(data.error || "Upload failed");
      } else if (data.warning) {
        clearPendingDocument(pendingId);
        setUploadPhase("error");
        setUploadError(data.warning);
        setRefreshKey((k) => k + 1);
      } else {
        setUploadPhase("success");
        setRefreshKey((k) => k + 1);
        addToast("success", `${file.name} indexed successfully`);
        setTimeout(() => {
          clearPendingDocument(pendingId);
          setShowUploadModal(false);
          resetUpload();
        }, 1500);
      }
    } catch (error) {
      clearPendingDocument(pendingId);
      setUploadPhase("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const resetUpload = () => {
    setUploadPhase("idle");
    setUploadFileName("");
    setUploadError("");
  };

  // ── Crawl handler ───────────────────────────────────────────────────────

  const handleCrawl = async () => {
    if (!crawlUrl.trim()) return;

    const urlToCrawl = crawlUrl.trim();
    const pendingId = `crawl:${urlToCrawl}:${Date.now()}`;
    setCrawlPhase("connecting");
    setCrawlError("");
    setCrawlResult({ pages: 0, chunks: 0 });
    addPendingDocument({
      id: pendingId,
      name: new URL(urlToCrawl).hostname,
      source_type: "url",
      detail: `Crawling up to ${MAX_CRAWL_PAGES} pages...`,
    });

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
        clearPendingDocument(pendingId);
        setCrawlPhase("error");
        setCrawlError(data.error || "Crawl failed");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      setCrawlPhase("crawling");

      let done = false;
      let buffer = "";

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
          } else if (event.type === "complete") {
            setCrawlPhase("done");
            setCrawlResult({ pages: event.totalPages, chunks: event.totalChunks });
            setCrawlUrl("");
            setRefreshKey((k) => k + 1);
            addToast("success", `${event.totalPages} pages, ${event.totalChunks} chunks indexed`);
            setTimeout(() => {
              clearPendingDocument(pendingId);
              setShowUrlModal(false);
              resetCrawl();
            }, 2000);
          } else if (event.type === "error") {
            clearPendingDocument(pendingId);
            setCrawlPhase("error");
            setCrawlError(event.message);
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
      if (err instanceof DOMException && err.name === "AbortError") {
        setCrawlPhase("done");
        setRefreshKey((k) => k + 1);
        addToast("success", "Crawl stopped. Partial results indexed");
        setTimeout(() => clearPendingDocument(pendingId), 2000);
      } else {
        clearPendingDocument(pendingId);
        setCrawlPhase("error");
        setCrawlError(err instanceof Error ? err.message : "Crawl failed");
      }
    } finally {
      abortRef.current = null;
    }
  };

  const resetCrawl = () => {
    setCrawlPhase("idle");
    setCrawlUrl("");
    setCrawlProgress({ completed: 0, total: 0, path: "" });
    setCrawlResult({ pages: 0, chunks: 0 });
    setCrawlError("");
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
            onClick={() => { resetCrawl(); setShowUrlModal(true); }}
            disabled={crawlLoading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            <Globe className="h-3.5 w-3.5" />
            Import URL
          </button>
          <button
            onClick={() => { resetUpload(); setShowUploadModal(true); }}
            disabled={uploadLoading}
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
            <DocumentsPanel refreshKey={refreshKey} pendingDocuments={pendingDocuments} />
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <Chat />
        </main>
      </div>

      {/* ── Upload Modal ────────────────────────────────────────────────── */}
      <Modal
        open={showUploadModal}
        onClose={() => { setShowUploadModal(false); resetUpload(); }}
        closeable={!uploadLoading}
      >
        {/* Idle: show drop zone */}
        {uploadPhase === "idle" && (
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
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file?.type === "application/pdf") processFile(file);
              }}
              className={`w-full flex flex-col items-center gap-3 py-12 rounded-xl border-2 border-dashed text-sm transition-all cursor-pointer ${
                dragging
                  ? "border-foreground bg-accent text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-accent/40"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <UploadIcon className="h-5 w-5" />
              </div>
              <span>Drop a PDF here or click to browse</span>
            </button>
          </div>
        )}

        {/* Uploading / Processing */}
        {uploadLoading && (
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadFileName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {uploadPhase === "uploading" ? "Uploading file..." : "Chunking & embedding..."}
                </p>
              </div>
            </div>
            <ProgressBar
              percent={uploadPhase === "uploading" ? 30 : 70}
              indeterminate={uploadPhase === "processing"}
            />
            <p className="text-xs text-muted-foreground text-center">
              This may take a moment depending on file size.
            </p>
          </div>
        )}

        {/* Success */}
        {uploadPhase === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Indexed successfully</p>
              <p className="text-xs text-muted-foreground mt-1">{uploadFileName} is ready to chat with.</p>
            </div>
          </div>
        )}

        {/* Error */}
        {uploadPhase === "error" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Upload failed</p>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">{uploadError}</p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="w-full text-sm font-medium bg-foreground text-primary-foreground py-2.5 rounded-xl hover:opacity-80 transition-opacity"
            >
              Try again
            </button>
          </div>
        )}

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
      </Modal>

      {/* ── URL Import Modal ────────────────────────────────────────────── */}
      <Modal
        open={showUrlModal}
        onClose={() => { setShowUrlModal(false); resetCrawl(); if (crawlLoading) abortRef.current?.abort(); }}
        closeable={!crawlLoading}
      >
        {/* Idle: show URL input */}
        {crawlPhase === "idle" && (
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
                className="flex-1 min-w-0 bg-background border border-border text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground transition-shadow"
              />
              <button
                onClick={handleCrawl}
                disabled={!crawlUrl.trim()}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground text-primary-foreground disabled:opacity-25 hover:opacity-80 transition-opacity shrink-0"
                aria-label="Start crawl"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Up to 25 pages will be crawled per URL. Only publicly accessible pages are supported.
            </p>
          </div>
        )}

        {/* Connecting */}
        {crawlPhase === "connecting" && (
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium">Connecting...</p>
                <p className="text-xs text-muted-foreground mt-0.5">Fetching the first page</p>
              </div>
            </div>
            <ProgressBar indeterminate />
          </div>
        )}

        {/* Crawling */}
        {crawlPhase === "crawling" && (
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  Crawling {crawlProgress.completed}/{MAX_CRAWL_PAGES} pages
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {crawlProgress.path || "Processing..."}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <ProgressBar percent={crawlProgressPercent} />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {Math.min(crawlProgressPercent, 100)}% complete
                </p>
                <button
                  onClick={() => abortRef.current?.abort()}
                  className="flex items-center gap-1.5 text-xs font-medium text-destructive bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Square className="h-3 w-3" />
                  Stop crawl
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Done */}
        {crawlPhase === "done" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Crawl complete</p>
              <p className="text-xs text-muted-foreground mt-1">
                {crawlResult.pages} pages, {crawlResult.chunks} chunks indexed
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {crawlPhase === "error" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Crawl failed</p>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">{crawlError}</p>
              </div>
            </div>
            <button
              onClick={resetCrawl}
              className="w-full text-sm font-medium bg-foreground text-primary-foreground py-2.5 rounded-xl hover:opacity-80 transition-opacity"
            >
              Try again
            </button>
          </div>
        )}
      </Modal>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
