// Ephemeral invite-code rendezvous for Bitty Live P2P chat.
//
// Instead of sharing a full collab URL (which couples peer discovery to URL
// hash parsing, payload fallbacks and box passcodes), the chatbox itself is
// the rendezvous point: the host presses "Invite", gets a short code, and
// listens for ~30s. A guest types that code into their own chatbox and lands
// in the exact same Trystero room. If nobody connects within the window the
// code expires and a fresh one must be generated.

export const INVITE_CODE_LENGTH = 6;

// Unambiguous alphabet: no 0/O, 1/I/L to avoid read-back mistakes.
const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const INVITE_LISTEN_MS = 30_000;

export const INVITE_SEED_PREFIX = 'invite:';

function randomIndex(max: number): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_ALPHABET[randomIndex(INVITE_ALPHABET.length)];
  }
  return code;
}

/** Normalize user-typed codes: uppercase, strip separators/whitespace.
 * Confusable characters (0/O, 1/I/L) are left as-is so validation rejects
 * them with a clear error instead of silently joining the wrong room. */
export function normalizeInviteCode(input: string): string {
  return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidInviteCode(code: string): boolean {
  const normalized = normalizeInviteCode(code);
  if (normalized.length !== INVITE_CODE_LENGTH) return false;
  return normalized.split('').every(ch => INVITE_ALPHABET.includes(ch));
}

/** Room seed for an invite code. Namespaced so invite rooms never collide with box rooms. */
export function inviteBoxIdFor(code: string): string {
  return `${INVITE_SEED_PREFIX}${normalizeInviteCode(code)}`;
}

export function isInviteBoxId(boxId: string | null | undefined): boolean {
  return Boolean(boxId && boxId.startsWith(INVITE_SEED_PREFIX));
}

export function inviteCodeFromBoxId(boxId: string | null | undefined): string | null {
  if (!isInviteBoxId(boxId)) return null;
  const code = normalizeInviteCode((boxId as string).slice(INVITE_SEED_PREFIX.length));
  return isValidInviteCode(code) ? code : null;
}
