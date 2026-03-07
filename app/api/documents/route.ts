import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      documents: [],
      warning: "Supabase is not configured.",
    });
  }

  const deviceId = req.headers.get("x-device-id");

  let query = supabase
    .from("documents")
    .select("id,name,size,chunk_count,created_at,source_type,source_url")
    .is("parent_id", null)
    .order("created_at", { ascending: false });

  if (deviceId) {
    query = query.eq("device_id", deviceId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data || [] });
}
