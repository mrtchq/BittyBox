/**
 * Box Chaining — REGRESSION BASELINE
 *
 * Spec: bittybox-dms-instructions §33 (P0) "preserve existing Box Chaining",
 * §4 "Box Chaining already works. Preserve the existing functionality.",
 * §18 "Do not break existing Box Chains."
 *
 * PURPOSE: pin the chain topology + URL format that already ship today, so the
 * DMS work cannot silently break existing chain URLs or the linked-list
 * invariant the chain engine will be built on.
 *
 * Run: node --test tests/bittyChain.regression.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBittyChain, decodeBittyLink, encodeChainUrl, decodeChainUrl } from '../lib/bitty-engine.js';

const DOMAIN = 'https://bittybox.org';
const box = (title, format = 'markdown') => ({ title, content: `# ${title}\nbody`, format });

async function makeChain(n = 3, opts = {}) {
  return createBittyChain(
    Array.from({ length: n }, (_, i) => box(`Stage ${i + 1}`)),
    { title: 'Regression Chain', domain: DOMAIN, ...opts },
  );
}

// ── 1. Generation ────────────────────────────────────────────────────────────
test('createBittyChain: one URL per Box, primary URL first', async () => {
  const r = await makeChain(3);
  assert.equal(r.success, true);
  assert.equal(r.total, 3);
  assert.equal(r.urls.length, 3);
  assert.equal(r.primaryUrl, r.urls[0], 'primaryUrl is the first Box');
  assert.match(r.chainId, /^bbc_/, 'chain ids use the bbc_ prefix');
});

test('createBittyChain: chain metadata is consistent across every Box', async () => {
  const r = await makeChain(4);
  for (let i = 0; i < 4; i++) {
    const decoded = await decodeBittyLink(r.urls[i]);
    assert.equal(decoded.chain.enabled, true);
    assert.equal(decoded.chain.chainId, r.chainId, 'all Boxes share one chainId');
    assert.equal(decoded.chain.index, i, `Box ${i} carries index ${i}`);
    assert.equal(decoded.chain.total, 4, `Box ${i} carries total 4`);
  }
});

// ── 2. Topology (the invariant the chain engine depends on) ──────────────────
test('chain is a proper linked list: each Box points at the next', async () => {
  const r = await makeChain(3);
  const b0 = await decodeBittyLink(r.urls[0]);
  const b1 = await decodeBittyLink(r.urls[1]);
  const b2 = await decodeBittyLink(r.urls[2]);

  assert.equal(b0.chain.nextUrl, r.urls[1], 'Box 0 -> Box 1');
  assert.equal(b1.chain.nextUrl, r.urls[2], 'Box 1 -> Box 2');
  assert.equal(b2.chain.nextUrl, undefined, 'the FINAL Box terminates (no nextUrl)');
});

test('a single-Box chain terminates immediately', async () => {
  const r = await makeChain(1);
  assert.equal(r.total, 1);
  const only = await decodeBittyLink(r.urls[0]);
  assert.equal(only.chain.index, 0);
  assert.equal(only.chain.total, 1);
  assert.equal(only.chain.nextUrl, undefined, 'no successor');
});

test('separate chains get distinct chain ids', async () => {
  const a = await makeChain(2);
  const b = await makeChain(2);
  assert.notEqual(a.chainId, b.chainId, 'chain ids must not collide');
});

test('Box titles survive the round trip in chain order', async () => {
  const r = await makeChain(3);
  const titles = [];
  for (const u of r.urls) titles.push((await decodeBittyLink(u)).title);
  assert.deepEqual(titles, ['Stage 1', 'Stage 2', 'Stage 3']);
});

// ── 3. URL format stability (guards existing chain URLs) ─────────────────────
test('GOLDEN: the chain-URL encoder output is frozen', () => {
  // If this fails, the URL format changed and ALREADY-SHARED chain links may
  // no longer decode. That is a §18 backwards-compatibility break.
  const GOLDEN_URL = 'https://bittybox.org/#/X';
  const GOLDEN_ENC = 'eNrLKCkpKLbS10_KLCmpTMqv0MsvStdX1o8AAHEZCJA';
  assert.equal(encodeChainUrl(GOLDEN_URL), GOLDEN_ENC, 'encoder output changed');
  assert.equal(decodeChainUrl(GOLDEN_ENC), GOLDEN_URL, 'existing encoded links must still decode');
});

test('encode/decode is a lossless round trip', () => {
  const samples = [
    'https://bittybox.org/#/X',
    'https://bittybox.org/#/Stage-Two/ch/bbc_abc_123~1~3/nx/xyz',
    'https://bittybox.org/#/A/data:text/html;charset=utf-8;format=gz;base64,H4sIAAAA',
  ];
  for (const s of samples) {
    assert.equal(decodeChainUrl(encodeChainUrl(s)), s, `round trip failed for ${s}`);
  }
});

test('generated chain URLs keep the documented shape', async () => {
  const r = await makeChain(3);
  const [u0, , u2] = r.urls;

  // .../#/<Title>/ch/<chainId>~<index>~<total>/nx/<encoded next>/data:...
  assert.match(u0, /^https:\/\/bittybox\.org\/#\/Stage-1\/ch\/bbc_[^~]+~0~3\/nx\//,
    'non-final Box carries /ch/<id>~0~3/nx/<encoded next>/');
  assert.match(u0, /\/data:text\/html/, 'the Box payload is embedded after the chain segment');

  const b2 = await decodeBittyLink(u2);
  assert.equal(b2.chain.nextUrl, undefined, 'final Box has no /nx/ successor');
});

test('chain ids are URL-safe', async () => {
  const r = await makeChain(2);
  assert.match(r.chainId, /^[A-Za-z0-9_~-]+$/, 'chainId must not need escaping in a URL');
  assert.ok(!r.chainId.includes('/'), 'chainId must not contain a path separator');
});

// ── 4. Mixed formats in one chain ────────────────────────────────────────────
test('a chain may mix Box formats without breaking linkage', async () => {
  const r = await createBittyChain(
    [
      { title: 'Md', content: '# md', format: 'markdown' },
      { title: 'Html', content: '<p>html</p>', format: 'html' },
      { title: 'Code', content: 'const x = 1;', format: 'code', language: 'javascript' },
    ],
    { title: 'Mixed', domain: DOMAIN },
  );
  assert.equal(r.total, 3);
  const b1 = await decodeBittyLink(r.urls[1]);
  assert.equal(b1.chain.nextUrl, r.urls[2], 'linkage holds across differing formats');
});
