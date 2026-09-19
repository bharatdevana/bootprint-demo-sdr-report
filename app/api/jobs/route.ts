import { NextResponse } from "next/server";
import { getRun } from "workflow/api";
import { parseWorkflowName } from "workflow/observability";
import { getWorld } from "workflow/runtime";
import { SEEDED_REPORTS, type WorkflowResult } from "@/lib/research-workflow";

export const runtime = "nodejs";

export async function GET() {
  try {
    const world = await getWorld();
    const listed = await world.runs.list({ pagination: { limit: 40, sortOrder: "desc" }, resolveData: "none" });
    const runs = listed.data.filter((run) => parseWorkflowName(run.workflowName)?.shortName === "generateAccountBrief").slice(0, 10);
    const live = await Promise.all(runs.map(async (run) => {
      let result: WorkflowResult | undefined;
      if (run.status === "completed") {
        try { result = await getRun<WorkflowResult>(run.runId).returnValue; } catch { /* Keep the run visible. */ }
      }
      return {
        id: run.runId, companyName: result?.companyName || "Research in progress", inputUrl: result?.inputUrl || "",
        reportUrl: result?.outcome === "published" ? `/reports/run/${encodeURIComponent(run.runId)}` : undefined,
        jobUrl: `/jobs/${encodeURIComponent(run.runId)}`,
        status: result?.outcome === "blocked" ? "Stopped safely" : result?.outcome === "published" ? "Published" : run.status === "running" ? "In progress" : run.status === "pending" ? "Queued" : run.status,
        createdAt: run.createdAt.toISOString(),
      };
    }));
    return NextResponse.json({ jobs: [...live, ...SEEDED_REPORTS] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Recent reports could not be loaded.", jobs: SEEDED_REPORTS }, { status: 500 });
  }
}
