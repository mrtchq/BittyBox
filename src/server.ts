import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './routes/api.js';
import { createMagicAuthRouter } from './routes/magic-auth.js';
import { openmoltRouter } from './routes/openmolt.js';
import { capsulesRouter } from './routes/capsules.js';
import { registerMcp } from './mcp/server.js';
import { serverStatus } from './meta/status.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const FIREBASE_KEY_PLACEHOLDER = '__FIREBASE_WEB_API_KEY__';

function firebaseWebApiKey(): string | null {
  const value = process.env.FIREBASE_WEB_API_KEY?.trim();
  return value || null;
}

const app = express();
const magicAuthRouter = createMagicAuthRouter();

// --- API surface ---
app.use('/api', express.json({ limit: '2mb' }));
// Account-auth sub-router must come before generic /api router.
app.use('/api/accounts/magic', magicAuthRouter);
// OpenMolt bridge MUST be mounted before the generic /api router so its
// sub-routes are not shadowed by the SPA fallback or the boxes router.
app.use('/api/openmolt', openmoltRouter);
app.use('/api', apiRouter);
// Zero-knowledge capsule lock enforcement (server holds only ciphertext + verifier).
app.use('/api', capsulesRouter);

// --- Firebase Config Endpoint ---
app.get('/firebase-config', (_req, res) => {
  try {
    const apiKey = firebaseWebApiKey();
    if (!apiKey) {
      res.status(503).json({ error: 'Firebase web configuration is unavailable' });
      return;
    }
    const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      res.setHeader('Cache-Control', 'no-store');
      res.json({ ...config, apiKey });
    } else {
      res.status(404).json({ error: 'Config not found' });
    }
  } catch {
    res.status(500).json({ error: 'Failed to load Firebase config' });
  }
});

// The browser identifier is deliberately absent from Git, including the
// committed SPA bundle. Inject it only while serving JavaScript.
app.get(/^\/assets\/([A-Za-z0-9._-]+\.js)$/, (req, res, next) => {
  try {
    const apiKey = firebaseWebApiKey();
    if (!apiKey) {
      res.status(503).type('text/plain').send('Firebase web configuration is unavailable');
      return;
    }
    const assetPath = path.join(PUBLIC_DIR, 'assets', req.params[0]);
    if (!fs.existsSync(assetPath)) {
      next();
      return;
    }
    const source = fs.readFileSync(assetPath, 'utf8');
    res.setHeader('Cache-Control', 'no-store');
    res.type('application/javascript').send(source.replaceAll(FIREBASE_KEY_PLACEHOLDER, apiKey));
  } catch {
    res.status(500).type('text/plain').send('Failed to load application bundle');
  }
});

// --- MCP surface (agent-native) ---
// Streamable HTTP requests are JSON-RPC, so parse only this route's body.
app.use('/mcp', express.json({ limit: '2mb' }));
registerMcp(app);

// --- Machine-readable discovery (single source of truth) ---
app.get('/.well-known/bittybox-agent.json', (_req, res) => {
  res.json(serverStatus());
});
app.get('/server-status', (_req, res) => {
  res.json(serverStatus());
});

// --- Landing page (built SPA) ---
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));
app.get(/^(?!\/(api|mcp|\.well-known)\/).*/, (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// --- Health ---
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[bittybox] unified server listening on http://0.0.0.0:${PORT} (landing+/api+/mcp)`);
});
