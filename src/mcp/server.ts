import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { TOOLS } from '../meta/status.js';
import { apiRouter } from '../routes/api.js';
import fs from 'node:fs';
import path from 'node:path';

const STORE_DIR = process.env.BITTYBOX_STORE_DIR ?? path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'boxes.json');
function readStore(): Record<string, any> {
  try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')); } catch { return {}; }
}
function writeStore(s: Record<string, any>) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(s, null, 2));
}

// One MCP server instance, reused for both HTTP (SSE) and stdio later.
export function buildMcpServer(): McpServer {
  const mcp = new McpServer({ name: 'bittybox', version: '1.0.0' });

  (mcp as any).tool('create_box', 'Create a new portable BittyBox micro-site', {
    content: z.string().min(1).max(1_000_000),
    meta: z.record(z.string(), z.any()).optional(),
  }, async ({ content, meta }: { content: string; meta?: Record<string, any> }) => {
    const id = `box_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const rec = { id, content, meta: meta ?? {}, createdAt: Date.now() };
    const s = readStore(); s[id] = rec; writeStore(s);
    return { content: [{ type: 'text', text: JSON.stringify(rec) }] };
  });

  (mcp as any).tool('get_box', 'Fetch a stored box by id', { id: z.string() }, async ({ id }: { id: string }) => {
    const b = readStore()[id];
    if (!b) return { content: [{ type: 'text', text: JSON.stringify({ error: 'not_found' }) }] };
    return { content: [{ type: 'text', text: JSON.stringify(b) }] };
  });

  (mcp as any).tool('list_boxes', 'List stored boxes', {}, async () => {
    return { content: [{ type: 'text', text: JSON.stringify(Object.values(readStore())) }] };
  });

  return mcp;
}

// Mount MCP over SSE on the Express app (HTTP-transport MCP at /mcp).
export function registerMcp(app: express.Express) {
  const transports: Record<string, SSEServerTransport> = {};
  app.get('/mcp/sse', async (_req, res) => {
    const transport = new SSEServerTransport('/mcp/messages', res);
    transports[transport.sessionId] = transport;
    res.on('close', () => delete transports[transport.sessionId]);
    const mcp = buildMcpServer();
    await mcp.connect(transport);
  });
  app.post('/mcp/messages', async (req, res) => {
    const sid = String(req.query.sessionId ?? '');
    const t = transports[sid];
    if (!t) return res.status(404).json({ error: 'no_session' });
    await t.handlePostMessage(req, res);
  });
}
