"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ChunkStat = {
  chunk_id: string;
  document_name: string;
  usage_count: number;
  quality_score: number;
};

export function ChunkStats() {
  const [chunks, setChunks] = useState<ChunkStat[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setChunks(data.topChunks || []);
    };
    load();
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document</TableHead>
          <TableHead>Usage Count</TableHead>
          <TableHead>Quality Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {chunks.map((chunk) => (
          <TableRow key={chunk.chunk_id}>
            <TableCell className="text-sm">{chunk.document_name}</TableCell>
            <TableCell className="text-sm">{chunk.usage_count}</TableCell>
            <TableCell className="text-sm">
              <span className={chunk.quality_score > 0 ? "text-green-600" : chunk.quality_score < 0 ? "text-red-600" : ""}>
                {chunk.quality_score > 0 ? "+" : ""}{chunk.quality_score}
              </span>
            </TableCell>
          </TableRow>
        ))}
        {chunks.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-sm text-mutedForeground">
              No chunk usage data yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
