# AskBase

A production-ready MVP for document chat with Next.js 14, Supabase pgvector, and the raw OpenAI SDK. Upload PDFs, index them, and chat with streaming answers that include source citations.

## Features
- PDF upload -> chunk -> embed -> store in Supabase pgvector
- Streaming chat responses with source citations
- Admin dashboard with stats cards and recent queries
- Feedback thumbs up/down
- Clean minimal light-mode UI using Tailwind + shadcn-style components

## Tech Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui-style components
- Supabase Postgres + pgvector
- OpenAI SDK (no LangChain)

## Getting Started

### 1) Install dependencies
```bash
npm install
```

### 2) Configure Supabase
Create a Supabase project and run the SQL migration:

```sql
-- supabase/migrations/0001_init.sql
create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size integer,
  chunk_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  embedding vector(1536) not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists queries (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  response text,
  sources jsonb,
  feedback smallint,
  created_at timestamptz default now()
);

create or replace function match_chunks(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  document_name text
)
language sql stable as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.content,
    1 - (chunks.embedding <=> query_embedding) as similarity,
    documents.name as document_name
  from chunks
  join documents on documents.id = chunks.document_id
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;

create index if not exists chunks_embedding_ivfflat
  on chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

### 3) Environment variables
Create a `.env.local` file:

```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Notes:
- The app still runs without env vars. Upload + chat will return helpful warnings.
- Use the Supabase service role key for server-side writes.

### 4) Run the app
```bash
npm run dev
```

Visit:
- `http://localhost:3000` - main app
- `http://localhost:3000/admin` - admin dashboard

## API Routes
- `POST /api/upload` - Upload PDF and index chunks
- `GET /api/documents` - List uploaded documents
- `POST /api/chat` - Streaming chat with citations
- `POST /api/feedback` - Thumbs up/down
- `GET /api/admin/stats` - Stats cards
- `GET /api/admin/queries` - Recent queries

## Deployment (Vercel)
1. Push the repo to GitHub.
2. Create a new Vercel project and import the repo.
3. Add the environment variables in Vercel project settings.
4. Deploy.

If you want to self-host, ensure the same env vars are available at runtime.

## File Structure
- `app/` - Next.js App Router pages and API routes
- `components/` - UI components and client UI
- `lib/` - OpenAI, Supabase, chunking, embeddings helpers
- `supabase/migrations/` - SQL migration for pgvector tables

## License
MIT
