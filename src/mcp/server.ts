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

import { authenticateUserFromRequest } from '../routes/accounts.js';
import { readAccounts, saveAccounts } from '../routes/magic-auth.js';

const ACCOUNTS_FILE = process.env.BITTYBOX_ACCOUNTS_FILE ?? '/var/lib/bittybox/accounts.json';

// One MCP server instance, optionally scoped to an authenticated user.
export function buildMcpServer(user?: Record<string, any>): McpServer {
  const mcp = new McpServer({ name: 'bittybox', version: '1.0.0' });

  (mcp as any).tool('create_box', 'Create a new portable Bitty Box micro-site', {
    content: z.string().min(1).max(1_000_000),
    title: z.string().optional(),
    format: z.string().optional(),
    meta: z.record(z.string(), z.any()).optional(),
  }, async ({ content, title, format, meta }: { content: string; title?: string; format?: string; meta?: Record<string, any> }) => {
    const id = `box_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const boxTitle = title || meta?.title || 'Bitty Box Capsule';
    const boxFormat = format || meta?.format || 'html';
    const rec = {
      id,
      content,
      title: boxTitle,
      format: boxFormat,
      userId: user?.id,
      meta: { ...(meta ?? {}), userId: user?.id, createdAt: new Date().toISOString() },
      createdAt: Date.now(),
    };
    const s = readStore();
    s[id] = rec;
    writeStore(s);

    // If authenticated, log to user's account in accounts.json
    if (user?.id) {
      try {
        const accounts = readAccounts(ACCOUNTS_FILE);
        const liveUser = accounts.users?.[user.id];
        if (liveUser) {
          const links = Array.isArray(liveUser.links) ? liveUser.links : [];
          liveUser.links = links;
          (links as any[]).unshift({
            id,
            title: boxTitle,
            url: meta?.url || `https://bittybox.org/#${id}`,
            format: boxFormat,
            byteSize: Buffer.byteLength(content, 'utf8'),
            compressedSize: meta?.compressedBytes || 0,
            encrypted: false,
            createdAt: new Date().toISOString(),
          });
          saveAccounts(ACCOUNTS_FILE, accounts);
        }
      } catch (err) {
        console.warn('[mcp] Error logging box to user account:', err);
      }
    }

    return { content: [{ type: 'text', text: JSON.stringify(rec) }] };
  });

  (mcp as any).tool('get_box', 'Fetch one of your stored boxes by id', { id: z.string() }, async ({ id }: { id: string }) => {
    // SECURITY: a previous revision allowed any (even unauthenticated) MCP client to
    // read ANY box by id. Reads are now scoped to the authenticated user.
    if (!user?.id) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'authentication_required', message: 'Authenticate with an API key or session to read boxes.' }) }] };
    }
    const b = readStore()[id];
    const owns = b && (b.userId === user.id || b.meta?.userId === user.id);
    if (!b || !owns) return { content: [{ type: 'text', text: JSON.stringify({ error: 'not_found' }) }] };
    return { content: [{ type: 'text', text: JSON.stringify(b) }] };
  });

  (mcp as any).tool('list_boxes', 'List your stored boxes', {}, async () => {
    // SECURITY: a previous revision returned EVERY stored box to unauthenticated
    // MCP clients. Listing now requires authentication and is scoped to that user.
    if (!user?.id) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'authentication_required', message: 'Authenticate with an API key or session to list boxes.' }) }] };
    }
    const all = Object.values(readStore());
    const list = all.filter((b: any) => b.userId === user.id || b.meta?.userId === user.id);
    return { content: [{ type: 'text', text: JSON.stringify(list) }] };
  });

  return mcp;
}

// Mount MCP over SSE on the Express app (HTTP-transport MCP at /mcp).
export function registerMcp(app: express.Express) {
  const transports: Record<string, { transport: SSEServerTransport; user?: Record<string, any> }> = {};

  app.get('/mcp/sse', async (req, res) => {
    let authUser: Record<string, any> | undefined;
    try {
      const accounts = readAccounts(ACCOUNTS_FILE);
      const auth = authenticateUserFromRequest(req, accounts);
      const authHeader = (req.headers.authorization || '').trim();
      const xApiKey = ((req.headers['x-api-key'] as string) || '').trim();
      const queryApiKey = ((req.query.apiKey as string) || '').trim();
      const hasKey = authHeader.includes('bb_live_') || xApiKey.startsWith('bb_live_') || queryApiKey.startsWith('bb_live_');

      if (hasKey && !auth) {
        res.status(401).json({ error: 'invalid_api_key', message: 'The provided API key is invalid or revoked.' });
        return;
      }
      if (auth) {
        authUser = auth.user;
        saveAccounts(ACCOUNTS_FILE, accounts);
      }
    } catch {}

    const transport = new SSEServerTransport('/mcp/messages', res);
    transports[transport.sessionId] = { transport, user: authUser };
    res.on('close', () => delete transports[transport.sessionId]);
    const mcp = buildMcpServer(authUser);
    await mcp.connect(transport);
  });

  app.post('/mcp/messages', async (req, res) => {
    const sid = String(req.query.sessionId ?? '');
    const entry = transports[sid];
    if (!entry) return res.status(404).json({ error: 'no_session' });
    await entry.transport.handlePostMessage(req, res);
  });
}
