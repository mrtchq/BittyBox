import { Router, Request, Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import {
  readAccounts,
  saveAccounts,
  sanitizeUser,
  AccountsData,
} from './magic-auth.js';

export interface AuthContext {
  user: Record<string, any>;
  keyRecord?: Record<string, any>;
  authType: 'session' | 'api_key' | 'userId';
}

const STORE_DIR = process.env.BITTYBOX_STORE_DIR ?? path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'boxes.json');

function readBoxStore(): Record<string, any> {
  try {
    fs.mkdirSync(STORE_DIR, { recursive: true });
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeBoxStore(s: Record<string, any>) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(s, null, 2));
}

export function authenticateUserFromRequest(req: Request, accounts: AccountsData): AuthContext | null {
  const authHeader = (req.headers.authorization || '').trim();
  const xApiKey = ((req.headers['x-api-key'] as string) || '').trim();
  const xSessionId = ((req.headers['x-session-id'] as string) || '').trim();
  const queryApiKey = ((req.query.apiKey as string) || '').trim();
  const querySessionId = ((req.query.sessionId as string) || '').trim();

  // 1. Check for API key (Bearer bb_live_... or x-api-key or query)
  let rawKey = '';
  if (authHeader.startsWith('Bearer bb_live_')) {
    rawKey = authHeader.slice(7).trim();
  } else if (authHeader.startsWith('bb_live_')) {
    rawKey = authHeader;
  } else if (xApiKey.startsWith('bb_live_')) {
    rawKey = xApiKey;
  } else if (queryApiKey.startsWith('bb_live_')) {
    rawKey = queryApiKey;
  }

  if (rawKey) {
    const hash = createHash('sha256').update(rawKey).digest('hex');
    const keyMeta = (accounts.apiKeys as Record<string, any>)?.[hash];
    if (keyMeta && keyMeta.userId) {
      const user = accounts.users?.[keyMeta.userId];
      if (user) {
        const now = new Date().toISOString();
        if (Array.isArray(user.apiKeys)) {
          const k = user.apiKeys.find((item: any) => item.id === keyMeta.keyId || item.hash === hash);
          if (k) {
            k.lastUsedAt = now;
            k.requestCount = (k.requestCount || 0) + 1;
          }
        }
        return { user, keyRecord: keyMeta, authType: 'api_key' };
      }
    }
    return null;
  }

  // 2. Check for Session ID (Bearer bb_sess_... or x-session-id or query)
  let sessionId = '';
  if (authHeader.startsWith('Bearer bb_sess_')) {
    sessionId = authHeader.slice(7).trim();
  } else if (authHeader.startsWith('bb_sess_')) {
    sessionId = authHeader;
  } else if (xSessionId.startsWith('bb_sess_')) {
    sessionId = xSessionId;
  } else if (querySessionId.startsWith('bb_sess_')) {
    sessionId = querySessionId;
  }

  if (sessionId) {
    const session = accounts.sessions?.[sessionId] as Record<string, any> | undefined;
    if (session && session.userId) {
      if (!session.expiresAt || Date.parse(session.expiresAt) > Date.now()) {
        const user = accounts.users?.[session.userId];
        if (user) {
          return { user, authType: 'session' };
        }
      }
    }
  }

  // NOTE: a previous revision authenticated callers who merely supplied a `userId`
  // in the query string or request body. That is an impersonation vulnerability:
  // anyone who learns (or guesses) a user id becomes that user. Authentication now
  // requires a real credential — an API key or a live session. `userId` is treated
  // strictly as untrusted *filter* data by callers that need it.
  return null;
}

