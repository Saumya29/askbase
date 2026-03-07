"use client";

import { useState } from "react";
import { Upload } from "@/components/Upload";
import { UrlImport } from "@/components/UrlImport";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { Chat } from "@/components/Chat";

export function HomeClient() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <header className="flex items-center h-12 border-b px-5 shrink-0">
        <span className="text-sm font-semibold tracking-tight">AskBase</span>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto">
            <Upload onUploaded={() => setRefreshKey((k) => k + 1)} />
            <div className="border-t" />
            <UrlImport onImported={() => setRefreshKey((k) => k + 1)} />
            <div className="border-t" />
            <DocumentsPanel refreshKey={refreshKey} />
          </div>
        </aside>

        {/* Chat panel */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Chat />
        </main>
      </div>
    </div>
  );
}
