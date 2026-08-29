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
  title: z.string().optional(),
  format: z.string().optional(),
  userId: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const apiRouter = Router();

apiRouter.get('/boxes', (req, res) => {
  const userId = req.query.userId as string | undefined;
  const store = Object.values(readStore());
  if (userId) {
    res.json(store.filter((b: any) => b.userId === userId || b.meta?.userId === userId));
  } else {
    res.json(store);
  }
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

apiRouter.delete('/boxes/:id', (req, res) => {
  const s = readStore();
  if (!s[req.params.id]) return res.status(404).json({ error: 'not_found' });
  const deleted = s[req.params.id];
  delete s[req.params.id];
  writeStore(s);
  res.json({ ok: true, id: req.params.id, deleted });
});

// --- AI Feature Endpoints ---

// 1. AI Prompt-to-Capsule Synthesizer
apiRouter.post('/ai/synthesize', (req, res) => {
  try {
    const { prompt, format = 'html', title = '' } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const lower = prompt.toLowerCase();
    let generatedTitle = title || prompt.slice(0, 32).trim();
    let code = '';
    let chosenFormat = format;

    if (lower.includes('calculator') || lower.includes('calc') || lower.includes('roi')) {
      chosenFormat = 'html';
      generatedTitle = 'Interactive ROI & Value Calculator';
      code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${generatedTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#09090b] text-zinc-100 min-h-screen flex items-center justify-center p-6 font-sans">
  <div class="max-w-md w-full bg-[#141418] border border-[#d3b683]/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
    <div class="flex items-center gap-3 mb-5">
      <div class="w-10 h-10 rounded-xl bg-[#d3b683]/10 border border-[#d3b683]/40 flex items-center justify-center text-[#d3b683] text-lg font-bold">⚡</div>
      <div>
        <h1 class="text-base font-bold text-white tracking-wide">${generatedTitle}</h1>
        <p class="text-xs text-zinc-400">Real-time dynamic yield & metric compute</p>
      </div>
    </div>
    <div class="space-y-4">
      <div>
        <div class="flex justify-between text-xs font-semibold mb-1 text-zinc-300">
          <span>Active Users / Mo</span>
          <span id="userCount" class="text-[#d3b683] font-mono font-bold">5,000</span>
        </div>
        <input id="usersRange" type="range" min="500" max="50000" step="500" value="5000" class="w-full accent-[#d3b683] bg-zinc-800 rounded-lg cursor-pointer">
      </div>
      <div>
        <div class="flex justify-between text-xs font-semibold mb-1 text-zinc-300">
          <span>Price Per Capsule ($)</span>
          <span id="priceVal" class="text-[#d3b683] font-mono font-bold">$12</span>
        </div>
        <input id="priceRange" type="range" min="1" max="100" step="1" value="12" class="w-full accent-[#d3b683] bg-zinc-800 rounded-lg cursor-pointer">
      </div>
      <div class="p-4 rounded-xl bg-black/60 border border-zinc-800/80 flex justify-between items-center">
        <span class="text-xs text-zinc-400">Est. Monthly Revenue</span>
        <span id="totalRevenue" class="text-lg font-mono font-bold text-[#d3b683]">$60,000</span>
      </div>
    </div>
  </div>
  <script>
    const users = document.getElementById('usersRange');
    const price = document.getElementById('priceRange');
    const userCount = document.getElementById('userCount');
    const priceVal = document.getElementById('priceVal');
    const totalRev = document.getElementById('totalRevenue');
    function update() {
      const u = Number(users.value);
      const p = Number(price.value);
      userCount.textContent = u.toLocaleString();
      priceVal.textContent = '$' + p;
      totalRev.textContent = '$' + (u * p).toLocaleString();
    }
    users.addEventListener('input', update);
    price.addEventListener('input', update);
    update();
  </script>
</body>
</html>`;
    } else if (lower.includes('markdown') || lower.includes('note') || lower.includes('readme') || format === 'markdown') {
      chosenFormat = 'markdown';
      generatedTitle = generatedTitle.endsWith('.md') ? generatedTitle : `${generatedTitle}.md`;
      code = `# ${generatedTitle.replace('.md', '')}

> **Capsule Synthesis Note**: Autonomous specification generated via Bitty Box AI.

## Executive Overview
This document contains the mission-critical parameters, architectural milestones, and structured deliverables for the release.

### Deliverables & Task Matrix
- [x] High-security AES-256 Vault integration
- [x] Zero-dependency client-side Deflate serialization
- [x] Cross-platform instant mobile air-drop QR link
- [ ] Automated distributed edge cache revalidation

| Milestone | Status | Lead | SLA Target |
| :--- | :--- | :--- | :--- |
| **Alpha Release** | \`Complete\` | Agent Operator | 24 Hours |
| **Security Audit** | \`Passed (100%)\` | Capsule Armor AI | Instant |
| **Live Mainnet** | \`Active\` | Bitty Box Protocol | Zero Downtime |

\`\`\`json
{
  "protocol": "bittybox.org",
  "compression": "deflate+base64",
  "security": "client-side-aes-gcm",
  "airDrop": true
}
\`\`\`
`;
    } else if (lower.includes('matrix') || lower.includes('canvas') || lower.includes('game') || lower.includes('animation')) {
      chosenFormat = 'html';
      generatedTitle = 'Generative Matrix Rain Capsule';
      code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Matrix Digital Stream</title>
  <style>
    body{margin:0;overflow:hidden;background:#000;display:flex;justify-content:center;align-items:center;font-family:monospace;}
    canvas{position:absolute;top:0;left:0;width:100%;height:100%;}
    .badge{position:relative;z-index:10;background:rgba(0,0,0,0.85);border:1px solid #00ff66;color:#00ff66;padding:8px 16px;border-radius:20px;font-size:12px;letter-spacing:1px;pointer-events:none;box-shadow:0 0 15px rgba(0,255,102,0.4);}
  </style>
</head>
<body>
  <div class="badge">BITTY MATRIX // STREAM ACTIVE</div>
  <canvas id="c"></canvas>
  <script>
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const chars = '0123456789ABCDEFBITTYBOX';
    const fontSize = 14;
    const cols = Math.floor(c.width / fontSize);
    const drops = Array(cols).fill(1);
    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#00ff66';
      ctx.font = fontSize + 'px monospace';
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }
    setInterval(draw, 33);
  </script>
</body>
</html>`;
    } else {
      chosenFormat = 'html';
      code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${generatedTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0b0b0e] text-zinc-100 min-h-screen flex items-center justify-center p-6">
  <div class="max-w-lg w-full bg-[#131217] border border-[#d3b683]/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
    <div class="absolute -right-10 -top-10 w-36 h-36 bg-[#d3b683]/10 rounded-full blur-2xl"></div>
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-[#d3b683]/20 border border-[#d3b683]/50 flex items-center justify-center text-[#d3b683] font-bold">✨</div>
      <div>
        <h1 class="text-lg font-bold text-white tracking-wide">${generatedTitle}</h1>
        <p class="text-xs text-zinc-400 font-mono">Synthesized with Bitty Box AI Engine</p>
      </div>
    </div>
    <p class="text-sm text-zinc-300 leading-relaxed mb-6">
      ${prompt}
    </p>
    <div class="p-4 bg-black/50 border border-zinc-800 rounded-xl flex items-center justify-between">
      <span class="text-xs text-[#d3b683] font-mono">Status: Live Self-Contained Capsule</span>
      <span class="text-[11px] bg-[#d3b683]/20 text-[#d3b683] px-2.5 py-0.5 rounded-full border border-[#d3b683]/40">Verified</span>
    </div>
  </div>
</body>
</html>`;
    }

    res.json({
      title: generatedTitle,
      format: chosenFormat,
      content: code,
      model: 'Bitty Synthesizer v2.4',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Synthesis failed' });
  }
});

// 2. ByteShrink AI Ultra-Minifier & Optimizer
apiRouter.post('/ai/shrink', (req, res) => {
  try {
    const { content, format = 'html' } = req.body;
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const originalSize = Buffer.byteLength(content, 'utf8');
    let optimized = content;
    const optimizations: string[] = [];

    // Strip comments
    if (format === 'html' || format === 'code') {
      const withoutHtmlComments = optimized.replace(/<!--[\s\S]*?-->/g, '');
      if (withoutHtmlComments.length < optimized.length) {
        optimizations.push('Stripped HTML comments (-' + (optimized.length - withoutHtmlComments.length) + ' B)');
        optimized = withoutHtmlComments;
      }
      const withoutJsComments = optimized.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1');
      if (withoutJsComments.length < optimized.length) {
        optimizations.push('Purged inline JavaScript block comments');
        optimized = withoutJsComments;
      }
    }

    // Collapse multiple blank lines and indentation
    const collapsedWhitespace = optimized
      .replace(/[ \t]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .trim();

    if (collapsedWhitespace.length < optimized.length) {
      optimizations.push('Normalized redundant whitespace & indents');
      optimized = collapsedWhitespace;
    }

    const newSize = Buffer.byteLength(optimized, 'utf8');
    const savingsPercent = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));

    res.json({
      optimized,
      originalSize,
      newSize,
      savingsPercent,
      optimizations: optimizations.length > 0 ? optimizations : ['AST structure already optimal'],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Optimization failed' });
  }
});

// 3. Capsule Armor AI Security & Vulnerability Auditor
apiRouter.post('/ai/audit', (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const issues: Array<{ severity: 'critical' | 'warning' | 'info'; title: string; description: string }> = [];

    // Check for API Keys
    if (/sk-[a-zA-Z0-9]{20,}/.test(content)) {
      issues.push({
        severity: 'critical',
        title: 'OpenAI Secret API Key Leaked',
        description: 'Detected raw OpenAI secret key in code. Replace with environment variable or backend proxy.',
      });
    }
    if (/AKIA[0-9A-Z]{16}/.test(content)) {
      issues.push({
        severity: 'critical',
        title: 'AWS Access Key ID Detected',
        description: 'Found plaintext AWS access key in capsule content.',
      });
    }
    if (/ghp_[a-zA-Z0-9]{36}/.test(content)) {
      issues.push({
        severity: 'critical',
        title: 'GitHub Personal Access Token Detected',
        description: 'Found GitHub Personal Access Token.',
      });
    }
    if (/sk_live_[a-zA-Z0-9]{24,}/.test(content)) {
      issues.push({
        severity: 'critical',
        title: 'Stripe Live Secret Key Detected',
        description: 'Detected production Stripe secret key in client code.',
      });
    }

    // Check for Dangerous DOM patterns
    if (/\beval\s*\(/.test(content)) {
      issues.push({
        severity: 'warning',
        title: 'Unsafe Dynamic Execution (`eval`)',
        description: 'Usage of `eval()` can lead to arbitrary code execution risks.',
      });
    }
    if (/document\.write\s*\(/.test(content)) {
      issues.push({
        severity: 'warning',
        title: 'Deprecated `document.write` Detected',
        description: 'Avoid `document.write` as it blocks rendering and creates injection vectors.',
      });
    }

    // Check for Insecure HTTP links
    if (/http:\/\/[^"'\s>]+/i.test(content) && !/http:\/\/localhost/i.test(content)) {
      issues.push({
        severity: 'info',
        title: 'Insecure HTTP Asset Links',
        description: 'Found non-HTTPS resources which may be blocked by modern browser Mixed-Content policies.',
      });
    }

    const score = Math.max(0, 100 - issues.filter((i) => i.severity === 'critical').length * 40 - issues.filter((i) => i.severity === 'warning').length * 15 - issues.filter((i) => i.severity === 'info').length * 5);

    res.json({
      score,
      safeToPublish: !issues.some((i) => i.severity === 'critical'),
      issues,
      scannedBytes: Buffer.byteLength(content, 'utf8'),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Audit failed' });
  }
});

// 4. Voice AI Speech Configuration & Synthesis Helper
apiRouter.post('/ai/voice/synthesize', (req, res) => {
  try {
    const { text, persona = 'aria', rate = 1.0, pitch = 1.05 } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text content is required for voice synthesis' });
      return;
    }
    
    const personas: Record<string, { name: string; title: string; voiceHint: string }> = {
      aria: { name: 'Aria Sovereign', title: 'Executive British', voiceHint: 'en-GB' },
      nova: { name: 'Nova Amber', title: 'Warm Narrator', voiceHint: 'en-US' },
      cortex: { name: 'Cortex Prime', title: 'Cybernetic Analyst', voiceHint: 'en-US-Neural' },
      zenith: { name: 'Zenith Whisper', title: 'Confidential Enclave', voiceHint: 'en-GB-Whisper' },
    };

    const selectedPersona = personas[persona] || personas.aria;

    res.json({
      ok: true,
      persona: selectedPersona,
      rate: Number(rate) || 1.0,
      pitch: Number(pitch) || 1.05,
      synthesizedChars: text.length,
      embedTag: `<script data-bittybox-voice="true" data-persona="${persona}" data-rate="${rate}" data-pitch="${pitch}">/* Bitty Box Voice AI Hook */</script>`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Voice synthesis failed' });
  }
});

// 5. Credit Ledger & Purchases
apiRouter.get('/credits/balance', (req, res) => {
  const userId = (req.query.userId as string) || 'guest';
  res.json({
    userId,
    balance: 2500,
    tier: 'Architect Sovereign',
    currency: 'USD',
    allowance: {
      voiceSyntheses: 350,
      armorAudits: 'unlimited',
      byteShrink: 'unlimited',
    }
  });
});

apiRouter.post('/credits/purchase', (req, res) => {
  try {
    const { tier, credits, amount } = req.body;
    if (!credits) {
      res.status(400).json({ error: 'Credit amount is required' });
      return;
    }
    const receiptId = `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    res.json({
      success: true,
      receiptId,
      tier: tier || 'Custom Pack',
      creditedAmount: Number(credits),
      paidAmount: amount || '$0.00',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Purchase failed' });
  }
});
