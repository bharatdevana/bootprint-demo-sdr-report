"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Search, X } from "lucide-react";
import { ESTIMATED_API_COST_RANGE, filterJobsByQuery, PROGRESS_STAGES, SEEDED_REPORTS, type DashboardMetrics, type JobSummary } from "@/lib/research-workflow";

function statusStyle(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "published") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (normalized === "stopped safely") return "border-amber-200 bg-amber-50 text-amber-800";
  if (normalized === "failed" || normalized === "cancelled") return "border-red-200 bg-red-50 text-red-800";
  return "border-violet-200 bg-violet-50 text-violet-800";
}

function costForStatus(status: string) {
  return status === "Published" ? ESTIMATED_API_COST_RANGE : "Not recorded";
}

export function ResearchDashboard() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<JobSummary[]>([...SEEDED_REPORTS]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const filteredJobs = useMemo(() => filterJobsByQuery(jobs, query), [jobs, query]);
  const publishRateTone = !metrics?.publishRate ? "border-slate-200 bg-slate-50" : metrics.publishRate >= 80 ? "border-emerald-200 bg-emerald-50/70" : metrics.publishRate >= 60 ? "border-amber-200 bg-amber-50/70" : "border-red-200 bg-red-50/70";

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

        <section className="grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3" aria-label="Workflow performance">
          <div className="bg-emerald-50/70 p-5"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800">Published runs</span><strong className="mt-3 block text-3xl font-medium tracking-[-0.04em]">{metrics ? metrics.publishedRuns : "—"}</strong><span className="mt-2 block text-sm text-[var(--muted-ink)]">Recent workflow history</span></div>
          <div className={`border-0 p-5 ${publishRateTone}`}><span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-ink)]">Observed publish rate</span><strong className="mt-3 block text-3xl font-medium tracking-[-0.04em]">{metrics?.publishRate !== null && metrics?.publishRate !== undefined ? `${metrics.publishRate}%` : "—"}</strong><span className="mt-2 block text-sm text-[var(--muted-ink)]">{metrics ? `${metrics.publishedRuns} of ${metrics.completedRuns} completed runs` : "Loading completed runs"}</span></div>
          <div className="bg-violet-50/70 p-5"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-violet-800">Typical API cost</span><strong className="mt-3 block text-3xl font-medium tracking-[-0.04em]">{metrics?.costRange || ESTIMATED_API_COST_RANGE}</strong><span className="mt-2 block text-sm text-[var(--muted-ink)]">Estimate per report · Vercel excluded</span></div>
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
          <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="eyebrow text-[var(--muted-ink)]">Workflow history</p><h2 className="mt-2 text-3xl font-medium tracking-[-0.04em]">Recent runs</h2></div>
            <div className="flex w-full gap-2 md:w-auto">
              <div className="relative min-w-0 flex-1 md:w-80">
                <label className="sr-only" htmlFor="run-search">Search reports by company or domain</label>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-ink)]" />
                <input id="run-search" type="text" inputMode="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company or domain" className="h-11 w-full rounded-[3px] border border-[var(--rule)] bg-white pl-10 pr-9 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10" />
                {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-[var(--muted-ink)] hover:bg-slate-100 hover:text-[var(--ink)]"><X className="size-3.5" /></button> : null}
              </div>
              <button onClick={() => { setLoading(true); void loadJobs(); }} aria-label="Refresh workflow history" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[3px] border border-[var(--rule)] bg-white px-4 text-sm font-medium text-[var(--brand)] transition hover:border-[var(--brand)] hover:bg-violet-50"><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh</span></button>
            </div>
          </div>
          <div className="overflow-hidden rounded-[4px] border border-[var(--rule)] bg-white">
            <div className="hidden grid-cols-[1.25fr_0.75fr_0.55fr_0.65fr_28px] gap-4 border-b border-[var(--rule)] bg-slate-50 px-4 py-3 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--muted-ink)] sm:grid"><span>Account</span><span>Run date</span><span>Status</span><span>API cost</span><span className="sr-only">Open</span></div>
            {filteredJobs.map((job) => {
              const destination = job.reportUrl || job.jobUrl || "#";
              let host = job.inputUrl;
              try { host = new URL(job.inputUrl).hostname.replace(/^www\./, ""); } catch { /* Keep raw input. */ }
              return <Link key={job.id} href={destination} className="group relative grid grid-cols-2 gap-x-4 gap-y-5 border-b border-[var(--rule)] px-4 py-4 transition last:border-b-0 hover:bg-violet-50/45 focus-visible:bg-violet-50/45 focus-visible:outline-none sm:grid-cols-[1.25fr_0.75fr_0.55fr_0.65fr_28px] sm:items-center sm:gap-4">
                <div className="col-span-2 pr-8 sm:col-span-1 sm:pr-0"><strong className="block font-semibold text-[var(--brand)] transition group-hover:text-violet-700 group-hover:underline group-hover:decoration-violet-300 group-hover:underline-offset-4">{job.companyName}</strong><span className="mt-1 block text-sm font-medium text-[var(--lime-deep)]">{host || "Resolving company"}</span></div>
                <div><span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--muted-ink)] sm:hidden">Run date</span><span className="text-sm text-[var(--muted-ink)]">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(job.createdAt))}</span></div>
                <div><span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--muted-ink)] sm:hidden">Status</span><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(job.status)}`}>{job.status}</span></div>
                <div className="col-span-2 sm:col-span-1"><span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--muted-ink)] sm:hidden">API cost</span><span className="text-sm font-medium text-[var(--ink)]">{costForStatus(job.status)}</span><span className="mt-0.5 block text-xs text-[var(--muted-ink)]">{job.status === "Published" ? "Estimate" : "Exact cost unavailable"}</span></div>
                <ArrowRight className="absolute right-4 top-5 size-4 text-violet-500 transition group-hover:translate-x-0.5 group-hover:text-violet-700 sm:static" />
              </Link>;
            })}
            {!loading && filteredJobs.length === 0 ? <div className="px-5 py-12 text-center"><p className="font-medium">No matching reports</p><p className="mt-1 text-sm text-[var(--muted-ink)]">Try another company name or domain.</p></div> : null}
            {loading ? <p className="py-5 text-sm text-[var(--muted-ink)]">Refreshing report history…</p> : null}
          </div>
          <p className="mt-3 text-xs text-[var(--muted-ink)]">Showing {filteredJobs.length} of {jobs.length} runs · Costs are estimates until per-run metering is stored.</p>
        </section>
      </section>
    </main>
  );
}
