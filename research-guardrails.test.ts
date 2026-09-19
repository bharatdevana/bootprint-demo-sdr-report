import assert from "node:assert/strict";
import test from "node:test";
import { joshPackagingBrief, specialtyBoxBrief } from "@/lib/account-brief-data";
import {
  cleanHttpsUrl,
  cleanResearchText,
  deriveCompanySegment,
  ResearchContractError,
  validateAccountBriefBudget,
  validateCustomerDisplay,
  validateSynthesisDisplay,
} from "@/lib/research-guardrails";

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

test("approved calibration reports remain inside the total copy budget", () => {
  assert.equal(validateAccountBriefBudget(specialtyBoxBrief), specialtyBoxBrief);
  assert.equal(validateAccountBriefBudget(joshPackagingBrief), joshPackagingBrief);
});
