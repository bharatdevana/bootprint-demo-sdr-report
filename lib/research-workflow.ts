import type { AccountBrief } from "@/lib/account-brief-data";

export const PROGRESS_STAGES = [
  { key: "queued", label: "Queued", percent: 4 },
  { key: "identity", label: "Verifying the company", percent: 16 },
  { key: "company", label: "Researching the account", percent: 42 },
  { key: "customers", label: "Checking customers and buyers", percent: 61 },
  { key: "people", label: "Verifying decision-makers", percent: 78 },
  { key: "synthesis", label: "Building the SDR handoff", percent: 91 },
  { key: "published", label: "Report ready", percent: 100 },
] as const;

export type ProgressStage = (typeof PROGRESS_STAGES)[number]["key"];
export type ProgressEvent = {
  stage: ProgressStage;
  label: string;
  percent: number;
  state: "active" | "complete" | "blocked";
  message: string;
  at: string;
};

export type WorkflowResult = {
  outcome: "published" | "blocked";
  inputUrl: string;
  companyName?: string;
  report?: AccountBrief;
  stage?: ProgressStage;
  message?: string;
  details?: string[];
};

export const SEEDED_REPORTS = [
  { id: "specialty-box", companyName: "Specialty Box", inputUrl: "https://specialtybox.com", reportUrl: "/reports/specialty-box", status: "Published", createdAt: "2026-09-19T12:00:00-04:00" },
  { id: "josh-packaging", companyName: "Josh Packaging, Inc.", inputUrl: "https://www.joshpackaging.com/", reportUrl: "/josh-packaging", status: "Published", createdAt: "2026-09-19T13:00:00-04:00" },
] as const;
