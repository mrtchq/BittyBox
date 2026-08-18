import zlib from 'zlib';
import crypto from 'crypto';
import { renderMarkdownToHtml } from './templates/markdown-template.js';
import { renderCodeToHtml } from './templates/code-template.js';
import { renderJsonToHtml } from './templates/json-template.js';
import { renderSvgToHtml } from './templates/svg-template.js';
import { renderCanvasToHtml } from './templates/canvas-template.js';
import { renderRecipeToHtml } from './templates/recipe-template.js';
import { scanForSecrets } from './secrets-scan.js';

export const DEFAULT_DOMAIN = process.env.BITTYBOX_PUBLIC_ORIGIN || 'https://bittybox.org';

/**
 * Encode space/dash combinations to avoid %20 in URLs (compatible with bitty.js)
 */
export function encodePrettyComponent(s) {
  if (!s) return '';
  const replacements = { ' - ': '---', '-': '--', ' ': '-' };
  const re = new RegExp('(' + Object.keys(replacements).map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|') + ')', 'g');
  return encodeURIComponent(s.replace(re, e => replacements[e] ?? '-'))
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16));
}

/**
 * Decode space/dash combinations (compatible with bitty.js)
 */
export function decodePrettyComponent(s) {
  if (!s) return '';
  const replacements = { '---': ' - ', '--': '-', '-': ' ' };
  return decodeURIComponent(s.replace(/-+/g, e => replacements[e] ?? '-'));
}

/**
 * Detect format of the given content
 */
