// ─────────────────────────────────────────────────────────────────────────────
// lib/deadman-switch.js
// Dead-Man Switch Locks for Bitty Box.
//
// A dead-man switch is a liveness-gated release. The creator arms a switch with
// an interval and a grace window. The server quietly tracks the creator's
// check-ins and emails a one-click check-in link each time one is due. As long
// as the creator keeps checking in, nothing is released. If the creator goes
// silent past `interval + grace`, the switch FIRES and the archived Box link is
// delivered to the designated recipient.
//
// This module is deliberately self-contained: it owns its own JSON store, speaks
// plain express, and lazy-loads the Resend client, so it can be dropped into any
// of the Bitty Box servers (production, staging) with a two-line mount.
//
// Public routes (all under /api/deadman):
//   POST /api/deadman/arm              create/update a switch, email first link
//   GET  /api/deadman/status/:id       public state for the viewer gate
//   GET  /api/deadman/checkin/:token   human check-in page (one-click)
//   POST /api/deadman/checkin/:token   perform a check-in (JSON)
//   POST /api/deadman/disarm           cancel a switch ({ id, token })
//   ALL  /api/deadman/tick             advance all switches (cron / n8n)
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ── Configuration ────────────────────────────────────────────────────────────

const DATA_DIR = process.env.BITTYBOX_DATA_DIR || '/var/lib/bittybox';
const STORE_FILE = path.join(DATA_DIR, 'deadman-switches.json');

// Durations are canonical in MINUTES so a cadence can be set down to a single
// minute (60 s). Grace may be 0, meaning the switch releases the instant the
// interval lapses with no grace window.
const DEFAULT_INTERVAL_MINUTES = 7 * 24 * 60; // 7 days
const DEFAULT_GRACE_MINUTES = 3 * 24 * 60; // 3 days
const MIN_INTERVAL_MINUTES = 1; // one minute
const MAX_INTERVAL_MINUTES = 400 * 24 * 60; // ~400 days
const MIN_GRACE_MINUTES = 0; // 0 = no grace period
const MAX_GRACE_MINUTES = 90 * 24 * 60; // 90 days
const REMINDER_COOLDOWN_MS = 6 * 60 * 60 * 1000; // never re-remind within 6h
const MAX_EVENTS = 200; // per-switch rolling audit trail

export function resolveOrigin(req) {
  const env =
    process.env.BITTYBOX_PUBLIC_ORIGIN ||
    process.env.PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    '';
  if (env) return String(env).replace(/\/+$/, '');
  if (req && typeof req.get === 'function') {
    const host = req.get('host');
    if (host) return `${req.protocol || 'https'}://${host}`;
  }
  return 'https://bittybox.org';
}

// ── Store ────────────────────────────────────────────────────────────────────

function readStore() {
  try {
    const data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    if (!data.switches || typeof data.switches !== 'object') data.switches = {};
    if (!data.version) data.version = 1;
    return data;
  } catch {
    return { version: 1, switches: {} };
  }
}

function writeStore(data) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${STORE_FILE}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, STORE_FILE);
  } catch (err) {
    console.error('[deadman] failed to persist store:', err.message);
  }
}

function genId() {
  return 'dms_' + crypto.randomBytes(8).toString('hex');
}
function genToken() {
  return crypto.randomBytes(24).toString('base64url');
}
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
function nowIso() {
  return new Date().toISOString();
}
function clampMinutes(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n * 1000) / 1000));
}

/**
 * Read a duration from an arm request, normalising every accepted unit to
 * minutes. Precedence: minutes → seconds → hours. Keeps older callers that
 * still send `intervalHours` / `graceHours` working.
 */
function readDurationMinutes(input, { minutesKey, secondsKey, hoursKey, min, max, fallback }) {
  const body = input || {};
  let raw;
  if (body[minutesKey] != null) raw = Number(body[minutesKey]);
  else if (body[secondsKey] != null) raw = Number(body[secondsKey]) / 60;
  else if (body[hoursKey] != null) raw = Number(body[hoursKey]) * 60;
  else return fallback;
  return clampMinutes(raw, min, max, fallback);
}
function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function maskEmail(email) {
  if (!isEmail(email)) return null;
  const [user, domain] = email.trim().toLowerCase().split('@');
  const head = user.slice(0, 1) || '*';
  return `${head}${'•'.repeat(Math.max(1, Math.min(4, user.length - 1)))}@${domain}`;
}
function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] || c));
}

