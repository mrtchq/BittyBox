import { Router, type Request, type Response } from 'express';
import fs from 'node:fs';

/**
 * OpenMolt bridge.
 *
 * The browser talks ONLY to these routes. This router holds the loopback
 * OpenMolt daemon token server-side and proxies authenticated requests to
 * 127.0.0.1:7777. The daemon token is never exposed to clients.
 *
 * Token resolution order:
 *   1. BITTYBOX_OPENMOLT_TOKEN env (set in /etc/bittybox/production.env)
 *   2. /root/.moltctl_token (root-only file written by openmolt-control)
 *   3. disabled (returns 503)
 */
const OMOLT_BASE = (process.env.OPENMOLT_BASE_URL ?? 'http://127.0.0.1:7777').replace(/\/$/, '');

function resolveToken(): string {
  const fromEnv = process.env.BITTYBOX_OPENMOLT_TOKEN;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  for (const p of ['/root/.moltctl_token', '/etc/bittybox/.moltctl_token']) {
    try {
      const v = fs.readFileSync(p, 'utf8').trim();
      if (v) return v;
    } catch {
      /* not present */
    }
  }
  return '';
}

// Node 18+ has global fetch; bind through any to avoid DOM-lib typing issues.
const g: any = globalThis;
const fetchImpl: (input: string, init?: any) => Promise<any> =
  g.fetch?.bind(g) ?? (() => Promise.reject(new Error('global fetch unavailable')));

export const openmoltRouter = Router();

openmoltRouter.all('*', async (req: Request, res: Response) => {
  const token = resolveToken();
  if (!token) {
    return res.status(503).json({ error: 'openmolt bridge not configured' });
  }

  // Strip the /api/openmolt prefix; the daemon exposes every route under /api.
  const sub = (req.path || '/').replace(/^\//, '');
  const upstreamPath = sub ? `/api/${sub}` : '/api';
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const url = `${OMOLT_BASE}${upstreamPath}${query}`;

  const init: any = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    try {
      init.body = JSON.stringify(req.body);
    } catch {
      /* leave unset */
    }
  }

  try {
    const upstream = await fetchImpl(url, init);
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(text);
  } catch (err: any) {
    return res.status(502).json({ error: 'openmolt upstream unreachable', detail: String(err?.message ?? err) });
  }
});
