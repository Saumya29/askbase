"use client";

import { useEffect } from "react";
import { BookOpen, FileText, Globe, PanelLeft, ShieldCheck, Upload, X } from "lucide-react";
import { Chat } from "@/components/Chat";
import { DocumentsPanel, type PendingDocument } from "@/components/DocumentsPanel";

export function WorkspaceShell({
  documentsOpen,
  onToggleDocuments,
  onCloseDocuments,
  refreshKey,
  pendingDocuments,
  onUpload,
  onImport,
  uploadDisabled,
  importDisabled,
}: {
  documentsOpen: boolean;
  onToggleDocuments: () => void;
  onCloseDocuments: () => void;
  refreshKey: number;
  pendingDocuments: PendingDocument[];
  onUpload: () => void;
  onImport: () => void;
  uploadDisabled: boolean;
  importDisabled: boolean;
}) {
  useEffect(() => {
    if (!documentsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseDocuments();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [documentsOpen, onCloseDocuments]);

  return (
    <div className="focus-workspace">
      <header className="focus-topbar">
        <a href="/" className="focus-brand" aria-label="AskBase home">
          <span className="focus-brand-mark"><BookOpen size={17} /></span>
          <span>AskBase</span>
        </a>
        <div className="focus-topbar-actions">
          <button className="focus-library-trigger" onClick={onToggleDocuments} aria-expanded={documentsOpen} aria-controls="document-library">
            <PanelLeft size={16} /><span>Documents</span>
          </button>
          <span className="focus-action-separator" />
          <button className="focus-import" onClick={onImport} disabled={importDisabled}>
            <Globe size={15} /><span>Import website</span>
          </button>
          <button className="focus-upload" onClick={onUpload} disabled={uploadDisabled}>
            <Upload size={15} /><span>Upload PDF</span>
          </button>
        </div>
      </header>

      <div className="focus-demo-banner"><ShieldCheck size={14} /><span>Shared demo. Use public documents only.</span></div>

      <main className="focus-main">
        <section className="focus-chat-card" aria-label="Ask your documents">
          <Chat />
        </section>
      </main>

      {documentsOpen && (
        <>
          <button className="focus-drawer-scrim" onClick={onCloseDocuments} aria-label="Close documents panel" />
          <aside id="document-library" className="focus-library-drawer" aria-label="Document library">
            <div className="focus-library-title">
              <div><span className="focus-library-icon"><FileText size={16} /></span><div><h2>Your documents</h2><p>Sources AskBase can use in its answers</p></div></div>
              <button onClick={onCloseDocuments} aria-label="Close documents"><X size={17} /></button>
            </div>
            <div className="focus-library-content">
              <p className="focus-sample-note">The Harbour AI files are fictional examples. Add a public PDF or website to ask about your own sources.</p>
              <DocumentsPanel refreshKey={refreshKey} pendingDocuments={pendingDocuments} />
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
