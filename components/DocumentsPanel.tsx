"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Globe, Loader2 } from "lucide-react";
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

  const showEmptyState = !error && !loading && documents.length === 0 && visiblePendingDocuments.length === 0;

  return (
    <div className="px-4 py-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Documents
      </p>

      {error && <p className="text-xs text-destructive leading-snug">{error}</p>}

      {loading && !documents.length && !visiblePendingDocuments.length && !error && (
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

      {!error && documents.length > 0 && (
        <div className="space-y-0.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              {doc.source_type === "url" ? (
                <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-snug">{doc.name}</p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                  {doc.chunk_count} chunks
                  {doc.source_type !== "url" && ` · ${(doc.size / 1024).toFixed(1)} KB`}
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
