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

  return NextResponse.json({ ok: true });
}
