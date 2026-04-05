import Image from "next/image";
import { ArrowRight, FileText, Globe, MessageSquare, Github } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: FileText,
    title: "PDF Upload & Indexing",
    description:
      "Drop in any PDF and AskBase chunks, embeds, and stores it in Supabase pgvector — ready to query in seconds.",
  },
  {
    icon: Globe,
    title: "URL Crawling",
    description:
      "Paste a URL and we crawl the whole site, indexing every page so you can ask questions across an entire knowledge base.",
  },
  {
    icon: MessageSquare,
    title: "Streaming Chat with Citations",
    description:
      "Get answers that stream in real time, grounded in your documents with source citations you can expand and inspect.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add your sources",
    description:
      "Upload PDFs or import any public URL. AskBase crawls, chunks, and embeds your content automatically.",
  },
  {
    number: "02",
    title: "Ask your question",
    description:
      "Type a question in plain language. Semantic search finds the most relevant passages across all your documents.",
  },
  {
    number: "03",
    title: "Get a grounded answer",
    description:
      "The AI synthesises an answer from your actual content and shows you exactly which sources it used.",
  },
];

const techStack = [
  "Next.js 15",
  "Supabase pgvector",
  "OpenAI Embeddings",
  "Streaming API",
  "TypeScript",
];

// ─── Components ──────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="sticky top-0 z-30 bg-background/90 backdrop-blur-sm border-b">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="font-display text-lg font-semibold tracking-tight">AskBase</span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Saumya29/askbase"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub repository"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a
            href="https://askbase.saumyatiwari.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium bg-foreground text-primary-foreground px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
          >
            Launch App
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-full px-3 py-1 mb-8 bg-card">
        <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 inline-block" />
        Powered by Supabase pgvector &amp; OpenAI
      </div>
      <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight text-balance leading-tight mb-6">
        Chat with your
        <br />
        documents
      </h1>
      <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty mb-10">
        Upload PDFs or import any URL. Ask questions in plain language and get
        answers grounded in your actual content — with sources.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href="https://askbase.saumyatiwari.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-foreground text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
        >
          Start for free
          <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href="https://github.com/Saumya29/askbase"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 border border-border bg-card text-foreground px-6 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
        >
          <Github className="h-4 w-4" />
          View on GitHub
        </a>
      </div>
    </section>
  );
}

function DemoShowcase() {
  return (
    <section className="max-w-5xl mx-auto px-6 pb-24">
      <div className="relative rounded-2xl overflow-hidden shadow-demo border border-border bg-card">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-surface">
          <span className="w-3 h-3 rounded-full bg-border" />
          <span className="w-3 h-3 rounded-full bg-border" />
          <span className="w-3 h-3 rounded-full bg-border" />
          <div className="flex-1 mx-4">
            <div className="bg-background border border-border rounded-md px-3 py-0.5 text-xs text-muted-foreground text-center max-w-xs mx-auto">
              askbase.saumyatiwari.com
            </div>
          </div>
        </div>
        <Image
          src="/demo.gif"
          alt="AskBase product demo showing document upload and AI-powered chat"
          width={1200}
          height={720}
          className="w-full h-auto block"
          unoptimized
          priority
        />
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="bg-surface border-y border-border">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-balance mb-3">
            Everything you need
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
            AskBase handles the entire pipeline — from ingestion to retrieval to generation.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-2xl p-6 shadow-soft"
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <Icon className="h-4 w-4 text-foreground" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-balance mb-3">
          How it works
        </h2>
        <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
          Three simple steps from document to answer.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div key={step.number} className="relative">
            <span className="font-display text-4xl font-semibold text-border select-none block mb-4">
              {step.number}
            </span>
            <h3 className="font-display text-base font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TechStack() {
  return (
    <section className="bg-surface border-t border-border">
      <div className="max-w-5xl mx-auto px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-sm text-muted-foreground font-medium">Built with</p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="text-xs font-medium text-foreground bg-card border border-border rounded-full px-3.5 py-1.5"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-24 text-center">
      <h2 className="font-display text-4xl font-semibold tracking-tight text-balance mb-4">
        Ready to ask your documents?
      </h2>
      <p className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed mb-8">
        No account required. Upload a PDF or paste a URL and start chatting immediately.
      </p>
      <a
        href="https://askbase.saumyatiwari.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-foreground text-primary-foreground px-7 py-3.5 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
      >
        Launch AskBase
        <ArrowRight className="h-4 w-4" />
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          AskBase
        </span>
        <p className="text-xs text-muted-foreground">
          Built with Next.js &amp; Supabase.
        </p>
        <a
          href="https://github.com/Saumya29/askbase"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="GitHub repository"
        >
          <Github className="h-3.5 w-3.5" />
          GitHub
        </a>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-full bg-background">
      <Navbar />
      <main>
        <Hero />
        <DemoShowcase />
        <Features />
        <HowItWorks />
        <TechStack />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
