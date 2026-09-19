import { classifyClikWorksFit, type FitEvidence } from "@/lib/fit-classifier";
import type { AccountBrief } from "@/lib/account-brief-data";
import {
  cleanHttpsUrl,
  cleanResearchText,
  deriveCompanySegment,
  ResearchContractError,
  validateAccountBriefBudget,
  validateCompanyDisplay,
  validateCustomerDisplay,
  validatePeopleDisplay,
  validateSynthesisDisplay,
} from "@/lib/research-guardrails";

const API_URL = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_RESEARCH_MODEL || "gpt-5.6-terra";

const sourceItem = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", maxLength: 60 },
    detail: { type: "string", maxLength: 80 },
    url: { type: "string", maxLength: 2048 },
  },
  required: ["name", "detail", "url"],
};

const companySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    company_name: { type: "string", maxLength: 100 },
    canonical_url: { type: "string", maxLength: 2048 },
    logo_url: { type: "string", maxLength: 2048 },
    description: { type: "string", maxLength: 180 },
    segment: { type: "string", enum: ["Micro", "SMB", "Mid-market", "Enterprise", "Unresolved"] },
    employee_minimum: { type: ["integer", "null"] },
    employee_maximum: { type: ["integer", "null"] },
    employees_display: { type: "string", maxLength: 36 },
    headquarters: { type: "string", maxLength: 48 },
    operating_since: { type: "string", maxLength: 28 },
    operating_years_minimum: { type: ["integer", "null"] },
    business_model: { type: "string", maxLength: 36 },
    is_b2b: { type: ["boolean", "null"] },
    repeat_purchase_model: { type: "string", enum: ["confirmed", "consumable", "one_time", "unknown"] },
    repeat_purchase_note: { type: "string", maxLength: 80 },
    outbound_owner: { type: "string", enum: ["absent", "present", "unknown"] },
    outbound_owner_note: { type: "string", maxLength: 80 },
    reply_owner: { type: "string", enum: ["assigned", "likely", "unknown"] },
    reply_owner_note: { type: "string", maxLength: 80 },
    what_they_sell: { type: "string", maxLength: 280 },
    services: { type: "array", items: { type: "string", maxLength: 56 }, maxItems: 4 },
    who_buys: { type: "string", maxLength: 220 },
    best_segment: { type: "string", maxLength: 90 },
    likely_buyer: { type: "string", maxLength: 80 },
    conflicts: { type: "array", items: { type: "string", maxLength: 150 }, maxItems: 3 },
    sources: { type: "array", items: sourceItem, maxItems: 5 },
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
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", maxLength: 60 }, evidence: { type: "string", maxLength: 72 },
          relevance: { type: "string", maxLength: 80 }, url: { type: "string", maxLength: 2048 },
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
          name: { type: "string", maxLength: 70 }, title: { type: "string", maxLength: 70 },
          relevance: { type: "string", maxLength: 100 }, linkedin_url: { type: ["string", "null"], maxLength: 2048 },
          match_state: { type: "string", enum: ["confirmed", "probable"] }, evidence: { type: "string", maxLength: 140 },
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
    recommendation: { type: "string", maxLength: 190 }, lead_with: { type: "string", maxLength: 190 },
    ask: { type: "string", maxLength: 190 }, do_not_assume: { type: "string", maxLength: 190 },
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
    max_output_tokens: 4_000,
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

function cleanStringsDeep<T>(value: T): T {
  if (typeof value === "string") return cleanResearchText(value) as T;
  if (Array.isArray(value)) return value.map((item) => cleanStringsDeep(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanStringsDeep(item)])) as T;
  }
  return value;
}