function formatDurationShort(minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return 'no grace';
  if (m % (24 * 60) === 0) return `${m / (24 * 60)}d`;
  if (m % 60 === 0) return `${m / 60}h`;
  if (m < 1) return `${Math.round(m * 60)}s`;
  return `${m}m`;
}

function appendEvent(sw, type, meta = {}) {
  sw.events = Array.isArray(sw.events) ? sw.events : [];
  sw.events.push({ type, at: nowIso(), ...meta });
  if (sw.events.length > MAX_EVENTS) {
    sw.events = sw.events.slice(sw.events.length - MAX_EVENTS);
  }
}

// ── Liveness math ────────────────────────────────────────────────────────────

// Tolerate older records that stored durations in hours.
function switchIntervalMinutes(sw) {
  if (sw && sw.intervalMinutes != null) return Number(sw.intervalMinutes);
  if (sw && sw.intervalHours != null) return Number(sw.intervalHours) * 60;
  return DEFAULT_INTERVAL_MINUTES;
}
function switchGraceMinutes(sw) {
  if (sw && sw.graceMinutes != null) return Number(sw.graceMinutes);
  if (sw && sw.graceHours != null) return Number(sw.graceHours) * 60;
  return DEFAULT_GRACE_MINUTES;
}

function computeDeadlines(sw) {
  const base = sw.lastCheckInAt || sw.armedAt;
  const baseMs = base ? new Date(base).getTime() : Date.now();
  const intervalMs = switchIntervalMinutes(sw) * 60 * 1000;
  const graceMs = switchGraceMinutes(sw) * 60 * 1000;
  const dueMs = baseMs + intervalMs;
  const fireMs = dueMs + graceMs;
  return { baseMs, intervalMs, graceMs, dueMs, fireMs };
}

/**
 * Decide what the switch needs right now: nothing, a reminder, or the trigger.
 * Trigger always wins over reminder. A reminder is only issued once per
 * cooldown window so a flapping cron cannot spam the creator.
 */
export function evaluateSwitch(sw, nowMs = Date.now()) {
  if (!sw || sw.status !== 'armed') return { action: 'none', reason: 'not_armed' };
  const { dueMs, fireMs } = computeDeadlines(sw);

  if (nowMs >= fireMs) return { action: 'trigger', reason: 'grace_elapsed', dueMs, fireMs };

  const reminderAt = sw.lastReminderAt ? new Date(sw.lastReminderAt).getTime() : 0;
  if (nowMs >= dueMs && nowMs - reminderAt >= REMINDER_COOLDOWN_MS) {
    return { action: 'remind', reason: 'check_in_due', dueMs, fireMs };
  }
  return { action: 'none', reason: 'healthy', dueMs, fireMs };
}

// ── Public projections ───────────────────────────────────────────────────────

export function publicSwitchView(sw, nowMs = Date.now()) {
  if (!sw) return null;
  const { dueMs, fireMs } = computeDeadlines(sw);
  const triggered = sw.status === 'triggered';
  const intervalMinutes = switchIntervalMinutes(sw);
  const graceMinutes = switchGraceMinutes(sw);
  return {
    id: sw.id,
    boxTitle: sw.boxTitle || '',
    status: sw.status,
    intervalMinutes,
    graceMinutes,
    // Derived units for callers that still read hours/seconds.
    intervalHours: intervalMinutes / 60,
    graceHours: graceMinutes / 60,
    intervalSeconds: Math.round(intervalMinutes * 60),
    graceSeconds: Math.round(graceMinutes * 60),
    graceDisabled: graceMinutes <= 0,
    armedAt: sw.armedAt || null,
    lastCheckInAt: sw.lastCheckInAt || null,
    nextDueAt: new Date(dueMs).toISOString(),
    releasesAt: new Date(fireMs).toISOString(),
    triggeredAt: sw.triggeredAt || null,
    releasedTo: sw.releasedAt ? maskEmail(sw.recipientEmail) : null,
    creator: maskEmail(sw.creatorEmail),
    msUntilDue: triggered ? 0 : Math.max(0, dueMs - nowMs),
    msUntilRelease: triggered ? 0 : Math.max(0, fireMs - nowMs),
    overdue: !triggered && nowMs >= dueMs,
    triggered,
  };
}

// ── Email ────────────────────────────────────────────────────────────────────

async function defaultSendEmail(options) {
  const mod = await import('./resend-client.js');
  if (typeof mod.sendEmail !== 'function') throw new Error('resend-client missing sendEmail');
  return mod.sendEmail(options);
}

