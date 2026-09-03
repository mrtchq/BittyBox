import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import express from 'express';

import { createAccountsRouter } from '../dist/routes/accounts.js';
import { apiRouter } from '../dist/routes/api.js';

async function startTestServer() {
  const dir = await mkdtemp(path.join(tmpdir(), 'bittybox-accounts-test-'));
  const accountsFile = path.join(dir, 'accounts.json');
  const storeDir = path.join(dir, 'data');
  process.env.BITTYBOX_STORE_DIR = storeDir;
  process.env.BITTYBOX_ACCOUNTS_FILE = accountsFile;
  // Dev-login is a local-development convenience and is disabled by default in
  // production (it previously let anonymous callers mint accounts for any email).
  // These tests need a login primitive, so opt in for the duration of the fixture.
  const previousDevLogin = process.env.BITTYBOX_ALLOW_DEV_LOGIN;
  process.env.BITTYBOX_ALLOW_DEV_LOGIN = 'true';

  await writeFile(accountsFile, JSON.stringify({ version: 1, users: {}, sessions: {}, apiKeys: {} }));

  const app = express();
  app.use(express.json());
  app.use('/api/accounts', createAccountsRouter({ accountsFile }));
  app.use('/api', apiRouter);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address();

  return {
    dir,
    accountsFile,
    url: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
      await rm(dir, { recursive: true, force: true });
      if (previousDevLogin === undefined) delete process.env.BITTYBOX_ALLOW_DEV_LOGIN;
      else process.env.BITTYBOX_ALLOW_DEV_LOGIN = previousDevLogin;
    }
  };
}

test('accounts: authentication protection, dev-login, and /me endpoint', async (t) => {
  const fixture = await startTestServer();
  t.after(() => fixture.close());

  // 1. Unauthenticated request to /me fails with 401
  const unauthRes = await fetch(`${fixture.url}/api/accounts/me`);
  assert.equal(unauthRes.status, 401);

  // 2. Dev-login creates session
  const loginRes = await fetch(`${fixture.url}/api/accounts/dev-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'builder@example.com', displayName: 'Builder' }),
  });
  assert.equal(loginRes.status, 200);
  const loginBody = await loginRes.json();
  assert.equal(loginBody.success, true);
  assert.ok(loginBody.sessionId.startsWith('bb_sess_'));
  assert.equal(loginBody.user.email, 'builder@example.com');

  // 3. /me with session succeeds
  const meRes = await fetch(`${fixture.url}/api/accounts/me`, {
    headers: { 'Authorization': `Bearer ${loginBody.sessionId}` },
  });
  assert.equal(meRes.status, 200);
  const meBody = await meRes.json();
  assert.equal(meBody.success, true);
  assert.equal(meBody.user.email, 'builder@example.com');
  assert.equal(meBody.keysCount, 0);
  assert.equal(meBody.boxesCount, 0);
});

test('accounts: generate, list, and revoke API keys', async (t) => {
  const fixture = await startTestServer();
  t.after(() => fixture.close());

  // Log in
  const loginRes = await fetch(`${fixture.url}/api/accounts/dev-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'operator@bittybox.org', displayName: 'Operator' }),
  });
  const { sessionId } = await loginRes.json();

  // Generate Key
  const genRes = await fetch(`${fixture.url}/api/accounts/keys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionId}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ label: 'Claude Code Agent', scopes: ['capsules:create', 'mcp:access'] }),
  });
  assert.equal(genRes.status, 201);
  const genBody = await genRes.json();
  assert.equal(genBody.success, true);
  assert.ok(genBody.key.startsWith('bb_live_'));
  assert.equal(genBody.keyRecord.label, 'Claude Code Agent');
  assert.ok(genBody.keyRecord.id.startsWith('bb_key_'));

  // Key should not expose hash in response
  assert.equal(genBody.keyRecord.hash, undefined);

  // List Keys
  const listRes = await fetch(`${fixture.url}/api/accounts/keys`, {
    headers: { 'Authorization': `Bearer ${sessionId}` },
  });
  assert.equal(listRes.status, 200);
  const listBody = await listRes.json();
  assert.equal(listBody.keys.length, 1);
  assert.equal(listBody.keys[0].id, genBody.keyRecord.id);
  assert.equal(listBody.keys[0].label, 'Claude Code Agent');

  // Use the API Key to call /api/boxes
  const postBoxRes = await fetch(`${fixture.url}/api/boxes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${genBody.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Agent Capsule',
      format: 'html',
      content: '<h1>Built via API Key</h1>',
    }),
  });
  assert.equal(postBoxRes.status, 201);
  const postBoxBody = await postBoxRes.json();
  assert.ok(postBoxBody.id.startsWith('box_'));

  // Box shows up in user's /api/accounts/boxes
  const boxesRes = await fetch(`${fixture.url}/api/accounts/boxes`, {
    headers: { 'Authorization': `Bearer ${sessionId}` },
  });
  assert.equal(boxesRes.status, 200);
  const boxesBody = await boxesRes.json();
  assert.equal(boxesBody.boxes.length, 1);
  assert.equal(boxesBody.boxes[0].title, 'Agent Capsule');

  // Revoke Key
  const deleteKeyRes = await fetch(`${fixture.url}/api/accounts/keys/${genBody.keyRecord.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${sessionId}` },
  });
  assert.equal(deleteKeyRes.status, 200);

  // Requesting with revoked key now fails with 401
  const badKeyRes = await fetch(`${fixture.url}/api/boxes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${genBody.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: '<h1>Should fail</h1>' }),
  });
  assert.equal(badKeyRes.status, 401);
});
