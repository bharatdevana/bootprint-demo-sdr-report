"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw } from "lucide-react";
import { PROGRESS_STAGES, SEEDED_REPORTS, type DashboardMetrics, type JobSummary } from "@/lib/research-workflow";

export function ResearchDashboard() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<JobSummary[]>([...SEEDED_REPORTS]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadJobs() {
    try {
      const response = await fetch("/api/jobs", { cache: "no-store" });
      const result = await response.json();
      if (Array.isArray(result.jobs)) setJobs(result.jobs);
      if (result.metrics) setMetrics(result.metrics);
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadJobs(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The report could not be started.");
      router.push(result.jobUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The report could not be started.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-white/10 bg-[var(--brand)] text-white">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-5"><div className="brand-wordmark">CLIK<span>/</span>WORKS</div><div className="hidden h-5 w-px bg-white/20 sm:block" /><span className="hidden text-sm text-white/62 sm:block">Account research</span></div>
          <div className="flex items-center gap-3 text-sm text-white/70"><span className="status-light" />Internal workflow</div>
        </div>
      </header>

      <section className="mx-auto max-w-[1380px] px-5 py-10 sm:px-8 lg:px-12 lg:py-12">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--rule)] pb-8 md:flex-row md:items-end">
          <div><p className="eyebrow text-[var(--muted-ink)]">Internal workflow</p><h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] sm:text-5xl">Account research</h1><p className="mt-3 max-w-2xl text-[var(--muted-ink)]">Generate and review account qualification briefs from public company information.</p></div>
          <span className="text-sm text-[var(--muted-ink)]">Capacity: 1 active · 3 starts/hour · 10/day</span>
        </div>

        <section className="grid border-b border-l border-[var(--rule)] sm:grid-cols-3" aria-label="Workflow performance">
          <div className="border-r border-t border-[var(--rule)] p-5"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-ink)]">Published runs</span><strong className="mt-3 block text-3xl font-medium tracking-[-0.04em]">{metrics ? metrics.publishedRuns : "—"}</strong><span className="mt-2 block text-sm text-[var(--muted-ink)]">Recent workflow history</span></div>
          <div className="border-r border-t border-[var(--rule)] p-5"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-ink)]">Observed publish rate</span><strong className="mt-3 block text-3xl font-medium tracking-[-0.04em]">{metrics?.publishRate !== null && metrics?.publishRate !== undefined ? `${metrics.publishRate}%` : "—"}</strong><span className="mt-2 block text-sm text-[var(--muted-ink)]">{metrics ? `${metrics.publishedRuns} of ${metrics.completedRuns} completed runs` : "Loading completed runs"}</span></div>
          <div className="border-r border-t border-[var(--rule)] p-5"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-ink)]">Typical API cost</span><strong className="mt-3 block text-3xl font-medium tracking-[-0.04em]">{metrics?.costRange || "$0.25–$0.40"}</strong><span className="mt-2 block text-sm text-[var(--muted-ink)]">Estimate per report · Vercel excluded</span></div>
        </section>
        <p className="mt-3 text-xs text-[var(--muted-ink)]">Publish rate measures completed runs that produced a report; it is not a research-accuracy score. Exact per-run API metering is not yet stored.</p>

        <form id="new-run" onSubmit={submit} className="mt-10 border border-[var(--rule)] bg-white p-6 sm:p-8">
          <div><p className="eyebrow text-[var(--muted-ink)]">New research run</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.035em]">Company website</h2></div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="research-url">Company website</label><input id="research-url" value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }} placeholder="https://company.com" required className="h-14 min-w-0 flex-1 rounded-[3px] border border-[var(--rule)] bg-white px-5 text-base outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10" />
            <button disabled={busy} className="inline-flex h-14 items-center justify-center gap-3 rounded-[3px] bg-[var(--brand)] px-8 font-semibold text-white hover:bg-[#342653] disabled:opacity-60">
              {busy ? <><RefreshCw className="size-4 animate-spin" />Starting run</> : <>Start research<ArrowRight className="size-4" /></>}
            </button>
          </div>
          <div className="mt-3 text-sm text-[var(--muted-ink)]">Public sources only · People photos disabled · Unsupported output stops before publication</div>
          {error ? <p className="mt-3 text-sm font-medium text-red-700" role="alert">{error}</p> : null}
        </form>

        <section className="grid gap-12 py-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="eyebrow text-[var(--muted-ink)]">Run stages</p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em]">Processing sequence</h2>
            <p className="mt-4 max-w-md leading-7 text-[var(--muted-ink)]">Each stage validates its output before the next stage starts. Missing evidence remains unresolved.</p>
          </div>
          <ol className="border-t border-[var(--rule)]">
            {PROGRESS_STAGES.slice(1).map((stage, index) => <li key={stage.key} className="grid grid-cols-[52px_1fr_auto] items-center border-b border-[var(--rule)] py-4"><span className="font-mono text-xs text-[var(--muted-ink)]">{String(index + 1).padStart(2, "0")}</span><strong className="font-medium">{stage.label}</strong><span className="text-xs text-[var(--muted-ink)]">{stage.percent}%</span></li>)}
          </ol>
        </section>

        <section className="pb-16">
          <div className="mb-5 flex items-end justify-between gap-5"><div><p className="eyebrow text-[var(--muted-ink)]">Workflow history</p><h2 className="mt-2 text-3xl font-medium tracking-[-0.04em]">Recent runs</h2></div><button onClick={() => { setLoading(true); void loadJobs(); }} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)]"><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>
          <div className="border-t-2 border-[var(--ink)]">
            {jobs.map((job) => {
              const destination = job.reportUrl || job.jobUrl || "#";
              let host = job.inputUrl;
              try { host = new URL(job.inputUrl).hostname.replace(/^www\./, ""); } catch { /* Keep raw input. */ }
              return <Link key={job.id} href={destination} className="grid gap-3 border-b border-[var(--rule)] py-5 transition hover:bg-white/60 sm:grid-cols-[1.2fr_0.8fr_0.45fr_auto] sm:items-center sm:px-3">
                <div><strong className="block font-medium">{job.companyName}</strong><span className="mt-1 block text-sm text-[var(--muted-ink)]">{host || "Resolving company"}</span></div>
                <span className="text-sm text-[var(--muted-ink)]">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(job.createdAt))}</span>
                <span className="text-sm font-medium">{job.status}</span>
                <ArrowRight className="size-4 text-[var(--muted-ink)]" />
              </Link>;
            })}
            {loading ? <p className="py-5 text-sm text-[var(--muted-ink)]">Refreshing report history…</p> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
