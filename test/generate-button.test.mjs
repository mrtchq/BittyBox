import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const page = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

test('rich text editor page contains GENERATE button', () => {
  assert.match(page, /id="editorjs-generate-btn"[^>]*>[\s\S]*?GENERATE/i);
});

test('page contains self-contained URL result modal', () => {
  assert.match(page, /id="bitty-generate-modal"/);
  assert.match(page, /id="bitty-generated-url-input"/);
  assert.match(page, /id="bitty-modal-copy-btn"/);
  assert.match(page, /id="bitty-modal-view-btn"/);
});

test('page contains live self-contained capsule viewer shell and iframe', () => {
  assert.match(page, /id="capsule-viewer-shell"/);
  assert.match(page, /id="capsule-viewer-frame"/);
  assert.match(page, /id="capsule-viewer-home-btn"/);
  assert.match(page, /id="capsule-viewer-edit-btn"/);
  assert.match(page, /id="capsule-viewer-copy-btn"/);
});

test('hash router and decompressor are wired up for self-contained URLs', () => {
  assert.match(page, /function\s+parseBittyHash/);
  assert.match(page, /async\s+function\s+decompressPayload/);
  assert.match(page, /async\s+function\s+checkAndRenderCapsuleFromURL/);
  assert.match(page, /window\.addEventListener\(['"]hashchange['"],\s*checkAndRenderCapsuleFromURL\)/);
});

test('self-contained URL compression and decompression roundtrip preserves content', async () => {
  const originalTitle = 'Test Capsule Title';
  const originalContent = '<!doctype html><html><head><title>Test</title></head><body><h1>Hello World</h1><p>This is a self-contained page test.</p></body></html>';

  // Compress using deflate
  const stream = new Blob([originalContent]).stream().pipeThrough(new CompressionStream('deflate'));
  const buf = await new Response(stream).arrayBuffer();
  const u8 = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < u8.byteLength; i++) bin += String.fromCharCode(u8[i]);
  const base64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const prettyTitle = encodeURIComponent(originalTitle.replace(/\s+/g, '-'));
  const hash = `#/${prettyTitle}#data:text/html;charset=utf-8;format=gz;base64,${base64}`;

  // Parse hash
  let payload = hash.substring(1);
  const parts = payload.split('#');
  assert.equal(parts[0], `/${prettyTitle}`);
  const dataUri = parts.slice(1).join('#');
  assert.match(dataUri, /^data:text\/html;charset=utf-8;format=gz;base64,/);

  const commaIdx = dataUri.indexOf(',');
  const extractedB64 = dataUri.substring(commaIdx + 1);

  // Decompress
  let decB64 = extractedB64.replace(/-/g, '+').replace(/_/g, '/');
  while (decB64.length % 4 !== 0) decB64 += '=';
  const binStr = atob(decB64);
  const decU8 = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) decU8[i] = binStr.charCodeAt(i);

  const decStream = new Blob([decU8]).stream().pipeThrough(new DecompressionStream('deflate'));
  const recoveredText = await new Response(decStream).text();

  assert.equal(recoveredText, originalContent);
});
