import { notFound, redirect } from "next/navigation";
import { getRun } from "workflow/api";
import { AccountBriefPage } from "@/components/account-brief-page";
import type { WorkflowResult } from "@/lib/research-workflow";

export const dynamic = "force-dynamic";

async function loadReport(runId: string) {
  try {
    const run = getRun<WorkflowResult>(runId);
    if (await run.status !== "completed") return { state: "running" as const };
    const result = await run.returnValue;
    return result.outcome === "published" && result.report
      ? { state: "ready" as const, report: result.report }
      : { state: "missing" as const };
  } catch {
    return { state: "missing" as const };
  }
}

export default async function GeneratedReport({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const loaded = await loadReport(runId);
  if (loaded.state === "running") redirect(`/jobs/${encodeURIComponent(runId)}`);
  if (loaded.state === "missing") notFound();
  return <AccountBriefPage brief={loaded.report} />;
}
