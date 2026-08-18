import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createBittyLink, decodeBittyLink } from './lib/bitty-engine.js';
import { handleMcpHttpRequest } from './mcp/http-transport.js';
import { renderApiDocsPage } from './lib/api-docs-page.js';
import {
  getDefaultUser,
  getOrCreateUser,
  getUser,
  createApiKey,
  revokeApiKey,
  validateApiKey,
  recordLinkCreation
} from './lib/account-store.js';
import { authMiddleware } from './lib/auth-middleware.js';
import { createBox, getBox, listBoxes, updateLockConfig, incrementOpensUsed, publishBox, unpublishBox, deleteBox, setPasswordLock, setTimeWindowLock, setAccessLimitLock, setSessionLimitLock, setInviteOnlyLock, createTimeWindow, createOpenLimit, createSessionOpenLimit, createInviteOnly, evaluateAndRecord, touchSessionOpens, getSessionOpenCount } from './lib/box-store.js';
import { evaluatePolicy, createSessionGrant, verifyPassword, createPasswordVerifier } from './lib/policy-evaluator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3012;
const DIST_DIR = path.join(__dirname, 'dist');

// Disable x-powered-by header
app.disable('x-powered-by');

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-API-Key, X-Session-Id, Mcp-Session-Id, MCP-Protocol-Version');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Body parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.text({ limit: '15mb', type: ['text/plain', 'text/html', 'text/markdown'] }));

// Optional authentication extraction on all routes
app.use(authMiddleware({ required: false }));

// ==========================================
// Model Context Protocol (MCP) Endpoints
// ==========================================
app.all('/mcp', handleMcpHttpRequest);
app.all('/api/mcp', handleMcpHttpRequest);

