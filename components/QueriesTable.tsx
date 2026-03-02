"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type QueryRow = {
  id: string;
  question: string;
  response: string;
  feedback: number | null;
  created_at: string;
};

export function QueriesTable() {
  const [queries, setQueries] = useState<QueryRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/queries");
      const data = await res.json();
      setQueries(data.queries || []);
    };
    load();
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Question</TableHead>
          <TableHead>Feedback</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queries.map((query) => (
          <TableRow key={query.id}>
            <TableCell className="max-w-[420px]">
              <p className="truncate text-sm">{query.question}</p>
            </TableCell>
            <TableCell className="text-sm">
              {query.feedback === 1 ? "Up" : query.feedback === -1 ? "Down" : "None"}
            </TableCell>
            <TableCell className="text-sm text-mutedForeground">
              {new Date(query.created_at).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
        {queries.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-sm text-mutedForeground">
              No queries yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
