"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Stats = {
  documents: number;
  chunks: number;
  queries: number;
  thumbsUp: number;
  thumbsDown: number;
  feedbackRate: number;
  positiveRate: number;
  warning?: string;
};

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    };
    load();
  }, []);

  return (
    <div className="card-grid">
      {[
        { label: "Documents", value: stats?.documents ?? 0 },
        { label: "Chunks", value: stats?.chunks ?? 0 },
        { label: "Queries", value: stats?.queries ?? 0 },
        { label: "Thumbs Up", value: stats?.thumbsUp ?? 0 },
        { label: "Thumbs Down", value: stats?.thumbsDown ?? 0 },
        { label: "Feedback Rate", value: `${stats?.feedbackRate ?? 0}%` },
        { label: "Positive Rate", value: `${stats?.positiveRate ?? 0}%` },
      ].map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardTitle className="text-sm text-mutedForeground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
      {stats?.warning && (
        <p className="text-sm text-mutedForeground">{stats.warning}</p>
      )}
    </div>
  );
}
