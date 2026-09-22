import test from "node:test";
import assert from "node:assert/strict";
import {
  createDemoSession,
  isDemoPasswordConfigured,
  passwordMatches,
  verifyDemoSession,
} from "./lib/demo-auth";

const PASSWORD = "test-only-strong-password-123456";

test("shared demo password issues a signed 12-hour session", () => {
  process.env.DEMO_PASSWORD = PASSWORD;
  const now = Date.parse("2026-09-22T12:00:00Z");
  const token = createDemoSession(now);

  assert.equal(isDemoPasswordConfigured(), true);
  assert.equal(passwordMatches(PASSWORD), true);
  assert.equal(passwordMatches(`${PASSWORD}-wrong`), false);
  assert.equal(verifyDemoSession(token, now + 11 * 60 * 60 * 1000), true);
  assert.equal(verifyDemoSession(token, now + 12 * 60 * 60 * 1000), false);
});

test("tampered sessions and short password configuration fail closed", () => {
  process.env.DEMO_PASSWORD = PASSWORD;
  const token = createDemoSession();
  assert.equal(verifyDemoSession(`${token}x`), false);

  process.env.DEMO_PASSWORD = "too-short";
  assert.equal(isDemoPasswordConfigured(), false);
  assert.equal(verifyDemoSession(token), false);
});
