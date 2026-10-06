import React from "react";
import type { RetrievedChunk } from "@/lib/retrieval";

export function SourceCitations({ sources, expandedSource, onToggle }: {
  sources: RetrievedChunk[];
  expandedSource: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[11px] text-muted-foreground">Sources · tap to read</p>
      <div className="flex flex-wrap gap-x-2 gap-y-1.5">
        {sources.map((source, index) => (
          <span key={`${source.id}-${index}`} className="inline-flex items-center gap-1.5">
            <button
              onClick={() => onToggle(source.id)}
              aria-expanded={expandedSource === source.id}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-full px-2.5 py-1 hover:bg-muted"
            >
              [{index + 1}] {source.document_name?.replace(/_/g, " ").replace(/\.pdf$/i, "") || "Document"}
            </button>
            {source.source_url && (
              <a href={source.source_url} target="_blank" rel="noopener noreferrer"
                aria-label={`Open source ${index + 1}`}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                Open
              </a>
            )}
          </span>
        ))}
      </div>
      {sources.map((source, index) => expandedSource === source.id ? (
        <div key={`expanded-${source.id}-${index}`}
          className="rounded-xl bg-muted border border-border px-3.5 py-2.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {source.content}
        </div>
      ) : null)}
    </div>
  );
}
