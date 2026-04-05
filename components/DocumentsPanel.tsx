"use client";

import { useEffect, useState } from "react";
import { FileText, Globe } from "lucide-react";
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

export function DocumentsPanel({ refreshKey }: { refreshKey: number }) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/documents?t=${Date.now()}`, {
          headers: deviceHeaders(),
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        setDocuments(data.documents || []);
        setWarning(data.warning || null);
      } catch {
        // network error — keep existing state
      }
    };
    load();
  }, [refreshKey]);

  return (
    <div className="px-4 py-4">
<<<<<<< HEAD
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
=======
      <p className="text-xs font-semibold text-mutedForeground uppercase tracking-widest mb-3">
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
        Documents
      </p>

      {documents.length === 0 ? (
<<<<<<< HEAD
        <p className="text-xs text-muted-foreground italic">No documents yet.</p>
=======
        <p className="text-xs text-mutedForeground italic">No documents yet.</p>
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
      ) : (
        <div className="space-y-0.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              {doc.source_type === "url" ? (
<<<<<<< HEAD
                <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-snug">{doc.name}</p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
=======
                <Globe className="h-3.5 w-3.5 shrink-0 text-mutedForeground mt-0.5" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 text-mutedForeground mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-snug">{doc.name}</p>
                <p className="text-xs text-mutedForeground leading-snug mt-0.5">
>>>>>>> 920acf8 (feat: build landing page and refresh app shell)
                  {doc.chunk_count} chunks
                  {doc.source_type !== "url" && ` · ${(doc.size / 1024).toFixed(1)} KB`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {warning && (
        <p className="mt-3 text-xs text-muted-foreground">{warning}</p>
      )}
    </div>
  );
}
