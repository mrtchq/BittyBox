import { deflate, inflate } from 'pako';
import { BittyMetadata } from '../types';

export const GZIP_MARKER = 'gz';
export const BASE64_MARKER = 'base64';
export const LZMA_MARKER = 'xz';

export function encodePrettyComponent(s: string): string {
  if (!s) return '';
  const replacements: Record<string, string> = { ' - ': '---', '-': '--', ' ': '-' };
  const re = new RegExp('(' + Object.keys(replacements).map(k => k.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|') + ')', 'g');
  return encodeURIComponent(s.replace(re, e => replacements[e] ?? '-'))
    .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16));
}

export function decodePrettyComponent(s: string): string {
  if (!s) return '';
  const replacements: Record<string, string> = { '---': ' - ', '--': '-', '-': ' ' };
  try {
    return decodeURIComponent(s.replace(/-+/g, e => replacements[e] ?? '-'));
  } catch {
    return s;
  }
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const CHUNK_SIZE = 8192;
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  // Normalize padded or unpadded base64 and URL encoding
  let str = base64.trim();
  try {
    str = decodeURIComponent(str);
  } catch {}
  
  str = str
    .replace(/\s+/g, '+')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  while (str.length % 4 !== 0) {
    str += '=';
  }

  const binary = atob(str);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function subtleEncryptData(data: Uint8Array, pass: string): Promise<Uint8Array> {
  const pwUtf8 = new TextEncoder().encode(pass);
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', pwHash, { name: 'AES-GCM' }, false, ['encrypt']);
  const ctBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  
  const result = new Uint8Array(iv.byteLength + ctBuffer.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ctBuffer), iv.byteLength);
  return result;
}

export async function subtleDecryptData(data: Uint8Array, pass: string): Promise<Uint8Array> {
  const pwUtf8 = new TextEncoder().encode(pass);
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  const key = await crypto.subtle.importKey('raw', pwHash, { name: 'AES-GCM' }, false, ['decrypt']);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new Uint8Array(plainBuffer);
}

export async function compressContent(
  content: string,
  options?: {
    password?: string;
    mimeType?: string;
    render?: string;
    isRawHtml?: boolean;
  }
): Promise<{ compressedUrl: string; originalBytes: number; compressedBytes: number }> {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(content);
  const originalBytes = rawBytes.byteLength;

  let isEncrypted = false;
  let b64Data = '';

  if (options?.password && options.password.trim().length > 0) {
    // 1. Deflate the plaintext first for optimal compression ratio
    const deflated = deflate(rawBytes, { level: 9 });
    // 2. Encrypt the compressed bytes using AES-GCM (with random 12-byte IV prepended)
    const encryptedBytes = await subtleEncryptData(deflated, options.password.trim());
    // 3. Base64 encode the encrypted binary data
    b64Data = uint8ArrayToBase64(encryptedBytes).replace(/=+$/, '');
    isEncrypted = true;
  } else {
    // Compress using pako deflate (gzip level 9)
    const deflated = deflate(rawBytes, { level: 9 });
    b64Data = uint8ArrayToBase64(deflated).replace(/=+$/, '');
  }

  const compressedBytes = b64Data.length;

  let url = '';
  const mime = options?.mimeType || 'text/html';

  if (isEncrypted) {
    url = `data:${mime};charset=utf-8;cipher=aes-gcm;format=gz;base64,${b64Data}`;
  } else if (options?.render) {
    url = `data:${mime};render=${options.render};format=gz;base64,${b64Data}`;
  } else if (options?.isRawHtml) {
    url = `data:${mime};charset=utf-8;format=gz;base64,${b64Data}`;
  } else {
    // Standard short bitty box fragment
    url = `?${b64Data}`;
  }

  return {
    compressedUrl: url,
    originalBytes,
    compressedBytes,
  };
}

export function parseBittyHash(hash: string): {
  payload: string;
  metadata: Partial<BittyMetadata>;
} {
  let cleanHash = hash;
  if (cleanHash.startsWith('#')) cleanHash = cleanHash.substring(1);
  if (cleanHash.startsWith('/')) cleanHash = cleanHash.substring(1);

  const parts = cleanHash.split('/');
  const metadata: Partial<BittyMetadata> = {};
  let payload = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('?') || part.startsWith('data:') || (part.length > 25 && !metadata.title && i === parts.length - 1)) {
      payload = parts.slice(i).join('/');
      break;
    }
    if (i === 0 && !part.startsWith('d') && !part.startsWith('f') && !part.startsWith('i')) {
      metadata.title = decodePrettyComponent(part);
    } else if (part === 'd' && parts[i + 1]) {
      metadata.description = decodePrettyComponent(parts[i + 1]);
      i++;
    } else if (part === 'f' && parts[i + 1]) {
      metadata.favicon = decodeURIComponent(parts[i + 1]);
      i++;
    } else if (part === 'i' && parts[i + 1]) {
      try {
        metadata.image = atob(decodeURIComponent(parts[i + 1]));
      } catch {}
      i++;
    }
  }

  if (!payload && parts.length > 0) {
    payload = parts[parts.length - 1];
  }

  return { payload, metadata };
}

