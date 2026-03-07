alter table documents add column if not exists device_id text;
alter table queries add column if not exists device_id text;

create index if not exists idx_documents_device_id on documents(device_id);
create index if not exists idx_queries_device_id on queries(device_id);

drop function if exists match_chunks(vector, integer);

create or replace function match_chunks(
  query_embedding vector(1536),
  match_count int default 5,
  filter_device_id text default null
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
  where (filter_device_id is null or documents.device_id = filter_device_id)
  order by (1 - (chunks.embedding <=> query_embedding)) + (chunks.quality_score * 0.05) desc
  limit match_count;
$$;
