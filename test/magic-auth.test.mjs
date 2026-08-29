import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import express from 'express';

import { createMagicAuthRouter } from '../dist/routes/magic-auth.js';

async function startTestApp() {
  const directory = await mkdtemp(path.join(tmpdir(), 'bittybox-magic-auth-'));
  const sent = [];
  const app = express();
  app.use(express.json());
  app.use('/api/accounts/magic', createMagicAuthRouter({
    accountsFile: path.join(directory, 'accounts.json'),
    appUrl: 'https://bittybox.org',
    resendApiKey: 'test-key',
    sendEmail: async (message) => {
      sent.push(message);
      return { ok: true, id: 'email_test_1' };
    },
  }));
  const server = await new Promise((resolve) => {
    const started = app.listen(0, '127.0.0.1', () => resolve(started));
  });
  const { port } = server.address();
  return {
    directory,
    sent,
    url: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      await rm(directory, { recursive: true, force: true });
    },
  };
}

test('magic request sends from support and persists only a token digest', async (t) => {
  const fixture = await startTestApp();
  t.after(() => fixture.close());

  const response = await fetch(`${fixture.url}/api/accounts/magic/request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'builder@example.com', displayName: 'Builder' }),
  });
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { success: true, message: 'If that address can receive email, a sign-in link is on its way.' });
  assert.equal(fixture.sent.length, 1);
  assert.equal(fixture.sent[0].from, 'Bitty Box Support <support@bittybox.org>');
  assert.equal(fixture.sent[0].subject, 'Bitty Box access clearance');
  assert.match(fixture.sent[0].html, /ACCESS CLEARANCE/);
  assert.match(fixture.sent[0].html, /EXPIRES IN 15 MINUTES/);
  assert.match(fixture.sent[0].html, /support@bittybox\.org/);
  assert.match(fixture.sent[0].text, /Expires in 15 minutes/);
  assert.match(fixture.sent[0].text, /Only trust sign-in links delivered from support@bittybox\.org/);
  assert.match(fixture.sent[0].html, /https:\/\/bittybox\.org\/#\/auth\/verify\?token=bb_magic_/);

  const accounts = await readFile(path.join(fixture.directory, 'accounts.json'), 'utf8');
  assert.doesNotMatch(accounts, /bb_magic_/);
  assert.equal(Object.keys(JSON.parse(accounts).magicLinks).length, 1);
});

test('magic verification is single-use and creates a trusted 30-day session', async (t) => {
  const fixture = await startTestApp();
  t.after(() => fixture.close());

  await fetch(`${fixture.url}/api/accounts/magic/request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'builder@example.com', displayName: 'Builder', trustDevice: true }),
  });
  const token = new URL(fixture.sent[0].magicLink).hash.match(/token=([^&]+)/)?.[1];
  assert.ok(token);

  const first = await fetch(`${fixture.url}/api/accounts/magic/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const firstBody = await first.json();
  assert.equal(first.status, 200);
  assert.equal(firstBody.success, true);
  assert.match(firstBody.sessionId, /^bb_sess_/);
  assert.equal(firstBody.trusted, true);
  assert.equal(firstBody.user.email, 'builder@example.com');
  assert.ok(Date.parse(firstBody.expiresAt) > Date.now() + (29 * 24 * 60 * 60 * 1000));

  const replay = await fetch(`${fixture.url}/api/accounts/magic/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  assert.equal(replay.status, 400);
  assert.deepEqual(await replay.json(), { success: false, error: 'This sign-in link is invalid, expired, or has already been used.' });
});

test('invalid addresses are rejected without dispatching email', async (t) => {
  const fixture = await startTestApp();
  t.after(() => fixture.close());

  const response = await fetch(`${fixture.url}/api/accounts/magic/request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { success: false, error: 'A valid email address is required.' });
  assert.equal(fixture.sent.length, 0);
});
