import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { constantTimeEqual } from './secure-compare.js';

const DATA_DIR = process.env.BITTYBOX_DATA_DIR || '/var/lib/bittybox';
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

// In-memory cache
let accountsData = null;
let saveTimeout = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadAccounts() {
  if (accountsData) return accountsData;
  ensureDataDir();

  if (fs.existsSync(ACCOUNTS_FILE)) {
    try {
      const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
      accountsData = JSON.parse(raw);
    } catch (err) {
      console.error('[account-store] Failed to parse accounts.json, initializing new store:', err);
    }
  }

  if (!accountsData) {
    accountsData = {
      version: 1,
      users: {},
      magicLinks: {},
      sessions: {},
      apiKeys: {},
      events: []
    };
    saveAccountsSync();
  }

  // Ensure top level structures
  if (!accountsData.users) accountsData.users = {};
  if (!accountsData.apiKeys) accountsData.apiKeys = {};
  if (!accountsData.sessions) accountsData.sessions = {};
  if (!accountsData.events) accountsData.events = [];

  return accountsData;
}

function saveAccountsSync() {
  try {
    ensureDataDir();
    const tmpFile = `${ACCOUNTS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(accountsData, null, 2), 'utf8');
    fs.renameSync(tmpFile, ACCOUNTS_FILE);
  } catch (err) {
    console.error('[account-store] Error saving accounts:', err);
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveAccountsSync();
    saveTimeout = null;
  }, 100);
}

function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Get or create a default demo user if database is empty
 */
export function getDefaultUser() {
  const data = loadAccounts();
  const userIds = Object.keys(data.users);
  if (userIds.length > 0) {
    return data.users[userIds[0]];
  }

  return getOrCreateUser('developer@bittybox.org', 'Bitty Developer');
}

/**
 * Get or create user by email
 */
export function getOrCreateUser(email, displayName = '') {
  const data = loadAccounts();
  const normalizedEmail = String(email).trim().toLowerCase();

  for (const user of Object.values(data.users)) {
    if (user.email && user.email.toLowerCase() === normalizedEmail) {
      user.lastSignedInAt = new Date().toISOString();
      scheduleSave();
      return user;
    }
  }

  // Create new user
  const userId = `bb_usr_${crypto.randomBytes(7).toString('hex')}`;
  const name = displayName || normalizedEmail.split('@')[0] || 'Builder';
  const newUser = {
    id: userId,
    email: normalizedEmail,
    displayName: name,
    tier: 'Pro Builder',
    avatar: '⚡',
    credits: 100,
    creditsUsedTotal: 0,
    joinedDate: new Date().toISOString(),
    lastSignedInAt: new Date().toISOString(),
    settings: {
      autoSaveLinks: true
    },
    apiKeys: [],
    links: [],
    transactions: [
      {
        id: `tx_${Date.now()}`,
        type: 'grant',
        amount: 100,
        description: 'Welcome Bonus Credits',
        createdAt: new Date().toISOString()
      }
    ],
    lastBonusClaim: new Date().toISOString()
  };

  data.users[userId] = newUser;
  scheduleSave();
  return newUser;
}

/**
 * Get user by user ID
 */
export function getUser(userId) {
  const data = loadAccounts();
  return data.users[userId] || null;
}

/**
 * Create a session for a user
 */
export function createSession(userId) {
  const data = loadAccounts();
  const user = data.users[userId];
  if (!user) throw new Error('User not found');

  const sessionId = `bb_sess_${crypto.randomBytes(24).toString('hex')}`;
  data.sessions[sessionId] = {
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };
  scheduleSave();
  return sessionId;
}

/**
 * Get user by session ID
 */
export function getUserBySession(sessionId) {
  if (!sessionId) return null;
  const data = loadAccounts();

  // Constant-time match against stored session IDs (defense against timing
  // oracles on the session token comparison).
  let matchedSid = null;
  let sess = null;
  for (const [sid, s] of Object.entries(data.sessions || {})) {
    if (constantTimeEqual(sid, sessionId)) {
      matchedSid = sid;
      sess = s;
      break;
    }
  }
  if (!sess) return null;

  if (new Date(sess.expiresAt) < new Date()) {
    delete data.sessions[matchedSid];
    scheduleSave();
    return null;
  }

  return data.users[sess.userId] || null;
}

/**
 * Generate a new API Key for a user
 * Returns { keyId, rawKey, label, prefix, scopes, createdAt }
 */
export function createApiKey(userId, label = 'API Key', scopes = ['links:create', 'links:read', 'mcp:access']) {
  const data = loadAccounts();
  const user = data.users[userId];
  if (!user) throw new Error('User not found');

  const randomSecret = crypto.randomBytes(20).toString('base64url');
  const rawKey = `bb_live_${randomSecret}`;
  const keyId = `bb_key_${crypto.randomBytes(7).toString('hex')}`;
  const keyHash = hashApiKey(rawKey);
  const prefix = `bb_live_${randomSecret.substring(0, 8)}...`;

  const keyMeta = {
    id: keyId,
    label: label.trim() || 'API Key',
    prefix,
    hash: keyHash,
    scopes: Array.isArray(scopes) ? scopes : ['links:create', 'links:read', 'mcp:access'],
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    requestCount: 0
  };

  if (!user.apiKeys) user.apiKeys = [];
  user.apiKeys.unshift(keyMeta);

  data.apiKeys[keyHash] = {
    userId,
    keyId
  };

  scheduleSave();

  return {
    keyId,
    rawKey,
    label: keyMeta.label,
    prefix: keyMeta.prefix,
    scopes: keyMeta.scopes,
    createdAt: keyMeta.createdAt
  };
}

/**
 * Revoke an API Key
 */
export function revokeApiKey(userId, keyId) {
  const data = loadAccounts();
  const user = data.users[userId];
  if (!user || !user.apiKeys) return false;

  const keyIdx = user.apiKeys.findIndex(k => k.id === keyId);
  if (keyIdx === -1) return false;

  const [removed] = user.apiKeys.splice(keyIdx, 1);
  if (removed && removed.hash) {
    delete data.apiKeys[removed.hash];
  }

  scheduleSave();
  return true;
}

/**
 * Validate an API Key (raw string)
 * Returns { valid: true, user, keyMeta } or { valid: false, error }
 */
export function validateApiKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') {
    return { valid: false, error: 'API key is required' };
  }

  const cleanKey = rawKey.trim().replace(/^Bearer\s+/i, '');
  const data = loadAccounts();
  const keyHash = hashApiKey(cleanKey);

  // Constant-time match against stored key hashes to prevent timing-oracle
  // attacks on credential comparison. We iterate the map and compare with a
  // constant-time primitive rather than relying on a short-circuiting lookup.
  let mapping = null;
  for (const [storedHash, entry] of Object.entries(data.apiKeys || {})) {
    if (constantTimeEqual(storedHash, keyHash)) {
      mapping = entry;
      break;
    }
  }

  if (!mapping) {
    return { valid: false, error: 'Invalid or revoked API key' };
  }

  const user = data.users[mapping.userId];
  if (!user) {
    return { valid: false, error: 'User account not found' };
  }

  const keyMeta = (user.apiKeys || []).find(k => k.id === mapping.keyId);
  if (keyMeta) {
    keyMeta.lastUsedAt = new Date().toISOString();
    keyMeta.requestCount = (keyMeta.requestCount || 0) + 1;
  }

  user.creditsUsedTotal = (user.creditsUsedTotal || 0) + 1;
  scheduleSave();

  return {
    valid: true,
    user,
    keyMeta
  };
}

/**
 * Record usage or link generation under user account
 */
export function recordLinkCreation(userId, linkData) {
  if (!userId) return;
  const data = loadAccounts();
  const user = data.users[userId];
  if (!user) return;

  if (!user.links) user.links = [];
  user.links.unshift({
    id: `lnk_${Date.now()}`,
    title: linkData.title,
    url: linkData.url,
    format: linkData.format,
    stats: linkData.stats,
    createdAt: new Date().toISOString()
  });

  // Keep last 100 links per user
  if (user.links.length > 100) {
    user.links = user.links.slice(0, 100);
  }

  scheduleSave();
}

/**
 * Record a box unlock audit event for the box owner's account history.
 * Best-effort; never throws. `boxVersion` is optional (from evaluator).
 */
export function recordUnlockEvent(boxId, event) {
  try {
    if (!boxId) return;
    const data = loadAccounts();
    // Find the owning user by scanning boxes map, if present.
    let ownerId = null;
    if (data.boxes) {
      const entry = data.boxes[boxId];
      if (entry && entry.ownerId) ownerId = entry.ownerId;
    }
    if (!ownerId) {
      // Fallback: store under a global audit list if present.
      if (!data.boxAudit) data.boxAudit = [];
      data.boxAudit.unshift({ boxId, ...event });
      if (data.boxAudit.length > 500) data.boxAudit = data.boxAudit.slice(0, 500);
      scheduleSave();
      return;
    }
    const user = data.users[ownerId];
    if (!user) return;
    if (!user.boxAudit) user.boxAudit = [];
    user.boxAudit.unshift({ boxId, ...event });
    if (user.boxAudit.length > 500) user.boxAudit = user.boxAudit.slice(0, 500);
    scheduleSave();
  } catch (e) {
    // Audit is best-effort; swallow.
  }
}
