import { classifyClikWorksFit, type FitEvidence } from "@/lib/fit-classifier";
import type { AccountBrief } from "@/lib/account-brief-data";

const API_URL = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_RESEARCH_MODEL || "gpt-5.6-terra";

const sourceItem = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    detail: { type: "string" },
    url: { type: "string" },
  },
  required: ["name", "detail", "url"],
};

const companySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    company_name: { type: "string" },
    canonical_url: { type: "string" },
    logo_url: { type: "string" },
    description: { type: "string" },
    segment: { type: "string" },
    employee_minimum: { type: ["integer", "null"] },
    employee_maximum: { type: ["integer", "null"] },
    employees_display: { type: "string" },
    headquarters: { type: "string" },
    operating_since: { type: "string" },
    operating_years_minimum: { type: ["integer", "null"] },
    business_model: { type: "string" },
    is_b2b: { type: ["boolean", "null"] },
    repeat_purchase_model: { type: "string", enum: ["confirmed", "consumable", "one_time", "unknown"] },
    repeat_purchase_note: { type: "string" },
    outbound_owner: { type: "string", enum: ["absent", "present", "unknown"] },
    outbound_owner_note: { type: "string" },
    reply_owner: { type: "string", enum: ["assigned", "likely", "unknown"] },
    reply_owner_note: { type: "string" },
    what_they_sell: { type: "string" },
    services: { type: "array", items: { type: "string" }, maxItems: 4 },
    who_buys: { type: "string" },
    best_segment: { type: "string" },
    likely_buyer: { type: "string" },
    conflicts: { type: "array", items: { type: "string" } },
    sources: { type: "array", items: sourceItem },
  },
  required: [
    "company_name", "canonical_url", "logo_url", "description", "segment", "employee_minimum",
    "employee_maximum", "employees_display", "headquarters", "operating_since", "operating_years_minimum",
    "business_model", "is_b2b", "repeat_purchase_model", "repeat_purchase_note", "outbound_owner",
    "outbound_owner_note", "reply_owner", "reply_owner_note", "what_they_sell", "services", "who_buys",
    "best_segment", "likely_buyer", "conflicts", "sources",
  ],
};

const customerSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    customers: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" }, evidence: { type: "string" }, relevance: { type: "string" }, url: { type: "string" },
        },
        required: ["name", "evidence", "relevance", "url"],
      },
    },
  },
  required: ["customers"],
};

const peopleSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    people: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" }, title: { type: "string" }, relevance: { type: "string" },
          linkedin_url: { type: "string" }, match_state: { type: "string", enum: ["confirmed", "probable"] },
          evidence: { type: "string" },
        },
        required: ["name", "title", "relevance", "linkedin_url", "match_state", "evidence"],
      },
    },
  },
  required: ["people"],
};

const synthesisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    recommendation: { type: "string" }, lead_with: { type: "string" }, ask: { type: "string" }, do_not_assume: { type: "string" },
  },
  required: ["recommendation", "lead_with", "ask", "do_not_assume"],
};

function outputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  return output.flatMap((item) => {
    if (!item || typeof item !== "object" || (item as { type?: string }).type !== "message") return [];
    const content = (item as { content?: unknown[] }).content || [];
    return content.flatMap((part) => part && typeof part === "object" && (part as { type?: string }).type === "output_text"
      ? [(part as { text?: string }).text || ""] : []);
  }).join("");
}

async function structuredCall<T>(name: string, instructions: string, input: string, schema: object, webSearch: boolean): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const body: Record<string, unknown> = {
    model: MODEL,
    reasoning: { effort: "medium" },
    instructions,
    input,
    text: { format: { type: "json_schema", name, strict: true, schema } },
    store: false,
  };
  if (webSearch) {
    body.tools = [{ type: "web_search" }];
    body.tool_choice = "required";
    body.include = ["web_search_call.action.sources"];
  }
  const result = await fetch(API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(240_000),
  });
  const response = await result.json() as Record<string, unknown>;
  if (!result.ok) {
    const error = response.error && typeof response.error === "object" ? JSON.stringify(response.error) : result.statusText;
    throw new Error(`OpenAI ${name} failed (${result.status}): ${error}`);
  }
  return JSON.parse(outputText(response)) as T;
}

export type CompanyResearch = {
  company_name: string; canonical_url: string; logo_url: string; description: string; segment: string;
  employee_minimum: number | null; employee_maximum: number | null; employees_display: string; headquarters: string;
  operating_since: string; operating_years_minimum: number | null; business_model: string; is_b2b: boolean | null;
  repeat_purchase_model: FitEvidence["repeatPurchaseModel"]; repeat_purchase_note: string;
  outbound_owner: FitEvidence["outboundOwner"]; outbound_owner_note: string;
  reply_owner: FitEvidence["replyOwner"]; reply_owner_note: string;
  what_they_sell: string; services: string[]; who_buys: string; best_segment: string; likely_buyer: string;
  conflicts: string[]; sources: Array<{ name: string; detail: string; url: string }>;
};
export type CustomerResearch = { customers: AccountBrief["customerEvidence"] };
export type PeopleResearch = { people: Array<{ name: string; title: string; relevance: string; linkedin_url: string; match_state: "confirmed" | "probable"; evidence: string }> };
export type Synthesis = { recommendation: string; lead_with: string; ask: string; do_not_assume: string };

