/**
 * Shared helper for authenticated Bitty Box API calls.
 *
 * The server accepts either:
 *   - `X-Session-Id: bb_sess_...`  (legacy server session)
 *   - `Authorization: Bearer <firebase-id-token>`  (Firebase users)
 *   - `Authorization: Bearer bb_live_...`          (API key)
 *
 * IMPORTANT: Firebase users have NO server session. `useAccount` stores a
 * client-side marker `fb_sess_<uid>_...` in localStorage, but the API rejects
 * that value with 401 — it is a UI marker, not a credential. For Firebase
 * users the real credential is the Firebase ID token, which must be attached
 * as a Bearer header. Use the async helpers below so that is handled.
 */

export const SESSION_STORAGE_KEY = 'bitty_session_id';
export const API_KEY_STORAGE_KEY = 'bitty_api_key';

/** Client-side Firebase marker prefix — mirrors utils/firebaseSession.ts. */
export const FIREBASE_SESSION_PREFIX = 'fb_sess_';

export function getStoredSessionId(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

export function getStoredApiKey(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

/** Returns the Firebase marker (`fb_sess_...`) when present, else null. */
export function getFirebaseSessionMarker(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const sid = localStorage.getItem(SESSION_STORAGE_KEY);
    return sid && sid.startsWith(FIREBASE_SESSION_PREFIX) ? sid : null;
  } catch {
    return null;
  }
}

/** True when the visitor is signed in at all, including Firebase users. */
export function isSignedIn(): boolean {
  return Boolean(getStoredSessionId() || getStoredApiKey());
}

/** True when a usable server credential (session or API key) exists. */
export function hasServerCredential(): boolean {
  const sessionId = getStoredSessionId();
  if (sessionId && !sessionId.startsWith(FIREBASE_SESSION_PREFIX)) return true;
  return Boolean(getStoredApiKey());
}

/**
 * Get a current Firebase ID token, if a Firebase user is signed in.
 * Returns null for legacy/API-key users or when Firebase is unavailable.
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  try {
    const { auth } = await import('../lib/firebase');
    const currentUser = auth?.currentUser;
    if (!currentUser) return null;
    return await currentUser.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Async auth headers for JSON requests. Handles all three credential types.
 * Returns null only when there is genuinely no way to authenticate.
 */
export async function authJsonHeadersAsync(): Promise<Record<string, string> | null> {
  const base = { 'Content-Type': 'application/json' } as Record<string, string>;

  const sessionId = getStoredSessionId();
  if (sessionId && !sessionId.startsWith(FIREBASE_SESSION_PREFIX)) {
    return { ...base, 'X-Session-Id': sessionId };
  }

  const apiKey = getStoredApiKey();
  if (apiKey) return { ...base, Authorization: `Bearer ${apiKey}` };

  // Firebase user: the marker alone is not a credential — use the ID token.
  if (getFirebaseSessionMarker() || !sessionId) {
    const idToken = await getFirebaseIdToken();
    if (idToken) return { ...base, Authorization: `Bearer ${idToken}` };
  }

  return null;
}

/** Async auth headers for bodyless requests. */
export async function authHeadersAsync(): Promise<Record<string, string> | null> {
  const full = await authJsonHeadersAsync();
  if (!full) return null;
  const { 'Content-Type': _omit, ...rest } = full;
  return rest;
}

/**
 * Build headers for an authenticated JSON request.
 * Returns null when no credential is available so callers can prompt sign-in.
 */
export function authJsonHeaders(): Record<string, string> | null {
  const sessionId = getStoredSessionId();
  if (sessionId && !sessionId.startsWith(FIREBASE_SESSION_PREFIX)) {
    return { 'Content-Type': 'application/json', 'X-Session-Id': sessionId };
  }
  const apiKey = getStoredApiKey();
  if (apiKey) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
  }
  return null;
}

/** Same as authJsonHeaders but for requests with no body. */
export function authHeaders(): Record<string, string> | null {
  const sessionId = getStoredSessionId();
  if (sessionId && !sessionId.startsWith(FIREBASE_SESSION_PREFIX)) {
    return { 'X-Session-Id': sessionId };
  }
  const apiKey = getStoredApiKey();
  if (apiKey) return { Authorization: `Bearer ${apiKey}` };
  return null;
}
