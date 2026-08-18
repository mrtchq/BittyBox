import express from 'express';
import path from 'path';
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