export function detectFormat(content, hint = '') {
  if (hint && hint !== 'auto') return hint.toLowerCase();

  const trimmed = content.trim();

  if (/^<svg[\s>]/i.test(trimmed) || (trimmed.startsWith('<?xml') && trimmed.includes('<svg'))) {
    return 'svg';
  }

  if (/^<!DOCTYPE\s+html|<html[\s>]|<div|<head|<body/i.test(trimmed)) {
    return 'html';
  }

  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && (parsed['@context'] || parsed.recipeIngredient || parsed.recipeInstructions)) {
        return 'recipe';
      }
      return 'json';
    } catch {
      // not valid json
    }
  }

  // Markdown indicators
  const mdPatterns = [
    /^#{1,6}\s+\S+/m,
    /^\s*[-*+]\s+\S+/m,
    /^\s*\d+\.\s+\S+/m,
    /```[\s\S]*?```/,
    /\[.+?\]\(.+?\)/,
    /^\s*>\s+\S+/m,
    /\*\*.*?\*\*/,
    /\|.+?\|.+?\|/
  ];
  let mdScore = 0;
  for (const pattern of mdPatterns) {
    if (pattern.test(trimmed)) mdScore++;
  }
  if (mdScore >= 2) return 'markdown';

  // Code indicators
  const codePatterns = [
    /^import\s+|^export\s+|^const\s+|^let\s+|^function\s+/m,
    /^def\s+\w+\s*\(|^class\s+\w+:|^from\s+\w+\s+import/m,
    /^#include\s+<|^fn\s+\w+\s*\(|^pub\s+fn/m,
    /^package\s+\w+|^func\s+\w+\s*\(/m,
    /^SELECT\s+.*\s+FROM\s+/im,
    /^#!\/bin\/(bash|sh|zsh)/m
  ];
  for (const pattern of codePatterns) {
    if (pattern.test(trimmed)) return 'code';
  }

  if (mdScore >= 1) return 'markdown';

  return 'text';
}

/**
 * AES-256-GCM encryption compatible with Web Crypto API subtleEncryptData in bitty.js
 */
export async function encryptPayload(dataBuffer, password) {
  const pwUtf8 = Buffer.from(password, 'utf-8');
  const key = crypto.createHash('sha256').update(pwUtf8).digest();
  const iv = crypto.randomBytes(12); // 96-bit random iv
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16 bytes auth tag
  return Buffer.concat([iv, encrypted, authTag]);
}

/**
 * AES-256-GCM decryption compatible with subtleDecryptData in bitty.js
 */
export async function decryptPayload(cipherBuffer, password) {
  const pwUtf8 = Buffer.from(password, 'utf-8');
  const key = crypto.createHash('sha256').update(pwUtf8).digest();
  const iv = cipherBuffer.subarray(0, 12);
  const authTag = cipherBuffer.subarray(cipherBuffer.length - 16);
  const encrypted = cipherBuffer.subarray(12, cipherBuffer.length - 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Primary function to create a Bitty Link
 */
export async function createBittyLink(options = {}) {
  let {
    content,
    title,
    format = 'auto',
    language,
    theme = 'auto',
    editable = false,
    password,
    domain = DEFAULT_DOMAIN,
    metadata = {}
  } = options;

  if (content === undefined || content === null) {
    throw new Error('Missing required "content" parameter');
  }
  content = String(content);

  // Pre-creation sensitive-value scan (warn-only, non-destructive).
  // Flags credentials/secrets so creators don't accidentally bake a live token
  // into a shareable (and for unencrypted links, plaintext) URL fragment.
  const secretScan = scanForSecrets(content, {
    encrypted: !!(password && String(password).trim().length > 0),
  });

  const resolvedFormat = detectFormat(content, format);

  // Auto-generate title if not provided
  if (!title) {
    if (resolvedFormat === 'markdown') {
      const match = content.match(/^#\s+(.+)$/m);
      title = match ? match[1].trim() : 'Markdown Doc';
    } else if (resolvedFormat === 'code') {
      const langName = language || 'Code';
      title = `${capitalize(langName)} Snippet`;
    } else if (resolvedFormat === 'html') {
      const match = content.match(/<title>(.*?)<\/title>/i);
      title = match ? match[1].trim() : 'Web App';
    } else if (resolvedFormat === 'json') {
      title = 'Data View';
    } else if (resolvedFormat === 'svg') {
      title = 'Vector Graphic';
    } else if (resolvedFormat === 'recipe') {
      try {
        const p = JSON.parse(content);
        title = p.name || 'Recipe';
      } catch {
        title = 'Recipe';
      }
    } else {
      title = content.split('\n')[0].substring(0, 30).trim() || 'Bitty Note';
    }
  }

  // Render to self-contained HTML payload
  let renderedHtml = '';
  switch (resolvedFormat) {
    case 'markdown':
    case 'md':
      renderedHtml = renderMarkdownToHtml(content, { title, theme });
      break;
    case 'code':
      renderedHtml = renderCodeToHtml(content, { title, language, theme });
      break;
    case 'json':
      renderedHtml = renderJsonToHtml(content, { title, theme });
      break;
    case 'svg':
      renderedHtml = renderSvgToHtml(content, { title, theme });
      break;
    case 'canvas':
      renderedHtml = renderCanvasToHtml(content, { title, theme });
      break;
    case 'recipe':
      renderedHtml = renderRecipeToHtml(content, { title });
      break;
    case 'text':
    case 'plain':
      // For simple text, markdown renderer produces clean typography
      renderedHtml = renderMarkdownToHtml(content, { title, theme });
      break;
    case 'html':
    case 'raw':
    default:
      renderedHtml = content.includes('<html') || content.includes('<!DOCTYPE')
        ? content
        : `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title></head><body>${content}</body></html>`;
      break;
  }

  const rawBytes = Buffer.byteLength(content, 'utf-8');
  const renderedBytes = Buffer.byteLength(renderedHtml, 'utf-8');

  // Compress HTML with GZIP level 9
  let compressedBuffer = zlib.gzipSync(Buffer.from(renderedHtml, 'utf-8'), { level: 9 });

  // Optional encryption
  let isEncrypted = false;
  if (password && String(password).trim().length > 0) {
    isEncrypted = true;
    compressedBuffer = await encryptPayload(compressedBuffer, String(password).trim());
  }

  const base64Data = compressedBuffer.toString('base64');
  const compressedBytes = compressedBuffer.length;

  // Build URL components
  const cleanDomain = domain.replace(/\/+$/, '');
  const encodedTitle = encodePrettyComponent(title);

  let fragment = '';
  if (isEncrypted) {
    fragment = `#${encodedTitle}/data:text/html;charset=utf-8;cipher=aes-gcm;format=gz;base64,${base64Data}`;
  } else if (editable) {
    fragment = `#${encodedTitle}/?${base64Data}`;
  } else {
    fragment = `#${encodedTitle}/data:text/html;charset=utf-8;format=gz;base64,${base64Data}`;
  }

  const fullUrl = `${cleanDomain}/${fragment}`;
  const compressionRatio = renderedBytes > 0 
    ? `${Math.round((1 - (compressedBytes / renderedBytes)) * 100)}%` 
    : '0%';

  const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chld=L|1&choe=UTF-8&chl=${encodeURIComponent(fullUrl)}`;
  const markdownLink = `[${title}](${fullUrl})`;
  const iframeSnippet = `<iframe src="${fullUrl}" width="100%" height="600" style="border:1px solid #ccc; border-radius:8px;" allow="camera; microphone; fullscreen; clipboard-read; clipboard-write"></iframe>`;

  return {
    url: fullUrl,
    title,
    format: resolvedFormat,
    language: language || (resolvedFormat === 'code' ? detectFormat(content, 'code') : undefined),
    isEncrypted,
    warnings: secretScan.matches,
    requiresSecretOverride: secretScan.requiresOverride,
    stats: {
      rawBytes,
      renderedBytes,
      compressedBytes,
      urlLength: fullUrl.length,
      compressionRatio
    },
    qrCodeUrl,
    markdownLink,
    iframeSnippet
  };
}

/**
 * Decode a Bitty link back into content
 */
export async function decodeBittyLink(urlOrHash, options = {}) {
  const { password } = options;
  let str = String(urlOrHash).trim();

  let hash = '';
  if (str.includes('#')) {
    hash = str.split('#')[1];
  } else {
    hash = str.startsWith('/') ? str.substring(1) : str;
  }

  const slashIdx = hash.indexOf('/');
  let title = 'Document';
  let dataPart = hash;

  if (slashIdx !== -1) {
    title = decodePrettyComponent(hash.substring(0, slashIdx));
    dataPart = hash.substring(slashIdx + 1);
  }

  let isEditable = false;
  if (dataPart.startsWith('?')) {
    isEditable = true;
    dataPart = dataPart.substring(1);
  }

  let mediatype = 'text/html';
  let format = 'gz';
  let cipher = null;
  let base64Data = dataPart;

  if (dataPart.startsWith('data:')) {
    const commaIdx = dataPart.indexOf(',');
    if (commaIdx !== -1) {
      const meta = dataPart.substring(5, commaIdx);
      base64Data = dataPart.substring(commaIdx + 1);
      
      const parts = meta.split(';');
      mediatype = parts[0] || 'text/html';
      for (const part of parts.slice(1)) {
        const [k, v] = part.split('=');
        if (k === 'format') format = v;
        if (k === 'cipher') cipher = v;
      }
    }
  }

  let buffer = Buffer.from(base64Data, 'base64');

  if (cipher && cipher.toLowerCase().includes('aes')) {
    if (!password) {
      return {
        title,
        isEncrypted: true,
        cipher,
        error: 'Password required to decrypt this Bitty link'
      };
    }
    buffer = await decryptPayload(buffer, password);
  }

  let decompressed = '';
  if (format === 'gz' || format === 'gzip') {
    try {
      decompressed = zlib.gunzipSync(buffer).toString('utf-8');
    } catch {
      try {
        decompressed = zlib.inflateSync(buffer).toString('utf-8');
      } catch {
        try {
          decompressed = zlib.inflateRawSync(buffer).toString('utf-8');
        } catch {
          decompressed = buffer.toString('utf-8');
        }
      }
    }
  } else if (format === 'xz' || format === 'lzma') {
    throw new Error('LZMA/XZ decompression is not currently supported in server decoder');
  } else {
    decompressed = buffer.toString('utf-8');
  }

  return {
    title,
    mediatype,
    isEditable,
    isEncrypted: !!cipher,
    content: decompressed,
    byteLength: Buffer.byteLength(decompressed, 'utf-8')
  };
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
