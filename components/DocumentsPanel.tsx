"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  FileText,
  Globe,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
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
    const key = doc.source_type === "url" ? `url:${doc.source_url || doc.name}` : `pdf:${doc.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(doc);
  }

  return deduped;
}

function DeleteConfirmModal({
  document,
  deleting,
  onCancel,
  onConfirm,
}: {
  document: DocumentRow | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!document) return null;

  const label = document.source_type === "url" ? document.source_url || document.name : document.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/15 backdrop-blur-sm" onClick={deleting ? undefined : onCancel} />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-border bg-card shadow-demo animate-slide-up">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">Delete document</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed break-words">
                This will remove <span className="font-medium text-foreground">{label}</span> and all related chunks.
              </p>
            </div>
            {!deleting && (
              <button
                onClick={onCancel}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="px-3 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="px-3 py-2 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div className="mb-3 last:mb-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-[11px] font-medium text-muted-foreground mb-1.5 hover:text-foreground transition-colors"
      >
        <span>
          {title} <span className="text-muted-foreground/70">({count})</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

function DocumentItem({
  doc,
  deleting,
  onDelete,
}: {
  doc: DocumentRow;
  deleting: boolean;
  onDelete: (doc: DocumentRow) => void;
}) {
  return (
    <div className="group flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-accent transition-colors">
      {doc.source_type === "url" ? (
        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
      ) : (
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className="text-xs font-medium truncate leading-snug flex-1">{doc.name}</p>
          <button
            onClick={() => onDelete(doc)}
            disabled={deleting}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50 shrink-0"
            aria-label={`Delete ${doc.name}`}
            title="Delete document"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground leading-snug mt-0.5">
          {doc.chunk_count} chunks
          {doc.source_type !== "url" && ` · ${(doc.size / 1024).toFixed(1)} KB`}
          {` · ${formatRelativeTime(doc.created_at)}`}
        </p>
      </div>
    </div>
  );
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
  const [search, setSearch] = useState("");
  const [websiteOpen, setWebsiteOpen] = useState(true);
  const [pdfOpen, setPdfOpen] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);

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

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return visibleDocuments;
    return visibleDocuments.filter((doc) => {
      const haystack = [doc.name, doc.source_url || "", doc.source_type].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [search, visibleDocuments]);

  const websiteDocuments = filteredDocuments.filter((doc) => doc.source_type === "url");
  const pdfDocuments = filteredDocuments.filter((doc) => doc.source_type !== "url");

  const showEmptyState =
    !error && !loading && websiteDocuments.length === 0 && pdfDocuments.length === 0 && visiblePendingDocuments.length === 0;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: deviceHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete document");
      setDocuments((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Documents</p>
          {visibleDocuments.length > 0 && (
            <span className="text-[11px] text-muted-foreground">{visibleDocuments.length}</span>
          )}
        </div>

        <div className="relative mb-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents"
            className="w-full bg-card border border-border rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground"
          />
        </div>

        {error && <p className="text-xs text-destructive leading-snug mb-2">{error}</p>}

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

        {!error && (websiteDocuments.length > 0 || pdfDocuments.length > 0) && (
          <div>
            <Section
              title="Websites"
              count={websiteDocuments.length}
              open={websiteOpen}
              onToggle={() => setWebsiteOpen((v) => !v)}
            >
              {websiteDocuments.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  doc={doc}
                  deleting={deletingId === doc.id}
                  onDelete={setDeleteTarget}
                />
              ))}
            </Section>

            <Section
              title="PDFs"
              count={pdfDocuments.length}
              open={pdfOpen}
              onToggle={() => setPdfOpen((v) => !v)}
            >
              {pdfDocuments.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  doc={doc}
                  deleting={deletingId === doc.id}
                  onDelete={setDeleteTarget}
                />
              ))}
            </Section>
          </div>
        )}

        {warning && <p className="mt-3 text-xs text-muted-foreground">{warning}</p>}
      </div>

      <DeleteConfirmModal
        document={deleteTarget}
        deleting={deletingId === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
