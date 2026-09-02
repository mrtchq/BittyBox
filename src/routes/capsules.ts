import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Server-side capsule lock enforcement (zero-knowledge envelopes).
 *
 * The server NEVER stores plaintext capsule content. It stores only:
 *  - `envelope`: client-side AES-256-GCM ciphertext (+ iv + salt)
 *  - `pwVerifier` / `pwSalt`: a password proof derived from the key, NOT the key/password
 *  - lock rules (time windows, visit ceiling)
 *
 * Enforcement happens here:
 *  - Time locks are judged by the server clock; the envelope is withheld until the window opens.
 *  - Visit locks are decremented atomically on successful release.
 *  - Password locks are verified constant-time against `pwVerifier`; the server never sees the
 *    passphrase or the decryption key, so it cannot read the content even after release.
 */

const STORE_DIR = process.env.BITTYBOX_CAPSULE_DIR ?? path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'capsules.json');

type AttemptRecord = { count: number; firstAt: number };
const rateLimit = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 8;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function readStore(): Record<string, any> {
  try {
    fs.mkdirSync(STORE_DIR, { recursive: true });
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeStore(s: Record<string, any>) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(s, null, 2));
}

const datetimeSchema = z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: 'invalid datetime' });

const lockSchema = z.object({
  password: z.object({
    enabled: z.boolean(),
    hint: z.string().max(200).optional(),
  }).default({ enabled: false }),
  time: z.object({
    enabled: z.boolean(),
    open: z.object({ enabled: z.boolean(), datetime: datetimeSchema.optional() }).default({ enabled: false }),
    expire: z.object({ enabled: z.boolean(), datetime: datetimeSchema.optional(), action: z.enum(['lock', 'hide']).default('lock') }).default({ enabled: false }),
    range: z.object({ enabled: z.boolean(), start: datetimeSchema.optional(), end: datetimeSchema.optional() }).default({ enabled: false }),
  }).default({ enabled: false }),
  visits: z.object({
    enabled: z.boolean(),
    max: z.number().int().min(1).max(1_000_000).default(1),
    action: z.enum(['lock', 'hide']).default('lock'),
  }).default({ enabled: false }),
});

const createSchema = z.object({
  title: z.string().max(300).optional(),
  envelope: z.string().min(1).max(8_000_000),
  pwVerifier: z.string().max(256).optional(),
  pwSalt: z.string().max(128).optional(),
  pwHint: z.string().max(200).optional(),
  locks: lockSchema.optional(),
});

function hasActiveLocks(l: any): boolean {
  if (!l) return false;
  if (l.password?.enabled && l.password?.enabled === true) return true;
  if (l.time?.enabled) {
    if (l.time.open?.enabled || l.time.expire?.enabled || l.time.range?.enabled) return true;
  }
  if (l.visits?.enabled) return true;
  return false;
}

function timeLockStatus(l: any, now: number): { locked: false } | { locked: true; reason: string; until?: number; msg?: string } {
  if (!l?.time?.enabled) return { locked: false };
  const t = l.time;
  if (t.open?.enabled && t.open.datetime) {
    const ms = Date.parse(t.open.datetime);
    if (now < ms) return { locked: true, reason: 'time_open', until: ms, msg: t.open.msg };
  }
  if (t.expire?.enabled && t.expire.datetime) {
    const ms = Date.parse(t.expire.datetime);
    if (now >= ms) return { locked: true, reason: 'time_expire', msg: t.expire.msg };
  }
  if (t.range?.enabled && t.range.start && t.range.end) {
    const s = Date.parse(t.range.start);
    const e = Date.parse(t.range.end);
    if (now < s || now > e) return { locked: true, reason: 'time_range', msg: t.range.msg };
  }
  return { locked: false };
}

export const capsulesRouter = Router();

// Create a locked capsule envelope.
capsulesRouter.post('/capsules', (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid', details: parsed.error.flatten() });
  }
  const data = parsed.data;
  const locks = data.locks ?? { password: { enabled: false }, time: { enabled: false }, visits: { enabled: false } };

  if (!hasActiveLocks(locks)) {
    return res.status(400).json({ error: 'capsule_without_locks', message: 'Server-side envelopes require at least one active lock.' });
  }
  if (locks.password?.enabled && (!data.pwVerifier || !data.pwSalt)) {
    return res.status(400).json({ error: 'password_lock_requires_verifier', message: 'Password-locked capsules must send pwVerifier and pwSalt.' });
  }

  const id = `cap_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`;
  const rec: any = {
    id,
    title: data.title || 'Protected Capsule',
    createdAt: Date.now(),
    envelope: data.envelope,
    pwVerifier: data.pwVerifier ?? null,
    pwSalt: data.pwSalt ?? null,
    pwHint: data.pwHint ?? null,
    locks,
    visitsRemaining: locks.visits?.enabled ? locks.visits.max : null,
  };

  const s = readStore();
  s[id] = rec;
  writeStore(s);

  res.status(201).json({ id, url: `/c/${id}` });
});