function shellHtml({ eyebrow, badge, title, bodyHtml, footerNote = '' }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#06040d;color:#f4f1ea;font-family:Arial,Helvetica,sans-serif">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escapeHtml(title)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#06040d;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#100b1e;border:1px solid #2a2350;border-radius:18px;overflow:hidden;box-shadow:0 0 35px rgba(0,242,255,0.15)">
<tr><td style="height:4px;background:linear-gradient(90deg,#00f2ff,#a855f7,#00f2ff)"></td></tr>
<tr><td style="padding:30px 32px 8px">
<p style="margin:0;color:#00f2ff;font-size:12px;font-weight:700;letter-spacing:2px">${escapeHtml(eyebrow)}</p>
<p style="display:inline-block;margin:16px 0 12px;padding:6px 12px;border:1px solid #6d5bd0;border-radius:999px;color:#d8ccff;background:#1c1636;font-size:11px;font-weight:700;letter-spacing:1.2px">${escapeHtml(badge)}</p>
<h1 style="margin:0 0 14px;color:#ffffff;font-size:25px;line-height:1.2;font-weight:700">${escapeHtml(title)}</h1>
</td></tr>
<tr><td style="padding:4px 32px 26px;color:#c9c6bf;font-size:15px;line-height:1.55">${bodyHtml}</td></tr>
${footerNote ? `<tr><td style="padding:18px 32px;border-top:1px solid #2a2350;background:#0c0818"><p style="margin:0;color:#8b87a0;font-size:12px;line-height:1.5">${footerNote}</p></td></tr>` : ''}
</table></td></tr></table></body></html>`;
}

function buttonHtml(href, label) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:6px 0 4px"><tr><td style="border-radius:10px;background:#00f2ff;box-shadow:0 0 15px rgba(0,242,255,0.4)"><a href="${escapeHtml(href)}" style="display:inline-block;padding:15px 24px;border-radius:10px;color:#04121a;font-size:14px;font-weight:800;letter-spacing:.5px;text-decoration:none">${escapeHtml(label)}</a></td></tr></table>`;
}

export async function sendCheckInEmail(sw, { origin, sendEmail } = {}) {
  const send = sendEmail || defaultSendEmail;
  const checkInUrl = `${origin}/api/deadman/checkin/${sw.token || ''}`;
  const due = new Date(computeDeadlines(sw).fireMs).toISOString();
  const dueLabel = new Date(due).toUTCString();
  const title = 'Check in to keep your Dead-Man Switch armed';
  const bodyHtml = `
    <p style="margin:0 0 12px">Hello,</p>
    <p style="margin:0 0 12px">Your Bitty Box dead-man switch <strong style="color:#fff">${escapeHtml(sw.boxTitle || 'Untitled Bitty Box')}</strong> is due for a liveness check-in. If you do not check in, your archived Box will be released to <strong style="color:#fff">${escapeHtml(sw.recipientEmail || 'your recipient')}</strong>.</p>
    <p style="margin:0 0 6px;color:#fca5a5;font-weight:700">Release at ${escapeHtml(dueLabel)} if you do not check in.</p>
    ${buttonHtml(checkInUrl, "I'M HERE — CHECK IN NOW")}
    <p style="margin:14px 0 0;color:#8b87a0;font-size:12px">One tap is all it takes. This link is a secret: anyone who has it can check in on your behalf.</p>`;
  const html = shellHtml({
    eyebrow: 'BITTY BOX / DEAD-MAN SWITCH',
    badge: 'CHECK-IN REQUIRED',
    title,
    bodyHtml,
    footerNote: 'You are receiving this because you armed a Dead-Man Switch on bittybox.org. Checking in resets the clock; nothing is released while you are active.',
  });
  const text = `BITTY BOX / DEAD-MAN SWITCH\n\n${title}\n\nYour switch "${sw.boxTitle || 'Untitled Bitty Box'}" is due for a liveness check-in.\n\nIf you do not check in, it releases to ${sw.recipientEmail || 'your recipient'} at ${dueLabel}.\n\nCHECK IN NOW:\n${checkInUrl}\n\nThis link is secret; anyone with it can check in on your behalf.`;
  return send({ to: sw.creatorEmail, subject: `Check in: “${sw.boxTitle || 'Bitty Box'}” dead-man switch`, html, text, replyTo: 'support@bittybox.org' });
}

