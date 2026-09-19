import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { parseWorkflowName } from "workflow/observability";
import { getWorld } from "workflow/runtime";
import { normalizeWebUrl, assertSafePublicUrl } from "@/lib/url-safety";
import { generateAccountBrief } from "@/workflows/generate-account-brief";

export const runtime = "nodejs";

async function enforceDemoQuota() {
  const world = await getWorld();
  const listed = await world.runs.list({ pagination: { limit: 100, sortOrder: "desc" }, resolveData: "none" });
  const runs = listed.data.filter((run) => parseWorkflowName(run.workflowName)?.shortName === "generateAccountBrief");
  if (runs.some((run) => run.status === "running" || run.status === "pending")) {
    throw new Error("Another report is already running. Open it from Recent reports or try again when it finishes.");
  }
  const now = Date.now();
  const configuredReset = Date.parse(process.env.DEMO_QUOTA_RESET_AT || "");
  const quotaResetAt = Number.isFinite(configuredReset) ? configuredReset : 0;
  const quotaRuns = runs.filter((run) => run.createdAt.getTime() >= quotaResetAt);
  const hourly = quotaRuns.filter((run) => now - run.createdAt.getTime() < 60 * 60 * 1000).length;
  const daily = quotaRuns.filter((run) => now - run.createdAt.getTime() < 24 * 60 * 60 * 1000).length;
  if (hourly >= 3 || daily >= 10) throw new Error("The public demo has reached its research limit. Try again later.");
}

export async function POST(request: Request) {
  let value = "";
  try {
    const body = await request.json();
    value = typeof body.url === "string" ? body.url : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const normalized = await assertSafePublicUrl(normalizeWebUrl(value));
    await enforceDemoQuota();
    const run = await start(generateAccountBrief, [normalized]);
    return NextResponse.json({ runId: run.runId, jobUrl: `/jobs/${encodeURIComponent(run.runId)}`, inputUrl: normalized }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The report could not be started.";
    const status = /already running|research limit/.test(message) ? 429 : 400;
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
