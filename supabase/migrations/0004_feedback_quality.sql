alter table chunks add column if not exists quality_score float default 0.0;

drop function if exists match_chunks(vector, integer);

create or replace function match_chunks(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid, document_id uuid, content text,
  similarity float, document_name text, source_url text
)
language sql stable as $$
  select
    chunks.id, chunks.document_id, chunks.content,
    (1 - (chunks.embedding <=> query_embedding)) + (chunks.quality_score * 0.05) as similarity,
    documents.name as document_name, documents.source_url
  from chunks
  join documents on documents.id = chunks.document_id
  order by (1 - (chunks.embedding <=> query_embedding)) + (chunks.quality_score * 0.05) desc
  limit match_count;
$$;

create or replace function update_chunk_quality(chunk_ids uuid[], delta float)
returns void
language sql as $$
  update chunks set quality_score = quality_score + delta
  where id = any(chunk_ids);
$$;

create or replace function get_chunk_usage_stats(result_limit int default 10)
returns table (chunk_id uuid, document_name text, usage_count bigint, quality_score float)
language sql stable as $$
  select
    (source->>'id')::uuid as chunk_id,
    source->>'document_name' as document_name,
    count(*) as usage_count,
    coalesce(chunks.quality_score, 0) as quality_score
  from queries, jsonb_array_elements(sources) as source
  left join chunks on chunks.id = (source->>'id')::uuid
  where source->>'id' is not null
  group by chunk_id, document_name, chunks.quality_score
  order by usage_count desc
  limit result_limit;
$$;
