import assert from "node:assert/strict";
import test from "node:test";
import { joshPackagingBrief, specialtyBoxBrief } from "@/lib/account-brief-data";
import {
  cleanHttpsUrl,
  cleanLinkedInProfileUrl,
  cleanResearchText,
  deriveCompanySegment,
  ResearchContractError,
  validateAccountBriefBudget,
  validateCustomerDisplay,
  validatePeopleDisplay,
  validateSynthesisDisplay,
} from "@/lib/research-guardrails";
import { mergeLinkedInProfiles, type PeopleResearch } from "@/lib/openai-account-research";
import { classifyLogoPixels, inferLogoSurfaceTone } from "@/lib/logo-presentation";
import { calculateDashboardMetrics } from "@/lib/research-workflow";

test("removes inline citation markup without truncating the claim", () => {
  assert.equal(
    cleanResearchText("Flexible packaging ([Josh Packaging](https://example.com/source)) for food brands."),
    "Flexible packaging for food brands.",
  );
});

test("removes tracking parameters from retained sources", () => {
  assert.equal(cleanHttpsUrl("https://example.com/about?utm_source=test&id=4#team"), "https://example.com/about?id=4");
});

test("derives the compact segment from the public employee band", () => {
  assert.equal(deriveCompanySegment(2, 10), "Micro");
  assert.equal(deriveCompanySegment(5, 70), "SMB");
  assert.equal(deriveCompanySegment(51, 200), "Mid-market");
  assert.equal(deriveCompanySegment(null, null), "Unresolved");
});

test("rejects more than three customer cards", () => {
  assert.throws(
    () => validateCustomerDisplay({ customers: Array.from({ length: 4 }, (_, index) => ({
      name: `Customer ${index}`, evidence: "Official logo", relevance: "Food manufacturer", url: "https://example.com/customers",
    })) }),
    ResearchContractError,
  );
});

test("rejects handoff prose over the field budget", () => {
  assert.throws(
    () => validateSynthesisDisplay({
      recommendation: Array.from({ length: 26 }, () => "word").join(" "),
      lead_with: "Observable operating fact.", ask: "Who owns follow-up?", do_not_assume: "Do not infer buying intent.",
    }),
    ResearchContractError,
  );
});

test("allows a corroborated person without a verified LinkedIn profile", () => {
  const people = { people: [{
    name: "Avery Morgan", title: "Director of Sales", relevance: "Owns commercial conversations",
    linkedin_url: null, evidence: "Current role confirmed on the official leadership page",
  }] };
  assert.equal(validatePeopleDisplay(people), people);
});

test("accepts only canonical LinkedIn person profile URLs", () => {
  assert.equal(
    cleanLinkedInProfileUrl("https://www.linkedin.com/in/matthew-cheng-1342b3121?trk=public_profile"),
    "https://www.linkedin.com/in/matthew-cheng-1342b3121",
  );
  assert.equal(cleanLinkedInProfileUrl("https://www.linkedin.com/posts/example_activity-123"), "");
  assert.equal(cleanLinkedInProfileUrl("https://www.linkedin.com/company/ernest-packaging-solutions"), "");
  assert.equal(cleanLinkedInProfileUrl("https://example.com/in/matthew-cheng"), "");
});

test("merges a separately verified profile only into the exact named person", () => {
  const people: PeopleResearch = { people: [{
    name: "Matthew Cheng", title: "Vice President, Elevate Operations", relevance: "Owns Elevate delivery",
    linkedin_url: null, match_state: "confirmed", evidence: "Official leadership listing corroborates current role",
  }] };
  const merged = mergeLinkedInProfiles(people, { profiles: [{
    name: "Matthew Cheng", linkedin_url: "https://www.linkedin.com/in/matthew-cheng-1342b3121",
    match_state: "confirmed", match_reason: "Current Ernest role matches",
  }, {
    name: "David Graney", linkedin_url: "https://www.linkedin.com/in/david-graney",
    match_state: "confirmed", match_reason: "Different person",
  }] });
  assert.equal(merged.people[0].linkedin_url, "https://www.linkedin.com/in/matthew-cheng-1342b3121");
});

test("uses a dark logo plate for white and reversed asset names", () => {
  assert.equal(inferLogoSurfaceTone("https://example.com/PPC-Logo-White-Vertical.svg"), "dark");
  assert.equal(inferLogoSurfaceTone("https://example.com/brand-reversed.png"), "dark");
  assert.equal(inferLogoSurfaceTone("https://example.com/logo-primary.svg"), "light");
  assert.equal(inferLogoSurfaceTone("https://example.com/logo.svg", "dark"), "dark");
});

test("selects the logo plate from visible pixel luminance", () => {
  assert.equal(classifyLogoPixels(new Uint8Array([255, 255, 255, 255, 245, 245, 245, 255]), 4), "dark");
  assert.equal(classifyLogoPixels(new Uint8Array([12, 18, 32, 255, 40, 60, 80, 255]), 4), "light");
  assert.equal(classifyLogoPixels(new Uint8Array([255, 255, 255, 0]), 4), null);
});

test("reports publish rate from completed workflow runs only", () => {
  const base = { companyName: "Example", inputUrl: "https://example.com", createdAt: "2026-09-19T00:00:00Z" };
  const metrics = calculateDashboardMetrics([
    { ...base, id: "1", status: "Published" },
    { ...base, id: "2", status: "Published" },
    { ...base, id: "3", status: "Stopped safely" },
    { ...base, id: "4", status: "In progress" },
  ]);
  assert.equal(metrics.publishedRuns, 2);
  assert.equal(metrics.completedRuns, 3);
  assert.equal(metrics.publishRate, 67);
});

test("approved calibration reports remain inside the total copy budget", () => {
  assert.equal(validateAccountBriefBudget(specialtyBoxBrief), specialtyBoxBrief);
  assert.equal(validateAccountBriefBudget(joshPackagingBrief), joshPackagingBrief);
});
