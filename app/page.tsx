import Link from "next/link";
import { ArrowRight, FileText, Globe, MessageSquare, Github, Sparkles, PanelLeft, Upload, ArrowUp } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: FileText,
    title: "Add PDF files",
    description:
      "Upload a PDF and AskBase makes its text searchable, so you can ask questions about what it says.",
  },
  {
    icon: Globe,
    title: "Import a website",
    description:
      "Add a public URL. AskBase can index up to 25 reachable pages from that site.",
  },
  {
    icon: MessageSquare,
    title: "Answers with sources",
    description:
      "Ask in plain language, then open a citation to check the passage behind an answer.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add your sources",
    description:
      "Upload a PDF or import a public website with up to 25 reachable pages.",
  },
  {
    number: "02",
    title: "Ask your question",
    description:
      "Ask a question in your own words. AskBase searches your indexed sources for relevant passages.",
  },
  {
    number: "03",
    title: "Get a grounded answer",
    description:
      "Read the answer and open its citations to see the supporting text.",
  },
];

const techStack = [
  "Next.js 14",
  "Supabase pgvector",
  "OpenAI",
  "TypeScript",
];

// ─── Components ──────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="sticky top-0 z-30 bg-background/90 backdrop-blur-sm border-b">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-primary-foreground"><MessageSquare className="h-4 w-4" /></span>
          AskBase
        </Link>
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
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-sm font-medium bg-foreground text-primary-foreground px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
          >
            Launch App
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="max-w-5xl mx-auto px-6 pt-20 pb-14 text-center">
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-full px-3 py-1 mb-8 bg-card">
        <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 inline-block" />
        DOCUMENT Q&amp;A WITH CHECKABLE SOURCES
      </div>
      <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight text-balance leading-tight mb-6">
        Answers from your documents.
        <br className="hidden sm:block" />
        Sources you can check.
      </h1>
      <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty mb-10">
        Add PDFs or a public website. Ask in plain language, then open citations to see where each answer came from.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/app"
          className="flex items-center gap-2 bg-foreground text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
        >
          Open the demo
          <ArrowRight className="h-4 w-4" />
        </Link>
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
      <p className="mt-5 text-xs text-muted-foreground">Shared demo. Please use public or sample documents only.</p>
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
              ask.saumyat.com
            </div>
          </div>
        </div>
        <div className="bg-[#f3f6f2] p-4 sm:p-8" aria-label="Preview of the AskBase document chat">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e3e9e2] bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-[#24312b]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#286b55] text-white"><MessageSquare className="h-4 w-4" /></span>AskBase</div>
            <div className="flex items-center gap-2 text-xs text-[#58665e]"><span className="flex items-center gap-1.5 rounded-lg border px-3 py-2"><PanelLeft className="h-3.5 w-3.5" />Documents</span><span className="hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-2"><Globe className="h-3.5 w-3.5" />Import website</span><span className="flex items-center gap-1.5 rounded-lg bg-[#286b55] px-3 py-2 text-white"><Upload className="h-3.5 w-3.5" />Upload PDF</span></div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-[#dfe9df] bg-[#edf4ed] py-2 text-[11px] text-[#58665e]"><span className="h-1.5 w-1.5 rounded-full bg-[#4c8c69]" />Shared demo. Use public documents only.</div>
          <div className="mx-auto mt-5 flex min-h-[360px] max-w-4xl flex-col rounded-2xl border border-[#e6eae5] bg-white shadow-[0_12px_40px_rgba(37,59,45,0.08)] sm:min-h-[430px]">
            <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center">
              <span className="mb-6 grid h-12 w-12 place-items-center rounded-2xl border border-[#e3e9e2] bg-[#f4f7f3] text-[#286b55]"><Sparkles className="h-5 w-5" /></span>
              <span className="text-[10px] font-semibold tracking-[0.18em] text-[#778078]">DOCUMENT ASSISTANT</span>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-[#202723] sm:text-3xl">What’s in your documents?</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#788078]">Ask in your own words. Answers include citations so you can check the source.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2"><span className="rounded-full border border-[#e4e8e3] px-3 py-2 text-xs text-[#69736b]">Summarize the main points</span><span className="rounded-full border border-[#e4e8e3] px-3 py-2 text-xs text-[#69736b]">Compare these documents</span><span className="rounded-full border border-[#e4e8e3] px-3 py-2 text-xs text-[#69736b]">List decisions and next steps</span></div>
            </div>
            <div className="flex items-center gap-2 border-t border-[#edf0ec] p-4 sm:px-8"><div className="flex-1 rounded-xl border border-[#e5e9e4] bg-[#fbfcfa] px-4 py-3 text-sm text-[#9aa19b]">Ask about your documents...</div><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#286b55] text-white"><ArrowUp className="h-4 w-4" /></span></div>
          </div>
        </div>
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
            Add sources, ask questions and check the answer against the original text.
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
                  <Icon className="h-4.5 w-4.5 text-foreground" strokeWidth={1.75} />
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
        Open the shared demo and try a question against its sample documents.
      </p>
      <Link
        href="/app"
        className="inline-flex items-center gap-2 bg-foreground text-primary-foreground px-7 py-3.5 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
      >
        Launch AskBase
        <ArrowRight className="h-4 w-4" />
      </Link>
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
