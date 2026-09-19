import type { AccountBrief } from "@/lib/account-brief-data";

export class ResearchContractError extends Error {
  constructor(public readonly violations: string[]) {
    super(`Research output failed the display contract: ${violations.join("; ")}`);
    this.name = "ResearchContractError";
  }
}

export function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function cleanResearchText(value: string) {
  return value
    .replace(/\s*\(\s*\[[^\]]+]\(https?:\/\/[^)]+\)\s*\)/gi, "")
    .replace(/\[([^\]]+)]\(https?:\/\/[^)]+\)/gi, "$1")
    .replace(/cite[^]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)) url.searchParams.delete(key);
    }
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

export function cleanLinkedInProfileUrl(value: string | null | undefined) {
  if (!value) return "";
  const cleaned = cleanHttpsUrl(value);
  if (!cleaned) return "";
  try {
    const url = new URL(cleaned);
    const hostname = url.hostname.toLowerCase();
    if (hostname !== "linkedin.com" && !hostname.endsWith(".linkedin.com")) return "";
    const match = url.pathname.match(/^\/in\/([^/]+)\/?$/i);
    if (!match?.[1]) return "";
    return `https://www.linkedin.com/in/${match[1]}`;
  } catch {
    return "";
  }
}

export function deriveCompanySegment(minimum: number | null, maximum: number | null) {
  if (minimum === null || maximum === null) return "Unresolved";
  if (maximum <= 10) return "Micro";
  if (maximum <= 70) return "SMB";
  if (maximum <= 999) return "Mid-market";
  return "Enterprise";
}

function requireWords(violations: string[], label: string, value: string, maximum: number) {
  const count = wordCount(value);
  if (count > maximum) violations.push(`${label} is ${count} words; maximum ${maximum}`);
}

function requireArray(violations: string[], label: string, values: unknown[], maximum: number) {
  if (values.length > maximum) violations.push(`${label} has ${values.length} items; maximum ${maximum}`);
}

function rejectInlineLinks(violations: string[], label: string, value: string) {
  if (/\[[^\]]+]\(https?:\/\//i.test(value) || /https?:\/\//i.test(value) || /cite/.test(value)) {
    violations.push(`${label} contains an inline link or citation`);
  }
}

export type CompanyDisplayContract = {
  company_name: string;
  canonical_url: string;
  logo_url: string;
  description: string;
  segment: string;
  employee_minimum: number | null;
  employee_maximum: number | null;
  employees_display: string;
  headquarters: string;
  operating_since: string;
  operating_years_minimum: number | null;
  business_model: string;
  repeat_purchase_note: string;
  outbound_owner_note: string;
  reply_owner_note: string;
  what_they_sell: string;
  services: string[];
  who_buys: string;
  best_segment: string;
  likely_buyer: string;
  conflicts: string[];
  sources: Array<{ name: string; detail: string; url: string }>;
};

export function validateCompanyDisplay<T extends CompanyDisplayContract>(company: T): T {
  const violations: string[] = [];
  const fields: Array<[string, string, number]> = [
    ["description", company.description, 24],
    ["employees_display", company.employees_display, 5],
    ["headquarters", company.headquarters, 5],
    ["operating_since", company.operating_since, 4],
    ["business_model", company.business_model, 4],
    ["repeat_purchase_note", company.repeat_purchase_note, 10],
    ["outbound_owner_note", company.outbound_owner_note, 10],
    ["reply_owner_note", company.reply_owner_note, 10],
    ["what_they_sell", company.what_they_sell, 35],
    ["who_buys", company.who_buys, 30],
    ["best_segment", company.best_segment, 12],
    ["likely_buyer", company.likely_buyer, 10],
  ];
  for (const [label, value, maximum] of fields) {
    requireWords(violations, label, value, maximum);
    rejectInlineLinks(violations, label, value);
  }
  requireArray(violations, "services", company.services, 4);
  company.services.forEach((value, index) => requireWords(violations, `services[${index}]`, value, 6));
  requireArray(violations, "conflicts", company.conflicts, 3);
  company.conflicts.forEach((value, index) => requireWords(violations, `conflicts[${index}]`, value, 20));
  requireArray(violations, "sources", company.sources, 5);
  company.sources.forEach((source, index) => {
    requireWords(violations, `sources[${index}].name`, source.name, 8);
    requireWords(violations, `sources[${index}].detail`, source.detail, 10);
    if (!cleanHttpsUrl(source.url)) violations.push(`sources[${index}].url is not a valid HTTPS URL`);
  });
  if (!cleanHttpsUrl(company.canonical_url)) violations.push("canonical_url is not a valid HTTPS URL");
  if (company.logo_url && !cleanHttpsUrl(company.logo_url)) violations.push("logo_url is not a valid HTTPS URL");
  if (violations.length) throw new ResearchContractError(violations);
  return company;
}

