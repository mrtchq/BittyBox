// ─────────────────────────────────────────────────────────────────────────────
// lib/policy-evaluator.js
// Policy evaluation engine for Bitty Box locked content.
//
// Evaluates a box's lockConfig against a viewer context and returns:
//   { ok, deniedCodes, sessionGrant?, reason? }
//
// Session grants are opaque tokens the serving layer can use to allow a single
// payload delivery within a TTL. They are NOT passwords and carry no box
// content.
//
// Audit events are emitted for every evaluation (allow or deny). The audit is
// best-effort: it tries account-store.recordUnlockEvent but degrades silently
// if that module is unavailable, so this module never becomes a hard
// dependency that can crash the host server on import.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Hash helpers — salted, one-way, SHA-256. No raw password handling here;
// password verification is delegated to the verifier object.
// ─────────────────────────────────────────────────────────────────────────────

function hashEmail(email) {
  if (!email) return null;
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function hashUserAgent(ua) {
  if (!ua) return null;
  return crypto.createHash('sha256').update(ua).digest('hex');
}

function hashSessionKey(ip, userAgent) {
  return crypto.createHash('sha256').update((ip || '0.0.0.0') + '|' + (userAgent || '')).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// KDF / password verification.
//   - Existing boxes: pbkdf2-sha256 (matches smoke-test verifier format).
//   - New boxes: prefer argon2id if installed, else pbkdf2-sha256 @ 600k.
// ─────────────────────────────────────────────────────────────────────────────

let argon2 = null;
try {
  argon2 = await import('argon2');
} catch (e) {
  argon2 = null; // pbkdf2 fallback for new boxes
}

const DEFAULT_NEW_BOX_ITERATIONS = 600000;

function verifyPasswordWithPbkdf2(password, verifier) {
  if (verifier.algorithm !== 'pbkdf2-sha256') return false;
  try {
    const derived = crypto.pbkdf2Sync(
      password,
      Buffer.from(verifier.salt, 'base64'),
      verifier.iterations,
      32,
      'sha256'
    );
    const stored = Buffer.from(verifier.hash, 'base64');
    if (derived.length !== stored.length) return false;
    return crypto.timingSafeEqual(derived, stored);
  } catch (e) {
    return false;
  }
}

function verifyPasswordWithArgon2(password, verifier) {
  if (!argon2 || verifier.algorithm !== 'argon2id') return false;
  try {
    return argon2.verify(verifier.hash, password);
  } catch (e) {
    return false;
  }
}

/**
 * Verify a password against a lockConfig.password.verifier.
 * Supports pbkdf2-sha256 (existing format) and argon2id (new format).
 */
export function verifyPassword(password, passwordConfig) {
  if (!password || !passwordConfig || !passwordConfig.enabled) return false;
  const v = passwordConfig.verifier;
  if (!v) return false;
  if (v.algorithm === 'argon2id') return verifyPasswordWithArgon2(password, v);
  return verifyPasswordWithPbkdf2(password, v);
}

/**
 * Create a verifier object for a new password-locked box.
 * Prefers argon2id; falls back to pbkdf2-sha256 at DEFAULT_NEW_BOX_ITERATIONS.
 * ASYNC (argon2.hash is async). Callers MUST await.
 */
export async function createPasswordVerifier(plaintextPassword, opts = {}) {
  const { algorithm = argon2 ? 'argon2id' : 'pbkdf2-sha256', iterations = DEFAULT_NEW_BOX_ITERATIONS, hint = '' } = opts;

  if (algorithm === 'argon2id' && argon2) {
    const salt = crypto.randomBytes(16);
    const argonHash = await argon2.hash(plaintextPassword, {
      type: argon2.argon2id,
      salt,
      hashLength: 32,
      timeCost: 3,
      memoryCost: 65536,
      parallelism: 1,
    });
    return {
      algorithm: 'argon2id',
      salt: salt.toString('base64'),
      hash: argonHash,
      timeCost: 3,
      memoryCost: 65536,
      parallelism: 1,
      hint,
    };
  }

  // pbkdf2-sha256 fallback (primary path on this VPS — no argon2 installed)
  const salt = crypto.randomBytes(18);
  const derived = crypto.pbkdf2Sync(plaintextPassword, salt, iterations, 32, 'sha256');
  return {
    algorithm: 'pbkdf2-sha256',
    iterations,
    salt: salt.toString('base64'),
    hash: derived.toString('base64'),
    hint,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Time window evaluation
// ─────────────────────────────────────────────────────────────────────────────

function evaluateTimeWindow(config) {
  if (!config || !config.enabled) return { ok: true, deniedCodes: [] };

  const now = new Date();
  const notBefore = config.notBefore ? new Date(config.notBefore) : null;
  const notAfter = config.notAfter ? new Date(config.notAfter) : null;

  const denied = [];
  if (notBefore && isNaN(notBefore.getTime())) return { ok: false, deniedCodes: ['invalid_not_before'] };
  if (notAfter && isNaN(notAfter.getTime())) return { ok: false, deniedCodes: ['invalid_not_after'] };

  if (notBefore && now < notBefore) denied.push('too_early');
  if (notAfter && now > notAfter) denied.push('expired');

  return { ok: denied.length === 0, deniedCodes: denied };
}

// ─────────────────────────────────────────────────────────────────────────────
// Open limit (per-box) evaluation
// ─────────────────────────────────────────────────────────────────────────────

function evaluateOpenLimit(config, currentOpensUsed) {
  if (!config || !config.enabled) return { ok: true, deniedCodes: [], currentOpensUsed };

  const max = config.maxOpens;
  if (max == null || max < 1) return { ok: false, deniedCodes: ['invalid_max_opens'], currentOpensUsed };

  if (currentOpensUsed >= max) {
    return { ok: false, deniedCodes: ['open_limit_reached'], currentOpensUsed };
  }
  return { ok: true, deniedCodes: [], currentOpensUsed };
}

// ─────────────────────────────────────────────────────────────────────────────
// Session open limit (per-session) — NEW rule type for per-session caps.
// ─────────────────────────────────────────────────────────────────────────────

function evaluateSessionOpenLimit(config, sessionOpenCount) {
  if (!config || !config.enabled) return { ok: true, deniedCodes: [], sessionOpenCount };

  const max = config.maxSessionOpens;
  if (max == null || max < 1) return { ok: false, deniedCodes: ['invalid_max_session_opens'], sessionOpenCount };

  if (sessionOpenCount >= max) {
    return { ok: false, deniedCodes: ['session_open_limit_reached'], sessionOpenCount };
  }
  return { ok: true, deniedCodes: [], sessionOpenCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// Invite-only evaluation
// ─────────────────────────────────────────────────────────────────────────────

function evaluateInviteOnly(config, emailHash) {
  if (!config || !config.enabled) return { ok: true, deniedCodes: [] };
  if (!config.allowedEmailHashes || config.allowedEmailHashes.length === 0) {
    return { ok: false, deniedCodes: ['no_invited_emails'] };
  }
  if (!emailHash) {
    return { ok: false, deniedCodes: ['not_invited'] };
  }
  for (const allowed of config.allowedEmailHashes) {
    try {
      if (crypto.timingSafeEqual(Buffer.from(emailHash, 'hex'), Buffer.from(allowed, 'hex'))) {
        return { ok: true, deniedCodes: [] };
      }
    } catch (e) {
      // hash format mismatch — skip
    }
  }
  return { ok: false, deniedCodes: ['not_invited'] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Session grant — issued on successful unlock to allow payload delivery.
// ─────────────────────────────────────────────────────────────────────────────

export function createSessionGrant(boxId, sessionId, ttlSeconds = 60) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const token = crypto.randomBytes(32).toString('hex');
  return {
    boxId,
    sessionId,
    token,
    issuedAt: new Date().toISOString(),
    expiresAt,
    ttlSeconds,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit emission (best-effort, never throws)
// ─────────────────────────────────────────────────────────────────────────────

let _auditWarned = false;
function emitAudit(boxId, event) {
  import('./account-store.js')
    .then(({ recordUnlockEvent }) => {
      if (typeof recordUnlockEvent === 'function') recordUnlockEvent(boxId, event);
    })
    .catch(() => {
      if (!_auditWarned) {
        _auditWarned = true;
        console.warn('[policy-evaluator] account-store audit unavailable; box-local audit only');
      }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main evaluator
//
// viewerContext shape:
//   { email?, ip?, userAgent?, sessionId?, sessionOpenCount?, password? }
// lockConfig shape (from box model):
//   { password?, timeWindow?, openLimit?, sessionOpenLimit?, inviteOnly? }
//
// Evaluation order (defense-in-depth):
//   1. Time window   2. Invite-only   3. Password   4. Open limit   5. Session open limit
// All enabled rules must pass (AND semantics) — matches policy.v1.schema.json
// evaluation.default.mode = "all".
// ─────────────────────────────────────────────────────────────────────────────

export function evaluatePolicy(lockConfig, viewerContext, boxState = {}) {
  const boxId = lockConfig?.__boxId || boxState?.boxId || null;
  const emailHash = hashEmail(viewerContext.email);
  const ipHash = hashIp(viewerContext.ip);
  const userAgentHash = hashUserAgent(viewerContext.userAgent);
  const sessionId = viewerContext.sessionId || hashSessionKey(viewerContext.ip, viewerContext.userAgent);

  const deniedCodes = [];

  // 1. Time window
  const tw = evaluateTimeWindow(lockConfig.timeWindow);
  if (!tw.ok) deniedCodes.push(...tw.deniedCodes);

  // 2. Invite-only
  const inv = evaluateInviteOnly(lockConfig.inviteOnly, emailHash);
  if (!inv.ok) deniedCodes.push(...inv.deniedCodes);

  // 3. Password
  if (lockConfig.password?.enabled) {
    const supplied = viewerContext.password;
    if (!supplied) deniedCodes.push('password_required');
    else if (!verifyPassword(supplied, lockConfig.password)) deniedCodes.push('invalid_password');
  }

  // 4. Open limit (per-box)
  const ol = evaluateOpenLimit(lockConfig.openLimit, boxState.opensUsed || 0);
  if (!ol.ok) deniedCodes.push(...ol.deniedCodes);

  // 5. Session open limit (per-session)
  const sol = evaluateSessionOpenLimit(lockConfig.sessionOpenLimit, viewerContext.sessionOpenCount || 0);
  if (!sol.ok) deniedCodes.push(...sol.deniedCodes);

  const ok = deniedCodes.length === 0;

  const evaluation = {
    ok,
    deniedCodes,
    viewerContext: {
      emailHash,
      ipHash,
      userAgentHash,
      sessionId,
    },
  };

  if (ok) {
    emitAudit(boxId, buildAuditEvent(true, deniedCodes, evaluation.viewerContext, boxState));
  } else {
    emitAudit(boxId, buildAuditEvent(false, deniedCodes, evaluation.viewerContext, boxState));
  }

  return evaluation;
}

function buildAuditEvent(ok, deniedCodes, viewerContext, boxState) {
  return {
    type: ok ? 'box.unlock.allowed' : 'box.unlock.denied',
    timestamp: new Date().toISOString(),
    ok,
    deniedCodes,
    boxVersion: boxState.version || null,
    viewer: viewerContext,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience: evaluate + coerce to { ok, reason, deniedCodes } for the gate.
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateAccess(lockConfig, viewerContext, boxState = {}) {
  const result = evaluatePolicy(lockConfig, viewerContext, boxState);
  return {
    ok: result.ok,
    reason: result.ok ? null : result.deniedCodes[0],
    deniedCodes: result.deniedCodes,
  };
}

// Re-export narrow helpers for callers that only need one rule type.
export { evaluateTimeWindow, evaluateOpenLimit, evaluateSessionOpenLimit, evaluateInviteOnly };
