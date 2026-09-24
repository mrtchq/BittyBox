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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, h1, a, span { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#06070a;color:#ede4d3;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escapeHtml(title)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#06070a;padding:36px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#0e1118;border:1px solid #202634;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.65),0 0 28px rgba(201,24,59,0.12)">
        <tr><td style="height:4px;background:#c9183b;background:linear-gradient(90deg,#c9183b 0%,#dfc291 50%,#8a0e23 100%)"></td></tr>
        <tr><td style="padding:28px 32px 10px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px">
            <tr>
              <td valign="middle" style="width:36px">
                <img src="https://bittybox.org/bittybox-header-mark.png" alt="Bitty Box" width="32" height="32" style="display:block;border:0;border-radius:6px">
              </td>
              <td valign="middle" style="padding-left:10px">
                <span style="display:block;font-family:'Cinzel','Playfair Display',Georgia,serif;font-size:15px;font-weight:800;letter-spacing:2px;color:#faf7f2;line-height:1.2">BITTYBOX</span>
                <span style="display:block;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:9px;font-weight:600;letter-spacing:1.6px;color:#dfc291;line-height:1.2;margin-top:2px">URL-NATIVE MICRO-WEB</span>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#dfc291;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">${escapeHtml(eyebrow)}</p>
          <p style="display:inline-block;margin:16px 0 14px;padding:6px 14px;border:1px solid rgba(201,24,59,0.45);border-radius:999px;color:#fb7185;background-color:#250911;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">${escapeHtml(badge)}</p>
          <h1 style="margin:0 0 14px;color:#faf7f2;font-family:'Cinzel','Playfair Display',Georgia,serif;font-size:25px;line-height:1.25;font-weight:700;letter-spacing:-0.01em">${escapeHtml(title)}</h1>
        </td></tr>
        <tr><td style="padding:4px 32px 28px;color:#ede4d3;font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
        ${footerNote ? `<tr><td style="padding:18px 32px 22px;border-top:1px solid #1c222e;background-color:#090b10"><p style="margin:0;color:#847a6b;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;line-height:1.55">${footerNote}</p></td></tr>` : ''}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buttonHtml(href, label) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:14px 0 10px"><tr><td align="center" style="border-radius:8px;background-color:#b01431;background-image:linear-gradient(135deg,#c9183b 0%,#8a0e23 55%,#470611 100%);border:1px solid rgba(246,241,230,0.28);box-shadow:0 6px 20px rgba(176,20,49,0.38)"><a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;border-radius:8px;color:#faf7f2;font-family:'JetBrains Mono','DM Mono',Menlo,Consolas,monospace;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase">${escapeHtml(label)}</a></td></tr></table>`;
}

export async function sendCheckInEmail(sw, { origin, sendEmail } = {}) {
  const send = sendEmail || defaultSendEmail;
  const checkInUrl = `${origin}/api/deadman/checkin/${sw.token || ''}`;
  const due = new Date(computeDeadlines(sw).fireMs).toISOString();
  const dueLabel = new Date(due).toUTCString();
  const title = 'Check in to keep your Dead-Man Switch armed';
  const bodyHtml = `
    <p style="margin:0 0 14px">Hello,</p>
    <p style="margin:0 0 14px">Your Bitty Box dead-man switch <strong style="color:#faf7f2">${escapeHtml(sw.boxTitle || 'Untitled Bitty Box')}</strong> is due for a liveness check-in. If you do not check in, your archived Box will be released to <strong style="color:#faf7f2">${escapeHtml(sw.recipientEmail || 'your recipient')}</strong>.</p>
    <div style="margin:0 0 18px;background-color:#190e13;border:1px solid rgba(201,24,59,0.35);border-left:3px solid #e11d48;border-radius:8px;padding:12px 16px"><p style="margin:0;color:#fb7185;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:12px;font-weight:700;letter-spacing:0.5px">RELEASE DUE: ${escapeHtml(dueLabel)} IF UNCONFIRMED</p></div>
    ${buttonHtml(checkInUrl, "I'M HERE — CHECK IN NOW")}
    <p style="margin:16px 0 0;color:#847a6b;font-size:12px;line-height:1.5">One tap is all it takes. This link is a secret: anyone who has it can check in on your behalf.</p>`;
  const html = shellHtml({
    eyebrow: 'BITTY BOX / DEAD-MAN SWITCH',
    badge: 'CHECK-IN REQUIRED',
    title,
    bodyHtml,
    footerNote: 'You are receiving this because you armed a Dead-Man Switch on bittybox.org. Checking in resets the clock; nothing is released while you are active. Only trust notifications from support@bittybox.org.',
  });
  const text = `BITTY BOX / DEAD-MAN SWITCH\n\n${title}\n\nYour switch "${sw.boxTitle || 'Untitled Bitty Box'}" is due for a liveness check-in.\n\nIf you do not check in, it releases to ${sw.recipientEmail || 'your recipient'} at ${dueLabel}.\n\nCHECK IN NOW:\n${checkInUrl}\n\nThis link is secret; anyone with it can check in on your behalf. Only trust notifications from support@bittybox.org.`;
  return send({ to: sw.creatorEmail, subject: `Check in: “${sw.boxTitle || 'Bitty Box'}” dead-man switch`, html, text, replyTo: 'support@bittybox.org' });
}

