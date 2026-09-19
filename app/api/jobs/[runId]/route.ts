import { NextResponse } from "next/server";
import { getRun } from "workflow/api";
import type { WorkflowResult } from "@/lib/research-workflow";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  try {
    const run = getRun<WorkflowResult>(runId);
    const [status, createdAt, completedAt] = await Promise.all([run.status, run.createdAt, run.completedAt]);
    if (status !== "completed") return NextResponse.json({ status, createdAt: createdAt.toISOString() }, { headers: { "Cache-Control": "no-store" } });
    const result = await run.returnValue;
    return NextResponse.json({ status, ...result, report: undefined, reportUrl: result.outcome === "published" ? `/reports/run/${encodeURIComponent(runId)}` : undefined, createdAt: createdAt.toISOString(), completedAt: completedAt?.toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ status: "failed", error: error instanceof Error ? error.message : "The job could not be read." }, { status: 500 });
  }
}
