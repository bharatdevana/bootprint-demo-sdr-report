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

export type JobSummary = {
  id: string;
  companyName: string;
  inputUrl: string;
  reportUrl?: string;
  jobUrl?: string;
  status: string;
  createdAt: string;
};

export type DashboardMetrics = {
  publishedRuns: number;
  completedRuns: number;
  publishRate: number | null;
  costRange: string;
};

export const ESTIMATED_API_COST_RANGE = "$0.25–$0.40";

export function filterJobsByQuery(jobs: JobSummary[], query: string): JobSummary[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return jobs;

  return jobs.filter((job) => {
    let domain = job.inputUrl;
    try { domain = new URL(job.inputUrl).hostname.replace(/^www\./, ""); } catch { /* Keep raw input. */ }
    return `${job.companyName} ${domain}`.toLowerCase().includes(normalizedQuery);
  });
}

export function calculateDashboardMetrics(jobs: JobSummary[]): DashboardMetrics {
  const publishedRuns = jobs.filter((job) => job.status === "Published").length;
  const completedRuns = jobs.filter((job) => ["Published", "Stopped safely", "failed", "cancelled"].includes(job.status)).length;
  return {
    publishedRuns,
    completedRuns,
    publishRate: completedRuns ? Math.round((publishedRuns / completedRuns) * 100) : null,
    costRange: ESTIMATED_API_COST_RANGE,
  };
}

export const SEEDED_REPORTS = [
  { id: "specialty-box", companyName: "Specialty Box", inputUrl: "https://specialtybox.com", reportUrl: "/reports/specialty-box", status: "Published", createdAt: "2026-09-19T12:00:00-04:00" },
  { id: "josh-packaging", companyName: "Josh Packaging, Inc.", inputUrl: "https://www.joshpackaging.com/", reportUrl: "/josh-packaging", status: "Published", createdAt: "2026-09-19T13:00:00-04:00" },
] as const;
