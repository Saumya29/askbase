create or replace function match_chunks(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  document_name text,
  source_url text
)
language sql stable as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.content,
    1 - (chunks.embedding <=> query_embedding) as similarity,
    documents.name as document_name,
    documents.source_url
  from chunks
  join documents on documents.id = chunks.document_id
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