async function guardedCall<T>(
  name: string,
  instructions: string,
  input: string,
  schema: object,
  webSearch: boolean,
  validate: (value: T) => T,
) {
  const draft = cleanStringsDeep(await structuredCall<T>(name, instructions, input, schema, webSearch));
  try {
    return validate(draft);
  } catch (error) {
    if (!(error instanceof ResearchContractError)) throw error;
    const repaired = await structuredCall<T>(
      `${name}_repair`,
      [
        "Rewrite the supplied JSON so it passes every listed display-contract violation.",
        "Preserve supported facts and URLs. Remove repetition, inline citations, commentary, and low-value sources.",
        "Do not browse, add facts, or replace missing evidence with guesses. Return only the required schema.",
      ].join(" "),
      JSON.stringify({ violations: error.violations, draft }),
      schema,
      false,
    );
    return validate(cleanStringsDeep(repaired));
  }
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
export type PeopleResearch = { people: Array<{ name: string; title: string; relevance: string; linkedin_url: string | null; match_state: "confirmed" | "probable"; evidence: string }> };
export type Synthesis = { recommendation: string; lead_with: string; ask: string; do_not_assume: string };

export function researchCompany(url: string) {
  return guardedCall<CompanyResearch>(
    "account_company_research",
    [
      "Research one operating company for an internal SDR qualification brief using current public evidence.",
      "Prefer the official website, official company LinkedIn, official case studies, and authoritative registries.",
      "Separate conflicts instead of choosing a convenient claim. A LinkedIn employee band is an estimate, not an exact count.",
      "Classify repeat purchase as confirmed or consumable only when the core offer is replenished, renewed, consumed, or reordered in normal customer operations.",
      "Keep outbound ownership unknown unless public evidence establishes a dedicated owner or its absence. Keep reply ownership unknown or likely unless explicit.",
      "Return an official logo asset only when referenced by an official company page; otherwise return an empty string.",
      "Never infer revenue, internal systems, buying intent, adoption, or commercial performance. Return direct HTTPS sources.",
      "Write for the fixed report layout, not as a research memo. No markdown, inline links, citations, footnotes, preambles, or repeated caveats in display fields.",
      "DISPLAY CONTRACT: description <=24 words; employees_display <=5 words; headquarters is city and region only <=5 words; operating_since <=4 words; business_model <=4 words.",
      "what_they_sell <=35 words; who_buys <=30 words; best_segment <=12 words; likely_buyer <=10 words; each ownership or repeat-purchase note <=10 words.",
      "Return at most four service labels of <=6 words, three conflicts of <=20 words, and five material sources. Each source name <=8 words and detail <=10 words.",
      "Keep only sources that materially establish identity, firmographics, offer, customer evidence, leadership, or a safety-relevant conflict.",
    ].join(" "),
    `Company URL: ${url}\nResearch date: ${new Date().toISOString().slice(0, 10)}\nPeople photos are disabled.`,
    companySchema,
    true,
    validateCompanyDisplay,
  );
}

export function researchCustomers(company: CompanyResearch) {
  return guardedCall<CustomerResearch>(
    "account_customer_research",
    [
      "Find up to three named customers from official case studies, testimonials, logo walls, or named company mentions.",
      "Rank by evidence strength and relevance; do not fill the quota with weak examples. Return an empty array when no named customer is verified.",
      "State the evidence type precisely. A logo establishes only a company-stated relationship, not contract value, recency, retention, or products supplied.",
      "The renderer states that caveat once for the section, so never repeat it on individual customer cards.",
      "No markdown or inline citations. Each name <=6 words, evidence <=8 words, and relevance <=10 words.",
    ].join(" "),
    JSON.stringify({ company: company.company_name, website: company.canonical_url, sources: company.sources }),
    customerSchema,
    true,
    validateCustomerDisplay,
  );
}

export function researchPeople(company: CompanyResearch) {
  return guardedCall<PeopleResearch>(
    "account_people_research",
    [
      "Identify no more than three current people relevant to a sales conversation: growth owner, sales or business-development leader, and operations or reply owner.",
      "Require a corroborated exact person-company match. Include only confirmed or strong probable matches; omit unresolved people rather than inventing a person.",
      "A LinkedIn profile is optional. Return linkedin_url as null when no exact verified profile is available; do not omit an otherwise corroborated person and do not guess a URL.",
      "Preserve a material stale-title conflict in the evidence field. Do not search for or return profile photos.",
      "No markdown or inline citations. Name <=5 words, title <=8 words, relevance <=12 words, and evidence <=18 words.",
    ].join(" "),
    JSON.stringify({ company: company.company_name, website: company.canonical_url, company_sources: company.sources }),
    peopleSchema,
    true,
    validatePeopleDisplay,
  );
}

export function synthesizeHandoff(company: CompanyResearch, customers: CustomerResearch, people: PeopleResearch) {
  return guardedCall<Synthesis>(
    "account_handoff_synthesis",
    [
      "Write a concise internal SDR handoff using only the supplied research.",
      "The recommendation must name the most important checks still needed. Lead with an observable fact or tension, not a diagnosis. Ask one useful discovery question.",
      "Do not repeat customers, firmographics, or the product list. Do not claim the company needs a service, lacks a CRM, has no outbound motion, or is actively buying unless supplied evidence proves it.",
      "No markdown or inline citations. Each field must be 25 words or fewer.",
    ].join(" "),
    JSON.stringify({ company, customers, people }),
    synthesisSchema,
    false,
    validateSynthesisDisplay,
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function safeHttps(value: string | null | undefined) {
  return value ? cleanHttpsUrl(value) : "";
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
  const brief: AccountBrief = {
    slug,
    website: safeHttps(company.canonical_url) || company.canonical_url,
    companyName: company.company_name,
    researchedOn: new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date()),
    logoUrl: safeHttps(company.logo_url),
    description: company.description,
    score: fit.score, totalChecks: fit.totalChecks, fitLabel: fit.label, fitSummary: fit.summary,
    segment: deriveCompanySegment(company.employee_minimum, company.employee_maximum), employees: company.employees_display || "Not established",
    headquarters: company.headquarters || "Not established", operatingSince: company.operating_since || "Not established",
    businessModel: company.business_model || "Not established", recommendation: synthesis.recommendation,
    whatTheySell: company.what_they_sell, services: company.services, whoBuys: company.who_buys,
    bestSegment: company.best_segment, likelyBuyer: company.likely_buyer,
    customerEvidence: customers.customers.filter((item) => safeHttps(item.url)).map((item) => ({ ...item, url: safeHttps(item.url) })),
    decisionMakers: people.people.map((person) => ({
      name: person.name, title: person.title, relevance: person.relevance,
      linkedin: safeHttps(person.linkedin_url).replace(/^https?:\/\//, "").replace(/\/$/, "") || "No verified profile",
      profileUrl: safeHttps(person.linkedin_url),
      confidence: person.match_state === "confirmed" ? "Confirmed" : "Probable match",
      confidenceTone: person.match_state,
      initials: initials(person.name), evidence: person.evidence,
    })),
    fitChecks: fit.criteria,
    handoff: { leadWith: synthesis.lead_with, ask: synthesis.ask, doNotAssume: synthesis.do_not_assume },
    sources: company.sources.filter((item) => safeHttps(item.url)).map((item) => ({ ...item, url: safeHttps(item.url), status: "Reviewed" })),
  };
  return validateAccountBriefBudget(brief);
}
