import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      documents: 0,
      chunks: 0,
      queries: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      warning: "Supabase is not configured.",
    });
  }

  const [docs, chunks, queries, thumbsUp, thumbsDown] = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("chunks").select("id", { count: "exact", head: true }),
    supabase.from("queries").select("id", { count: "exact", head: true }),
    supabase.from("queries").select("id", { count: "exact", head: true }).eq("feedback", 1),
    supabase.from("queries").select("id", { count: "exact", head: true }).eq("feedback", -1),
  ]);

  return NextResponse.json({
    documents: docs.count ?? 0,
    chunks: chunks.count ?? 0,
    queries: queries.count ?? 0,
    thumbsUp: thumbsUp.count ?? 0,
    thumbsDown: thumbsDown.count ?? 0,
  });
}
