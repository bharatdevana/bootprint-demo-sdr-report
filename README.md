# Bootprint Demo: SDR Report

A branded internal account brief for SDR and BDR teams. The demo turns researched company information into a consistent qualification report with company context, decision-makers, evidence, fit criteria, and suggested outreach angles.

## Demo routes

- `/` — Specialty Box
- `/josh-packaging` — Josh Packaging

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production access

The demonstration is publicly accessible. Pages send `noindex` directives to discourage search-engine indexing, but this is not access control.

## Validation

```bash
npm test
npm run lint
npm run build
```

New reports are published only after section-level word limits, array limits, source rules, URL cleanup, and a 450-word dynamic-copy budget pass. A failed model draft gets one no-browse repair attempt; a second failure blocks publication.
