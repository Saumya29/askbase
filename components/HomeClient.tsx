"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Upload } from "@/components/Upload";
import { UrlImport } from "@/components/UrlImport";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { Chat } from "@/components/Chat";

export function HomeClient() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="app-shell flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center h-13 border-b bg-card px-5 shrink-0 gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="text-xs">Home</span>
        </Link>
        <span className="font-display text-base font-semibold tracking-tight">AskBase</span>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r flex flex-col overflow-hidden shrink-0 bg-surface">
          <div className="flex-1 overflow-y-auto">
            <Upload onUploaded={() => setRefreshKey((k) => k + 1)} />
            <div className="border-t mx-4" />
            <UrlImport onImported={() => setRefreshKey((k) => k + 1)} />
            <div className="border-t mx-4" />
            <DocumentsPanel refreshKey={refreshKey} />
          </div>
        </aside>

        {/* Chat panel */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <Chat />
        </main>
      </div>
    </div>
  );
}
