/**
 * Regression tests for Creem webhook signature verification.
 *
 * The bug: the handler computed an HMAC, and on mismatch only logged a warning
 * and continued — so an unauthenticated POST could mint credits. These tests
 * pin the fail-closed behaviour so it cannot silently regress.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  verifyWebhookSignature,
  statusForReason,
  getSignatureHeader,
  isEnforced,
} from '../lib/webhook-signature.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(HERE, '..', 'server.js');

const SECRET = 'whsec_test_secret';
const BODY = Buffer.from(JSON.stringify({ eventType: 'checkout.completed', data: { amount: 1000 } }));
const GOOD = crypto.createHmac('sha256', SECRET).update(BODY).digest('hex');

const V = (over = {}) => verifyWebhookSignature({ rawBody: BODY, headers: { 'creem-signature': GOOD }, secret: SECRET, ...over });

test('accepts a correctly signed raw body', () => {
  const r = V();
  assert.equal(r.ok, true);
  assert.equal(r.reason, 'verified');
  assert.equal(statusForReason(r.reason), null, 'must not reject a valid signature');
});

test('rejects a MISSING signature (the original exploit)', () => {
  const r = V({ headers: {} });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'signature_missing');
  assert.equal(statusForReason(r.reason), 401);
});

test('rejects a TAMPERED body signed with the same key', () => {
  const tampered = Buffer.from(JSON.stringify({ eventType: 'checkout.completed', data: { amount: 999999 } }));
  const r = verifyWebhookSignature({ rawBody: tampered, headers: { 'creem-signature': GOOD }, secret: SECRET });
  assert.equal(r.ok, false);
  assert.equal(statusForReason(r.reason), 401, 'a forged amount must not be credited');
});

test('rejects a wrong signature of the same length', () => {
  const wrong = crypto.createHmac('sha256', 'attacker').update(BODY).digest('hex');
  const r = V({ headers: { 'creem-signature': wrong } });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'signature_mismatch');
});

test('rejects non-hex and truncated signatures without throwing', () => {
  for (const bad of ['not-hex-at-all', 'abc', GOOD.slice(0, 10), 'ff'.repeat(32)]) {
    const r = V({ headers: { 'creem-signature': bad } });
    assert.equal(r.ok, false, `should reject ${bad.slice(0, 12)}`);
  }
});

test('accepts sha256= prefixed and differently-cased signatures', () => {
  for (const variant of [`sha256=${GOOD}`, `sha256:${GOOD}`, GOOD.toUpperCase()]) {
    const r = V({ headers: { 'creem-signature': variant } });
    assert.equal(r.ok, true, `should accept ${variant.slice(0, 16)}`);
  }
});

test('fails closed when the secret is not configured', () => {
  const r = V({ secret: undefined });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'secret_not_configured');
  assert.equal(statusForReason(r.reason), 500, 'misconfiguration must not grant credits');
});

test('fails closed when the raw body was not captured', () => {
  const r = V({ rawBody: undefined });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'raw_body_unavailable');
  assert.equal(statusForReason(r.reason), 500);
});

test('all three header names are honoured, first match wins', () => {
  for (const h of ['x-creem-signature', 'creem-signature', 'x-webhook-signature']) {
    assert.equal(getSignatureHeader({ [h]: GOOD }), GOOD);
  }
  assert.equal(getSignatureHeader({}), '');
});

test('enforcement can be disabled for rollback only via BITTYBOX_WEBHOOK_ENFORCE=0', () => {
  assert.equal(isEnforced({}), true, 'must default to enforcing');
  assert.equal(isEnforced({ BITTYBOX_WEBHOOK_ENFORCE: '1' }), true);
  assert.equal(isEnforced({ BITTYBOX_WEBHOOK_ENFORCE: '0' }), false);
  const r = V({ enforce: false, headers: {} });
  assert.equal(r.ok, true);
  assert.equal(r.reason, 'not_enforced');
});

test('server.js is actually wired to the guard (guards against silent removal)', () => {
  const src = readFileSync(SERVER, 'utf8');
  assert.match(src, /webhook-signature-guard/, 'guard marker missing from server.js');
  assert.match(src, /verifyWebhookSignature\s*\(/, 'verifier not called');
  assert.match(src, /WEBHOOK_SIGNATURE_INVALID/, 'rejection response missing');
  assert.match(src, /return res\.status\(rejectStatus\)/, 'handler does not return on failure');
  assert.ok(
    !/update\(JSON\.stringify\(req\.body\)\)/.test(src),
    'the re-serialised-body HMAC must not come back',
  );
  assert.ok(
    !/Signature verification note: payload received/.test(src),
    'the log-and-continue behaviour must not come back',
  );
});
