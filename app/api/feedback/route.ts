import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, warning: "Supabase is not configured." });
  }

  const body = await req.json().catch(() => null);
  const queryId = body?.queryId;
  const feedback = body?.feedback;

  if (!queryId || ![1, -1].includes(feedback)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error } = await supabase
    .from("queries")
    .update({ feedback })
    .eq("id", queryId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update quality_score on chunks referenced by this query
  const { data: queryData } = await supabase
    .from("queries")
    .select("sources")
    .eq("id", queryId)
    .single();

  if (queryData?.sources && Array.isArray(queryData.sources)) {
    const chunkIds = queryData.sources
      .map((s: { id?: string }) => s.id)
      .filter(Boolean);

    if (chunkIds.length > 0) {
      const delta = feedback === 1 ? 1 : -1;
      await supabase.rpc("update_chunk_quality", { chunk_ids: chunkIds, delta });
    }
  }

  return NextResponse.json({ ok: true });
}