export async function sendReleaseEmail(sw, { origin, sendEmail } = {}) {
  const send = sendEmail || defaultSendEmail;
  const boxUrl = sw.boxUrl || '';
  const title = 'A Bitty Box has been released to you';
  const bodyHtml = `
    <p style="margin:0 0 12px">Hello ${escapeHtml(sw.recipientName || 'there')},</p>
    <p style="margin:0 0 12px">You have been designated as the recipient of a Dead-Man Switch on Bitty Box. The creator stopped checking in, so the switch has fired and the following Box is now released to you.</p>
    <p style="margin:0 0 6px;color:#fff;font-weight:700">${escapeHtml(sw.boxTitle || 'Untitled Bitty Box')}</p>
    ${boxUrl ? buttonHtml(boxUrl, 'OPEN THE RELEASED BITTY BOX') : ''}
    ${sw.note ? `<div style="margin:14px 0 0;background:#17112c;border-left:3px solid #00f2ff;border-radius:6px;padding:12px 16px"><p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;color:#00f2ff;text-transform:uppercase">Message from the creator</p><p style="margin:0;color:#e2e8f0;font-style:italic;line-height:1.5">&ldquo;${escapeHtml(sw.note)}&rdquo;</p></div>` : ''}
    <p style="margin:16px 0 0;color:#8b87a0;font-size:12px">Delivered automatically by the Bitty Box Dead-Man Switch. The switch fired at ${escapeHtml(sw.triggeredAt || nowIso())}.</p>`;
  const html = shellHtml({
    eyebrow: 'BITTY BOX / DEAD-MAN SWITCH',
    badge: 'RELEASED',
    title,
    bodyHtml,
    footerNote: 'This message was sent because a Dead-Man Switch stopped receiving check-ins. If this is unexpected, contact the creator.',
  });
  const text = `BITTY BOX / DEAD-MAN SWITCH\n\n${title}\n\nHello ${sw.recipientName || 'there'},\n\n${sw.boxTitle || 'Untitled Bitty Box'} has been released to you.\n\n${boxUrl ? `Open it here:\n${boxUrl}\n\n` : ''}${sw.note ? `Message from the creator:\n"${sw.note}"\n\n` : ''}The switch fired at ${sw.triggeredAt || nowIso()}.`;
  return send({ to: sw.recipientEmail, subject: `Released: “${sw.boxTitle || 'Bitty Box'}”`, html, text, replyTo: 'support@bittybox.org' });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function armSwitch(input = {}, { origin, sendEmail, sendFirstEmail = true } = {}) {
  const creatorEmail = isEmail(input.creatorEmail) ? input.creatorEmail.trim().toLowerCase() : null;
  if (!creatorEmail) {
    const err = new Error('A valid creator email is required to arm a Dead-Man Switch.');
    err.code = 'invalid_creator_email';
    throw err;
  }
  const recipientEmail = isEmail(input.recipientEmail) ? input.recipientEmail.trim().toLowerCase() : null;
  // Canonical durations in minutes. Accepts minutes (preferred), seconds, or
  // legacy hours. `graceDisabled: true` forces a zero grace window.
  const intervalMinutes = readDurationMinutes(input, {
    minutesKey: 'intervalMinutes',
    secondsKey: 'intervalSeconds',
    hoursKey: 'intervalHours',
    min: MIN_INTERVAL_MINUTES,
    max: MAX_INTERVAL_MINUTES,
    fallback: DEFAULT_INTERVAL_MINUTES,
  });
  const graceMinutes = input.graceDisabled
    ? 0
    : readDurationMinutes(input, {
        minutesKey: 'graceMinutes',
        secondsKey: 'graceSeconds',
        hoursKey: 'graceHours',
        min: MIN_GRACE_MINUTES,
        max: MAX_GRACE_MINUTES,
        fallback: DEFAULT_GRACE_MINUTES,
      });

  const store = readStore();
  const requestedId = typeof input.id === 'string' && /^dms_[a-z0-9]{6,32}$/i.test(input.id) ? input.id : null;
  const id = requestedId || genId();
  const existing = store.switches[id] || null;

  const plainToken = genToken();
  const now = nowIso();
  const sw = {
    id,
    // The check-in token is a bearer secret, so it lives only in this root-only
    // (0600) server file and is never included in any public projection.
    token: plainToken,
    creatorEmail,
    recipientEmail,
    recipientName: input.recipientName ? String(input.recipientName).trim().slice(0, 120) : '',
    boxTitle: input.boxTitle ? String(input.boxTitle).trim().slice(0, 200) : 'Untitled Bitty Box',
    boxUrl: input.boxUrl ? String(input.boxUrl).trim() : '',
    note: input.note ? String(input.note).trim().slice(0, 2000) : '',
    intervalMinutes,
    graceMinutes,
    status: 'armed',
    armedAt: now,
    lastCheckInAt: now,
    lastReminderAt: null,
    reminderCount: 0,
    triggeredAt: null,
    releasedAt: null,
    releaseEmailId: null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    events: existing?.events ? existing.events.slice(-MAX_EVENTS) : [],
  };
  appendEvent(sw, existing ? 'rearmed' : 'armed', { by: 'creator' });

  store.switches[id] = sw;
  writeStore(store);

  const checkInUrl = `${origin}/api/deadman/checkin/${plainToken}`;
  const result = { switch: publicSwitchView(sw), checkInUrl, checkInToken: plainToken, id };

  if (sendFirstEmail) {
    Promise.resolve()
      .then(() => sendCheckInEmail(sw, { origin, sendEmail }))
      .then(r => {
        if (r && r.success === false) console.error('[deadman] first check-in email failed:', r.error);
      })
      .catch(err => console.error('[deadman] first check-in email error:', err.message));
  }

  return result;
}

export function checkInWithToken(token) {
  const store = readStore();
  const sw = Object.values(store.switches).find(s => s.token && safeEqual(s.token, token));
  if (!sw) return { ok: false, error: 'invalid_token' };

  const now = nowIso();
  if (sw.status === 'disarmed') return { ok: false, error: 'disarmed', switch: publicSwitchView(sw) };

  const wasTriggered = sw.status === 'triggered';
  sw.lastCheckInAt = now;
  sw.lastReminderAt = null;
  sw.reminderCount = 0;
  sw.updatedAt = now;
  if (!wasTriggered) sw.status = 'armed';
  appendEvent(sw, wasTriggered ? 'check_in_after_trigger' : 'checked_in', { via: 'email_link' });
  writeStore(store);

  return {
    ok: true,
    alreadyTriggered: wasTriggered,
    switch: publicSwitchView(sw),
  };
}

export function disarmSwitch({ token } = {}) {
  const store = readStore();
  // Disarming requires the bearer token: the public switch id is embedded in
  // the Box URL, so id-only disarming would let any recipient cancel the switch.
  const sw = token
    ? Object.values(store.switches).find(s => s.token && safeEqual(s.token, token))
    : null;
  if (!sw) return { ok: false, error: 'not_found' };
  sw.status = 'disarmed';
  sw.updatedAt = nowIso();
  appendEvent(sw, 'disarmed', { by: 'creator' });
  writeStore(store);
  return { ok: true, switch: publicSwitchView(sw) };
}

export function getSwitchStatus(id) {
  const sw = readStore().switches[id];
  if (!sw) return null;
  return publicSwitchView(sw);
}

// ── Test affordances (bearer-token authorised) ───────────────────────────────
// These let the creator exercise the reminder and release paths on demand
// without waiting out the real cadence. Both require the secret check-in token,
// so they only ever touch the caller's own switch.

export async function testRemindSwitch(token, { origin, sendEmail } = {}) {
  const store = readStore();
  const sw = Object.values(store.switches).find(s => s.token && safeEqual(s.token, token));
  if (!sw) return { ok: false, error: 'not_found' };
  if (sw.status !== 'armed') return { ok: false, error: `switch_${sw.status}` };

  sw.lastReminderAt = nowIso();
  sw.reminderCount = (sw.reminderCount || 0) + 1;
  sw.updatedAt = nowIso();
  appendEvent(sw, 'test_reminder_sent', { count: sw.reminderCount });
  writeStore(store);

  let delivery = null;
  try {
    delivery = await sendCheckInEmail(sw, { origin: origin || resolveOrigin(), sendEmail });
  } catch (err) {
    delivery = { success: false, error: err.message };
  }
  return { ok: true, delivery, switch: publicSwitchView(sw) };
}

export async function testFireSwitch(token, { origin, sendEmail } = {}) {
  const store = readStore();
  const sw = Object.values(store.switches).find(s => s.token && safeEqual(s.token, token));
  if (!sw) return { ok: false, error: 'not_found' };
  if (sw.status === 'triggered') return { ok: true, alreadyTriggered: true, switch: publicSwitchView(sw) };

  sw.status = 'triggered';
  sw.triggeredAt = nowIso();
  sw.updatedAt = nowIso();
  appendEvent(sw, 'test_fired', { by: 'creator' });

  let delivery = null;
  if (sw.recipientEmail && sw.boxUrl) {
    try {
      const res = await sendReleaseEmail(sw, { origin: origin || resolveOrigin(), sendEmail });
      if (res && res.success) {
        sw.releasedAt = nowIso();
        sw.releaseEmailId = res.id || null;
        appendEvent(sw, 'released', { to: sw.recipientEmail });
        delivery = { success: true, id: res.id || null };
      } else {
        appendEvent(sw, 'release_failed', { error: res?.error || 'unknown' });
        delivery = { success: false, error: res?.error || 'unknown' };
      }
    } catch (err) {
      delivery = { success: false, error: err.message };
    }
  } else if (!sw.recipientEmail) {
    appendEvent(sw, 'triggered_no_recipient', {});
    delivery = { success: false, error: 'no_recipient_email' };
  }

  writeStore(store);
  return { ok: true, delivery, switch: publicSwitchView(sw) };
}

// ── Tick: reminders + triggers ───────────────────────────────────────────────

export async function runDeadmanTick({ origin, sendEmail, now = Date.now() } = {}) {
  const store = readStore();
  const summary = { scanned: 0, reminded: 0, triggered: 0, errors: [] };
  let dirty = false;
  const resolvedOrigin = origin || resolveOrigin();

  for (const sw of Object.values(store.switches)) {
    summary.scanned += 1;
    const verdict = evaluateSwitch(sw, now);
    if (verdict.action === 'none') continue;

    if (verdict.action === 'remind') {
      sw.lastReminderAt = nowIso();
      sw.reminderCount = (sw.reminderCount || 0) + 1;
      sw.updatedAt = nowIso();
      appendEvent(sw, 'reminder_sent', { count: sw.reminderCount });
      dirty = true;
      summary.reminded += 1;
      try {
        await sendCheckInEmail(sw, { origin: resolvedOrigin, sendEmail });
      } catch (err) {
        summary.errors.push({ id: sw.id, phase: 'remind', error: err.message });
      }
      continue;
    }

    if (verdict.action === 'trigger') {
      sw.status = 'triggered';
      sw.triggeredAt = nowIso();
      sw.updatedAt = nowIso();
      appendEvent(sw, 'triggered', { reason: verdict.reason });
      dirty = true;
      summary.triggered += 1;
      if (sw.recipientEmail && sw.boxUrl) {
        try {
          const res = await sendReleaseEmail(sw, { origin: resolvedOrigin, sendEmail });
          if (res && res.success) {
            sw.releasedAt = nowIso();
            sw.releaseEmailId = res.id || null;
            appendEvent(sw, 'released', { to: sw.recipientEmail });
          } else {
            appendEvent(sw, 'release_failed', { error: res?.error || 'unknown' });
            summary.errors.push({ id: sw.id, phase: 'release', error: res?.error || 'unknown' });
          }
        } catch (err) {
          summary.errors.push({ id: sw.id, phase: 'release', error: err.message });
        }
      } else if (!sw.recipientEmail) {
        appendEvent(sw, 'triggered_no_recipient', {});
      }
    }
  }

  if (dirty) writeStore(store);
  return summary;
}

// ── Check-in web page ────────────────────────────────────────────────────────

function pageShell(inner) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bitty Box • Dead-Man Switch</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 50% 0%,#16112e 0%,#06040d 60%);color:#e8e6f2;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;padding:24px}
.card{width:100%;max-width:520px;border:1px solid rgba(0,242,255,.35);border-radius:20px;background:rgba(12,8,24,.92);box-shadow:0 0 60px rgba(0,242,255,.18);overflow:hidden}
.bar{height:4px;background:linear-gradient(90deg,#00f2ff,#a855f7,#00f2ff)}
.pad{padding:28px 28px 26px}
.eyebrow{color:#00f2ff;font-size:11px;letter-spacing:2px;font-weight:700;margin:0 0 14px}
h1{font-size:22px;margin:0 0 10px;color:#fff;line-height:1.25}
p{color:#b9b5cc;font-size:14px;line-height:1.6;margin:0 0 12px}
.badge{display:inline-block;padding:6px 12px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:1.5px;margin:0 0 16px}
.armed{background:#2d1b06;border:1px solid #ca8a04;color:#fde68a}
.ok{background:#062a1e;border:1px solid #10b981;color:#6ee7b7}
.bad{background:#2d0a12;border:1px solid #f43f5e;color:#fda4af}
button{width:100%;padding:16px;border-radius:14px;border:none;font-family:inherit;font-size:14px;font-weight:800;letter-spacing:.5px;cursor:pointer;background:linear-gradient(90deg,#00f2ff,#38bdf8);color:#04121a;box-shadow:0 0 24px rgba(0,242,255,.4)}
button:hover{filter:brightness(1.08)}
.mono{font-family:inherit;color:#8b87a0;font-size:12px;margin-top:14px}
</style></head><body><div class="card"><div class="bar"></div><div class="pad">${inner}</div></div></body></html>`;
}

