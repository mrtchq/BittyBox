import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type AccountsData = {
  version?: number;
  users?: Record<string, Record<string, unknown>>;
  magicLinks?: Record<string, MagicLinkRecord>;
  sessions?: Record<string, Record<string, unknown>>;
  apiKeys?: Record<string, unknown>;
  events?: unknown[];
};

type MagicLinkRecord = {
  email: string;
  displayName: string;
  trustDevice: boolean;
  createdAt: string;
  expiresAt: string;
};

type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  magicLink: string;
};

type SendEmail = (message: EmailMessage) => Promise<{ ok: boolean; id?: string }>;

type RouterOptions = {
  accountsFile?: string;
  appUrl?: string;
  resendApiKey?: string;
  sendEmail?: SendEmail;
  now?: () => number;
};

const MAGIC_TTL_MS = 15 * 60 * 1000;
const TRUSTED_SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const UNTRUSTED_SESSION_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAGIC_FROM = 'Bitty Box Support <support@bittybox.org>';
const requestWindowMs = 15 * 60 * 1000;

function resolveResendApiKey(explicit?: string): string {
  if (explicit && explicit.trim().length > 0) return explicit.trim();
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0) {
    return process.env.RESEND_API_KEY.trim();
  }
  const keyFiles = [
    '/root/TXT/resend-api-key-08-11-26.txt',
    '/root/TXT/resend-api-key.txt',
    '/root/TXT/resend-full-api.txt',
  ];
  for (const file of keyFiles) {
    try {
      if (existsSync(file)) {
        const value = readFileSync(file, 'utf8').trim();
        if (value.startsWith('re_')) return value;
      }
    } catch {}
  }
  return '';
}

function resolveSenderFrom(): string {
  const envFrom = process.env.RESEND_DEFAULT_FROM?.trim().replace(/^"|"$/g, '');
  return envFrom || DEFAULT_MAGIC_FROM;
}

