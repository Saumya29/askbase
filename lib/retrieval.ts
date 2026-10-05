import { getSupabaseAdmin } from "@/lib/supabase";

export type RetrievedChunk = {
  id: string;
  document_id: string;
  content: string;
  similarity: number;
  document_name?: string | null;
  source_url?: string | null;
};

export async function matchChunks(embedding: number[], topK = 6) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Document storage is not configured.");
  }

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: topK,
    filter_device_id: null,
  });

  if (error) throw new Error("Document search failed.", { cause: error });
  if (!Array.isArray(data)) throw new Error("Document search returned an invalid result.");

  return data as RetrievedChunk[];
}