export async function decompressBittyData(
  fragment: string,
  passwordAttempt?: string
): Promise<{
  content: string;
  mimeType: string;
  isEncrypted: boolean;
  needsPassword?: boolean;
  render?: string;
  error?: string;
}> {
  try {
    if (!fragment || !fragment.trim()) {
      return { content: '', mimeType: 'text/html', isEncrypted: false };
    }

    const { payload } = parseBittyHash(fragment);
    let cleanFragment = payload || fragment;

    if (cleanFragment.startsWith('#')) cleanFragment = cleanFragment.substring(1);

    let isEncrypted = false;
    let mimeType = 'text/html';
    let render = '';
    let isGzip = true;
    let b64Payload = '';

    if (cleanFragment.startsWith('?')) {
      // Short format ?<gzipBase64>
      b64Payload = cleanFragment.substring(1);
    } else if (cleanFragment.startsWith('data:')) {
      const commaIdx = cleanFragment.indexOf(',');
      if (commaIdx === -1) throw new Error('Invalid data URI format');
      
      const metaPart = cleanFragment.substring(5, commaIdx);
      b64Payload = cleanFragment.substring(commaIdx + 1);

      if (metaPart.includes('cipher=aes')) {
        isEncrypted = true;
      }
      if (metaPart.includes('format=gz') || metaPart.includes('gzip')) {
        isGzip = true;
      }
      const renderMatch = metaPart.match(/render=([^;]+)/);
      if (renderMatch) render = renderMatch[1];

      const mimeMatch = metaPart.match(/^([^;]+)/);
      if (mimeMatch && mimeMatch[1]) mimeType = mimeMatch[1];
    } else {
      b64Payload = cleanFragment;
    }

    if (!b64Payload || !b64Payload.trim()) {
      return { content: '', mimeType: 'text/html', isEncrypted: false };
    }

    const compressedBytes = base64ToUint8Array(b64Payload);

    if (isEncrypted) {
      if (!passwordAttempt) {
        return {
          content: '',
          mimeType,
          isEncrypted: true,
          needsPassword: true,
          render,
        };
      }

      // Try decrypting with passcode (support both trimmed and exact passcode)
      try {
        let decryptedBytes: Uint8Array | null = null;

        // Path 1: Deflate-then-Encrypt (standard format: payload is encrypted deflated stream)
        try {
          decryptedBytes = await subtleDecryptData(compressedBytes, passwordAttempt.trim());
        } catch {
          if (passwordAttempt !== passwordAttempt.trim()) {
            try {
              decryptedBytes = await subtleDecryptData(compressedBytes, passwordAttempt);
            } catch {}
          }
        }

        // Path 2: Encrypt-then-Deflate fallback (if payload was deflated after encrypting)
        if (!decryptedBytes) {
          try {
            let inflatedCipher: Uint8Array | null = null;
            try {
              inflatedCipher = inflate(compressedBytes);
            } catch {
              try {
                inflatedCipher = inflate(compressedBytes, { raw: true });
              } catch {}
            }
            if (inflatedCipher) {
              try {
                decryptedBytes = await subtleDecryptData(inflatedCipher, passwordAttempt.trim());
              } catch {
                if (passwordAttempt !== passwordAttempt.trim()) {
                  try {
                    decryptedBytes = await subtleDecryptData(inflatedCipher, passwordAttempt);
                  } catch {}
                }
              }
            }
          } catch {}
        }

        if (!decryptedBytes) {
          throw new Error('Authentication failed');
        }

        // Decompress the decrypted bytes (if compressed with deflate)
        let inflated: Uint8Array;
        try {
          inflated = inflate(decryptedBytes);
        } catch {
          try {
            inflated = inflate(decryptedBytes, { raw: true });
          } catch {
            // Uncompressed raw bytes fallback
            inflated = decryptedBytes;
          }
        }

        const text = new TextDecoder().decode(inflated);
        return {
          content: text,
          mimeType,
          isEncrypted: true,
          needsPassword: false,
          render,
        };
      } catch {
        return {
          content: '',
          mimeType,
          isEncrypted: true,
          needsPassword: true,
          error: 'Decryption failed: incorrect passcode.',
        };
      }
    }

    // Normal decompression with multi-format fallback
    let decompressedBytes: Uint8Array;
    if (isGzip) {
      try {
        decompressedBytes = inflate(compressedBytes);
      } catch {
        try {
          decompressedBytes = inflate(compressedBytes, { raw: true });
        } catch {
          // Fallback: may be uncompressed raw bytes
          decompressedBytes = compressedBytes;
        }
      }
    } else {
      decompressedBytes = compressedBytes;
    }

    const text = new TextDecoder().decode(decompressedBytes);
    return {
      content: text,
      mimeType,
      isEncrypted: false,
      render,
    };
  } catch (err: any) {
    return {
      content: '',
      mimeType: 'text/html',
      isEncrypted: false,
      error: err?.message || 'Failed to decode Bitty Box data fragment.',
    };
  }
}

export function buildBittyUrl(
  compressedFragment: string,
  metadata: BittyMetadata,
  origin: string = typeof window !== 'undefined' ? window.location.origin : ''
): string {
  const title = metadata.title.trim() || 'Untitled';
  const cleanFragment = compressedFragment.startsWith('#') ? compressedFragment.substring(1) : compressedFragment;

  // Build metadata path components inside hash to preserve single-page app routing on any host
  let metaHash = encodePrettyComponent(title);
  if (metadata.description) {
    metaHash += `/d/${encodePrettyComponent(metadata.description.substring(0, 100))}`;
  }
  if (metadata.favicon) {
    metaHash += `/f/${encodeURIComponent(metadata.favicon)}`;
  }
  if (metadata.image) {
    try {
      metaHash += `/i/${encodeURIComponent(btoa(metadata.image).replace(/=/g, ''))}`;
    } catch {}
  }

  const finalPayload = (cleanFragment.startsWith('?') || cleanFragment.startsWith('data:'))
    ? cleanFragment
    : `?${cleanFragment}`;

  return `${origin}/#/${metaHash}/${finalPayload}`;
}

export async function hashString(str: string): Promise<string> {
  const arrayBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}