export function renderCheckInPage(sw) {
  const view = publicSwitchView(sw);
  const dueLabel = new Date(view.releasesAt).toUTCString();
  return pageShell(`
    <p class="eyebrow">BITTY BOX / DEAD-MAN SWITCH</p>
    <span class="badge armed">CHECK-IN REQUESTED</span>
    <h1>${escapeHtml(view.boxTitle || 'Untitled Bitty Box')}</h1>
    <p>Confirm you are here to reset the liveness clock. Nothing is released while you keep checking in.</p>
    <p style="color:#fda4af">If you do nothing, your Box releases to <strong>${escapeHtml(view.releasedTo || 'your recipient')}</strong> at ${escapeHtml(dueLabel)}.</p>
    <form method="POST" action="">
      <button type="submit">I'M HERE — CHECK IN NOW</button>
    </form>
    <p class="mono">Switch ${escapeHtml(view.id)} • every ${formatDurationShort(view.intervalMinutes)}${view.graceDisabled ? ' · no grace' : ` + ${formatDurationShort(view.graceMinutes)} grace`}</p>
  `);
}

export function renderCheckInResultPage(sw, { alreadyTriggered } = {}) {
  const view = publicSwitchView(sw);
  if (alreadyTriggered) {
    return pageShell(`
      <p class="eyebrow">BITTY BOX / DEAD-MAN SWITCH</p>
      <span class="badge bad">ALREADY RELEASED</span>
      <h1>This switch has already fired</h1>
      <p>Your check-in was recorded, but the release to the recipient already happened. Re-arm the switch from the editor to start a new cycle.</p>
      <p class="mono">Switch ${escapeHtml(view.id)}</p>
    `);
  }
  const dueLabel = new Date(view.nextDueAt).toUTCString();
  return pageShell(`
    <p class="eyebrow">BITTY BOX / DEAD-MAN SWITCH</p>
    <span class="badge ok">CHECKED IN ✓</span>
    <h1>You're checked in</h1>
    <p>The clock has been reset. We'll email you again when the next check-in is due.</p>
    <p style="color:#6ee7b7">Next check-in due: <strong>${escapeHtml(dueLabel)}</strong></p>
    <p class="mono">Switch ${escapeHtml(view.id)} • every ${formatDurationShort(view.intervalMinutes)}${view.graceDisabled ? ' · no grace' : ` + ${formatDurationShort(view.graceMinutes)} grace`}</p>
  `);
}

