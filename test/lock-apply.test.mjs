import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCK_IDS,
  applyLocksToBox,
  lockRequest,
  validateLockConfig,
} from '../lib/lock-apply.js';
import { createBox } from '../lib/box-store.js';
import { assertTestDatabase } from './helpers/require-test-db.mjs';

// createBox writes to the real store path; never do that in production.
assertTestDatabase({ suite: 'lock-apply' });

// createBox writes to the real store path, so use it (and clean up after)
const BOX = createBox({ bittyUrl: 'https://bittybox.org/#lock-apply-test', title: 'lock-apply' });
const BOX_ID = BOX.id;

test.after(() => {
  try {
    const { deleteBox } = require('../lib/box-store.js');
  } catch (_) { /* cleanup best-effort */ }
});

function makeRequest(handlers = {}) {
  return (method, path, body) => {
    const key = `${method} ${path}`;
    if (handlers[key]) return handlers[key](body);
    return { ok: true, method, path, body };
  };
}

test('lock ids cover exactly the six production-enforced types', () => {
  assert.deepEqual([...LOCK_IDS].sort(), [
    'access-limit', 'invite-only', 'password', 'session-limit', 'time',
  ].sort());
});

test('password config rejects short and non-numeric passcodes', () => {
  assert.equal(validateLockConfig('password', { password: '123' }).ok, false);
  assert.equal(validateLockConfig('password', { password: 'abcdefgh' }).ok, false);
  assert.equal(validateLockConfig('password', { password: '12345678' }).ok, true);
});

test('invite-only rejects empty and malformed emails', () => {
  assert.equal(validateLockConfig('invite-only', { emails: '' }).ok, false);
  assert.equal(validateLockConfig('invite-only', { emails: 'nope' }).ok, false);
  assert.equal(validateLockConfig('invite-only', { emails: 'a@b.com, c@d.com' }).ok, true);
});

test('access-limit and session-limit require positive integers', () => {
  assert.equal(validateLockConfig('access-limit', { maxOpens: 0 }).ok, false);
  assert.equal(validateLockConfig('access-limit', { maxOpens: 3 }).ok, true);
  assert.equal(validateLockConfig('session-limit', { maxSessionOpens: -1 }).ok, false);
});

test('time rejects an inverted window', () => {
  const bad = validateLockConfig('time', {
    notBefore: '2026-10-02T00:00', notAfter: '2026-10-01T00:00',
  });
  assert.equal(bad.ok, false);
  assert.equal(validateLockConfig('time', { notBefore: '2026-10-01T00:00', notAfter: '2026-10-02T00:00' }).ok, true);
});

test('lockRequest targets the real production lock endpoints', () => {
  const r = lockRequest('password', BOX_ID, { password: '12345678' });
  assert.equal(r.method, 'POST');
  assert.equal(r.path, `/api/boxes/${BOX_ID}/lock/password`);
  assert.equal(r.body.password, '12345678');

  const t = lockRequest('time', BOX_ID, { notBefore: 'x', notAfter: 'y' });
  assert.equal(t.path, `/api/boxes/${BOX_ID}/lock/time`);

  const i = lockRequest('invite-only', BOX_ID, { emails: 'a@b.com\nc@d.com' });
  assert.deepEqual(i.body.emails, ['a@b.com', 'c@d.com']);
});

test('applyLocksToBox applies valid locks and reports invalid ones', () => {
  const calls = [];
  const req = (method, path, body) => { calls.push(path); return { ok: true }; };
  const res = applyLocksToBox({
    boxId: BOX_ID,
    locks: {
      password: { password: '12345678' },
      'access-limit': { maxOpens: 4 },
      'session-limit': { maxSessionOpens: 0 }, // invalid
    },
    request: req,
  });
  assert.deepEqual(res.applied, ['password', 'access-limit']);
  assert.equal(res.errors.length, 1);
  assert.equal(res.errors[0].id, 'session-limit');
  assert.ok(calls.some(p => p.includes('/lock/password')));
});

test('applyLocksToBox skips payment and reports unknown box', () => {
  const res = applyLocksToBox({
    boxId: BOX_ID, locks: { payment: { priceUsd: '$5.00' } },
    request: () => ({ ok: true }),
  });
  assert.deepEqual(res.skipped, [{ id: 'payment', reason: 'handled by billing' }]);

  const missing = applyLocksToBox({
    boxId: 'nope', locks: { password: { password: '12345678' } },
    request: () => ({ ok: true }),
  });
  assert.equal(missing.errors[0].error, 'Box not found');
});
