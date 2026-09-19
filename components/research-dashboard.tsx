"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Search, X } from "lucide-react";
import { ESTIMATED_API_COST_RANGE, filterJobsByQuery, PROGRESS_STAGES, SEEDED_REPORTS, type DashboardMetrics, type JobSummary } from "@/lib/research-workflow";

function statusPresentation(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "published") return { dot: "bg-emerald-600", text: "text-emerald-800" };
  if (normalized === "stopped safely") return { dot: "bg-amber-500", text: "text-amber-800" };
  if (normalized === "failed" || normalized === "cancelled") return { dot: "bg-red-600", text: "text-red-800" };
  return { dot: "bg-violet-600", text: "text-violet-800" };
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
    <main className="min-h-screen bg-[#f0f1ff] text-[#111114]">
      <header className="border-b border-[#dedff0] bg-white/90 text-[#111114] backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-5"><div className="brand-wordmark">CLIK<span>/</span>WORKS</div><div className="hidden h-5 w-px bg-[#d8d8e5] sm:block" /><span className="hidden text-sm text-[#686875] sm:block">Account research</span></div>
          <div className="flex items-center gap-3 text-sm text-[#686875]"><span className="status-light" />Internal workflow</div>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="flex flex-col justify-between gap-5 pb-8 md:flex-row md:items-end">
          <div><p className="text-sm font-medium text-[#686875]">Internal workflow</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Account research</h1><p className="mt-3 max-w-2xl text-[#626270]">Generate and review account qualification briefs from public company information.</p></div>
          <span className="text-sm text-[#686875]">Capacity: 1 active · 3 starts/hour · 10/day</span>
        </div>

        <section className="grid overflow-hidden rounded-2xl border border-[#dedff0] bg-white shadow-[0_14px_38px_rgba(46,42,83,0.06)] sm:grid-cols-3" aria-label="Workflow performance">
          <div className="border-b border-[#e5e5ef] p-6 sm:border-b-0 sm:border-r"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#686875]">Published runs</span><div className="mt-3 flex items-center gap-3"><span className="size-2 rounded-full bg-emerald-500" /><strong className="block text-3xl font-semibold tracking-[-0.04em]">{metrics ? metrics.publishedRuns : "—"}</strong></div><span className="mt-2 block text-sm text-[#747480]">Recent workflow history</span></div>
          <div className="border-b border-[#e5e5ef] p-6 sm:border-b-0 sm:border-r"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#686875]">Observed publish rate</span><strong className="mt-3 block text-3xl font-semibold tracking-[-0.04em]">{metrics?.publishRate !== null && metrics?.publishRate !== undefined ? `${metrics.publishRate}%` : "—"}</strong><span className="mt-2 block text-sm text-[#747480]">{metrics ? `${metrics.publishedRuns} of ${metrics.completedRuns} completed runs` : "Loading completed runs"}</span></div>
          <div className="p-6"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#686875]">Typical API cost</span><strong className="mt-3 block text-3xl font-semibold tracking-[-0.04em]">{metrics?.costRange || ESTIMATED_API_COST_RANGE}</strong><span className="mt-2 block text-sm text-[#747480]">Estimate per report · Vercel excluded</span></div>
        </section>
        <p className="mt-3 px-1 text-xs text-[#747480]">Publish rate measures completed runs that produced a report; it is not a research-accuracy score. Exact per-run API metering is not yet stored.</p>

        <form id="new-run" onSubmit={submit} className="mt-10 rounded-2xl border border-[#dedff0] bg-white p-6 shadow-[0_14px_38px_rgba(46,42,83,0.06)] sm:p-8">
          <div><p className="text-sm font-medium text-[#686875]">New research run</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Company website</h2></div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="research-url">Company website</label><input id="research-url" value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }} placeholder="https://company.com" required className="h-14 min-w-0 flex-1 rounded-xl border border-[#dcddea] bg-[#fafaff] px-5 text-base outline-none transition focus:border-[#111114] focus:bg-white" />
            <button disabled={busy} className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#111114] px-8 font-semibold text-white transition hover:bg-[#2c2c31] disabled:opacity-60">
              {busy ? <><RefreshCw className="size-4 animate-spin" />Starting run</> : <>Start research<ArrowRight className="size-4" /></>}
            </button>
          </div>
          <div className="mt-3 text-sm text-[#747480]">Public sources only · People photos disabled · Unsupported output stops before publication</div>
          {error ? <p className="mt-3 text-sm font-medium text-red-700" role="alert">{error}</p> : null}
        </form>

        <section className="grid gap-8 py-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-sm font-medium text-[#686875]">Run stages</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Processing sequence</h2>
            <p className="mt-4 max-w-md leading-7 text-[#686875]">Each stage validates its output before the next stage starts. Missing evidence remains unresolved.</p>
          </div>
          <ol className="overflow-hidden rounded-2xl border border-[#dedff0] bg-white shadow-[0_14px_38px_rgba(46,42,83,0.05)]">
            {PROGRESS_STAGES.slice(1).map((stage, index) => <li key={stage.key} className="grid grid-cols-[52px_1fr_auto] items-center border-b border-[#e8e8f1] px-5 py-4 last:border-b-0"><span className="font-mono text-xs text-[#858590]">{String(index + 1).padStart(2, "0")}</span><strong className="font-medium">{stage.label}</strong><span className="text-xs text-[#858590]">{stage.percent}%</span></li>)}
          </ol>
        </section>

        <section className="pb-16">
          <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="text-sm font-medium text-[#686875]">Workflow history</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Recent runs</h2></div>
            <div className="flex w-full gap-2 md:w-auto">
              <div className="relative min-w-0 flex-1 md:w-80">
                <label className="sr-only" htmlFor="run-search">Search reports by company or domain</label>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-ink)]" />
                <input id="run-search" type="text" inputMode="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company or domain" className="h-11 w-full rounded-xl border border-[#dcddea] bg-white pl-10 pr-9 text-sm outline-none transition focus:border-[#111114]" />
                {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-[var(--muted-ink)] hover:bg-slate-100 hover:text-[var(--ink)]"><X className="size-3.5" /></button> : null}
              </div>
              <button onClick={() => { setLoading(true); void loadJobs(); }} aria-label="Refresh workflow history" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-[#dcddea] bg-white px-4 text-sm font-medium text-[#111114] transition hover:border-[#111114]"><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh</span></button>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#dedff0] bg-white shadow-[0_14px_38px_rgba(46,42,83,0.06)]">
            <div className="hidden grid-cols-[1.25fr_0.75fr_0.55fr_0.65fr_28px] gap-4 border-b border-[#e5e5ef] bg-[#fafaff] px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#747480] sm:grid"><span>Account</span><span>Run date</span><span>Status</span><span>API cost</span><span className="sr-only">Open</span></div>
            {filteredJobs.map((job) => {
              const destination = job.reportUrl || job.jobUrl || "#";
              let host = job.inputUrl;
              try { host = new URL(job.inputUrl).hostname.replace(/^www\./, ""); } catch { /* Keep raw input. */ }
              const status = statusPresentation(job.status);
              return <Link key={job.id} href={destination} className="group relative grid grid-cols-2 gap-x-4 gap-y-5 border-b border-[#e8e8f1] px-5 py-4 transition last:border-b-0 hover:bg-[#fafaff] focus-visible:bg-[#fafaff] focus-visible:outline-none sm:grid-cols-[1.25fr_0.75fr_0.55fr_0.65fr_28px] sm:items-center sm:gap-4">
                <div className="col-span-2 pr-8 sm:col-span-1 sm:pr-0"><strong className="block font-semibold text-[#111114] transition group-hover:underline group-hover:decoration-[#aaaabb] group-hover:underline-offset-4">{job.companyName}</strong><span className="mt-1 block text-sm text-[#747480]">{host || "Resolving company"}</span></div>
                <div><span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#747480] sm:hidden">Run date</span><span className="text-sm text-[#747480]">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(job.createdAt))}</span></div>
                <div><span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#747480] sm:hidden">Status</span><span className={`inline-flex items-center gap-2 text-xs font-semibold ${status.text}`}><span className={`size-2 rounded-full ${status.dot}`} />{job.status}</span></div>
                <div className="col-span-2 sm:col-span-1"><span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#747480] sm:hidden">API cost</span><span className="text-sm font-medium text-[#111114]">{costForStatus(job.status)}</span><span className="mt-0.5 block text-xs text-[#858590]">{job.status === "Published" ? "Estimate" : "Exact cost unavailable"}</span></div>
                <ArrowRight className="absolute right-5 top-5 size-4 text-[#858590] transition group-hover:translate-x-0.5 group-hover:text-[#111114] sm:static" />
              </Link>;
            })}
            {!loading && filteredJobs.length === 0 ? <div className="px-5 py-12 text-center"><p className="font-medium">No matching reports</p><p className="mt-1 text-sm text-[var(--muted-ink)]">Try another company name or domain.</p></div> : null}
            {loading ? <p className="py-5 text-sm text-[var(--muted-ink)]">Refreshing report history…</p> : null}
          </div>
          <p className="mt-3 px-1 text-xs text-[#747480]">Showing {filteredJobs.length} of {jobs.length} runs · Costs are estimates until per-run metering is stored.</p>
        </section>
      </section>
    </main>
  );
}