export function renderMessagePage({ badge = 'ERROR', tone = 'bad', title, message }) {
  return pageShell(`
    <p class="eyebrow">BITTY BOX / DEAD-MAN SWITCH</p>
    <span class="badge ${tone}">${escapeHtml(badge)}</span>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  `);
}

// ── Router ───────────────────────────────────────────────────────────────────

function tickAuthorized(req) {
  const secret = process.env.BITTYBOX_DEADMAN_TICK_SECRET || '';
  const provided =
    req.headers['x-deadman-tick-secret'] ||
    req.query.secret ||
    (req.body && req.body.secret) ||
    '';
  if (secret) return safeEqual(provided, secret);
  const ip = req.ip || req.connection?.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

export function createDeadmanRouter({ sendEmail } = {}) {
  const router = express.Router();

  router.post('/api/deadman/arm', (req, res) => {
    try {
      const origin = resolveOrigin(req);
      const body = req.body || {};
      const result = armSwitch(body, { origin, sendEmail, sendFirstEmail: body.sendFirstEmail !== false });
      res.json({
        success: true,
        id: result.id,
        checkInUrl: result.checkInUrl,
        checkInToken: result.checkInToken,
        switch: result.switch,
      });
    } catch (err) {
      const status = err.code === 'invalid_creator_email' ? 400 : 500;
      res.status(status).json({ success: false, error: err.message });
    }
  });

  router.get('/api/deadman/status/:id', (req, res) => {
    try {
      const view = getSwitchStatus(req.params.id);
      if (!view) return res.status(404).json({ success: false, error: 'Switch not found' });
      res.json({ success: true, switch: view });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/api/deadman/checkin/:token', (req, res) => {
    try {
      const store = readStore();
      const sw = Object.values(store.switches).find(s => s.token && safeEqual(s.token, req.params.token));
      if (!sw) {
        return res
          .status(404)
          .type('html')
          .send(renderMessagePage({
            badge: 'INVALID LINK',
            tone: 'bad',
            title: 'This check-in link is not recognized',
            message: 'It may have expired or been replaced by a newer link. Use the most recent check-in email you received.',
          }));
      }
      res.type('html').send(renderCheckInPage(sw));
    } catch (err) {
      res.status(500).type('html').send(renderMessagePage({ title: 'Something went wrong', message: err.message }));
    }
  });

  const performCheckIn = (req, res) => {
    try {
      const result = checkInWithToken(req.params.token);
      if (!result.ok) {
        const html = renderMessagePage({
          badge: result.error === 'disarmed' ? 'SWITCH DISARMED' : 'INVALID LINK',
          tone: 'bad',
          title: result.error === 'disarmed' ? 'This switch has been disarmed' : 'This check-in link is not recognized',
          message: result.error === 'disarmed'
            ? 'The creator cancelled this Dead-Man Switch, so no check-in is needed.'
            : 'It may have expired or been replaced by a newer link.',
        });
        // JSON clients get JSON; browsers posting the form get a page.
        if ((req.get('accept') || '').includes('application/json')) {
          return res.status(400).json({ success: false, error: result.error });
        }
        return res.status(400).type('html').send(html);
      }
      if ((req.get('accept') || '').includes('application/json')) {
        return res.json({ success: true, switch: result.switch, alreadyTriggered: result.alreadyTriggered });
      }
      const store = readStore();
      res.type('html').send(renderCheckInResultPage(store.switches[result.switch.id], { alreadyTriggered: result.alreadyTriggered }));
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  router.post('/api/deadman/checkin/:token', performCheckIn);

  router.post('/api/deadman/disarm', (req, res) => {
    try {
      const result = disarmSwitch(req.body || {});
      if (!result.ok) return res.status(404).json({ success: false, error: 'Switch not found' });
      res.json({ success: true, switch: result.switch });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Test hooks — token-authorised, so they only affect the caller's own switch.
  router.post('/api/deadman/test-remind', async (req, res) => {
    try {
      const result = await testRemindSwitch((req.body || {}).token, { origin: resolveOrigin(req), sendEmail });
      if (!result.ok) return res.status(400).json({ success: false, error: result.error });
      res.json({ success: true, delivery: result.delivery, switch: result.switch });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/api/deadman/test-fire', async (req, res) => {
    try {
      const result = await testFireSwitch((req.body || {}).token, { origin: resolveOrigin(req), sendEmail });
      if (!result.ok) return res.status(400).json({ success: false, error: result.error });
      res.json({
        success: true,
        alreadyTriggered: Boolean(result.alreadyTriggered),
        delivery: result.delivery,
        switch: result.switch,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  const tickHandler = async (req, res) => {
    if (!tickAuthorized(req)) return res.status(403).json({ success: false, error: 'Forbidden' });
    try {
      const summary = await runDeadmanTick({ origin: resolveOrigin(req), sendEmail });
      res.json({ success: true, ...summary, tickedAt: nowIso() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  router.all('/api/deadman/tick', tickHandler);

  return router;
}

// Non-blocking internal scheduler. The n8n cron workflow is the visible control
// plane; this keeps switches advancing even if the workflow is paused. The
// default cadence is one minute so minute-level switches are honoured; override
// with BITTYBOX_DEADMAN_TICK_MS (minimum 1000 ms).
let _scheduler = null;
export function startDeadmanScheduler({ intervalMs } = {}) {
  if (_scheduler) return _scheduler;
  const envMs = Number(process.env.BITTYBOX_DEADMAN_TICK_MS);
  const every =
    Number.isFinite(intervalMs) && intervalMs > 0
      ? intervalMs
      : Number.isFinite(envMs) && envMs >= 1000
        ? envMs
        : 60 * 1000;
  const run = () => {
    runDeadmanTick({}).catch(err => console.error('[deadman] scheduler tick failed:', err.message));
  };
  _scheduler = setInterval(run, every);
  if (_scheduler.unref) _scheduler.unref();
  setTimeout(run, 20 * 1000).unref?.();
  console.log(`[deadman] scheduler armed (every ${Math.round(every / 1000)}s)`);
  return _scheduler;
}