export async function sendReleaseEmail(sw, { origin, sendEmail } = {}) {
  const send = sendEmail || defaultSendEmail;
  const boxUrl = sw.boxUrl || '';
  const title = 'A Bitty Box has been released to you';
  const bodyHtml = `
    <p style="margin:0 0 14px">Hello ${escapeHtml(sw.recipientName || 'there')},</p>
    <p style="margin:0 0 14px">You have been designated as the recipient of a Dead-Man Switch on Bitty Box. The creator stopped checking in, so the switch has fired and the following Box is now released to you.</p>
    <p style="margin:0 0 14px;color:#faf7f2;font-size:17px;font-weight:700">${escapeHtml(sw.boxTitle || 'Untitled Bitty Box')}</p>
    ${boxUrl ? buttonHtml(boxUrl, 'OPEN THE RELEASED BITTY BOX') : ''}
    ${sw.note ? `<div style="margin:16px 0 0;background-color:#12151d;border:1px solid #202634;border-left:3px solid #c9183b;border-radius:8px;padding:14px 18px"><p style="margin:0 0 6px;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#fb7185;text-transform:uppercase">Message from the creator</p><p style="margin:0;color:#ede4d3;font-style:italic;line-height:1.55">&ldquo;${escapeHtml(sw.note)}&rdquo;</p></div>` : ''}
    <p style="margin:18px 0 0;color:#847a6b;font-size:12px;line-height:1.5">Delivered automatically by the Bitty Box Dead-Man Switch. The switch fired at ${escapeHtml(sw.triggeredAt || nowIso())}.</p>`;
  const html = shellHtml({
    eyebrow: 'BITTY BOX / DEAD-MAN SWITCH',
    badge: 'RELEASED',
    title,
    bodyHtml,
    footerNote: 'This message was sent because a Dead-Man Switch stopped receiving check-ins. If this is unexpected, contact the creator at support@bittybox.org.',
  });
  const text = `BITTY BOX / DEAD-MAN SWITCH\n\n${title}\n\nHello ${sw.recipientName || 'there'},\n\n${sw.boxTitle || 'Untitled Bitty Box'} has been released to you.\n\n${boxUrl ? `Open it here:\n${boxUrl}\n\n` : ''}${sw.note ? `Message from the creator:\n"${sw.note}"\n\n` : ''}The switch fired at ${sw.triggeredAt || nowIso()}.\n\nSent securely via Bitty Box Support (support@bittybox.org).`;
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

function pageShell(inner, { footer = '', title = '' } = {}) {
  const pageTitle = title ? `${escapeHtml(title)} • Bitty Box` : 'Bitty Box • Dead-Man Switch';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>${pageTitle}</title>
  <link rel="icon" href="/favicon.png">
  <meta name="color-scheme" content="dark">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: dark;
      --bg-void: #06070a;
      --panel-card: rgba(14, 17, 24, 0.95);
      --cream-pure: #faf7f2;
      --cream-silk: #f4eee3;
      --cream-soft: #ede4d3;
      --cream-muted: #b8ab96;
      --cream-dim: #847a6b;
      --champagne: #dfc291;
      --champagne-glow: rgba(223, 194, 145, 0.35);
      --crimson-regal: #8a0e23;
      --crimson-velvet: #b01431;
      --crimson-vivid: #c9183b;
      --crimson-bright: #e11d48;
      --crimson-rose: #fb7185;
      --crimson-deep: #470611;
      --crimson-glow: rgba(201, 24, 59, 0.45);
      --font-display: 'Cinzel', 'Playfair Display', Georgia, serif;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', 'DM Mono', Menlo, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      min-height: 100vh;
      min-height: 100dvh;
      background-color: var(--bg-void);
      background-image:
        radial-gradient(circle at 50% 0%, rgba(201, 24, 59, 0.18) 0%, transparent 55%),
        radial-gradient(circle at 85% 85%, rgba(223, 194, 145, 0.05) 0%, transparent 45%),
        radial-gradient(ellipse at 50% 100%, #06070a 0%, #020204 100%),
        linear-gradient(rgba(244, 238, 227, 0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(244, 238, 227, 0.025) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 100% 100%, 48px 48px, 48px 48px;
      color: var(--cream-soft);
      font-family: var(--font-sans);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .card {
      width: 100%;
      max-width: 560px;
      border-radius: 16px;
      background: var(--panel-card);
      border: 1px solid rgba(246, 241, 230, 0.12);
      box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.85), 0 0 35px rgba(201, 24, 59, 0.12), inset 0 1px 0 rgba(244, 238, 227, 0.16);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      overflow: hidden;
      position: relative;
    }
    .bar {
      height: 4px;
      background: linear-gradient(90deg, #c9183b 0%, #dfc291 50%, #8a0e23 100%);
    }
    .pad {
      padding: 28px 32px 28px;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 22px;
      padding-bottom: 18px;
      border-bottom: 1px solid rgba(246, 241, 230, 0.08);
    }
    .brand-logo {
      display: block;
      width: 34px;
      height: 34px;
      border-radius: 7px;
      border: 1px solid rgba(246, 241, 230, 0.16);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }
    .brand-name {
      display: block;
      font-family: var(--font-display);
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 2px;
      color: var(--cream-pure);
      line-height: 1.2;
    }
    .brand-tag {
      display: block;
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 1.6px;
      color: var(--champagne);
      line-height: 1.2;
      margin-top: 2px;
    }
    .eyebrow {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--champagne);
      text-transform: uppercase;
      margin: 0 0 14px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 14px;
      border-radius: 999px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin: 0 0 16px;
    }
    .badge.armed {
      background: #250911;
      border: 1px solid rgba(201, 24, 59, 0.45);
      color: var(--crimson-rose);
      box-shadow: 0 0 14px rgba(201, 24, 59, 0.2);
    }
    .badge.ok {
      background: #062a1e;
      border: 1px solid rgba(16, 185, 129, 0.45);
      color: #6ee7b7;
      box-shadow: 0 0 14px rgba(16, 185, 129, 0.2);
    }
    .badge.bad {
      background: #250911;
      border: 1px solid rgba(225, 29, 72, 0.45);
      color: #fda4af;
      box-shadow: 0 0 14px rgba(225, 29, 72, 0.2);
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 8px currentColor;
    }
    h1 {
      font-family: var(--font-display);
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.01em;
      line-height: 1.25;
      color: var(--cream-pure);
      margin: 0 0 14px;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
      text-wrap: balance;
    }
    p {
      font-size: 14.5px;
      line-height: 1.65;
      color: var(--cream-soft);
      margin: 0 0 14px;
      text-wrap: pretty;
    }
    .alert-box {
      background-color: #190e13;
      border: 1px solid rgba(201, 24, 59, 0.35);
      border-left: 3px solid var(--crimson-bright);
      border-radius: 8px;
      padding: 14px 18px;
      margin: 18px 0 22px;
    }
    .alert-box.ok-box {
      background-color: #0c1c16;
      border-color: rgba(16, 185, 129, 0.35);
      border-left: 3px solid #10b981;
    }
    .alert-label {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: var(--crimson-rose);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .ok-box .alert-label {
      color: #6ee7b7;
    }
    .alert-value {
      font-family: var(--font-mono);
      font-size: 13.5px;
      font-weight: 700;
      color: var(--cream-pure);
    }
    button, .primary-btn {
      width: 100%;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 16px 28px;
      background: linear-gradient(135deg, #c9183b 0%, #8a0e23 55%, #470611 100%);
      color: var(--cream-pure);
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      text-decoration: none;
      border-radius: 8px;
      border: 1px solid rgba(246, 241, 230, 0.28);
      box-shadow: 0 6px 24px rgba(176, 20, 49, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.25);
      cursor: pointer;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, border-color 0.25s ease;
      overflow: hidden;
    }
    button::before, .primary-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 20%, rgba(250, 247, 242, 0.28) 50%, transparent 80%);
      transform: translateX(-120%);
      transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
    }
    button:hover::before, .primary-btn:hover::before {
      transform: translateX(120%);
    }
    button:hover, .primary-btn:hover {
      background: linear-gradient(135deg, #e11d48 0%, #b01431 50%, #6e091b 100%);
      border-color: var(--cream-pure);
      transform: translateY(-2px);
      box-shadow: 0 10px 32px rgba(225, 29, 72, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.2);
    }
    button:active, .primary-btn:active {
      transform: scale(0.96);
    }
    .card-footer {
      padding: 16px 32px 18px;
      border-top: 1px solid #1c222e;
      background-color: #090b10;
    }
    .mono {
      font-family: var(--font-mono);
      color: var(--cream-dim);
      font-size: 11.5px;
      line-height: 1.55;
      margin: 0;
    }
    .mono strong {
      color: var(--cream-muted);
    }
    .site-nav {
      margin-top: 22px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .site-link {
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: var(--champagne);
      text-decoration: none;
      transition: color 0.2s ease, transform 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .site-link:hover {
      color: var(--cream-pure);
      transform: translateY(-1px);
    }
    @media (max-width: 480px) {
      .pad { padding: 22px 20px; }
      .card-footer { padding: 14px 20px; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="bar"></div>
    <div class="pad">
      <div class="brand-row">
        <img class="brand-logo" src="https://bittybox.org/bittybox-header-mark.png" alt="Bitty Box" width="34" height="34">
        <div>
          <span class="brand-name">BITTYBOX</span>
          <span class="brand-tag">URL-NATIVE MICRO-WEB</span>
        </div>
      </div>
      ${inner}
    </div>
    ${footer ? `<div class="card-footer">${footer}</div>` : ''}
  </div>
  <div class="site-nav">
    <a class="site-link" href="https://bittybox.org/">← Return to bittybox.org</a>
    <span style="color:#202634">•</span>
    <a class="site-link" href="https://bittybox.org/editor">Open Editor ↗</a>
  </div>
</body>
</html>`;
}

export function renderCheckInPage(sw) {
  const view = publicSwitchView(sw);
  const dueLabel = new Date(view.releasesAt).toUTCString();
  const inner = `
    <p class="eyebrow">LIVENESS CONFIRMATION</p>
    <div class="badge armed"><span class="badge-dot"></span>CHECK-IN REQUESTED</div>
    <h1>${escapeHtml(view.boxTitle || 'Untitled Bitty Box')}</h1>
    <p>Confirm your presence to reset the liveness clock. Your archived Box remains securely sealed as long as you maintain scheduled check-ins.</p>
    <div class="alert-box">
      <div class="alert-label">Release Due If Unconfirmed</div>
      <div class="alert-value">${escapeHtml(dueLabel)}</div>
      <p style="margin:8px 0 0;font-size:12.5px;color:#fb7185">Recipient: <strong style="color:#faf7f2">${escapeHtml(view.releasedTo || 'Designated Recipient')}</strong></p>
    </div>
    <form method="POST" action="" onsubmit="const b=this.querySelector('button');if(b){setTimeout(()=>b.innerText='CONFIRMING PULSE...',50);}">
      <button type="submit" class="primary-btn">I'M HERE — CHECK IN NOW</button>
    </form>
  `;
  const footer = `
    <p class="mono">Switch <strong>${escapeHtml(view.id)}</strong> • Cadence: every <strong>${formatDurationShort(view.intervalMinutes)}</strong>${view.graceDisabled ? ' · no grace' : ` + <strong>${formatDurationShort(view.graceMinutes)}</strong> grace`}</p>
  `;
  return pageShell(inner, { footer, title: `${view.boxTitle || 'Bitty Box'} • Dead-Man Switch Check-In` });
}

export function renderCheckInResultPage(sw, { alreadyTriggered } = {}) {
  const view = publicSwitchView(sw);
  if (alreadyTriggered) {
    const inner = `
      <p class="eyebrow">DEAD-MAN SWITCH STATUS</p>
      <div class="badge bad"><span class="badge-dot"></span>ALREADY RELEASED</div>
      <h1>Switch Has Fired</h1>
      <p>Your check-in was acknowledged and recorded to the audit trail, but the release grace window had already elapsed. The capsule was dispatched to the designated recipient.</p>
      <div class="alert-box">
        <div class="alert-label">Status</div>
        <div class="alert-value">Released to Recipient</div>
        <p style="margin:8px 0 0;font-size:12.5px;color:#fda4af">To initiate a new monitoring cycle, re-arm the switch from the Bitty Box editor.</p>
      </div>
      <a href="https://bittybox.org/editor" class="primary-btn">OPEN BITTY BOX EDITOR ↗</a>
    `;
    const footer = `
      <p class="mono">Switch <strong>${escapeHtml(view.id)}</strong></p>
    `;
    return pageShell(inner, { footer, title: 'Dead-Man Switch • Released' });
  }

  const dueLabel = new Date(view.nextDueAt).toUTCString();
  const inner = `
    <p class="eyebrow">LIVENESS CONFIRMED</p>
    <div class="badge ok"><span class="badge-dot"></span>CHECKED IN ✓</div>
    <h1>You're Checked In</h1>
    <p>Your liveness pulse has been verified and the countdown timer has reset to a full cycle. Your sealed Box remains safe and untouched.</p>
    <div class="alert-box ok-box">
      <div class="alert-label">Next Check-In Due</div>
      <div class="alert-value">${escapeHtml(dueLabel)}</div>
      <p style="margin:8px 0 0;font-size:12.5px;color:#a7f3d0">We will email you another secret one-tap link when your next check-in approaches.</p>
    </div>
    <a href="https://bittybox.org/editor" class="primary-btn">RETURN TO EDITOR ↗</a>
  `;
  const footer = `
    <p class="mono">Switch <strong>${escapeHtml(view.id)}</strong> • Cadence: every <strong>${formatDurationShort(view.intervalMinutes)}</strong>${view.graceDisabled ? ' · no grace' : ` + <strong>${formatDurationShort(view.graceMinutes)}</strong> grace`}</p>
  `;
  return pageShell(inner, { footer, title: 'Checked In • Dead-Man Switch' });
}

export function renderMessagePage({ badge = 'ERROR', tone = 'bad', title, message }) {
  const badgeClass = tone === 'ok' ? 'ok' : (tone === 'armed' ? 'armed' : 'bad');
  const inner = `
    <p class="eyebrow">BITTY BOX / DEAD-MAN SWITCH</p>
    <div class="badge ${badgeClass}"><span class="badge-dot"></span>${escapeHtml(badge)}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <div style="margin-top: 24px;">
      <a href="https://bittybox.org/" class="primary-btn">GO TO BITTYBOX.ORG ↗</a>
    </div>
  `;
  return pageShell(inner, { title: `${title} • Bitty Box` });
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
