import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const api = fs.readFileSync(new URL('../src/routes/api.ts', import.meta.url), 'utf8');
const page = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

test('unverified credit purchase endpoint cannot mint value', () => {
  const routeStart = api.indexOf("apiRouter.post('/credits/purchase'");
  assert.notEqual(routeStart, -1);
  const route = api.slice(routeStart, routeStart + 700);
  assert.match(route, /status\(410\)/);
  assert.match(route, /verified billing rebuild/i);
  assert.doesNotMatch(route, /creditedAmount|receiptId|success:\s*true/);
});

test('browser purchase controls never mint local credits', () => {
  assert.doesNotMatch(page, /current\s*\+\s*credits/);
  assert.doesNotMatch(page, /Successfully purchased/);
  assert.doesNotMatch(page, /graceful offline simulation fallback/i);
  assert.match(page, /Billing is paused while verified checkout is rebuilt/i);
});