export type CustomerDisplayContract = {
  customers: Array<{ name: string; evidence: string; relevance: string; url: string }>;
};

export function validateCustomerDisplay<T extends CustomerDisplayContract>(research: T): T {
  const violations: string[] = [];
  requireArray(violations, "customers", research.customers, 3);
  research.customers.forEach((customer, index) => {
    requireWords(violations, `customers[${index}].name`, customer.name, 6);
    requireWords(violations, `customers[${index}].evidence`, customer.evidence, 8);
    requireWords(violations, `customers[${index}].relevance`, customer.relevance, 10);
    rejectInlineLinks(violations, `customers[${index}].evidence`, customer.evidence);
    rejectInlineLinks(violations, `customers[${index}].relevance`, customer.relevance);
    if (!cleanHttpsUrl(customer.url)) violations.push(`customers[${index}].url is not a valid HTTPS URL`);
  });
  if (violations.length) throw new ResearchContractError(violations);
  return research;
}

export type PeopleDisplayContract = {
  people: Array<{ name: string; title: string; relevance: string; linkedin_url: string | null; evidence: string }>;
};

export function validatePeopleDisplay<T extends PeopleDisplayContract>(research: T): T {
  const violations: string[] = [];
  requireArray(violations, "people", research.people, 3);
  research.people.forEach((person, index) => {
    requireWords(violations, `people[${index}].name`, person.name, 5);
    requireWords(violations, `people[${index}].title`, person.title, 8);
    requireWords(violations, `people[${index}].relevance`, person.relevance, 12);
    requireWords(violations, `people[${index}].evidence`, person.evidence, 18);
    rejectInlineLinks(violations, `people[${index}].relevance`, person.relevance);
    rejectInlineLinks(violations, `people[${index}].evidence`, person.evidence);
    if (person.linkedin_url && !cleanLinkedInProfileUrl(person.linkedin_url)) {
      violations.push(`people[${index}].linkedin_url is not a canonical LinkedIn profile URL`);
    }
  });
  if (violations.length) throw new ResearchContractError(violations);
  return research;
}

export type SynthesisDisplayContract = {
  recommendation: string;
  lead_with: string;
  ask: string;
  do_not_assume: string;
};

export function validateSynthesisDisplay<T extends SynthesisDisplayContract>(synthesis: T): T {
  const violations: string[] = [];
  for (const [label, value] of Object.entries(synthesis)) {
    requireWords(violations, label, value, 25);
    rejectInlineLinks(violations, label, value);
  }
  if (violations.length) throw new ResearchContractError(violations);
  return synthesis;
}

export function validateAccountBriefBudget(brief: AccountBrief) {
  const displayStrings = [
    brief.description, brief.segment, brief.employees, brief.headquarters, brief.operatingSince,
    brief.businessModel, brief.recommendation, brief.whatTheySell, ...brief.services, brief.whoBuys,
    brief.bestSegment, brief.likelyBuyer,
    ...brief.customerEvidence.flatMap((item) => [item.name, item.evidence, item.relevance]),
    ...brief.decisionMakers.flatMap((item) => [item.name, item.title, item.relevance, item.evidence]),
    ...brief.fitChecks.flatMap((item) => [item.label, item.note]),
    brief.handoff.leadWith, brief.handoff.ask, brief.handoff.doNotAssume,
    ...brief.sources.flatMap((item) => [item.name, item.detail]),
  ];
  const total = displayStrings.reduce((sum, value) => sum + wordCount(value), 0);
  if (total > 450) throw new ResearchContractError([`report display copy is ${total} words; maximum 450`]);
  return brief;
}
