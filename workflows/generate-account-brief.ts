import { getWritable } from "workflow";
import type { WorkflowResult, ProgressStage } from "@/lib/research-workflow";
import { closeProgress, companyResearchStep, customerResearchStep, emitProgress, peopleResearchStep, synthesisStep, verifyInputStep } from "@/workflows/account-brief-steps";

function detail(error: unknown) { return error instanceof Error ? error.message : String(error); }

export async function generateAccountBrief(inputUrl: string): Promise<WorkflowResult> {
  "use workflow";
  const writable = getWritable();
  let stage: ProgressStage = "queued";
  await emitProgress(writable, "queued", "complete", "The account brief is in the durable research queue.");
  try {
    stage = "identity";
    await emitProgress(writable, stage, "active", "Checking that the submitted URL resolves to a public company website.");
    const verifiedUrl = await verifyInputStep(inputUrl);
    await emitProgress(writable, stage, "complete", "The public website passed URL and network safety checks.");

    stage = "company";
    await emitProgress(writable, stage, "active", "Researching firmographics, services, buyers, operating history, and repeat-purchase evidence.");
    const company = await companyResearchStep(verifiedUrl);
    await emitProgress(writable, stage, "complete", `${company.company_name} was resolved with ${company.sources.length} retained sources.`);

    stage = "customers";
    await emitProgress(writable, stage, "active", "Checking official case studies, testimonials, logo evidence, and buyer patterns.");
    const customers = await customerResearchStep(company);
    await emitProgress(writable, stage, "complete", customers.customers.length
      ? `${customers.customers.length} named customer records were retained with bounded evidence.`
      : "No named customer evidence passed the public-source gate; the report will show the gap.");

    stage = "people";
    await emitProgress(writable, stage, "active", "Verifying the top commercial and operational decision-makers. People photos remain disabled.");
    const people = await peopleResearchStep(company);
    await emitProgress(writable, stage, "complete", `${people.people.length} decision-maker records passed the identity gate.`);

    stage = "synthesis";
    await emitProgress(writable, stage, "active", "Applying the fixed qualification rules and writing the internal SDR handoff.");
    const report = await synthesisStep(company, customers, people);
    await emitProgress(writable, stage, "complete", "The report passed deterministic fit scoring and handoff assembly.");

    await emitProgress(writable, "published", "complete", "The account brief is ready.");
    await closeProgress(writable);
    return { outcome: "published", inputUrl: verifiedUrl, companyName: report.companyName, report };
  } catch (error) {
    const message = "The workflow stopped safely before publishing an unsupported report.";
    await emitProgress(writable, stage, "blocked", message);
    await closeProgress(writable);
    return { outcome: "blocked", inputUrl, stage, message, details: [detail(error)] };
  }
}
