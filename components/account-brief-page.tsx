"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, ExternalLink, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccountBrief } from "@/lib/account-brief-data";

export function AccountBriefPage({ brief }: { brief: AccountBrief }) {
  const router = useRouter();
  const [url, setUrl] = useState(brief.website);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The report could not be started.");
      router.push(result.jobUrl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The report could not be started."); setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-white/10 bg-[var(--brand)] text-white">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-5"><div className="brand-wordmark" aria-label="ClikWorks">CLIK<span>/</span>WORKS</div><div className="hidden h-5 w-px bg-white/20 sm:block" /><p className="hidden text-sm text-white/62 sm:block">Account qualification</p></div>
          <div className="flex items-center gap-3 text-sm text-white/70"><span className="status-light" aria-hidden="true" />Internal tool</div>
        </div>
        <div className="mx-auto max-w-[1480px] px-5 pb-7 pt-6 sm:px-8 lg:px-12">
          <div className="tool-intro"><div><p className="eyebrow text-[var(--lime)]">Account qualification</p><h1>Research a company</h1><p>Enter a website to create an internal qualification brief.</p></div></div>
          <form onSubmit={handleSubmit} className="mt-5 flex max-w-4xl flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="company-url">Company website</label>
            <Input id="company-url" type="url" value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }} placeholder="https://company.com" required className="h-14 flex-1 rounded-[4px] border-white/18 bg-white px-5 text-base text-[var(--brand)] shadow-none placeholder:text-slate-400 focus-visible:border-[var(--lime)] focus-visible:ring-[var(--lime)]/20" />
            <Button disabled={busy} type="submit" className="h-14 rounded-[4px] bg-[var(--lime)] px-7 text-base font-semibold text-[var(--brand)] hover:bg-[#72f49d] focus-visible:ring-[var(--lime)]/40">{busy ? "Starting research…" : "Create account brief"}<ArrowRight /></Button>
          </form>
          <p className="mt-3 text-sm text-white/50">Public information only. Facts, estimates and open questions are labelled separately.</p>
          {error ? <p className="mt-2 text-sm text-amber-200" role="alert">{error}</p> : null}
        </div>
      </header>

      <section className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rule)] pb-4">
          <div className="flex items-center gap-3"><span className="sample-label">Calibration account</span><span className="text-sm text-[var(--muted-ink)]">OpenAI API research · local build</span></div>
          <a href={brief.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] underline-offset-4 hover:underline">{brief.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}<ExternalLink className="size-3.5" /></a>
        </div>

        <div className="brief-shell">
          <aside className="brief-rail">
            <div><p className="eyebrow text-[var(--muted-ink)]">Qualification</p><div className="mt-4 flex items-end gap-2"><span className="text-[4.75rem] font-medium leading-none tracking-[-0.08em]">{brief.score}</span><span className="pb-2 text-lg text-[var(--muted-ink)]">/ {brief.totalChecks} public checks</span></div><div className="mt-4 border-l-4 border-[var(--lime-deep)] pl-3"><p className="font-semibold">{brief.fitLabel}</p><p className="mt-1 text-sm leading-5 text-[var(--muted-ink)]">{brief.fitSummary}</p></div></div>
            <dl className="rail-facts"><div><dt>Segment</dt><dd>{brief.segment}</dd></div><div><dt>Employees</dt><dd>{brief.employees}</dd></div><div><dt>Headquarters</dt><dd>{brief.headquarters}</dd></div><div><dt>Operating since</dt><dd>{brief.operatingSince}</dd></div><div><dt>Model</dt><dd>{brief.businessModel}</dd></div></dl>
            <div className="rail-action"><p className="eyebrow text-[var(--muted-ink)]">Recommended action</p><p className="mt-3 font-semibold leading-5">{brief.recommendation}</p><Button className="mt-5 h-10 w-full rounded-[3px] bg-[var(--brand)] text-white hover:bg-[#342653]">Needs verification</Button></div>
          </aside>

          <article className="brief-body">
            <div className="company-heading"><div className={`target-logo-card ${brief.logoTone === "dark" ? "target-logo-card-dark" : ""}`} aria-label={`${brief.companyName} logo`}>{brief.logoUrl ? <img className="target-logo-image" src={brief.logoUrl} alt={brief.companyName} /> : <span className="customer-wordmark">{brief.companyName}</span>}</div><div><p className="eyebrow text-[var(--muted-ink)]">Account brief · researched {brief.researchedOn}</p><h2>{brief.companyName}</h2><p>{brief.description}</p><span className="logo-source">{brief.logoUrl ? "Official website asset" : "Verified name · logo not retained"}</span></div></div>
            <section className="brief-section summary-grid"><div><p className="section-number">01</p><h3>What they sell</h3></div><div className="prose-copy"><p>{brief.whatTheySell}</p><div className="service-list">{brief.services.map((service) => <span key={service}>{service}</span>)}</div></div></section>
            <section className="brief-section summary-grid"><div><p className="section-number">02</p><h3>Who buys</h3></div><div className="prose-copy"><p>{brief.whoBuys}</p><div className="buyer-row"><Building2 /><div><strong>Best observable segment</strong><span>{brief.bestSegment}</span></div></div><div className="buyer-row"><Users /><div><strong>Likely commercial buyer</strong><span>{brief.likelyBuyer}</span></div></div></div></section>
            <section className="brief-section"><div className="section-head"><div><p className="section-number">03</p><h3>Customer evidence</h3></div><p>Named customers help the SDR understand who already buys and which examples may be relevant.</p></div><div className="customer-grid">{brief.customerEvidence.map((customer) => <a className="customer-item" key={customer.name} href={customer.url} target="_blank" rel="noreferrer"><div className="customer-wordmark">{customer.name}<ExternalLink /></div><strong>{customer.relevance}</strong><span>{customer.evidence}</span></a>)}</div></section>
            <section className="brief-section"><div className="section-head"><div><p className="section-number">04</p><h3>Decision makers</h3></div><p>Ranked by role relevance and confidence in the person-to-company match.</p></div><div className="contact-grid">{brief.decisionMakers.map((person) => <article className="contact-card" key={`${person.name}-${person.title}`}><div className="contact-top"><div className="contact-photo has-initials" aria-label={`${person.name} initials`}><span>{person.initials}</span></div><span className={`confidence-tag ${person.confidenceTone}`}>{person.confidence}</span></div><h4>{person.name}</h4><p className="contact-title">{person.title}</p><p className="contact-relevance">{person.relevance}</p><dl className="contact-facts"><div><dt>LinkedIn</dt><dd><a href={person.profileUrl} target="_blank" rel="noreferrer">{person.linkedin}<ExternalLink /></a></dd></div><div><dt>Evidence</dt><dd>{person.evidence}</dd></div></dl></article>)}</div><div className="contact-rule"><UserRound /><p><strong>Contact rule</strong>If the person, employment or profile cannot be corroborated, keep the role visible but do not invent a name or include the contact in an outreach export.</p></div><div className="edge-case-list" aria-label="Decision-maker fallback rules"><span><strong>People photos</strong>Initials only</span><span><strong>Multiple matches</strong>Send to manual review</span><span><strong>Stale employment</strong>Verify current company</span><span><strong>No profile</strong>Keep the role, not a guessed person</span></div></section>
            <section className="brief-section"><div className="section-head"><div><p className="section-number">05</p><h3>ClikWorks fit</h3></div><p>Rules are fixed. The evidence changes by account.</p></div><div className="fit-table">{brief.fitChecks.map((item) => <div className="fit-row" key={item.label}><span className={`fit-icon ${item.state}`}>{item.state === "pass" ? <Check /> : item.state === "fail" ? "×" : "?"}</span><strong>{item.label}</strong><span>{item.note}</span></div>)}</div></section>
            <section className="brief-section handoff-block"><div><p className="section-number">06</p><h3>SDR handoff</h3></div><div><p className="handoff-line"><span>Lead with</span>{brief.handoff.leadWith}</p><p className="handoff-line"><span>Ask</span>{brief.handoff.ask}</p><p className="handoff-line"><span>Do not assume</span>{brief.handoff.doNotAssume}</p></div></section>
            <section className="brief-section"><div className="section-head"><div><p className="section-number">07</p><h3>Evidence used</h3></div><p>Facts, classifications and open questions stay separate.</p></div><div className="source-list">{brief.sources.map((source) => <a className="source-row" href={source.url} target="_blank" rel="noreferrer" key={source.name}><div><strong>{source.name}</strong><span>{source.detail}</span></div><span>{source.status}<ExternalLink /></span></a>)}</div></section>
          </article>
        </div>
      </section>
    </main>
  );
}
