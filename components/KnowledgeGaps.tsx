"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Gap = {
  id: string;
  question: string;
  response: string | null;
  created_at: string;
};

export function KnowledgeGaps() {
  const [gaps, setGaps] = useState<Gap[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setGaps(data.knowledgeGaps || []);
    };
    load();
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Question</TableHead>
          <TableHead>Response</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gaps.map((gap) => (
          <TableRow key={gap.id}>
            <TableCell className="max-w-[300px]">
              <p className="truncate text-sm">{gap.question}</p>
            </TableCell>
            <TableCell className="max-w-[300px]">
              <p className="truncate text-sm text-mutedForeground">{gap.response}</p>
            </TableCell>
            <TableCell className="text-sm text-mutedForeground whitespace-nowrap">
              {new Date(gap.created_at).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
        {gaps.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-sm text-mutedForeground">
              No knowledge gaps detected.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
