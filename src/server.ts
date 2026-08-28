import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './routes/api.js';
import { registerMcp } from './mcp/server.js';
import { serverStatus } from './meta/status.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3012);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();

// --- API surface ---
app.use('/api', express.json({ limit: '2mb' }));
app.use('/api', apiRouter);

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

app.listen(PORT, () => {
  console.log(`[bittybox] unified server listening on :${PORT} (landing+/api+/mcp)`);
});