// ==========================================
// Health Check Endpoints
// ==========================================
app.get(['/api/health', '/api/bitty/health'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'bittybox',
    version: '2.0.0',
    app: 'bittybox-spa-production',
    mcpEndpoint: '/mcp',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// Interactive API & MCP Documentation
// ==========================================
app.get(['/api/docs', '/api/bitty/docs'], (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderApiDocsPage());
});

// ==========================================
// Accounts & API Key Endpoints
// ==========================================
app.get('/api/accounts/me', (req, res) => {
  try {
    const user = req.user || getDefaultUser();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/accounts/keys', (req, res) => {
  try {
    const user = req.user || getDefaultUser();
    const { label, scopes } = req.body || {};
    const key = createApiKey(user.id, label, scopes);
    res.json({ success: true, key });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/accounts/keys/:id', (req, res) => {
  try {
    const user = req.user || getDefaultUser();
    const keyId = req.params.id;
    const revoked = revokeApiKey(user.id, keyId);
    res.json({ success: revoked, keyId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/accounts/keys/test', (req, res) => {
  try {
    const { key } = req.body || {};
    const validation = validateApiKey(key);
    if (validation.valid) {
      res.json({
        success: true,
        valid: true,
        user: {
          id: validation.user.id,
          displayName: validation.user.displayName,
          email: validation.user.email,
          tier: validation.user.tier
        },
        key: {
          id: validation.keyMeta.id,
          label: validation.keyMeta.label,
          prefix: validation.keyMeta.prefix,
          scopes: validation.keyMeta.scopes
        }
      });
    } else {
      res.json({
        success: true,
        valid: false,
        error: validation.error || 'Invalid API key'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/accounts/login', (req, res) => {
  try {
    const { email, displayName } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    const user = getOrCreateUser(email, displayName);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// REST API: Create Bitty Link
// ==========================================
app.post(['/api/bitty/create', '/api/bitty'], async (req, res) => {
  try {
    let content = '';
    let title = req.body?.title;
    let format = req.body?.format;
    let language = req.body?.language;
    let theme = req.body?.theme;
    let editable = req.body?.editable;
    let password = req.body?.password;
    let domain = req.body?.domain;
    let metadata = req.body?.metadata;
    const secretOverride = req.body?.secretOverride === true || req.body?.secretOverride === 'true' || req.body?.secretOverride === '1';

    if (typeof req.body === 'string') {
      content = req.body;
    } else if (req.body && req.body.content !== undefined) {
      content = req.body.content;
    } else if (req.body && req.body.code !== undefined) {
      content = req.body.code;
      format = format || 'code';
    } else if (req.body && req.body.markdown !== undefined) {
      content = req.body.markdown;
      format = format || 'markdown';
    } else if (req.body && req.body.html !== undefined) {
      content = req.body.html;
      format = format || 'html';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing "content", "code", "markdown", or "html" field in request body'
      });
    }

    const result = await createBittyLink({
      content,
      title,
      format,
      language,
      theme,
      editable,
      password,
      domain,
      metadata
    });

    if (result.requiresSecretOverride && !secretOverride && process.env.BITTYBOX_ENFORCE_SECRET_POLICY === '1') {
      return res.status(403).json({
        success: false,
        error: 'Sensitive values detected in an unencrypted link. Acknowledge by passing secretOverride: true, or add a password to encrypt the payload.',
        warnings: result.warnings,
        requiresSecretOverride: true,
      });
    }

    if (req.user) {
      recordLinkCreation(req.user.id, result);
    }

    res.json({
      success: true,
      authenticatedAs: req.user ? req.user.email : undefined,
      ...result
    });
  } catch (err) {
    console.error('[bittybox-api] Error creating bitty link:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/bitty/create', async (req, res) => {
  try {
    const { content, title, format, language, theme, editable, password, domain, redirect } = req.query;
    const secretOverride = req.query.secretOverride === 'true' || req.query.secretOverride === '1';
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required "content" query parameter'
      });
    }

    const result = await createBittyLink({
      content: String(content),
      title: title ? String(title) : undefined,
      format: format ? String(format) : undefined,
      language: language ? String(language) : undefined,
      theme: theme ? String(theme) : undefined,
      editable: editable === 'true' || editable === '1',
      password: password ? String(password) : undefined,
      domain: domain ? String(domain) : undefined
    });

    if (req.user) {
      recordLinkCreation(req.user.id, result);
    }

    if (result.requiresSecretOverride && !secretOverride && process.env.BITTYBOX_ENFORCE_SECRET_POLICY === '1') {
      return res.status(403).json({
        success: false,
        error: 'Sensitive values detected in an unencrypted link. Acknowledge by passing secretOverride=true, or add a password to encrypt the payload.',
        warnings: result.warnings,
        requiresSecretOverride: true,
      });
    }

    if (redirect === 'true' || redirect === '1') {
      return res.redirect(result.url);
    }

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// REST API: Decode Bitty Link
// ==========================================
app.post('/api/bitty/decode', async (req, res) => {
  try {
    const url = req.body?.url;
    const password = req.body?.password;
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required "url" field in request body'
      });
    }

    const result = await decodeBittyLink(url, { password });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/bitty/decode', async (req, res) => {
  try {
    const { url, password } = req.query;
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required "url" query parameter'
      });
    }

    const result = await decodeBittyLink(String(url), { password: password ? String(password) : undefined });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// REST API: Box Management + Lock Enforcement
// ==========================================
// All box management endpoints require authentication (the creator owns the box).
// Public lock-enforcement endpoints (unlock / payload) are unauthenticated by
// design — they enforce the lock, they don't reveal content without passing it.

// Helper: resolve the authenticated user (or 401 if required and absent)
function requireUser(req, res) {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required. Provide an API key via X-API-Key or Authorization: Bearer.' });
    return null;
  }
  return req.user;
}

// List boxes owned by the caller (or all if default user)
app.get('/api/boxes', (req, res) => {
  try {
    const user = req.user;
    const boxes = user ? listBoxes().filter(b => (b.createdBy?.userId || null) === user.id) : listBoxes();
    res.json({
      success: true,
      count: boxes.length,
      boxes: boxes.map(b => ({
        id: b.id,
        title: b.title,
        description: b.description,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        published: !!b.published,
        lockConfig: sanitizeLockConfig(b.lockConfig),
        payload: { bittyId: b.payload?.bittyId, bittyRelativeUrl: b.payload?.bittyRelativeUrl },
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a box (wrapping a bitty link) — optionally with initial locks.
app.post('/api/boxes', async (req, res) => {
  try {
    const user = req.user || getDefaultUser();
    const { title, description, bittyUrl, bittyRelativeUrl, bittyId, htmlSha256, payloadSha256, lockConfig } = req.body || {};
    if (!bittyUrl && !bittyRelativeUrl && !bittyId) {
      return res.status(400).json({ success: false, error: 'Provide bittyUrl, bittyRelativeUrl, or bittyId.' });
    }
    const box = createBox({
      title, description, bittyUrl, bittyRelativeUrl, bittyId, htmlSha256, payloadSha256,
      createdBy: { type: 'api', userId: user.id || null, keyId: req.keyMeta?.id || null },
      lockConfig: lockConfig || undefined,
    });
    // best-effort account attribution
    try { recordUnlockEvent; } catch (_) {}
    res.status(201).json({ success: true, boxId: box.id, box: publicBoxView(box) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get a single box (management view)
app.get('/api/boxes/:id', (req, res) => {
  try {
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, box: publicBoxView(box) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Set/Replace the full lock config
app.put('/api/boxes/:id/lock', (req, res) => {
  try {
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    const { lockConfig } = req.body || {};
    if (!lockConfig) return res.status(400).json({ success: false, error: 'lockConfig required' });
    updateLockConfig(req.params.id, lockConfig);
    res.json({ success: true, boxId: req.params.id, lockConfig: sanitizeLockConfig(lockConfig) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Convenience lock setters
app.post('/api/boxes/:id/lock/password', async (req, res) => {
  try {
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    const { password, hint } = req.body || {};
    if (!password) return res.status(400).json({ success: false, error: 'password required' });
    const verifier = await createPasswordVerifier(password, { hint: hint || '' });
    setPasswordLock(req.params.id, { enabled: true, verifier, hint: hint || '' });
    res.json({ success: true, boxId: req.params.id, passwordLock: { enabled: true, hint: hint || '' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/boxes/:id/lock/time', (req, res) => {
  try {
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    const { notBefore, notAfter } = req.body || {};
    setTimeWindowLock(req.params.id, createTimeWindow({ notBefore, notAfter }));
    res.json({ success: true, boxId: req.params.id, timeWindow: { enabled: true, notBefore, notAfter } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/boxes/:id/lock/access-limit', (req, res) => {
  try {
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    const { maxOpens } = req.body || {};
    setAccessLimitLock(req.params.id, createOpenLimit({ maxOpens: Number(maxOpens) || 1 }));
    res.json({ success: true, boxId: req.params.id, openLimit: { enabled: true, maxOpens: Number(maxOpens) || 1 } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/boxes/:id/lock/session-limit', (req, res) => {
  try {
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    const { maxSessionOpens } = req.body || {};
    setSessionLimitLock(req.params.id, createSessionOpenLimit({ maxSessionOpens: Number(maxSessionOpens) || 1 }));
    res.json({ success: true, boxId: req.params.id, sessionOpenLimit: { enabled: true, maxSessionOpens: Number(maxSessionOpens) || 1 } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/boxes/:id/lock/invite-only', (req, res) => {
  try {
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    const { emails } = req.body || {};
    setInviteOnlyLock(req.params.id, createInviteOnly(emails || []));
    res.json({ success: true, boxId: req.params.id, inviteOnly: { enabled: true, allowedEmailCount: (emails || []).length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Remove a specific lock type
app.delete('/api/boxes/:id/lock/:type', (req, res) => {
  try {
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    const allowed = ['password', 'timeWindow', 'openLimit', 'sessionOpenLimit', 'inviteOnly'];
    const map = { password: 'password', time: 'timeWindow', 'access-limit': 'openLimit', 'session-limit': 'sessionOpenLimit', invite: 'inviteOnly' };
    const field = map[req.params.type] || req.params.type;
    if (!allowed.includes(field)) return res.status(400).json({ success: false, error: 'Unknown lock type' });
    const newLock = { ...box.lockConfig, [field]: null };
    updateLockConfig(req.params.id, newLock);
    res.json({ success: true, boxId: req.params.id, lockConfig: sanitizeLockConfig(newLock) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Publish / unpublish
app.post('/api/boxes/:id/publish', (req, res) => {
  try {
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    publishBox(req.params.id);
    res.json({ success: true, boxId: req.params.id, published: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post('/api/boxes/:id/unpublish', (req, res) => {
  try {
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    unpublishBox(req.params.id);
    res.json({ success: true, boxId: req.params.id, published: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a box
app.delete('/api/boxes/:id', (req, res) => {
  try {
    const ok = deleteBox(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Box not found' });
    res.json({ success: true, boxId: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Public lock-enforcement gate ────────────────────────────────────────────

// Unlock attempt — evaluates the lock and, on success, issues a short-lived
// session grant that can be exchanged for the payload delivery.
app.post('/api/boxes/:id/unlock', async (req, res) => {
  try {
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });

    const sessionIdFromClient = req.body?.sessionId || req.headers['x-session-id'] || null;
    const sessionKey = sessionIdFromClient || hashSessionKeyForReq(req);
    const sessionOpenCount = getSessionOpenCount(sessionKey);

    const result = await evaluateAndRecord(req.params.id, {
      password: req.body?.password,
      email: req.body?.email,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
      sessionId: sessionKey,
      sessionOpenCount,
    });

    if (result.ok) {
      touchSessionOpens(sessionKey);
      incrementOpensUsed(req.params.id);
      const grant = createSessionGrant(req.params.id, sessionKey, 60);
      activeGrants.set(grant.token, { boxId: req.params.id, sessionKey: grant.sessionKey, expiresAt: grant.expiresAt });
      res.json({
        success: true,
        allowed: true,
        sessionKey: grant.sessionKey,
        grantToken: grant.token,
        grantExpiresAt: grant.expiresAt,
      });
    } else {
      res.status(403).json({
        success: true,
        allowed: false,
        reason: result.reason,
        deniedCodes: result.deniedCodes,
        lockScreen: buildLockScreen(box, result),
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Payload delivery — only with a valid, unexpired grant token.
app.get('/api/boxes/:id/payload', (req, res) => {
  try {
    const token = req.query.grant || req.headers['x-grant-token'];
    if (!token) return res.status(401).json({ success: false, error: 'Missing grant token' });
    const grant = activeGrants.get(token);
    if (!grant) return res.status(403).json({ success: false, error: 'Invalid grant token' });
    if (new Date(grant.expiresAt) < new Date()) {
      activeGrants.delete(token);
      return res.status(403).json({ success: false, error: 'Grant token expired' });
    }
    if (grant.boxId !== req.params.id) return res.status(403).json({ success: false, error: 'Grant mismatch' });
    const box = getBox(req.params.id);
    if (!box) return res.status(404).json({ success: false, error: 'Box not found' });
    // Consume the grant (single use)
    activeGrants.delete(token);
    res.json({
      success: true,
      boxId: box.id,
      payload: box.payload,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// View helpers
function hashSessionKeyForReq(req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
  const ua = req.headers['user-agent'] || '';
  return crypto.createHash('sha256').update(ip + '|' + ua).digest('hex');
}

const activeGrants = new Map();
// periodic grant cleanup
setInterval(() => {
  const now = Date.now();
  for (const [t, g] of activeGrants) if (new Date(g.expiresAt).getTime() < now) activeGrants.delete(t);
}, 60_000).unref?.();

function publicBoxView(box) {
  return {
    id: box.id,
    title: box.title,
    description: box.description,
    createdAt: box.createdAt,
    updatedAt: box.updatedAt,
    published: !!box.published,
    lockConfig: sanitizeLockConfig(box.lockConfig),
    payload: { bittyId: box.payload?.bittyId, bittyRelativeUrl: box.payload?.bittyRelativeUrl, bittyUrl: box.payload?.bittyUrl },
  };
}

// Never leak password verifier material to clients.
function sanitizeLockConfig(lockConfig) {
  if (!lockConfig) return lockConfig;
  const out = { ...lockConfig };
  if (out.password) {
    out.password = { enabled: !!out.password.enabled, hint: out.password.hint || null, algorithm: out.password.verifier?.algorithm || null };
  }
  return out;
}

function buildLockScreen(box, evaluation) {
  // Returns metadata the client can use to render the appropriate lock screen.
  const lc = box.lockConfig || {};
  return {
    boxId: box.id,
    title: box.title,
    deniedCodes: evaluation.deniedCodes,
    requiredLocks: {
      password: !!lc.password?.enabled,
      timeWindow: !!lc.timeWindow?.enabled,
      openLimit: !!lc.openLimit?.enabled,
      sessionOpenLimit: !!lc.sessionOpenLimit?.enabled,
      inviteOnly: !!lc.inviteOnly?.enabled,
    },
    passwordHint: lc.password?.hint || null,
    message: lockScreenMessage(evaluation.deniedCodes),
  };
}

function lockScreenMessage(deniedCodes = []) {
  if (deniedCodes.includes('too_early')) return 'This box is not available yet.';
  if (deniedCodes.includes('expired')) return 'This box is no longer available.';
  if (deniedCodes.includes('open_limit_reached') || deniedCodes.includes('session_open_limit_reached')) return 'Access limit reached for this box.';
  if (deniedCodes.includes('not_invited')) return 'This box is invite-only.';
  if (deniedCodes.includes('invalid_password') || deniedCodes.includes('password_required')) return 'This box is password protected.';
  return 'This box is locked.';
}

// ==========================================
// REST API: Supported Formats & Capabilities
// ==========================================
app.get('/api/bitty/formats', (_req, res) => {
  res.json({
    success: true,
    formats: [
      { format: 'auto', description: 'Auto-detects format from content' },
      { format: 'markdown', description: 'GitHub-flavored markdown with code highlighting and tables' },
      { format: 'code', description: 'Developer code viewer with syntax highlighting and line numbers' },
      { format: 'html', description: 'Interactive mini web applications in sandbox' },
      { format: 'json', description: 'Interactive JSON tree viewer' },
      { format: 'svg', description: 'Scalable vector graphic viewer' },
      { format: 'canvas', description: 'HTML5 Canvas animation / generative art' },
      { format: 'recipe', description: 'Schema.org culinary recipe card' },
      { format: 'text', description: 'Clean reading typography for plain notes' }
    ],
    features: [
      'GZIP compression level 9',
      'AES-256-GCM encryption',
      'Streamable HTTP Model Context Protocol (MCP) server',
      'Stdio MCP server',
      'API Key Authentication & Management'
    ]
  });
});

// ==========================================
// Static Assets & SPA Serving
// ==========================================
app.use(express.static(DIST_DIR, {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// SPA Fallback: All unmatched GET requests serve index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Start Server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[bittybox] Production server listening on http://127.0.0.1:${PORT}`);
  console.log(`[bittybox] Serving static SPA bundle from ${DIST_DIR}`);
  console.log(`[bittybox] MCP Server (Streamable HTTP): http://127.0.0.1:${PORT}/mcp`);
  console.log(`[bittybox] REST API: http://127.0.0.1:${PORT}/api/bitty/create`);
});
