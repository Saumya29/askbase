"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Globe, Loader2, Trash2 } from "lucide-react";
import { deviceHeaders } from "@/lib/api";

export type DocumentRow = {
  id: string;
  name: string;
  size: number;
  chunk_count: number;
  created_at: string;
  source_type: string;
  source_url: string | null;
};

export type PendingDocument = {
  id: string;
  name: string;
  source_type: "pdf" | "url";
  detail: string;
};

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function dedupeDocuments(documents: DocumentRow[]) {
  const seen = new Set<string>();
  const deduped: DocumentRow[] = [];

  for (const doc of documents) {
    const key = doc.source_type === "url"
      ? `url:${doc.source_url || doc.name}`
      : `pdf:${doc.name}`;

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(doc);
  }

  return deduped;
}

export function DocumentsPanel({
  refreshKey,
  pendingDocuments = [],
}: {
  refreshKey: number;
  pendingDocuments?: PendingDocument[];
}) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/documents?t=${Date.now()}`, {
          headers: deviceHeaders(),
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || `Failed to load documents (${res.status})`);
          return;
        }
        setDocuments(data.documents || []);
        setWarning(data.warning || null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    if (refreshKey > 0) {
      const retryDelays = [1000, 2500, 5000];
      const timers = retryDelays.map((delay) => setTimeout(load, delay));
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const visiblePendingDocuments = useMemo(() => {
    const existingNames = new Set(documents.map((doc) => `${doc.source_type}:${doc.name}`));
    return pendingDocuments.filter((doc) => !existingNames.has(`${doc.source_type}:${doc.name}`));
  }, [documents, pendingDocuments]);

  const visibleDocuments = useMemo(() => dedupeDocuments(documents), [documents]);

  const showEmptyState = !error && !loading && visibleDocuments.length === 0 && visiblePendingDocuments.length === 0;

  const handleDelete = async (doc: DocumentRow) => {
    const label = doc.source_type === "url" ? doc.source_url || doc.name : doc.name;
    const confirmed = window.confirm(`Delete ${label}? This will also delete related chunks.`);
    if (!confirmed) return;

    setDeletingId(doc.id);
    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: deviceHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id: doc.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete document");
      }
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Documents
        </p>
        {visibleDocuments.length > 0 && (
          <span className="text-[11px] text-muted-foreground">{visibleDocuments.length}</span>
        )}
      </div>

      {error && <p className="text-xs text-destructive leading-snug">{error}</p>}

      {loading && !visibleDocuments.length && !visiblePendingDocuments.length && !error && (
        <p className="text-xs text-muted-foreground italic">Loading...</p>
      )}

      {showEmptyState && <p className="text-xs text-muted-foreground italic">No documents yet.</p>}

      {visiblePendingDocuments.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Recently indexed</p>
          <div className="space-y-1">
            {visiblePendingDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg bg-card border border-border/80"
              >
                <Loader2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5 animate-spin" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate leading-snug">{doc.name}</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{doc.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!error && visibleDocuments.length > 0 && (
        <div className="space-y-0.5">
          {visibleDocuments.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              {doc.source_type === "url" ? (
                <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <p className="text-xs font-medium truncate leading-snug flex-1">{doc.name}</p>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50 shrink-0"
                    aria-label={`Delete ${doc.name}`}
                    title="Delete document"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                  {doc.chunk_count} chunks
                  {doc.source_type !== "url" && ` · ${(doc.size / 1024).toFixed(1)} KB`}
                  {` · ${formatRelativeTime(doc.created_at)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {warning && <p className="mt-3 text-xs text-muted-foreground">{warning}</p>}
    </div>
  );
}
