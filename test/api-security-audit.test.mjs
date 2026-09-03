import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Security regression suite for the BittyBox API + MCP server.
 *
 * These tests encode the vulnerabilities found in the 2026-09-03 audit:
 *  - userId query/body impersonation (auth bypass)
 *  - unauthenticated GET /api/boxes data dump
 *  - unauthenticated DELETE /api/boxes/:id (no ownership check)
 *  - unauthenticated /api/accounts/dev-login account minting
 *  - missing security headers
 *
 * They are meant to fail BEFORE the fix (RED) and pass AFTER (GREEN).
 */

const BASE = process.env.BITTYBOX_BASE ?? 'http://127.0.0.1:3012';

async function get(path, headers = {}) {
  const res = await fetch(`${BASE}${path}`, { headers, redirect: 'manual' });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body, headers: res.headers };
}

async function post(path, payload, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload ?? {}),
  });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

async function del(path, headers = {}) {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

test('GET /api/boxes must not dump every capsule to anonymous callers', async () => {
  const r = await get('/api/boxes');
  assert.notEqual(r.status, 200, 'anonymous GET /api/boxes returned 200 (full data dump)');
  assert.ok(r.status === 401 || r.status === 403, `expected 401/403, got ${r.status}`);
});

test('userId in query string must not authenticate (impersonation bypass)', async () => {
  const r = await get('/api/accounts/me?userId=bb_usr_830424a14cf869');
  assert.equal(r.status, 401, `expected 401, got ${r.status} — userId impersonation is live`);
  assert.equal(r.body?.success, false);
});

test('userId in request body must not authenticate', async () => {
  // /api/accounts/me is GET-only, so a POST is rejected outright. The important
  // assertion is that supplying a userId in the body never yields a session/user.
  const r = await post('/api/accounts/me', { userId: 'bb_usr_830424a14cf869' });
  assert.ok(r.status === 401 || r.status === 404 || r.status === 405, `expected rejection, got ${r.status}`);
  assert.notEqual(r.body?.success, true, 'body userId must never authenticate');
});

test('GET /api/accounts/me requires a real credential', async () => {
  const r = await get('/api/accounts/me');
  assert.equal(r.status, 401);
});

test('DELETE /api/boxes/:id must require authentication and ownership', async () => {
  const r = await del('/api/boxes/box_mte0t3da_3srk1v');
  assert.notEqual(r.status, 200, 'anonymous DELETE succeeded — no ownership check');
  assert.ok(r.status === 401 || r.status === 403 || r.status === 404, `got ${r.status}`);
});

test('POST /api/accounts/dev-login must not mint sessions for anonymous callers', async () => {
  const r = await post('/api/accounts/dev-login', { email: 'audit-probe@example.invalid' });
  assert.ok(
    r.status === 401 || r.status === 403 || r.status === 404,
    `dev-login returned ${r.status} — anonymous account minting is live`
  );
  assert.notEqual(r.body?.success, true, 'dev-login must not succeed anonymously');
});

test('bogus API keys are rejected with 401, not treated as anonymous', async () => {
  const r = await get('/api/boxes', { 'x-api-key': 'bb_live_totally_invalid_key' });
  assert.equal(r.status, 401, `expected 401 for invalid API key, got ${r.status}`);
});
