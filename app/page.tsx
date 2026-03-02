import { HomeClient } from "@/components/HomeClient";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-[#f7f7f7]">
      <div className="container py-12">
        <div className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
            AskBase MVP
          </p>
          <h1 className="text-4xl font-semibold leading-tight">Your private doc chat workspace.</h1>
          <p className="max-w-2xl text-base text-mutedForeground">
            Upload PDFs, index them with Supabase pgvector, and chat with streaming answers and citations.
          </p>
        </div>
        <HomeClient />
      </div>
    </main>
  );
}
