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
          <TableHead>Status</TableHead>
          <TableHead>Question</TableHead>
          <TableHead>Response</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queries.map((query) => (
          <TableRow key={query.id}>
            <TableCell>
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  query.feedback === 1
                    ? "bg-green-500"
                    : query.feedback === -1
                    ? "bg-red-500"
                    : "bg-gray-300"
                }`}
                title={query.feedback === 1 ? "Upvoted" : query.feedback === -1 ? "Downvoted" : "No feedback"}
              />
            </TableCell>
            <TableCell className="max-w-[300px]">
              <p className="truncate text-sm">{query.question}</p>
            </TableCell>
            <TableCell className="max-w-[300px]">
              <p className="truncate text-sm text-mutedForeground">{query.response}</p>
            </TableCell>
            <TableCell className="text-sm text-mutedForeground whitespace-nowrap">
              {new Date(query.created_at).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
        {queries.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-sm text-mutedForeground">
              No queries yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
