# AskBase

A production-ready MVP for document chat with Next.js 14, Supabase pgvector, and the raw OpenAI SDK. Upload PDFs, index them, and chat with streaming answers that include source citations.

## Features
- PDF upload -> chunk -> embed -> store in Supabase pgvector
- URL import/crawling with automatic content extraction
- Streaming chat responses with markdown rendering and source citations
- Feedback-driven retrieval — thumbs up/down votes adjust chunk quality scores to improve future results
- Admin monitoring dashboard with feedback rate, positive rate, knowledge gaps, and chunk usage stats
- Clickable source badges (links for crawled URLs, expandable content for uploads)
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
Create a Supabase project and run the SQL migrations in order:

```bash
# Run each migration file in the Supabase SQL Editor:
supabase/migrations/0001_init.sql        # Base tables, pgvector, match_chunks
supabase/migrations/0002_add_url_source.sql   # URL source tracking on documents
supabase/migrations/0003_match_chunks_url.sql # source_url in match_chunks results
supabase/migrations/0004_feedback_quality.sql # quality_score, feedback-driven retrieval, chunk usage stats
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
- `POST /api/crawl` - Import and index content from a URL
- `GET /api/documents` - List uploaded documents
- `POST /api/chat` - Streaming chat with markdown and citations
- `POST /api/feedback` - Thumbs up/down (also updates chunk quality scores)
- `GET /api/admin/stats` - Dashboard stats, knowledge gaps, chunk usage
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
- `supabase/migrations/` - SQL migrations for pgvector tables and RPCs

## License
MIT
