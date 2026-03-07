alter table documents
  add column if not exists source_type text not null default 'pdf',
  add column if not exists source_url text,
  add column if not exists parent_id uuid references documents(id) on delete cascade;
