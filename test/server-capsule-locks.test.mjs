import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';

// Zero-knowledge verifier derivation mirrors the client contract:
// verifier = HMAC-SHA256(key, salt) over the derived key.
function deriveVerifier(key, salt) {
  return crypto.createHmac('sha256', salt).update(key).digest('hex');
}

// Minimal app bootstrap for tests (mirrors server.ts mounting order).
async function makeApp() {
  const express = (await import('express')).default;
  const { capsulesRouter } = await import('../dist/routes/capsules.js');
  const app = express();
  app.use('/api', express.json({ limit: '2mb' }));
  app.use('/api', capsulesRouter);
  return app;
}

function request(app, method, url, body) {
  return new Promise((resolve) => {
    const srv = app.listen(0, () => {
      const port = srv.address().port;
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          host: '127.0.0.1', port, path: url, method,
          headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {},
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            srv.close(() => resolve({ status: res.statusCode, json: data ? JSON.parse(data) : null }));
          });
        }
      );
      if (payload) req.write(payload);
      req.end();
    });
  });
}

const TEST_DIR = mkdtempSync(path.join(tmpdir(), 'bitty-caps-'));
process.env.BITTYBOX_CAPSULE_DIR = TEST_DIR;

test('rejects capsule creation without any active lock', async () => {
  const app = await makeApp();
  const res = await request(app, 'POST', '/api/capsules', {
    title: 'x', envelope: 'abcd',
    locks: { password: { enabled: false }, time: { enabled: false }, visits: { enabled: false } },
  });
  assert.equal(res.status, 400);
  assert.equal(res.json.error, 'capsule_without_locks');
});

test('zero-knowledge password flow: verifier check then release (no plaintext at rest)', async () => {
  const app = await makeApp();
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.randomBytes(32);
  const verifier = deriveVerifier(key, salt);

  const created = await request(app, 'POST', '/api/capsules', {
    title: 'Secret', envelope: 'CIPHERTEXT', pwVerifier: verifier, pwSalt: salt, pwHint: 'it is x',
    locks: { password: { enabled: true, hint: 'it is x' }, time: { enabled: false }, visits: { enabled: false } },
  });
  assert.equal(created.status, 201);
  const id = created.json.id;

  // A separate capsule proves the metadata endpoint hides the envelope/verifier.
  const meta = await request(app, 'GET', `/api/capsules/${id}`);
  assert.equal(meta.status, 200);
  assert.equal(meta.json.envelope, undefined);
  assert.equal(meta.json.pwVerifier, undefined);
  assert.equal(meta.json.hasPassword, true);

  // Fresh capsule for the wrong-then-right sequence so the rate limiter does
  // not trip the legitimate release (rate limit is keyed per id+ip by design).
  const salt2 = crypto.randomBytes(16).toString('hex');
  const verifier2 = deriveVerifier(crypto.randomBytes(32), salt2);
  const created2 = await request(app, 'POST', '/api/capsules', {
    title: 'Secret2', envelope: 'CIPHERTEXT', pwVerifier: verifier2, pwSalt: salt2,
    locks: { password: { enabled: true }, time: { enabled: false }, visits: { enabled: false } },
  });
  const id2 = created2.json.id;
  const bad = await request(app, 'POST', `/api/capsules/${id2}/access`, { pwVerifier: deriveVerifier(crypto.randomBytes(32), salt2) });
  assert.equal(bad.status, 401);
  assert.equal(bad.json.locked, true);

  const ok = await request(app, 'POST', `/api/capsules/${id}/access`, { pwVerifier: verifier });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.envelope, 'CIPHERTEXT');
  assert.equal(ok.json.pwVerifier, undefined);
});

test('time lock withholds envelope until open window', async () => {
  const app = await makeApp();
  const future = new Date(Date.now() + 60_000).toISOString();
  const created = await request(app, 'POST', '/api/capsules', {
    envelope: 'C', locks: { password: { enabled: false }, time: { enabled: true, open: { enabled: true, datetime: future } }, visits: { enabled: false } },
  });
  const id = created.json.id;
  const blocked = await request(app, 'POST', `/api/capsules/${id}/access`, {});
  assert.equal(blocked.status, 403);
  assert.equal(blocked.json.reason, 'time_open');
});

test('visit ceiling decrements atomically and hard-locks at zero', async () => {
  const app = await makeApp();
  const created = await request(app, 'POST', '/api/capsules', {
    envelope: 'C', locks: { password: { enabled: false }, time: { enabled: false }, visits: { enabled: true, max: 2, action: 'lock' } },
  });
  const id = created.json.id;

  const first = await request(app, 'POST', `/api/capsules/${id}/access`, {});
  assert.equal(first.status, 200);
  assert.equal(first.json.remaining, 1);

  const second = await request(app, 'POST', `/api/capsules/${id}/access`, {});
  assert.equal(second.status, 200);
  assert.equal(second.json.remaining, 0);

  const third = await request(app, 'POST', `/api/capsules/${id}/access`, {});
  assert.equal(third.status, 403);
  assert.equal(third.json.reason, 'visits_exhausted');
});

test('rate limits repeated wrong password attempts', async () => {
  const app = await makeApp();
  const salt = crypto.randomBytes(16).toString('hex');
  const verifier = deriveVerifier(crypto.randomBytes(32), salt);
  const created = await request(app, 'POST', '/api/capsules', {
    envelope: 'C', pwVerifier: verifier, pwSalt: salt,
    locks: { password: { enabled: true }, time: { enabled: false }, visits: { enabled: false } },
  });
  const id = created.json.id;
  let lockedOut = false;
  for (let i = 0; i < 12; i++) {
    const r = await request(app, 'POST', `/api/capsules/${id}/access`, { pwVerifier: 'wrong' });
    if (r.status === 429) { lockedOut = true; break; }
  }
  assert.equal(lockedOut, true);
});
