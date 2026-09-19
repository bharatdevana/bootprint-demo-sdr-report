"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Circle, LoaderCircle, X } from "lucide-react";
import { PROGRESS_STAGES, type ProgressEvent } from "@/lib/research-workflow";

type Job = { status: string; outcome?: "published" | "blocked"; companyName?: string; reportUrl?: string; message?: string; details?: string[]; createdAt?: string; completedAt?: string; error?: string };

export function JobProgress({ runId }: { runId: string }) {
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [job, setJob] = useState<Job>({ status: "loading" });
  const [clock, setClock] = useState(0);
  const terminal = job.outcome === "published" || job.outcome === "blocked" || job.status === "failed" || job.status === "cancelled";
  const byStage = useMemo(() => new Map(events.map((event) => [event.stage, event])), [events]);
  const latest = events.at(-1);
  const percent = job.outcome === "published" ? 100 : latest?.percent || 2;

  const poll = useCallback(async () => {
    const response = await fetch(`/api/jobs/${encodeURIComponent(runId)}`, { cache: "no-store" });
    setJob(await response.json());
  }, [runId]);

  useEffect(() => {
    const initial = window.setTimeout(() => { void poll(); setClock(Date.now()); }, 0);
    const timer = window.setInterval(() => { void poll(); setClock(Date.now()); }, 2500);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [poll]);

  useEffect(() => {
    if (terminal) return;
    const controller = new AbortController();
    fetch(`/api/jobs/${encodeURIComponent(runId)}/stream`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (!response.body) return;
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() || "";
        for (const line of lines) if (line.trim()) {
          try { const event = JSON.parse(line) as ProgressEvent; setEvents((current) => [...current.filter((item) => !(item.stage === event.stage && item.state === event.state)), event]); } catch { /* Ignore incomplete records. */ }
        }
      }
      await poll();
    }).catch(() => undefined);
    return () => controller.abort();
  }, [poll, runId, terminal]);

  const started = job.createdAt ? new Date(job.createdAt).getTime() : clock;
  const ended = terminal && job.completedAt ? new Date(job.completedAt).getTime() : clock;
  const elapsed = Math.max(0, Math.floor((ended - started) / 1000));

  return <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
    <header className="bg-[var(--brand)] text-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/" className="brand-wordmark">CLIK<span>/</span>WORKS</Link><span className="text-sm text-white/60">Account research job</span></div></header>
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col justify-between gap-6 border-b border-[var(--rule)] pb-8 sm:flex-row sm:items-end">
        <div><p className="eyebrow text-[var(--muted-ink)]">Live research</p><h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] sm:text-5xl">{job.companyName || latest?.label || "Preparing the account brief"}</h1><p className="mt-3 text-[var(--muted-ink)]">{latest?.message || "Connecting to the durable job record…"}</p></div>
        <div className="text-left sm:text-right"><strong className="text-4xl font-medium tracking-[-0.05em]">{percent}%</strong><span className="mt-1 block text-sm text-[var(--muted-ink)]">{Math.floor(elapsed / 60)}m {String(elapsed % 60).padStart(2, "0")}s</span></div>
      </div>
      <div className="mt-8 h-2 overflow-hidden bg-black/8"><span className="block h-full bg-[var(--lime-deep)] transition-all duration-500" style={{ width: `${percent}%` }} /></div>
      <ol className="mt-10 border-t border-[var(--rule)]">{PROGRESS_STAGES.map((stage) => {
        const event = byStage.get(stage.key); const active = event?.state === "active"; const complete = event?.state === "complete" || job.outcome === "published"; const blocked = event?.state === "blocked";
        return <li key={stage.key} className="grid grid-cols-[34px_1fr_auto] gap-3 border-b border-[var(--rule)] py-5">
          <span>{blocked ? <X className="size-5 text-red-700" /> : complete ? <Check className="size-5 text-[var(--lime-deep)]" /> : active ? <LoaderCircle className="size-5 animate-spin text-[var(--brand)]" /> : <Circle className="size-5 text-black/20" />}</span>
          <div><strong className="font-medium">{stage.label}</strong>{event?.message ? <p className="mt-1 text-sm leading-6 text-[var(--muted-ink)]">{event.message}</p> : null}</div><span className="text-xs text-[var(--muted-ink)]">{stage.percent}%</span>
        </li>;
      })}</ol>
      {job.outcome === "published" && job.reportUrl ? <div className="mt-8 flex flex-wrap gap-3"><Link href={job.reportUrl} className="rounded-[3px] bg-[var(--brand)] px-6 py-3 font-semibold text-white">Open account brief</Link><Link href="/" className="rounded-[3px] border border-[var(--rule)] px-6 py-3 font-semibold">Back to reports</Link></div> : null}
      {job.outcome === "blocked" || job.status === "failed" ? <div className="mt-8 border-l-4 border-red-700 bg-red-50 p-5"><strong>The report was not published.</strong><p className="mt-2 text-sm leading-6">{job.message || job.error || "The workflow stopped safely."}</p>{job.details?.map((item) => <p className="mt-2 text-xs text-red-900/70" key={item}>{item}</p>)}</div> : null}
      <p className="mt-10 font-mono text-[10px] text-[var(--muted-ink)]">JOB {runId}</p>
    </section>
  </main>;
}
