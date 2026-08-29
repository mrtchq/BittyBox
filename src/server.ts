import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './routes/api.js';
import { openmoltRouter } from './routes/openmolt.js';
import { registerMcp } from './mcp/server.js';
import { serverStatus } from './meta/status.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();

// --- API surface ---
app.use('/api', express.json({ limit: '2mb' }));
// OpenMolt bridge MUST be mounted before the generic /api router so its
// sub-routes are not shadowed by the SPA fallback or the boxes router.
app.use('/api/openmolt', openmoltRouter);
app.use('/api', apiRouter);

// --- Firebase Config Endpoint ---
app.get('/firebase-config', (_req, res) => {
  try {
    const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      res.json(config);
    } else {
      res.status(404).json({ error: 'Config not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to load Firebase config' });
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
