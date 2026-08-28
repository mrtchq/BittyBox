import { Router } from 'express';
import { z } from 'zod';

import path from 'node:path';
import fs from 'node:fs';

// Greenfield box store: minimal, file-backed.
const STORE_DIR = process.env.BITTYBOX_STORE_DIR ?? path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'boxes.json');

function readStore(): Record<string, any> {
  try {
    fs.mkdirSync(STORE_DIR, { recursive: true });
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch {
    return {};
  }
}
function writeStore(s: Record<string, any>) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(s, null, 2));
}

const boxSchema = z.object({
  content: z.string().min(1).max(1_000_000),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const apiRouter = Router();

apiRouter.get('/boxes', (_req, res) => {
  res.json(Object.values(readStore()));
});

apiRouter.get('/boxes/:id', (req, res) => {
  const s = readStore();
  const b = s[req.params.id];
  if (!b) return res.status(404).json({ error: 'not_found' });
  res.json(b);
});

apiRouter.post('/boxes', (req, res) => {
  const parsed = boxSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid', details: parsed.error.flatten() });
  }
  const id = `box_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const rec = { id, ...parsed.data, createdAt: Date.now() };
  const s = readStore();
  s[id] = rec;
  writeStore(s);
  res.status(201).json(rec);
});