export function createAccountsRouter(options: { accountsFile?: string } = {}): Router {
  const accountsFile = options.accountsFile ?? process.env.BITTYBOX_ACCOUNTS_FILE ?? '/var/lib/bittybox/accounts.json';
  const router = Router();

  // Helper middleware for auth
  function requireAuth(req: Request, res: Response, next: () => void) {
    try {
      const accounts = readAccounts(accountsFile);
      const auth = authenticateUserFromRequest(req, accounts);
      if (!auth) {
        res.status(401).json({ success: false, error: 'Authentication required. Please sign in or provide a valid API key.' });
        return;
      }
      (req as any).auth = auth;
      (req as any).accounts = accounts;
      next();
    } catch {
      res.status(503).json({ success: false, error: 'Account service temporarily unavailable.' });
    }
  }

  // --- 1. Get Current User Account Profile & Stats ---
  router.get('/me', requireAuth, (req, res) => {
    const { user } = (req as any).auth as AuthContext;
    const accounts = (req as any).accounts as AccountsData;
    saveAccounts(accountsFile, accounts); // In case lastUsedAt was touched
    const safeUser = sanitizeUser(user);
    res.json({
      success: true,
      user: safeUser,
      keysCount: Array.isArray(user.apiKeys) ? user.apiKeys.length : 0,
      boxesCount: Array.isArray(user.links) ? user.links.length : 0,
    });
  });

  // --- 2. Developer / Instant Sign-In ---
  // SECURITY: a previous revision let ANY anonymous caller mint an account and a
  // 30-day session for an arbitrary email (including someone else's), which is both
  // an account-creation abuse vector and an impersonation primitive. This endpoint
  // is a local-development convenience only and is disabled unless the operator
  // explicitly opts in with BITTYBOX_ALLOW_DEV_LOGIN=true.
  const devLoginEnabled = () => String(process.env.BITTYBOX_ALLOW_DEV_LOGIN ?? '').toLowerCase() === 'true';

  router.post('/dev-login', (req, res) => {
    if (!devLoginEnabled()) {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }
    try {
      const email = typeof req.body?.email === 'string' && req.body.email.includes('@')
        ? req.body.email.trim().toLowerCase()
        : 'operator@bittybox.org';
      const displayName = typeof req.body?.displayName === 'string' && req.body.displayName.trim()
        ? req.body.displayName.trim()
        : email.split('@')[0];

      const accounts = readAccounts(accountsFile);
      accounts.users = accounts.users ?? {};
      accounts.sessions = accounts.sessions ?? {};

      let user = Object.values(accounts.users).find((u) => String(u.email ?? '').toLowerCase() === email);
      const issuedAt = Date.now();
      const expiresAt = new Date(issuedAt + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (!user) {
        const userId = `bb_usr_${randomBytes(7).toString('hex')}`;
        user = {
          id: userId,
          email,
          displayName,
          tier: 'Architect Sovereign',
          avatar: '⚡',
          credits: 2500,
          creditsUsedTotal: 0,
          joinedDate: new Date(issuedAt).toISOString(),
          lastSignedInAt: new Date(issuedAt).toISOString(),
          settings: { autoSaveLinks: true, trustThisDevice: true, deviceTrustExpiresAt: expiresAt },
          apiKeys: [],
          links: [],
          transactions: [],
          lastBonusClaim: null,
        };
        accounts.users[userId] = user;
      } else {
        user.lastSignedInAt = new Date(issuedAt).toISOString();
      }

      const sessionId = `bb_sess_${randomBytes(24).toString('hex')}`;
      accounts.sessions[sessionId] = {
        sessionId,
        userId: user.id,
        createdAt: new Date(issuedAt).toISOString(),
        expiresAt,
        trusted: true,
      };

      saveAccounts(accountsFile, accounts);

      res.json({
        success: true,
        user: sanitizeUser(user),
        sessionId,
        expiresAt,
        message: 'Signed in successfully.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Dev login failed' });
    }
  });

  // --- 3. List User API Keys ---
  router.get('/keys', requireAuth, (req, res) => {
    const { user } = (req as any).auth as AuthContext;
    const safeKeys = Array.isArray(user.apiKeys)
      ? user.apiKeys.map((key: any) => {
          const { hash: _hash, ...safe } = key;
          return safe;
        })
      : [];
    res.json({ success: true, keys: safeKeys });
  });

  // --- 4. Generate New API Key ---
  router.post('/keys', requireAuth, (req, res) => {
    try {
      const { user } = (req as any).auth as AuthContext;
      const accounts = (req as any).accounts as AccountsData;

      const label = typeof req.body?.label === 'string' && req.body.label.trim()
        ? req.body.label.trim().slice(0, 100)
        : 'API Key';

      const validScopes = ['capsules:create', 'capsules:read', 'mcp:access'];
      const requestedScopes = Array.isArray(req.body?.scopes)
        ? req.body.scopes.filter((s: string) => validScopes.includes(s))
        : [];
      const scopes = requestedScopes.length > 0 ? requestedScopes : ['capsules:create', 'capsules:read', 'mcp:access'];

      // Generate secret key token
      const rawSecret = randomBytes(24).toString('base64url');
      const rawKey = `bb_live_${rawSecret}`;
      const hash = createHash('sha256').update(rawKey).digest('hex');
      const keyId = `bb_key_${randomBytes(7).toString('hex')}`;
      const prefix = `${rawKey.slice(0, 16)}...`;
      const createdAt = new Date().toISOString();

      const keyRecord = {
        id: keyId,
        label,
        prefix,
        hash,
        scopes,
        createdAt,
        lastUsedAt: null,
        requestCount: 0,
      };

      accounts.apiKeys = accounts.apiKeys ?? {};
      (accounts.apiKeys as Record<string, any>)[hash] = {
        userId: user.id,
        keyId,
        createdAt,
      };

      user.apiKeys = Array.isArray(user.apiKeys) ? user.apiKeys : [];
      user.apiKeys.unshift(keyRecord);

      saveAccounts(accountsFile, accounts);

      const { hash: _hash, ...safeRecord } = keyRecord;

      res.status(201).json({
        success: true,
        key: rawKey,
        keyRecord: safeRecord,
        message: 'API key generated. Store it securely as it will not be displayed again.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Key generation failed' });
    }
  });

  // --- 5. Revoke / Delete API Key ---
  router.delete('/keys/:keyId', requireAuth, (req, res) => {
    try {
      const { user } = (req as any).auth as AuthContext;
      const accounts = (req as any).accounts as AccountsData;
      const { keyId } = req.params;

      if (!Array.isArray(user.apiKeys)) {
        res.status(404).json({ success: false, error: 'Key not found' });
        return;
      }

      const keyIndex = user.apiKeys.findIndex((k: any) => k.id === keyId);
      if (keyIndex === -1) {
        res.status(404).json({ success: false, error: 'Key not found' });
        return;
      }

      const [removedKey] = user.apiKeys.splice(keyIndex, 1);

      // Remove from top-level apiKeys mapping
      if (removedKey && removedKey.hash && accounts.apiKeys) {
        delete (accounts.apiKeys as Record<string, any>)[removedKey.hash];
      }

      saveAccounts(accountsFile, accounts);

      res.json({ success: true, message: 'API key revoked successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Key revocation failed' });
    }
  });

  // --- 6. Get User's Created Bitty Boxes ---
  router.get('/boxes', requireAuth, (req, res) => {
    try {
      const { user } = (req as any).auth as AuthContext;
      const boxStore = readBoxStore();

      // Collect from user.links in accounts.json
      const accountBoxes: any[] = Array.isArray(user.links) ? [...user.links] : [];

      // Collect from .data/boxes.json where userId matches
      const storeBoxes: any[] = Object.values(boxStore)
        .filter((b: any) => b.userId === user.id || b.meta?.userId === user.id)
        .map((b: any) => ({
          id: b.id,
          title: b.title || b.meta?.title || 'Bitty Box Capsule',
          url: b.meta?.url || `https://bittybox.org/#${b.id}`,
          format: b.format || b.meta?.format || 'html',
          byteSize: b.meta?.rawBytes || Buffer.byteLength(b.content || '', 'utf8'),
          compressedSize: b.meta?.compressedBytes || 0,
          encrypted: !!(b.meta?.isEncrypted),
          locks: b.meta?.locks || {},
          createdAt: b.meta?.createdAt || new Date(b.createdAt || Date.now()).toISOString(),
        }));

      // Merge and deduplicate by id and url
      const seenIds = new Set<string>();
      const seenUrls = new Set<string>();
      const combined: any[] = [];

      for (const box of [...accountBoxes, ...storeBoxes]) {
        if (!box || !box.id) continue;
        if (seenIds.has(box.id)) continue;
        if (box.url && seenUrls.has(box.url)) continue;
        seenIds.add(box.id);
        if (box.url) seenUrls.add(box.url);
        combined.push(box);
      }

      // Sort newest first
      combined.sort((a, b) => {
        const timeA = a.createdAt ? Date.parse(a.createdAt) : 0;
        const timeB = b.createdAt ? Date.parse(b.createdAt) : 0;
        return timeB - timeA;
      });

      res.json({ success: true, boxes: combined });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to load boxes' });
    }
  });

  // --- 7. Log a Created Bitty Box to User Account ---
  router.post('/boxes', requireAuth, (req, res) => {
    try {
      const { user } = (req as any).auth as AuthContext;
      const accounts = (req as any).accounts as AccountsData;
      const { id, title, format, content, url, rawBytes, compressedBytes, isEncrypted, locks } = req.body;

      if (!id || typeof id !== 'string') {
        res.status(400).json({ success: false, error: 'Box id is required' });
        return;
      }

      const boxRecord = {
        id,
        title: title || 'Untitled Capsule',
        url: url || `https://bittybox.org/#${id}`,
        format: format || 'html',
        byteSize: Number(rawBytes) || (content ? Buffer.byteLength(content, 'utf8') : 0),
        compressedSize: Number(compressedBytes) || 0,
        encrypted: Boolean(isEncrypted),
        locks: locks || {},
        createdAt: new Date().toISOString(),
      };

      user.links = Array.isArray(user.links) ? user.links : [];
      // If already logged, update it; otherwise unshift
      const existingIdx = user.links.findIndex((l: any) => l.id === id);
      if (existingIdx >= 0) {
        user.links[existingIdx] = boxRecord;
      } else {
        user.links.unshift(boxRecord);
      }

      saveAccounts(accountsFile, accounts);

      // Also persist to store if content was provided
      if (content) {
        const s = readBoxStore();
        s[id] = {
          id,
          content,
          title: boxRecord.title,
          format: boxRecord.format,
          userId: user.id,
          meta: boxRecord,
          createdAt: Date.now(),
        };
        writeBoxStore(s);
      }

      res.status(201).json({ success: true, box: boxRecord });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to save box' });
    }
  });

  // --- 8. Burn / Delete Bitty Box ---
  router.delete('/boxes/:boxId', requireAuth, (req, res) => {
    try {
      const { user } = (req as any).auth as AuthContext;
      const accounts = (req as any).accounts as AccountsData;
      const { boxId } = req.params;

      if (Array.isArray(user.links)) {
        user.links = user.links.filter((l: any) => l.id !== boxId);
        saveAccounts(accountsFile, accounts);
      }

      // Also delete from .data/boxes.json
      const s = readBoxStore();
      if (s[boxId]) {
        delete s[boxId];
        writeBoxStore(s);
      }

      res.json({ success: true, message: 'Capsule deleted from vault log' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to delete box' });
    }
  });

  // --- 9. Sign Out ---
  router.post('/signout', (req, res) => {
    try {
      const accounts = readAccounts(accountsFile);
      const authHeader = (req.headers.authorization || '').trim();
      let sessionId = '';
      if (authHeader.startsWith('Bearer bb_sess_')) sessionId = authHeader.slice(7).trim();
      else if ((req.headers['x-session-id'] as string)?.startsWith('bb_sess_')) sessionId = (req.headers['x-session-id'] as string).trim();
      else if ((req.body?.sessionId as string)?.startsWith('bb_sess_')) sessionId = req.body.sessionId.trim();

      if (sessionId && accounts.sessions?.[sessionId]) {
        delete accounts.sessions[sessionId];
        saveAccounts(accountsFile, accounts);
      }

      res.json({ success: true, message: 'Signed out successfully' });
    } catch {
      res.json({ success: true, message: 'Signed out' });
    }
  });

  return router;
}
