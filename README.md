# Bootprint Demo: SDR Report

A branded internal account brief for SDR and BDR teams. The demo turns researched company information into a consistent qualification report with company context, decision-makers, evidence, fit criteria, and suggested outreach angles.

## Demo routes

- `/` — account research dashboard
- `/reports/specialty-box` — Specialty Box calibration report
- `/josh-packaging` — Josh Packaging

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production access

The public repository does not contain credentials. Production requires a server-only `DEMO_PASSWORD` of at least 20 characters. A correct password creates a signed, HttpOnly, SameSite=Strict session cookie lasting 12 hours. The proxy protects pages and API routes while leaving Next.js assets and Vercel Workflow internals available. Pages also send `noindex` directives.

Set or rotate the password in Vercel, then redeploy:

```bash
vercel env add DEMO_PASSWORD production
vercel deploy --prod
```

## Validation

```bash
npm test
npm run lint
npm run build
```

New reports are published only after section-level word limits, array limits, source rules, URL cleanup, and a 450-word dynamic-copy budget pass. A failed model draft gets one no-browse repair attempt; a second failure blocks publication.

## Demo limits — September 2026

New research starts are capped at 20 per project per New York calendar day, beginning with this rollout. The existing one-active-run and three-starts-per-hour checks remain. The daily cap is enforced atomically using private Vercel Blob slots, shared across instances and deployments, with a server-only `BLOB_READ_WRITE_TOKEN`. Failed starts still consume a slot; quota storage failures block new starts. The store contains reservation timestamps only.

New research expires at `2026-09-26T04:00:00.000Z` (end of September 25, America/New_York). The request handler and every OpenAI research/repair call enforce expiry, so queued workflows cannot begin another paid step after that time. Existing reports remain readable. `/api/research` GET exposes remaining starts and expiry without secrets; POST applies the guards before starting the workflow.

Verification includes concurrency, day rollover, independent project allowances, storage outages, expiry, and blocked resumed research calls. The live storage collision check and status checks do not call OpenAI.
