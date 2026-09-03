import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

test('bittybox boots into the mobile-first compose view by default', () => {
  // The compose view exists and is the default landing (not the splash gate).
  assert.match(html, /<section id="compose-view"/);
  assert.match(html, /id="compose-title"/);
  assert.match(html, /id="compose-body"/);
  assert.match(html, /id="compose-seal-btn"/);
  // Default landing logic must reveal compose-view for a normal visit.
  assert.match(html, /compose-first landing for a normal visit/);
});

test('compose view provides inline lock chips that expand in place', () => {
  assert.match(html, /class="lock-chip"[^>]*data-lock="password"/);
  assert.match(html, /class="lock-chip"[^>]*data-lock="time"/);
  assert.match(html, /class="lock-chip"[^>]*data-lock="visits"/);
  // Details open inline (no full-screen panel dependency for the common path).
  assert.match(html, /id="lock-detail-password"/);
  assert.match(html, /id="lock-detail-time"/);
  assert.match(html, /id="lock-detail-visits"/);
});

test('seal from compose reuses the shared zero-knowledge sealer', () => {
  // The compose controller must delegate to the same enforcement path as the editor.
  assert.match(html, /async function buildAndSealCapsule\(/);
  assert.match(html, /async function sealFromCompose\(/);
  assert.match(html, /const finalUrl = await buildAndSealCapsule\(\{ title, htmlBody, openTab: false \}\);/);
});

test('splash is no longer the default gate; it only shows with ?intro or a capsule URL', () => {
  assert.match(html, /Default landing is the mobile-first compose view/);
  assert.match(html, /wantsIntro = new URLSearchParams\(window\.location\.search\)\.has\('intro'\)/);
});

test('floating bottom grip is hidden by default and only appears in advanced editor', () => {
  assert.match(html, /id="bottom-grip-btn"[\s\S]*?class="edge-grip-bottom group hidden"/);
});
