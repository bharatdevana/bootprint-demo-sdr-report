import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { parseWorkflowName } from "workflow/observability";
import { getWorld } from "workflow/runtime";
import { normalizeWebUrl, assertSafePublicUrl } from "@/lib/url-safety";
import { generateAccountBrief } from "@/workflows/generate-account-brief";

import { assertDemoActive, reserveRun, demoAvailability, DemoLimitError } from "@/lib/demo-limits.mjs";

export const runtime = "nodejs";

async function enforceDemoQuota() {
  const world = await getWorld();
  const listed = await world.runs.list({ pagination: { limit: 100, sortOrder: "desc" }, resolveData: "none" });
  const runs = listed.data.filter((run) => parseWorkflowName(run.workflowName)?.shortName === "generateAccountBrief");
  if (runs.some((run) => run.status === "running" || run.status === "pending")) {
    throw new Error("Another report is already running. Open it from Recent reports or try again when it finishes.");
  }
  const now = Date.now();
  const hourly = runs.filter((run) => now - run.createdAt.getTime() < 60 * 60 * 1000).length;
  if (hourly >= 3) throw new DemoLimitError("The demo allows 3 starts per hour. Try again later.", 429);
}

export async function POST(request: Request) {
  try { assertDemoActive(); } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Demo expired." }, { status: 410 });
  }
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
    await reserveRun("sdr");
    assertDemoActive();
    const run = await start(generateAccountBrief, [normalized]);
    return NextResponse.json({ runId: run.runId, jobUrl: `/jobs/${encodeURIComponent(run.runId)}`, inputUrl: normalized }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The report could not be started.";
    const status = error instanceof DemoLimitError ? error.status : /already running/.test(message) ? 429 : 400;
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET() {
  return NextResponse.json(await demoAvailability("sdr"), { headers: { "Cache-Control": "no-store" } });
}
