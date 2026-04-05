"use client";

import { useRef, useState } from "react";
import { Upload as UploadIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { deviceHeaders } from "@/lib/api";

type UploadResponse = {
  ok?: boolean;
  warning?: string;
  error?: string;
};

type Status = {
  type: "idle" | "uploading" | "processing" | "success" | "warning" | "error";
  message: string;
};

export function Upload({ onUploaded }: { onUploaded: () => void }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loading = status.type === "uploading" || status.type === "processing";

  const processFile = async (file: File) => {
    setFileName(file.name);
    setStatus({ type: "uploading", message: "Uploading..." });

    const formData = new FormData();
    formData.append("file", file);

    try {
      setStatus({ type: "processing", message: "Chunking & embedding..." });

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: deviceHeaders(),
        body: formData,
      });
      const data: UploadResponse = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Upload failed" });
      } else if (data.warning) {
        setStatus({ type: "warning", message: data.warning });
        setFileName(null);
        onUploaded();
      } else {
        setStatus({ type: "success", message: "Indexed successfully" });
        setFileName(null);
        onUploaded();
        setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Upload failed",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === "application/pdf") processFile(file);
  };

  return (
    <div className="px-4 pt-5 pb-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Upload PDF
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={loading}
        className={`w-full flex flex-col items-center gap-2 py-5 rounded-xl border-2 border-dashed text-xs transition-all ${
          dragging
            ? "border-foreground bg-accent text-foreground"
            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-accent/50"
        } ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <UploadIcon className="h-4 w-4" />
        <span className="leading-snug text-center px-2">
          {loading ? fileName : "Drop PDF here or click to browse"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Status indicator */}
      {status.type !== "idle" && (
        <div className="mt-3 space-y-2">
          {/* Progress bar for uploading/processing */}
          {loading && (
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-foreground/60 rounded-full transition-all duration-500 animate-pulse"
                style={{ width: status.type === "uploading" ? "40%" : "75%" }}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            {loading && (
              <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin shrink-0" />
            )}
            {status.type === "success" && (
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            )}
            {(status.type === "error" || status.type === "warning") && (
              <AlertCircle
                className={`h-3.5 w-3.5 shrink-0 ${
                  status.type === "error" ? "text-destructive" : "text-amber-600"
                }`}
              />
            )}
            <p
              className={`text-xs leading-snug ${
                status.type === "error"
                  ? "text-destructive"
                  : status.type === "success"
                  ? "text-emerald-600"
                  : status.type === "warning"
                  ? "text-amber-600"
                  : "text-muted-foreground"
              }`}
            >
              {status.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