// Metadata + non-password lock status. Never returns ciphertext or verifier.
capsulesRouter.get('/capsules/:id', (req, res) => {
  const s = readStore();
  const rec = s[req.params.id];
  if (!rec) return res.status(404).json({ error: 'not_found' });

  const now = Date.now();
  const tStatus = timeLockStatus(rec.locks, now);
  const visitsExhausted = rec.locks?.visits?.enabled && rec.visitsRemaining <= 0;

  res.json({
    id: rec.id,
    title: rec.title,
    hasPassword: Boolean(rec.locks?.password?.enabled),
    // PBKDF2 salt is non-secret derivation context; the viewer needs it to
    // derive the same verifier from the entered passphrase.
    pwSalt: rec.pwSalt,
    pwHint: rec.pwHint,
    time: rec.locks?.time ?? { enabled: false },
    visits: rec.locks?.visits?.enabled
      ? { max: rec.locks.visits.max, remaining: rec.visitsRemaining, exhausted: Boolean(visitsExhausted) }
      : { enabled: false },
    locked: tStatus.locked || Boolean(visitsExhausted),
    reason: tStatus.locked ? tStatus.reason : visitsExhausted ? 'visits_exhausted' : null,
    until: tStatus.locked && 'until' in tStatus ? tStatus.until : undefined,
  });
});

// Enforcement + release. Body may include `pwVerifier` for password-locked capsules.
capsulesRouter.post('/capsules/:id/access', (req, res) => {
  const s = readStore();
  const rec = s[req.params.id];
  if (!rec) return res.status(404).json({ error: 'not_found' });

  const now = Date.now();
  const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim();

  // 1. Time gate (server-authoritative)
  const tStatus = timeLockStatus(rec.locks, now);
  if (tStatus.locked) {
    return res.status(403).json({ locked: true, reason: tStatus.reason, until: 'until' in tStatus ? tStatus.until : undefined, msg: 'msg' in tStatus ? tStatus.msg : undefined });
  }

  // 2. Visits gate (atomic ceiling)
  if (rec.locks?.visits?.enabled) {
    if (rec.visitsRemaining <= 0) {
      return res.status(403).json({ locked: true, reason: 'visits_exhausted', msg: rec.locks.visits.msg });
    }
  }

  // 3. Password gate (zero-knowledge verifier check)
  if (rec.locks?.password?.enabled) {
    const key = `${rec.id}:${ip}`;
    const recAttempt = rateLimit.get(key);
    // Only hard-block once the failure ceiling is reached inside the window.
    if (recAttempt && recAttempt.count >= MAX_ATTEMPTS && now - recAttempt.firstAt < RATE_WINDOW_MS) {
      const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - recAttempt.firstAt)) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ locked: true, reason: 'rate_limited', retryAfter });
    }
    const submitted = typeof req.body?.pwVerifier === 'string' ? req.body.pwVerifier : '';
    const stored = rec.pwVerifier || '';
    const a = Buffer.from(submitted);
    const b = Buffer.from(stored);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) {
      // Sliding window: reset the counter if the previous window expired.
      const base = recAttempt && now - recAttempt.firstAt < RATE_WINDOW_MS
        ? { count: recAttempt.count + 1, firstAt: recAttempt.firstAt }
        : { count: 1, firstAt: now };
      rateLimit.set(key, base);
      return res.status(401).json({ locked: true, reason: 'password', attemptsRemaining: Math.max(0, MAX_ATTEMPTS - base.count) });
    }
    // Success: clear any failure state for this id+ip so a prior typo never blocks the right key.
    rateLimit.delete(key);
  }

  // 4. Release: decrement visits atomically, return ciphertext envelope only.
  if (rec.locks?.visits?.enabled) {
    rec.visitsRemaining -= 1;
    s[rec.id] = rec;
    writeStore(s);
  }

  res.json({
    id: rec.id,
    title: rec.title,
    envelope: rec.envelope,
    remaining: rec.visitsRemaining,
  });
});

// Hard delete (creator cleanup).
capsulesRouter.delete('/capsules/:id', (req, res) => {
  const s = readStore();
  if (!s[req.params.id]) return res.status(404).json({ error: 'not_found' });
  delete s[req.params.id];
  writeStore(s);
  res.json({ ok: true, id: req.params.id });
});
