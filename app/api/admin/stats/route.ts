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

  const [docs, chunks, queries, thumbsUp, thumbsDown, knowledgeGaps, topChunks] = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("chunks").select("id", { count: "exact", head: true }),
    supabase.from("queries").select("id", { count: "exact", head: true }),
    supabase.from("queries").select("id", { count: "exact", head: true }).eq("feedback", 1),
    supabase.from("queries").select("id", { count: "exact", head: true }).eq("feedback", -1),
    supabase
      .from("queries")
      .select("id,question,response,created_at")
      .or("feedback.eq.-1,response.ilike.%do not know%,response.ilike.%don't have%")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.rpc("get_chunk_usage_stats", { result_limit: 10 }),
  ]);

  const totalQueries = queries.count ?? 0;
  const up = thumbsUp.count ?? 0;
  const down = thumbsDown.count ?? 0;
  const totalFeedback = up + down;

  return NextResponse.json({
    documents: docs.count ?? 0,
    chunks: chunks.count ?? 0,
    queries: totalQueries,
    thumbsUp: up,
    thumbsDown: down,
    feedbackRate: totalQueries > 0 ? Math.round((totalFeedback / totalQueries) * 100) : 0,
    positiveRate: totalFeedback > 0 ? Math.round((up / totalFeedback) * 100) : 0,
    knowledgeGaps: knowledgeGaps.data ?? [],
    topChunks: topChunks.data ?? [],
  });
}
