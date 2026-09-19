import test from 'node:test';
import assert from 'node:assert/strict';
import { researchCompany } from './lib/openai-account-research';

test('resumed research steps cannot start paid work after expiry', async () => {
  const originalNow = Date.now, originalFetch = globalThis.fetch;
  let calls = 0;
  try {
    Date.now = () => Date.parse('2026-09-26T04:00:00Z');
    globalThis.fetch = async () => { calls++; throw Error('must not call a provider'); };
    await assert.rejects(researchCompany('https://example.com'), /expired/);
    assert.equal(calls, 0);
  } finally { Date.now = originalNow; globalThis.fetch = originalFetch; }
});
