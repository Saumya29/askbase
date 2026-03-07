"use client";

import { useRef, useState } from "react";
import { Upload as UploadIcon } from "lucide-react";

type UploadResponse = {
  ok?: boolean;
  warning?: string;
  error?: string;
};

export function Upload({ onUploaded }: { onUploaded: () => void }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setFileName(file.name);
    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data: UploadResponse = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Upload failed");
      } else {
        setStatus(data.warning ? `Warning: ${data.warning}` : "Indexed successfully");
        setFileName(null);
        onUploaded();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(false);
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

  const isError =
    status != null &&
    (status.toLowerCase().includes("fail") || status.toLowerCase().includes("error"));

  return (
    <div className="px-4 pt-4 pb-4">
      <p className="text-xs font-medium text-mutedForeground uppercase tracking-wide mb-2">
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
        className={`w-full flex flex-col items-center gap-1.5 py-4 rounded-xl border border-dashed text-xs transition-colors ${
          dragging
            ? "border-foreground bg-muted"
            : "border-border text-mutedForeground hover:border-foreground/40 hover:text-foreground"
        }`}
      >
        <UploadIcon className="h-4 w-4" />
        <span>
          {loading
            ? "Processing..."
            : fileName
            ? fileName
            : "Drop PDF or click to browse"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      {status && (
        <p
          className={`mt-2 text-xs leading-snug ${
            isError ? "text-destructive" : "text-mutedForeground"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}
