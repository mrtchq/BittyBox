/**
 * Dead-Man Switch — REGRESSION BASELINE
 *
 * Spec: bittybox-dms-instructions §33 (P0) "preserve current functional DMS",
 * §2 "reuse the existing functional DMS implementation", §34 Scenarios A & F.
 *
 * PURPOSE: pin the CURRENT behaviour of lib/deadman-switch.js before any
 * restructuring. If a later refactor changes any of these, this suite must fail
 * loudly — that is the point. These assertions describe what the code does
 * TODAY, not what the new product spec wants it to do.
 *
 * Run: node --test tests/deadmanSwitch.regression.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The module resolves DATA_DIR at import time, so isolate the store BEFORE import.
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-regress-'));
process.env.BITTYBOX_DATA_DIR = TMP;
const STORE = path.join(TMP, 'deadman-switches.json');

const dms = await import('../lib/deadman-switch.js');

const ORIGIN = 'https://bittybox.org';
const NO_EMAIL = { origin: ORIGIN, sendFirstEmail: false, sendEmail: async () => ({ success: true, id: 'stub' }) };

function arm(overrides = {}) {
  return dms.armSwitch(
    {
      creatorEmail: 'creator@example.com',
      recipientEmail: 'recipient@example.com',
      recipientName: 'Recipient',
      boxTitle: 'My Box',
      boxUrl: 'https://bittybox.org/#/box/abc',
      intervalMinutes: 30 * 24 * 60,
      graceMinutes: 7 * 24 * 60,
      ...overrides,
    },
    NO_EMAIL,
  );
}

function readStore() { return JSON.parse(fs.readFileSync(STORE, 'utf8')); }
function writeStore(s) { fs.writeFileSync(STORE, JSON.stringify(s)); }
function rawSwitch(id) { return readStore().switches[id]; }

// ── 1. Arm ───────────────────────────────────────────────────────────────────
test('arm: creates an armed switch with a secret bearer token', () => {
  const r = arm();
  assert.match(r.id, /^dms_[a-z0-9]+$/i, 'id uses the dms_ prefix');
  assert.equal(r.switch.status, 'armed');
  assert.ok(r.checkInToken && r.checkInToken.length > 0, 'a check-in token is issued');

  // SECURITY: the token is a bearer secret and must never appear in the projection.
  assert.equal(r.switch.token, undefined, 'public view must not carry the token');
  assert.ok(!JSON.stringify(r.switch).includes(r.checkInToken), 'token must not leak into the public view');
});

test('arm: requires a valid creator email', () => {
  assert.throws(() => arm({ creatorEmail: 'not-an-email' }), (e) => e.code === 'invalid_creator_email');
  assert.throws(() => arm({ creatorEmail: '' }), (e) => e.code === 'invalid_creator_email');
});

test('arm: applies documented defaults (7d interval, 3d grace)', () => {
  const r = dms.armSwitch({ creatorEmail: 'a@b.com', recipientEmail: 'r@b.com' }, NO_EMAIL);
  assert.equal(r.switch.intervalMinutes, 7 * 24 * 60);
  assert.equal(r.switch.graceMinutes, 3 * 24 * 60);
});

test('arm: clamps interval and grace to their bounds', () => {
  assert.equal(arm({ intervalMinutes: 0 }).switch.intervalMinutes, 1, 'min interval = 1 minute');
  assert.equal(arm({ intervalMinutes: 99999999 }).switch.intervalMinutes, 400 * 24 * 60, 'max interval ~400d');
  assert.equal(arm({ graceMinutes: -5 }).switch.graceMinutes, 0, 'min grace = 0');
  assert.equal(arm({ graceMinutes: 99999999 }).switch.graceMinutes, 90 * 24 * 60, 'max grace = 90d');
});

test('arm: graceDisabled forces a zero grace window', () => {
  const r = arm({ graceDisabled: true, graceMinutes: 9999 });
  assert.equal(r.switch.graceMinutes, 0);
  assert.equal(r.switch.graceDisabled, true);
});

test('arm: still tolerates legacy hour-based records', () => {
  assert.equal(arm({ intervalMinutes: undefined, intervalHours: 12 }).switch.intervalMinutes, 720);
  assert.equal(arm({ graceMinutes: undefined, graceHours: 24 }).switch.graceMinutes, 1440);
});

// ── 2. Liveness math + evaluateSwitch ────────────────────────────────────────
test('evaluateSwitch: only an armed switch is evaluated', () => {
  assert.deepEqual(dms.evaluateSwitch(null), { action: 'none', reason: 'not_armed' });
  assert.equal(dms.evaluateSwitch({ status: 'disarmed' }).action, 'none');
  assert.equal(dms.evaluateSwitch({ status: 'triggered' }).action, 'none');
});

test('evaluateSwitch: healthy before the check-in is due', () => {
  const sw = { status: 'armed', armedAt: '2026-01-01T00:00:00Z', lastCheckInAt: '2026-01-01T00:00:00Z', intervalMinutes: 60, graceMinutes: 60 };
  const t = Date.parse('2026-01-01T00:30:00Z');
  assert.deepEqual(dms.evaluateSwitch(sw, t), {
    action: 'none', reason: 'healthy',
    dueMs: Date.parse('2026-01-01T01:00:00Z'),
    fireMs: Date.parse('2026-01-01T02:00:00Z'),
  });
});

test('evaluateSwitch: reminds once the check-in is due', () => {
  const sw = { status: 'armed', armedAt: '2026-01-01T00:00:00Z', lastCheckInAt: '2026-01-01T00:00:00Z', intervalMinutes: 60, graceMinutes: 60, lastReminderAt: null };
  const r = dms.evaluateSwitch(sw, Date.parse('2026-01-01T01:00:00Z'));
  assert.equal(r.action, 'remind');
  assert.equal(r.reason, 'check_in_due');
});

test('evaluateSwitch: reminder is cooldown-gated (6h), so a flapping cron cannot spam', () => {
  const base = { status: 'armed', armedAt: '2026-01-01T00:00:00Z', lastCheckInAt: '2026-01-01T00:00:00Z', intervalMinutes: 60, graceMinutes: 600 };
  const now = Date.parse('2026-01-01T01:00:00Z');
  // reminded 1h ago -> inside the 6h cooldown -> silence
  assert.equal(dms.evaluateSwitch({ ...base, lastReminderAt: '2026-01-01T00:00:00Z' }, now).action, 'none');
  // reminded 7h ago -> outside the cooldown -> remind again
  assert.equal(dms.evaluateSwitch({ ...base, lastReminderAt: '2025-12-31T18:00:00Z' }, now).action, 'remind');
});

test('evaluateSwitch: TRIGGER ALWAYS WINS over a reminder', () => {
  const sw = { status: 'armed', armedAt: '2026-01-01T00:00:00Z', lastCheckInAt: '2026-01-01T00:00:00Z', intervalMinutes: 60, graceMinutes: 60, lastReminderAt: null };
  const r = dms.evaluateSwitch(sw, Date.parse('2026-01-01T02:00:00Z'));
  assert.equal(r.action, 'trigger');
  assert.equal(r.reason, 'grace_elapsed');
});

test('evaluateSwitch: zero grace fires exactly at the due time', () => {
  const sw = { status: 'armed', armedAt: '2026-01-01T00:00:00Z', lastCheckInAt: '2026-01-01T00:00:00Z', intervalMinutes: 60, graceMinutes: 0 };
  assert.equal(dms.evaluateSwitch(sw, Date.parse('2026-01-01T00:59:59Z')).action, 'none');
  assert.equal(dms.evaluateSwitch(sw, Date.parse('2026-01-01T01:00:00Z')).action, 'trigger');
});

test('deadlines derive from lastCheckInAt, falling back to armedAt', () => {
  const fromCheckIn = dms.publicSwitchView({ id: 'dms_x', status: 'armed', armedAt: '2026-01-01T00:00:00Z', lastCheckInAt: '2026-01-02T00:00:00Z', intervalMinutes: 60, graceMinutes: 30 });
  assert.equal(fromCheckIn.nextDueAt, '2026-01-02T01:00:00.000Z');
  assert.equal(fromCheckIn.releasesAt, '2026-01-02T01:30:00.000Z');

  const fromArm = dms.publicSwitchView({ id: 'dms_y', status: 'armed', armedAt: '2026-01-01T00:00:00Z', lastCheckInAt: null, intervalMinutes: 60, graceMinutes: 30 });
  assert.equal(fromArm.nextDueAt, '2026-01-01T01:00:00.000Z');
});

// ── 3. Check-in ──────────────────────────────────────────────────────────────
test('check-in: resets the clock, clears the reminder, and re-arms', () => {
  const r = arm({ intervalMinutes: 60, graceMinutes: 60 });
  const store = readStore();
  store.switches[r.id].lastReminderAt = '2026-01-01T00:00:00Z';
  store.switches[r.id].reminderCount = 3;
  writeStore(store);

  const ci = dms.checkInWithToken(r.checkInToken);
  assert.equal(ci.ok, true);
  assert.equal(ci.alreadyTriggered, false);
  assert.equal(ci.switch.status, 'armed');
  assert.equal(rawSwitch(r.id).lastReminderAt, null, 'reminder marker cleared');
  assert.equal(rawSwitch(r.id).reminderCount, 0, 'reminder count reset');
  // msUntilDue is derived from Date.now() at view time, so a few ms always
  // elapse between the check-in and this assertion — never assert exact equality.
  const MS = 60 * 60 * 1000;
  assert.ok(ci.switch.msUntilDue > MS - 5000 && ci.switch.msUntilDue <= MS,
    `full interval restored (got ${ci.switch.msUntilDue}ms, want ~${MS}ms)`);
});

test('check-in: rejects an unknown token', () => {
  assert.deepEqual(dms.checkInWithToken('nope'), { ok: false, error: 'invalid_token' });
});

test('check-in DURING GRACE cancels the release (Scenario F)', () => {
  const r = arm({ intervalMinutes: 60, graceMinutes: 60 });
  const sw = rawSwitch(r.id);
  // Force the switch into the grace window: due 1h ago, fires 1h from now.
  sw.lastCheckInAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  writeStore({ switches: { [r.id]: sw } });

  assert.equal(dms.evaluateSwitch(sw, Date.now()).reason, 'check_in_due', 'sitting in grace, overdue but not fired');

  const ci = dms.checkInWithToken(r.checkInToken);
  assert.equal(ci.ok, true);
  assert.equal(ci.switch.status, 'armed', 'returns to healthy');
  assert.equal(ci.switch.overdue, false, 'no longer overdue');
  // Same time-derived tolerance as above: interval + grace, minus elapsed ms.
  const FULL = 120 * 60 * 1000;
  assert.ok(ci.switch.msUntilRelease > FULL - 5000 && ci.switch.msUntilRelease <= FULL,
    `release pushed a full interval+grace away (got ${ci.switch.msUntilRelease}ms, want ~${FULL}ms)`);
  assert.equal(dms.evaluateSwitch(rawSwitch(r.id), Date.now()).action, 'none', 'no release will fire');
});

test('check-in AFTER trigger does NOT un-trigger the switch', async () => {
  const r = arm({ intervalMinutes: 60, graceMinutes: 60 });
  const fire = await dms.testFireSwitch(r.checkInToken, NO_EMAIL);
  assert.equal(fire.switch.status, 'triggered');

  const ci = dms.checkInWithToken(r.checkInToken);
  assert.equal(ci.ok, true);
  assert.equal(ci.alreadyTriggered, true, 'flagged as a post-trigger check-in');
  assert.equal(ci.switch.status, 'triggered', 'status deliberately stays triggered');
  assert.ok(rawSwitch(r.id).events.some(e => e.type === 'check_in_after_trigger'), 'audit records the late check-in');
});

// ── 4. Disarm (security) ─────────────────────────────────────────────────────
test('disarm: requires the bearer token — the public id alone is refused', () => {
  const r = arm();
  // The switch id is embedded in the Box URL, so id-only disarm would let a
  // RECIPIENT cancel the creator's switch. This must never work.
  assert.deepEqual(dms.disarmSwitch({ id: r.id }), { ok: false, error: 'not_found' });
  assert.deepEqual(dms.disarmSwitch({ token: 'wrong-token' }), { ok: false, error: 'not_found' });
  assert.equal(dms.disarmSwitch({}).ok, false);

  const ok = dms.disarmSwitch({ token: r.checkInToken });
  assert.equal(ok.ok, true);
  assert.equal(ok.switch.status, 'disarmed');
});

test('check-in on a disarmed switch is refused', () => {
  const r = arm();
  dms.disarmSwitch({ token: r.checkInToken });
  const ci = dms.checkInWithToken(r.checkInToken);
  assert.equal(ci.ok, false);
  assert.equal(ci.error, 'disarmed');
});

test('disarmed switches never fire', () => {
  const r = arm({ intervalMinutes: 1, graceMinutes: 0 });
  dms.disarmSwitch({ token: r.checkInToken });
  const sw = rawSwitch(r.id);
  const farFuture = Date.now() + 365 * 24 * 60 * 60 * 1000;
  assert.equal(dms.evaluateSwitch(sw, farFuture).action, 'none');
  assert.equal(dms.evaluateSwitch(sw, farFuture).reason, 'not_armed');
});

// ── 5. Public projection ─────────────────────────────────────────────────────
test('public view masks both creator and recipient addresses', () => {
  const r = arm();
  assert.notEqual(r.switch.creator, 'creator@example.com', 'creator email must be masked');
  assert.ok(r.switch.creator.includes('@'), 'mask keeps the domain shape');
  assert.equal(r.switch.releasedTo, null, 'nothing released yet');
  assert.equal(r.switch.triggeredAt, null);
});

test('getSwitchStatus returns null for an unknown id', () => {
  assert.equal(dms.getSwitchStatus('dms_doesnotexist'), null);
});

// ── 6. Test affordances are bearer-authorised ────────────────────────────────
test('testFireSwitch: wrong token is refused, right token fires', async () => {
  const r = arm();
  const bad = await dms.testFireSwitch('wrong', NO_EMAIL);
  assert.deepEqual(bad, { ok: false, error: 'not_found' });

  const good = await dms.testFireSwitch(r.checkInToken, NO_EMAIL);
  assert.equal(good.switch.status, 'triggered');

  const again = await dms.testFireSwitch(r.checkInToken, NO_EMAIL);
  assert.equal(again.alreadyTriggered, true, 'firing twice is idempotent');
});

test('testRemindSwitch: wrong token is refused, right token sends', async () => {
  const r = arm();
  const bad = await dms.testRemindSwitch('wrong', NO_EMAIL);
  assert.deepEqual(bad, { ok: false, error: 'not_found' });

  const good = await dms.testRemindSwitch(r.checkInToken, NO_EMAIL);
  assert.equal(good.ok, true);
  assert.equal(good.switch.intervalMinutes > 0, true);
});

// ── 7. Audit trail ───────────────────────────────────────────────────────────
test('audit: events are appended in order with timestamps', () => {
  const r = arm();
  dms.checkInWithToken(r.checkInToken);
  const events = rawSwitch(r.id).events.map(e => e.type);
  assert.deepEqual(events, ['armed', 'checked_in']);
  assert.ok(rawSwitch(r.id).events.every(e => typeof e.at === 'string'));
});

test('audit: the rolling trail is capped at 200 events', () => {
  const r = arm();
  const store = readStore();
  store.switches[r.id].events = Array.from({ length: 260 }, (_, i) => ({ type: 'noise', at: new Date().toISOString(), i }));
  writeStore(store);
  dms.checkInWithToken(r.checkInToken); // triggers one append + the trim
  const events = rawSwitch(r.id).events;
  assert.equal(events.length, 200, 'trail is capped');
  assert.equal(events.at(-1).type, 'checked_in', 'newest event is retained');
});

test('re-arming the same id preserves createdAt and the audit trail', () => {
  const first = arm();
  const created = rawSwitch(first.id).createdAt;
  const second = dms.armSwitch(
    { id: first.id, creatorEmail: 'creator@example.com', recipientEmail: 'recipient@example.com' },
    NO_EMAIL,
  );
  assert.equal(second.id, first.id, 'same id re-armed');
  assert.equal(rawSwitch(first.id).createdAt, created, 'createdAt preserved');
  assert.ok(rawSwitch(first.id).events.some(e => e.type === 'rearmed'), 're-arm is recorded');
});

// ── 8. Store hygiene ─────────────────────────────────────────────────────────
test('store file is written root-only (0600)', () => {
  arm();
  const mode = fs.statSync(STORE).mode & 0o777;
  assert.equal(mode, 0o600, 'the check-in tokens live in a 0600 file');
});