function tokenDigest(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function safeDisplayName(value: unknown, email: string): string {
  if (typeof value !== 'string') return email.split('@')[0] || 'Builder';
  return value.trim().slice(0, 120) || email.split('@')[0] || 'Builder';
}

function readAccounts(accountsFile: string): AccountsData {
  if (!existsSync(accountsFile)) {
    return { version: 1, users: {}, magicLinks: {}, sessions: {}, apiKeys: {}, events: [] };
  }
  try {
    const data = JSON.parse(readFileSync(accountsFile, 'utf8')) as AccountsData;
    return {
      ...data,
      version: data.version ?? 1,
      users: data.users ?? {},
      magicLinks: data.magicLinks ?? {},
      sessions: data.sessions ?? {},
      apiKeys: data.apiKeys ?? {},
      events: data.events ?? [],
    };
  } catch {
    throw new Error('Account storage is unavailable');
  }
}

function saveAccounts(accountsFile: string, data: AccountsData): void {
  mkdirSync(path.dirname(accountsFile), { recursive: true, mode: 0o700 });
  const temporary = `${accountsFile}.tmp.${process.pid}.${randomBytes(6).toString('hex')}`;
  try {
    writeFileSync(temporary, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
    renameSync(temporary, accountsFile);
  } finally {
    // The rename is atomic; no cleanup is needed after success. Failed writes never
    // replace the authoritative account file.
  }
}

function cleanupExpiredMagicLinks(data: AccountsData, now: number): void {
  for (const [key, record] of Object.entries(data.magicLinks ?? {})) {
    if (!record?.expiresAt || Number.isNaN(Date.parse(record.expiresAt)) || Date.parse(record.expiresAt) <= now) {
      delete data.magicLinks![key];
    }
  }
}

function sanitizeUser(user: Record<string, unknown>): Record<string, unknown> {
  const { passwordHash: _passwordHash, ...safe } = user;
  const apiKeys = Array.isArray(safe.apiKeys)
    ? safe.apiKeys.map((key) => {
      if (!key || typeof key !== 'object') return key;
      const { hash: _hash, ...keySafe } = key as Record<string, unknown>;
      return keySafe;
    })
    : [];
  return { ...safe, apiKeys };
}

function emailHtml(displayName: string, magicLink: string): string {
  const escapedName = displayName.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] ?? character));
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bitty Box Access Clearance</title>
  </head>
  <body style="margin:0;padding:0;background:#08080a;color:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">Your Bitty Box access clearance expires in 15 minutes. Verified sender cue from support@bittybox.org.</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#08080a;padding:36px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background:#131316;border:1px solid #332f26;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.85)">
            <!-- Gold Luxury Accent Bar -->
            <tr>
              <td style="height:4px;background:#d8bb82"></td>
            </tr>

            <!-- Header & Clearance Badge -->
            <tr>
              <td style="padding:34px 34px 16px">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td>
                      <p style="margin:0;color:#d8bb82;font-size:12px;font-weight:700;letter-spacing:2px;font-family:monospace">BITTY BOX // SECURITY CLEARANCE</p>
                    </td>
                    <td align="right">
                      <span style="display:inline-block;padding:5px 12px;border:1px solid #675934;border-radius:999px;color:#f1d79e;background:#242014;font-size:11px;font-weight:700;letter-spacing:1.2px;font-family:monospace">ACCESS CLEARANCE</span>
                    </td>
                  </tr>
                </table>
                <h1 style="margin:22px 0 12px;color:#ffffff;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.4px">Your workspace clearance is ready.</h1>
                <p style="margin:0;color:#c9c6bf;font-size:15px;line-height:1.6">Hello <strong>${escapedName}</strong>,</p>
                <p style="margin:12px 0 0;color:#aaa7a0;font-size:14px;line-height:1.6">
                  You requested single-use access to your Bitty Box workspace. Use this one-time clearance token to open your account instantly without passwords.
                </p>
              </td>
            </tr>

            <!-- Primary Action Button -->
            <tr>
              <td style="padding:16px 34px 28px">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius:10px;background:#d8bb82;box-shadow:0 4px 16px rgba(216,187,130,0.3)">
                      <a href="${magicLink}" style="display:inline-block;padding:16px 28px;border-radius:10px;background:#d8bb82;color:#110f0a;font-size:13px;font-weight:800;letter-spacing:1px;text-decoration:none;font-family:monospace">OPEN MY BITTY BOX &#8594;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Visible Expiry Box -->
            <tr>
              <td style="padding:0 34px 20px">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1c1913;border:1px solid #4a3e23;border-radius:12px">
                  <tr>
                    <td style="padding:16px 18px">
                      <div style="color:#f1d79e;font-size:11px;font-weight:700;letter-spacing:1px;font-family:monospace;margin-bottom:5px">&#9201; EXPIRES IN 15 MINUTES</div>
                      <div style="color:#aba79d;font-size:13px;line-height:1.5">
                        This clearance token is single-use and invalidates immediately upon redemption. If not redeemed within 15 minutes, it permanently self-terminates.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Verified Sender Cue: Trust Weapon -->
            <tr>
              <td style="padding:0 34px 24px">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0f1513;border:1px solid #204632;border-radius:12px">
                  <tr>
                    <td style="padding:16px 18px">
                      <div style="color:#4ade80;font-size:11px;font-weight:700;letter-spacing:1px;font-family:monospace;margin-bottom:6px">&#128737;&#65039; VERIFIED SENDER CUE // AUTHENTIC DISPATCH</div>
                      <div style="color:#b5c4bc;font-size:13px;line-height:1.5">
                        Legitimate Bitty Box sign-in emails come from <a href="mailto:support@bittybox.org" style="color:#f1d79e;text-decoration:none;font-weight:700">Bitty Box Support &lt;support@bittybox.org&gt;</a>.
                      </div>
                      <div style="color:#71877b;font-size:12px;line-height:1.5;margin-top:6px">
                        Cryptographically signed and delivered via Resend. We will never ask for your password in this email, nor will any Bitty Box engineer ask you to share this clearance link.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Direct Link Fallback -->
            <tr>
              <td style="padding:0 34px 28px">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0c0c0e;border:1px solid #252528;border-radius:10px">
                  <tr>
                    <td style="padding:12px 14px">
                      <div style="color:#6e6d75;font-size:10px;font-weight:700;letter-spacing:0.8px;font-family:monospace;margin-bottom:4px">DIRECT CLEARANCE LINK:</div>
                      <a href="${magicLink}" style="color:#d8bb82;font-size:11px;font-family:monospace;word-break:break-all;line-height:1.4;text-decoration:none">${magicLink}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer Advisory -->
            <tr>
              <td style="padding:22px 34px 30px;border-top:1px solid #262420;background:#0d0d10">
                <p style="margin:0 0 8px;color:#78756f;font-size:12px;line-height:1.5">
                  If you did not request access, ignore this message. No action is needed and your account remains secure.
                </p>
                <p style="margin:0;color:#504e4a;font-size:11px;font-family:monospace">
                  Bitty Box &#8226; Luxury private capsules for the micro-web &#8226; <a href="https://bittybox.org" style="color:#78756f;text-decoration:none">bittybox.org</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function emailText(displayName: string, magicLink: string): string {
  return `BITTY BOX // ACCESS CLEARANCE
============================================================
CLEARANCE RECIPIENT: ${displayName}
VALIDITY WINDOW:     Expires in 15 minutes (single-use token)
VERIFIED SENDER:     support@bittybox.org (Bitty Box Support)
============================================================

Hello ${displayName},

You asked to enter Bitty Box. Use this one-time clearance to open your workspace.

OPEN MY BITTY BOX:
${magicLink}

⏱️ VISIBLE EXPIRY:
Expires in 15 minutes. This link works once.

🛡️ VERIFIED SENDER CUE:
Only trust sign-in links delivered from support@bittybox.org. Bitty Box will never ask for your password in this email, and staff will never ask you to forward this clearance token.

If you did not request access, ignore this message. No action is needed.

------------------------------------------------------------
Bitty Box • luxury private capsules for the micro-web
https://bittybox.org
`;
}

