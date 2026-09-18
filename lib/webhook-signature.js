/**
 * Creem webhook signature verification.
 *
 * Runs over the RAW request body (never a re-serialised parse) and compares in
 * constant time. Fails CLOSED: every failure mode rejects the request rather
 * than logging and continuing.
 *
 * Set BITTYBOX_WEBHOOK_ENFORCE=0 for a fast rollback (logs a loud warning).
 */
import crypto from 'node:crypto';

export const SIGNATURE_HEADERS = ['x-creem-signature', 'creem-signature', 'x-webhook-signature'];

/** Pull the signature out of whichever header Creem (or a proxy) used. */
export function getSignatureHeader(headers = {}) {
  for (const name of SIGNATURE_HEADERS) {
    const value = headers[name];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

/** Tolerate `sha256=<hex>` / `sha256:<hex>` prefixes; normalise to bare lowercase hex. */
function normaliseSignature(header) {
  return String(header).trim().replace(/^sha256[=:]/i, '').replace(/\s+/g, '').toLowerCase();
}

export function computeSignature(rawBody, secret) {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

/**
 * @returns {{ok: boolean, reason: string}}
 *   reason: verified | not_enforced | signature_missing | signature_mismatch
 *           | secret_not_configured | raw_body_unavailable
 */
export function verifyWebhookSignature({ rawBody, headers = {}, secret, enforce = true } = {}) {
  if (!enforce) return { ok: true, reason: 'not_enforced' };
  if (!secret) return { ok: false, reason: 'secret_not_configured' };
  if (!rawBody || rawBody.length === 0) return { ok: false, reason: 'raw_body_unavailable' };

  const provided = normaliseSignature(getSignatureHeader(headers));
  if (!provided) return { ok: false, reason: 'signature_missing' };

  const expected = computeSignature(rawBody, secret);
  const a = Buffer.from(provided, 'hex');
  const b = Buffer.from(expected, 'hex');
  // Non-hex input decodes to an empty/odd buffer -> length check rejects it
  // before timingSafeEqual (which throws on length mismatch).
  if (a.length === 0 || a.length !== b.length) return { ok: false, reason: 'signature_mismatch' };
  if (!crypto.timingSafeEqual(a, b)) return { ok: false, reason: 'signature_mismatch' };

  return { ok: true, reason: 'verified' };
}

/** HTTP status for a verification failure; null when the request may proceed. */
export function statusForReason(reason) {
  switch (reason) {
    case 'verified':
    case 'not_enforced':
      return null;
    case 'secret_not_configured':
    case 'raw_body_unavailable':
      return 500; // misconfiguration on our side -> fail closed, do not mint
    default:
      return 401; // signature_missing | signature_mismatch
  }
}

export function isEnforced(env = process.env) {
  return env.BITTYBOX_WEBHOOK_ENFORCE !== '0';
}
