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

Production is protected with HTTP Basic Authentication when both of these environment variables are configured:

- `BASIC_AUTH_USER`
- `BASIC_AUTH_PASSWORD`

Credentials are stored in Vercel and are not committed to Git.

## Validation

```bash
npm run lint
npm run build
```