export function researchCompany(url: string) {
  return structuredCall<CompanyResearch>(
    "account_company_research",
    [
      "Research one operating company for an internal SDR qualification brief using current public evidence.",
      "Prefer the official website, official company LinkedIn, official case studies, and authoritative registries.",
      "Separate conflicts instead of choosing a convenient claim. A LinkedIn employee band is an estimate, not an exact count.",
      "Classify repeat purchase as confirmed or consumable only when the core offer is replenished, renewed, consumed, or reordered in normal customer operations.",
      "Keep outbound ownership unknown unless public evidence establishes a dedicated owner or its absence. Keep reply ownership unknown or likely unless explicit.",
      "Return an official logo asset only when referenced by an official company page; otherwise return an empty string.",
      "Never infer revenue, internal systems, buying intent, adoption, or commercial performance. Return direct HTTPS sources.",
    ].join(" "),
    `Company URL: ${url}\nResearch date: ${new Date().toISOString().slice(0, 10)}\nPeople photos are disabled.`,
    companySchema,
    true,
  );
}

export function researchCustomers(company: CompanyResearch) {
  return structuredCall<CustomerResearch>(
    "account_customer_research",
    "Find up to five named customers from official case studies, testimonials, logo walls, or named company mentions. State the evidence type precisely. A logo establishes only a company-stated relationship, not contract value, recency, retention, or products supplied. Return an empty array when no named customer is verified.",
    JSON.stringify({ company: company.company_name, website: company.canonical_url, sources: company.sources }),
    customerSchema,
    true,
  );
}

export function researchPeople(company: CompanyResearch) {
  return structuredCall<PeopleResearch>(
    "account_people_research",
    "Identify no more than three current people relevant to a sales conversation: growth owner, sales or business-development leader, and operations or reply owner. Require a corroborated exact person-company match. Include only confirmed or strong probable matches; omit unresolved roles rather than inventing a person or LinkedIn URL. Preserve stale-title conflicts in the evidence string. Do not search for or return profile photos.",
    JSON.stringify({ company: company.company_name, website: company.canonical_url, company_sources: company.sources }),
    peopleSchema,
    true,
  );
}

export function synthesizeHandoff(company: CompanyResearch, customers: CustomerResearch, people: PeopleResearch) {
  return structuredCall<Synthesis>(
    "account_handoff_synthesis",
    "Write a concise internal SDR handoff using only the supplied research. The recommendation must name the most important checks still needed. Lead with an observable fact or tension, not a diagnosis. Ask one useful discovery question. Do not claim the company needs a service, lacks a CRM, has no outbound motion, or is actively buying unless supplied evidence proves it.",
    JSON.stringify({ company, customers, people }),
    synthesisSchema,
    false,
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function safeHttps(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function buildAccountBrief(company: CompanyResearch, customers: CustomerResearch, people: PeopleResearch, synthesis: Synthesis): AccountBrief {
  const fit = classifyClikWorksFit({
    isB2B: company.is_b2b,
    employeeRange: company.employee_minimum !== null && company.employee_maximum !== null
      ? { minimum: company.employee_minimum, maximum: company.employee_maximum } : null,
    operatingYearsMinimum: company.operating_years_minimum,
    repeatPurchaseModel: company.repeat_purchase_model,
    repeatPurchaseNote: company.repeat_purchase_note,
    outboundOwner: company.outbound_owner,
    outboundOwnerNote: company.outbound_owner_note,
    replyOwner: company.reply_owner,
    replyOwnerNote: company.reply_owner_note,
  });
  const slug = new URL(company.canonical_url).hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return {
    slug,
    website: safeHttps(company.canonical_url) || company.canonical_url,
    companyName: company.company_name,
    researchedOn: new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date()),
    logoUrl: safeHttps(company.logo_url),
    description: company.description,
    score: fit.score, totalChecks: fit.totalChecks, fitLabel: fit.label, fitSummary: fit.summary,
    segment: company.segment || "Unresolved", employees: company.employees_display || "Not established",
    headquarters: company.headquarters || "Not established", operatingSince: company.operating_since || "Not established",
    businessModel: company.business_model || "Not established", recommendation: synthesis.recommendation,
    whatTheySell: company.what_they_sell, services: company.services.slice(0, 4), whoBuys: company.who_buys,
    bestSegment: company.best_segment, likelyBuyer: company.likely_buyer,
    customerEvidence: customers.customers.filter((item) => safeHttps(item.url)).slice(0, 5),
    decisionMakers: people.people.slice(0, 3).map((person) => ({
      name: person.name, title: person.title, relevance: person.relevance,
      linkedin: safeHttps(person.linkedin_url).replace(/^https?:\/\//, "").replace(/\/$/, "") || "No verified profile",
      profileUrl: safeHttps(person.linkedin_url) || company.canonical_url,
      confidence: person.match_state === "confirmed" ? "Confirmed" : "Probable match",
      confidenceTone: person.match_state,
      initials: initials(person.name), evidence: person.evidence,
    })),
    fitChecks: fit.criteria,
    handoff: { leadWith: synthesis.lead_with, ask: synthesis.ask, doNotAssume: synthesis.do_not_assume },
    sources: company.sources.filter((item) => safeHttps(item.url)).map((item) => ({ ...item, status: "Reviewed" })).slice(0, 12),
  };
}
