import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createBittyLink, decodeBittyLink, DEFAULT_DOMAIN } from '../lib/bitty-engine.js';
import {
  createBox, getBox, listBoxes, deleteBox,
  setPasswordLock, setTimeWindowLock, setAccessLimitLock, setSessionLimitLock, setInviteOnlyLock,
  createInviteOnly, createTimeWindow, createOpenLimit, createSessionOpenLimit,
  evaluateAndRecord, getSessionOpenCount, touchSessionOpens, publishBox
} from '../lib/box-store.js';
import { createPasswordVerifier, createSessionGrant } from '../lib/policy-evaluator.js';

export function buildMcpServer() {
  const server = new McpServer({
    name: 'bittybox',
    version: '2.0.0'
  });

  // Tool 1: Universal Bitty Link Creator
  server.tool(
    'create_bitty_link',
    'Create a self-contained Bitty Link URL for any text, code, markdown, HTML, SVG, JSON, or canvas to be rendered directly in the browser without backend storage. The compressed payload is contained entirely in the URL hash.',
    {
      content: z.string().describe('The content to encode (text, code, markdown, HTML, JSON, SVG, etc.)'),
      title: z.string().optional().describe('Document or window title (e.g. "My Script", "Project Plan", "Data Summary")'),
      format: z.enum(['auto', 'markdown', 'code', 'html', 'text', 'json', 'svg', 'canvas', 'recipe', 'raw'])
        .optional()
        .default('auto')
        .describe('Rendering format. "auto" automatically detects markdown, HTML, code, or JSON. "code" provides syntax highlighting and line numbers. "markdown" provides rich typography and dark/light mode.'),
      language: z.string().optional().describe('Programming language if format is code (e.g. python, typescript, javascript, bash, sql, rust, go, html, css, json, yaml)'),
      theme: z.enum(['auto', 'dark', 'light']).optional().default('auto').describe('Theme styling for markdown, code, and viewer templates'),
      editable: z.boolean().optional().default(false).describe('Whether to open directly in Bitty Box editable note mode'),
      password: z.string().optional().describe('Optional password to encrypt the document using AES-256-GCM'),
      domain: z.string().optional().describe(`Base domain for the generated link (default: ${DEFAULT_DOMAIN})`)
    },
    async (args) => {
      try {
        const result = await createBittyLink(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating Bitty link: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // Tool 2: Code Bitty Link Creator
  server.tool(
    'create_code_bitty_link',
    'Create a developer-grade syntax-highlighted code viewer Bitty Link with line numbers, copy button, download button, and dark/light themes.',
    {
      code: z.string().describe('The raw source code to display'),
      language: z.string().optional().describe('Programming language (e.g. python, typescript, javascript, rust, go, bash, sql, json, yaml, html, css)'),
      title: z.string().optional().describe('File name or title (e.g. "main.py", "database.sql", "Deploy Script")'),
      theme: z.enum(['dark', 'light', 'auto']).optional().default('dark').describe('Color theme (dark or light)')
    },
    async (args) => {
      try {
        const result = await createBittyLink({
          content: args.code,
          format: 'code',
          language: args.language,
          title: args.title,
          theme: args.theme
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating code Bitty link: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // Tool 3: Markdown Bitty Link Creator
  server.tool(
    'create_markdown_bitty_link',
    'Create a rich Markdown document Bitty Link with GitHub-flavored markdown, syntax-highlighted code blocks, tables, task lists, and reading stats.',
    {
      markdown: z.string().describe('Markdown formatted text'),
      title: z.string().optional().describe('Document title'),
      theme: z.enum(['auto', 'dark', 'light']).optional().default('auto').describe('Color theme')
    },
    async (args) => {
      try {
        const result = await createBittyLink({
          content: args.markdown,
          format: 'markdown',
          title: args.title,
          theme: args.theme
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating markdown Bitty link: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // Tool 4: Interactive HTML Mini-Web App Creator
  server.tool(
    'create_html_bitty_link',
    'Create an interactive HTML / mini-web application Bitty Link that renders inside the secure Bitty Box client sandbox.',
    {
      html: z.string().describe('Complete HTML/CSS/JavaScript code for the web app or widget'),
      title: z.string().optional().describe('App or page title')
    },
    async (args) => {
      try {
        const result = await createBittyLink({
          content: args.html,
          format: 'html',
          title: args.title
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating HTML Bitty link: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // Tool 5: Bitty Link Decoder
  server.tool(
    'decode_bitty_link',
    'Decode an existing Bitty Link URL or hash fragment back to its original source content and metadata.',
    {
      url: z.string().describe('The full Bitty Link URL (e.g. "https://bittybox.org/#My-Title/...") or hash fragment'),
      password: z.string().optional().describe('Passcode if the Bitty Link is AES-256-GCM encrypted')
    },
    async (args) => {
      try {
        const result = await decodeBittyLink(args.url, { password: args.password });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error decoding Bitty link: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // Tool 6: Supported Formats & Capabilities
  server.tool(
    'list_supported_formats',
    'List all supported formats, templates, code languages, and link features supported by Bitty Box.',
    {},
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              supportedFormats: [
                {
                  format: 'auto',
                  description: 'Auto-detects whether the content is markdown, HTML, code, SVG, or JSON'
                },
                {
                  format: 'markdown',
                  description: 'Rich GitHub-flavored markdown with code highlighting, tables, checkboxes, dark/light themes'
                },
                {
                  format: 'code',
                  description: 'Syntax-highlighted code viewer with line numbers, copy button, and download button'
                },
                {
                  format: 'html',
                  description: 'Interactive HTML/CSS/JavaScript web applications, calculators, widgets, games'
                },
                {
                  format: 'json',
                  description: 'Interactive JSON tree viewer with search and copy'
                },
                {
                  format: 'svg',
                  description: 'Responsive vector graphic viewer with zoom and copy'
                },
                {
                  format: 'canvas',
                  description: 'HTML5 Canvas animation / generative art runner'
                },
                {
                  format: 'recipe',
                  description: 'Schema.org Recipe card with ingredients check-off list and step instructions'
                },
                {
                  format: 'text',
                  description: 'Clean reading typography for plain notes and articles'
                }
              ],
              popularLanguages: [
                'python', 'javascript', 'typescript', 'rust', 'go', 'bash', 'sql', 
                'c', 'cpp', 'csharp', 'java', 'kotlin', 'swift', 'php', 'ruby', 
                'html', 'css', 'json', 'yaml', 'toml', 'dockerfile'
              ],
              features: [
                'Zero-backend persistent URLs (payload stored in URL hash)',
                'GZIP compression level 9',
                'Optional AES-256-GCM password encryption',
                'Embedded responsive dark/light themes',
                'One-click clipboard copy buttons with visual feedback',
                'QR code generation for mobile scanning'
              ]
            }, null, 2)
          }
        ]
      };
    }
  );

  // Tool 7: Create a Box (wraps a Bitty Link with optional locks)
  server.tool(
    'create_box',
    'Create a Bitty Box: a server-stored, lockable wrapper around a Bitty Link URL. The box can be password-locked, time-window-locked, access-limited, or invite-only. Returns the boxId used by all other box tools.',
    {
      title: z.string().optional().describe('Human-readable box title'),
      description: z.string().optional().describe('Box description'),
      bittyUrl: z.string().optional().describe('Full Bitty Link URL to wrap'),
      bittyRelativeUrl: z.string().optional().describe('Relative Bitty Link path (e.g. /#abc123)'),
      bittyId: z.string().optional().describe('Bitty Link id if known'),
      password: z.string().optional().describe('If set, immediately enables a PBKDF2-SHA256 password lock (server stores only a verifier, never the plaintext)'),
      passwordHint: z.string().optional().describe('Optional hint shown on the lock screen'),
      notBefore: z.string().optional().describe('ISO timestamp; box unavailable before this (time lock)'),
      notAfter: z.string().optional().describe('ISO timestamp; box unavailable after this (time lock)'),
      maxOpens: z.number().optional().describe('Max total opens across all viewers (access limit)'),
      maxSessionOpens: z.number().optional().describe('Max opens per session (per-session access limit)'),
      invitedEmails: z.array(z.string()).optional().describe('Emails allowed if invite-only')
    },
    async (args) => {
      try {
        const lockConfig = { password: null, timeWindow: null, openLimit: null, sessionOpenLimit: null, inviteOnly: null };
        if (args.password) {
          const verifier = await createPasswordVerifier(args.password, { hint: args.passwordHint || '' });
          lockConfig.password = { enabled: true, verifier, hint: args.passwordHint || '' };
        }
        if (args.notBefore || args.notAfter) lockConfig.timeWindow = createTimeWindow({ notBefore: args.notBefore, notAfter: args.notAfter });
        if (typeof args.maxOpens === 'number') lockConfig.openLimit = createOpenLimit({ maxOpens: args.maxOpens });
        if (typeof args.maxSessionOpens === 'number') lockConfig.sessionOpenLimit = createSessionOpenLimit({ maxSessionOpens: args.maxSessionOpens });
        if (Array.isArray(args.invitedEmails)) lockConfig.inviteOnly = createInviteOnly(args.invitedEmails);

        const box = createBox({
          title: args.title,
          description: args.description,
          bittyUrl: args.bittyUrl,
          bittyRelativeUrl: args.bittyRelativeUrl,
          bittyId: args.bittyId,
          createdBy: { type: 'mcp', userId: null, keyId: null },
          lockConfig
        });
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, boxId: box.id, lockConfigApplied: !!args.password || !!args.notBefore || typeof args.maxOpens === 'number' }, null, 2) }] };
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: `Error creating box: ${err.message}` }] };
      }
    }
  );

  // Tool 8: Set password lock
  server.tool(
    'set_password_lock',
    'Add or replace the password lock on a box. The server stores only a PBKDF2-SHA256 verifier; the plaintext password is never persisted.',
    { boxId: z.string().describe('Target box id'), password: z.string().describe('Password to set'), hint: z.string().optional().describe('Hint shown on lock screen') },
    async (args) => {
      try {
        const box = getBox(args.boxId);
        if (!box) return { isError: true, content: [{ type: 'text', text: 'Box not found' }] };
        const verifier = await createPasswordVerifier(args.password, { hint: args.hint || '' });
        setPasswordLock(args.boxId, { enabled: true, verifier, hint: args.hint || '' });
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, boxId: args.boxId, passwordLock: { enabled: true } }, null, 2) }] };
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: `Error: ${err.message}` }] };
      }
    }
  );

  // Tool 9: Set time lock
  server.tool(
    'set_time_lock',
    'Add or replace the time-window lock on a box. Server rejects access outside [notBefore, notAfter].',
    { boxId: z.string().describe('Target box id'), notBefore: z.string().optional().describe('ISO timestamp; unavailable before'), notAfter: z.string().optional().describe('ISO timestamp; unavailable after') },
    async (args) => {
      try {
        const box = getBox(args.boxId);
        if (!box) return { isError: true, content: [{ type: 'text', text: 'Box not found' }] };
        setTimeWindowLock(args.boxId, createTimeWindow({ notBefore: args.notBefore, notAfter: args.notAfter }));
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, boxId: args.boxId, timeWindow: { enabled: true, notBefore: args.notBefore, notAfter: args.notAfter } }, null, 2) }] };
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: `Error: ${err.message}` }] };
      }
    }
  );

  // Tool 10: Set access limit
  server.tool(
    'set_access_limit',
    'Add or replace the access-limit lock on a box: maxOpens (total across viewers) and/or maxSessionOpens (per session).',
    { boxId: z.string().describe('Target box id'), maxOpens: z.number().optional().describe('Max total opens'), maxSessionOpens: z.number().optional().describe('Max opens per session') },
    async (args) => {
      try {
        const box = getBox(args.boxId);
        if (!box) return { isError: true, content: [{ type: 'text', text: 'Box not found' }] };
        if (typeof args.maxOpens === 'number') setAccessLimitLock(args.boxId, createOpenLimit({ maxOpens: args.maxOpens }));
        if (typeof args.maxSessionOpens === 'number') setSessionLimitLock(args.boxId, createSessionOpenLimit({ maxSessionOpens: args.maxSessionOpens }));
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, boxId: args.boxId }, null, 2) }] };
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: `Error: ${err.message}` }] };
      }
    }
  );

  // Tool 11: Set invite-only
  server.tool(
    'set_invite_only',
    'Add or replace the invite-only lock on a box. Only the listed emails (hashed) may unlock.',
    { boxId: z.string().describe('Target box id'), emails: z.array(z.any()).describe('Allowed email addresses') },
    async (args) => {
      try {
        const box = getBox(args.boxId);
        if (!box) return { isError: true, content: [{ type: 'text', text: 'Box not found' }] };
        setInviteOnlyLock(args.boxId, createInviteOnly(args.emails || []));
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, boxId: args.boxId, inviteOnly: { enabled: true, allowedEmailCount: (args.emails || []).length } }, null, 2) }] };
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: `Error: ${err.message}` }] };
      }
    }
  );

  // Tool 12: Publish a box
  server.tool(
    'publish_box',
    'Mark a box as published (discoverable / linkable).',
    { boxId: z.string().describe('Target box id') },
    async (args) => {
      try {
        const box = getBox(args.boxId);
        if (!box) return { isError: true, content: [{ type: 'text', text: 'Box not found' }] };
        publishBox(args.boxId);
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, boxId: args.boxId, published: true }, null, 2) }] };
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: `Error: ${err.message}` }] };
      }
    }
  );

  // Tool 13: List boxes
  server.tool(
    'list_boxes',
    'List all boxes with their lock configuration (verifier material omitted).',
    {},
    async () => {
      try {
        const boxes = listBoxes().map(b => ({
          id: b.id, title: b.title, published: !!b.published,
          lockConfig: {
            password: !!b.lockConfig?.password?.enabled,
            timeWindow: !!b.lockConfig?.timeWindow?.enabled,
            openLimit: !!b.lockConfig?.openLimit?.enabled,
            sessionOpenLimit: !!b.lockConfig?.sessionOpenLimit?.enabled,
            inviteOnly: !!b.lockConfig?.inviteOnly?.enabled
          }
        }));
        return { content: [{ type: 'text', text: JSON.stringify({ count: boxes.length, boxes }, null, 2) }] };
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: `Error: ${err.message}` }] };
      }
    }
  );

  // Tool 14: Unlock a box
  server.tool(
    'unlock_box',
    'Attempt to unlock a box, supplying any required password/email. On success returns a single-use grant token that can be exchanged for the payload via the REST API /api/boxes/:id/payload?grant=TOKEN.',
    { boxId: z.string().describe('Target box id'), password: z.string().optional().describe('Password if required'), email: z.string().optional().describe('Email if invite-only'), sessionId: z.string().optional().describe('Stable session id for per-session limits') },
    async (args) => {
      try {
        const box = getBox(args.boxId);
        if (!box) return { isError: true, content: [{ type: 'text', text: 'Box not found' }] };
        const sessionKey = args.sessionId || 'mcp-' + cryptoRandom();
        const res = await evaluateAndRecord(args.boxId, {
          password: args.password, email: args.email,
          ip: 'mcp', userAgent: 'mcp-agent', sessionId: sessionKey,
          sessionOpenCount: getSessionOpenCount(sessionKey)
        });
        if (res.ok) {
          touchSessionOpens(sessionKey);
          const grant = createSessionGrant(args.boxId, sessionKey, 60);
          return { content: [{ type: 'text', text: JSON.stringify({ allowed: true, grantToken: grant.token, grantExpiresAt: grant.expiresAt }, null, 2) }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify({ allowed: false, deniedCodes: res.deniedCodes, reason: res.reason }, null, 2) }] };
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: `Error: ${err.message}` }] };
      }
    }
  );

  // Tool 15: Delete a box
  server.tool(
    'delete_box',
    'Permanently delete a box and its lock configuration.',
    { boxId: z.string().describe('Target box id') },
    async (args) => {
      try {
        const ok = deleteBox(args.boxId);
        if (!ok) return { isError: true, content: [{ type: 'text', text: 'Box not found' }] };
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, boxId: args.boxId }, null, 2) }] };
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: `Error: ${err.message}` }] };
      }
    }
  );

  return server;
}

function cryptoRandom() { try { return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 16); } catch { return Math.random().toString(36).slice(2); } }
