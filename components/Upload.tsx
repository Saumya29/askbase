"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type UploadResponse = {
  ok?: boolean;
  warning?: string;
  error?: string;
};

export function Upload({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data: UploadResponse = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Upload failed");
      } else {
        const message = data.warning
          ? `Uploaded with warning: ${data.warning}`
          : "Upload complete";
        setStatus(message);
        onUploaded();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload PDFs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <Button onClick={handleUpload} disabled={!file || loading}>
          {loading ? "Processing..." : "Upload & Index"}
        </Button>
        {status && <p className="text-sm text-mutedForeground">{status}</p>}
      </CardContent>
    </Card>
  );
}
