"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { PROGRESS_STAGES, SEEDED_REPORTS } from "@/lib/research-workflow";

type Job = { id: string; companyName: string; inputUrl: string; reportUrl?: string; jobUrl?: string; status: string; createdAt: string };

export function ResearchDashboard() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<Job[]>([...SEEDED_REPORTS]);
  const [loading, setLoading] = useState(true);

  async function loadJobs() {
    try {
      const response = await fetch("/api/jobs", { cache: "no-store" });
      const result = await response.json();
      if (Array.isArray(result.jobs)) setJobs(result.jobs);
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
          <div className="brand-wordmark">CLIK<span>/</span>WORKS</div>
          <div className="flex items-center gap-3 text-sm text-white/70"><span className="status-light" />Account research</div>
        </div>
        <div className="mx-auto grid max-w-[1380px] gap-10 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1fr_0.72fr] lg:px-12 lg:pb-20 lg:pt-16">
          <div>
            <p className="eyebrow text-[var(--lime)]">SDR account qualification</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Turn a company URL into a usable account brief.</h1>
          </div>
          <div className="self-end border-l border-white/20 pl-6 text-base leading-7 text-white/68">
            Public company research, customer evidence, verified decision-makers, fixed fit rules, and an SDR handoff in one report.
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1380px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <form onSubmit={submit} className="border-y border-[var(--rule)] py-7">
          <label htmlFor="research-url" className="eyebrow text-[var(--muted-ink)]">Company website</label>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input id="research-url" value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }} placeholder="company.com" required className="h-16 min-w-0 flex-1 rounded-[3px] border border-[var(--rule)] bg-white px-5 text-lg outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10" />
            <button disabled={busy} className="inline-flex h-16 items-center justify-center gap-3 rounded-[3px] bg-[var(--brand)] px-8 font-semibold text-white hover:bg-[#342653] disabled:opacity-60">
              {busy ? <><RefreshCw className="size-4 animate-spin" />Starting research</> : <>Create account brief<ArrowRight className="size-4" /></>}
            </button>
          </div>
          <div className="mt-3 flex flex-col justify-between gap-2 text-sm text-[var(--muted-ink)] sm:flex-row"><span>Public information only. People photos are disabled.</span><span>Demo limit: one active run, three per hour.</span></div>
          {error ? <p className="mt-3 text-sm font-medium text-red-700" role="alert">{error}</p> : null}
        </form>

        <section className="grid gap-12 py-14 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="eyebrow text-[var(--muted-ink)]">Research sequence</p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em]">Visible progress. Fixed gates.</h2>
            <p className="mt-4 max-w-md leading-7 text-[var(--muted-ink)]">Each step receives the validated output from the previous step. Missing evidence stays missing rather than becoming a confident guess.</p>
          </div>
          <ol className="border-t border-[var(--rule)]">
            {PROGRESS_STAGES.slice(1).map((stage, index) => <li key={stage.key} className="grid grid-cols-[52px_1fr_auto] items-center border-b border-[var(--rule)] py-4"><span className="font-mono text-xs text-[var(--muted-ink)]">{String(index + 1).padStart(2, "0")}</span><strong className="font-medium">{stage.label}</strong><span className="text-xs text-[var(--muted-ink)]">{stage.percent}%</span></li>)}
          </ol>
        </section>

        <section className="pb-16">
          <div className="mb-5 flex items-end justify-between gap-5"><div><p className="eyebrow text-[var(--muted-ink)]">Report library</p><h2 className="mt-2 text-3xl font-medium tracking-[-0.04em]">Recent reports</h2></div><button onClick={() => { setLoading(true); void loadJobs(); }} className="text-sm font-medium text-[var(--brand)]">Refresh</button></div>
          <div className="border-t-2 border-[var(--ink)]">
            {jobs.map((job) => {
              const destination = job.reportUrl || job.jobUrl || "#";
              let host = job.inputUrl;
              try { host = new URL(job.inputUrl).hostname.replace(/^www\./, ""); } catch { /* Keep raw input. */ }
              return <Link key={job.id} href={destination} className="grid gap-3 border-b border-[var(--rule)] py-5 transition hover:bg-white/60 sm:grid-cols-[1.2fr_0.8fr_0.45fr_auto] sm:items-center sm:px-3">
                <div><strong className="block font-medium">{job.companyName}</strong><span className="mt-1 block text-sm text-[var(--muted-ink)]">{host || "Resolving company"}</span></div>
                <span className="text-sm text-[var(--muted-ink)]">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(job.createdAt))}</span>
                <span className="text-sm font-medium">{job.status}</span>
                <ExternalLink className="size-4 text-[var(--muted-ink)]" />
              </Link>;
            })}
            {loading ? <p className="py-5 text-sm text-[var(--muted-ink)]">Refreshing report history…</p> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
