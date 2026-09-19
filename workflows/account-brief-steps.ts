import { assertDemoActive } from "@/lib/demo-limits.mjs";
import { FatalError } from "workflow";
import { buildAccountBrief, researchCompany, researchCustomers, researchPeople, synthesizeHandoff, type CompanyResearch, type CustomerResearch, type PeopleResearch } from "@/lib/openai-account-research";
import { PROGRESS_STAGES, type ProgressEvent, type ProgressStage } from "@/lib/research-workflow";
import { assertSafePublicUrl } from "@/lib/url-safety";
import { detectLogoSurfaceTone } from "@/lib/logo-analysis";

function fatal(error: unknown, label: string): never {
  throw new FatalError(`${label}: ${error instanceof Error ? error.message : String(error)}`);
}

export async function emitProgress(writable: WritableStream<Uint8Array>, stage: ProgressStage, state: ProgressEvent["state"], message: string) {
  "use step";
  const definition = PROGRESS_STAGES.find((item) => item.key === stage);
  if (!definition) throw new FatalError(`Unknown progress stage: ${stage}`);
  const event: ProgressEvent = { stage, label: definition.label, percent: definition.percent, state, message, at: new Date().toISOString() };
  const writer = writable.getWriter();
  try { await writer.write(new TextEncoder().encode(`${JSON.stringify(event)}\n`)); }
  finally { writer.releaseLock(); }
}
emitProgress.maxRetries = 2;

export async function closeProgress(writable: WritableStream<Uint8Array>) {
  "use step";
  const writer = writable.getWriter();
  try { await writer.close(); }
  finally { writer.releaseLock(); }
}
closeProgress.maxRetries = 1;

export async function verifyInputStep(inputUrl: string) {
  "use step";
  try { assertDemoActive(); return await assertSafePublicUrl(inputUrl); }
  catch (error) { fatal(error, "Company verification failed"); }
}
verifyInputStep.maxRetries = 1;

export async function companyResearchStep(inputUrl: string) {
  "use step";
  try { return await researchCompany(inputUrl); }
  catch (error) { fatal(error, "Company research failed"); }
}
companyResearchStep.maxRetries = 2;

export async function customerResearchStep(company: CompanyResearch) {
  "use step";
  try { return await researchCustomers(company); }
  catch (error) { fatal(error, "Customer research failed"); }
}
customerResearchStep.maxRetries = 2;

export async function peopleResearchStep(company: CompanyResearch) {
  "use step";
  try { return await researchPeople(company); }
  catch (error) { fatal(error, "Decision-maker research failed"); }
}
peopleResearchStep.maxRetries = 2;

export async function synthesisStep(company: CompanyResearch, customers: CustomerResearch, people: PeopleResearch) {
  "use step";
  try {
    const synthesis = await synthesizeHandoff(company, customers, people);
    const logoTone = await detectLogoSurfaceTone(company.logo_url);
    return buildAccountBrief(company, customers, people, synthesis, logoTone);
  } catch (error) { fatal(error, "SDR handoff synthesis failed"); }
}
synthesisStep.maxRetries = 2;
