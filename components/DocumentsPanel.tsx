"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type DocumentRow = {
  id: string;
  name: string;
  size: number;
  chunk_count: number;
  created_at: string;
};

export function DocumentsPanel({ refreshKey }: { refreshKey: number }) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
      setWarning(data.warning || null);
    };
    load();
  }, [refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length === 0 && (
          <p className="text-sm text-mutedForeground">No documents uploaded yet.</p>
        )}
        {documents.map((doc, index) => (
          <div key={doc.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-mutedForeground">
                  {doc.chunk_count} chunks - {(doc.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Badge>{new Date(doc.created_at).toLocaleDateString()}</Badge>
            </div>
            {index < documents.length - 1 && <Separator />}
          </div>
        ))}
        {warning && <p className="text-xs text-mutedForeground">{warning}</p>}
      </CardContent>
    </Card>
  );
}
