"use client";

import { useState } from "react";
import { Upload } from "@/components/Upload";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { Chat } from "@/components/Chat";

export function HomeClient() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-6">
        <Upload onUploaded={() => setRefreshKey((prev) => prev + 1)} />
        <DocumentsPanel refreshKey={refreshKey} />
      </div>
      <Chat />
    </div>
  );
}