async function sendWithResend(apiKey: string, message: EmailMessage): Promise<{ ok: boolean; id?: string }> {
  if (!apiKey) {
    console.error('[magic-auth] Resend delivery skipped: No API key resolved.');
    return { ok: false };
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        reply_to: 'support@bittybox.org',
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[magic-auth] Resend delivery failed (HTTP ${response.status}):`, errText);
      return { ok: false };
    }
    const payload = await response.json().catch(() => ({})) as { id?: string };
    console.log(`[magic-auth] Clearance email successfully dispatched via Resend (ID: ${payload.id || 'ok'})`);
    return { ok: true, id: payload.id };
  } catch (err) {
    console.error('[magic-auth] Exception dispatching via Resend:', err);
    return { ok: false };
  }
}

export function createMagicAuthRouter(options: RouterOptions = {}): Router {
  const accountsFile = options.accountsFile ?? process.env.BITTYBOX_ACCOUNTS_FILE ?? '/var/lib/bittybox/accounts.json';
  const appUrl = (options.appUrl ?? process.env.APP_URL ?? 'https://bittybox.org').replace(/\/+$/, '');
  const now = options.now ?? (() => Date.now());
  const resendApiKey = resolveResendApiKey(options.resendApiKey);
  const senderFrom = resolveSenderFrom();
  const sender = options.sendEmail ?? ((message: EmailMessage) => sendWithResend(resendApiKey, message));
  const requestWindows = new Map<string, number[]>();

  function permitted(key: string, limit: number): boolean {
    const current = now();
    const retained = (requestWindows.get(key) ?? []).filter((time) => current - time < requestWindowMs);
    if (retained.length >= limit) {
      requestWindows.set(key, retained);
      return false;
    }
    retained.push(current);
    requestWindows.set(key, retained);
    return true;
  }

  const router = Router();

  router.post('/request', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      res.status(400).json({ success: false, error: 'A valid email address is required.' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!permitted(`email:${email}`, 3) || !permitted(`ip:${ip}`, 10)) {
      res.status(429).json({ success: false, error: 'Please wait before requesting another sign-in link.' });
      return;
    }

    const issuedAt = now();
    const token = `bb_magic_${randomBytes(32).toString('base64url')}`;
    const digest = tokenDigest(token);
    const displayName = safeDisplayName(req.body?.displayName, email);
    const trustDevice = req.body?.trustDevice !== false;
    const magicLink = `${appUrl}/#/auth/verify?token=${encodeURIComponent(token)}`;

    try {
      const accounts = readAccounts(accountsFile);
      cleanupExpiredMagicLinks(accounts, issuedAt);
      accounts.magicLinks![digest] = {
        email,
        displayName,
        trustDevice,
        createdAt: new Date(issuedAt).toISOString(),
        expiresAt: new Date(issuedAt + MAGIC_TTL_MS).toISOString(),
      };
      saveAccounts(accountsFile, accounts);

      const delivery = await sender({
        from: senderFrom,
        to: email,
        subject: 'Bitty Box access clearance',
        html: emailHtml(displayName, magicLink),
        text: emailText(displayName, magicLink),
        magicLink,
      });
      if (!delivery.ok) {
        const rollback = readAccounts(accountsFile);
        if (rollback.magicLinks?.[digest]) {
          delete rollback.magicLinks[digest];
          saveAccounts(accountsFile, rollback);
        }
        res.status(503).json({ success: false, error: 'Email delivery is temporarily unavailable. Please try again shortly.' });
        return;
      }

      res.status(202).json({ success: true, message: 'If that address can receive email, a sign-in link is on its way.' });
    } catch {
      res.status(503).json({ success: false, error: 'Email delivery is temporarily unavailable. Please try again shortly.' });
    }
  });

  router.post('/verify', (req, res) => {
    const token = req.body?.token;
    if (typeof token !== 'string' || !/^bb_magic_[A-Za-z0-9_-]{32,256}$/.test(token)) {
      res.status(400).json({ success: false, error: 'This sign-in link is invalid, expired, or has already been used.' });
      return;
    }

    try {
      const issuedAt = now();
      const accounts = readAccounts(accountsFile);
      cleanupExpiredMagicLinks(accounts, issuedAt);
      const digest = tokenDigest(token);
      const record = accounts.magicLinks?.[digest];
      if (!record || Date.parse(record.expiresAt) <= issuedAt) {
        res.status(400).json({ success: false, error: 'This sign-in link is invalid, expired, or has already been used.' });
        return;
      }

      delete accounts.magicLinks![digest];
      const users = accounts.users!;
      let user = Object.values(users).find((candidate) => String(candidate.email ?? '').toLowerCase() === record.email);
      if (!user) {
        const userId = `bb_usr_${randomBytes(7).toString('hex')}`;
        user = {
          id: userId,
          email: record.email,
          displayName: record.displayName,
          tier: 'Pro Builder',
          avatar: '⚡',
          credits: 0,
          creditsUsedTotal: 0,
          creditsHumanUsed: 0,
          creditsApiUsed: 0,
          creditsMcpUsed: 0,
          joinedDate: new Date(issuedAt).toISOString(),
          lastSignedInAt: new Date(issuedAt).toISOString(),
          settings: { autoSaveLinks: true },
          apiKeys: [],
          links: [],
          transactions: [],
          lastBonusClaim: null,
        };
        users[userId] = user;
      }

      user.lastSignedInAt = new Date(issuedAt).toISOString();
      const trusted = req.body?.trustDevice !== undefined ? Boolean(req.body.trustDevice) : record.trustDevice;
      const expiresAt = new Date(issuedAt + (trusted ? TRUSTED_SESSION_MS : UNTRUSTED_SESSION_MS)).toISOString();
      const settings = (user.settings && typeof user.settings === 'object' ? user.settings : {}) as Record<string, unknown>;
      settings.trustThisDevice = trusted;
      settings.deviceTrustExpiresAt = expiresAt;
      user.settings = settings;

      const sessionId = `bb_sess_${randomBytes(24).toString('hex')}`;
      accounts.sessions![sessionId] = { sessionId, userId: user.id, createdAt: new Date(issuedAt).toISOString(), expiresAt, trusted };
      saveAccounts(accountsFile, accounts);

      res.json({ success: true, user: sanitizeUser(user), sessionId, trusted, expiresAt, message: 'Successfully authenticated via magic link.' });
    } catch {
      res.status(503).json({ success: false, error: 'Sign-in is temporarily unavailable. Please request a new link.' });
    }
  });

  return router;
}
