import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RawDocumentRow = {
  id?: string;
  name?: string;
  size?: number | null;
  chunk_count?: number | null;
  created_at?: string;
  source_type?: string | null;
  source_url?: string | null;
  parent_id?: string | null;
};

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      documents: [],
      warning: "Supabase is not configured.",
    });
  }

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[documents] failed to load documents:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data || []) as RawDocumentRow[];
  const hasParentIdColumn = rows.length === 0 || rows.some((row) => "parent_id" in row);
  const hasSourceTypeColumn = rows.length === 0 || rows.some((row) => "source_type" in row);

  const topLevelDocuments = hasParentIdColumn
    ? rows.filter((row) => row.parent_id == null)
    : rows;

  const documents = topLevelDocuments.map((row) => ({
    id: row.id || crypto.randomUUID(),
    name: row.name || "Untitled document",
    size: row.size ?? 0,
    chunk_count: row.chunk_count ?? 0,
    created_at: row.created_at || new Date(0).toISOString(),
    source_type: row.source_type || "pdf",
    source_url: row.source_url ?? null,
  }));

  const warnings: string[] = [];
  if (!hasParentIdColumn) {
    warnings.push("Database is missing parent_id, so all documents are shown.");
  }
  if (!hasSourceTypeColumn) {
    warnings.push("Database is missing source_type, so all documents are treated as PDFs.");
  }

  return NextResponse.json({
    documents,
    warning: warnings.length ? warnings.join(" ") : null,
  });
}
