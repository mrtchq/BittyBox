import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

test('GENERATE delegates to the shared sealer (inline copy, no forced new tab)', () => {
  assert.match(page, /async\s+function\s+handleGenerateSelfContainedPage\(\)/);
  // The editor generate path now delegates sealing to the shared, zero-knowledge sealer.
  assert.match(page, /const finalUrl = await buildAndSealCapsule\(\{ title, htmlBody, openTab: false \}\);/);
  // The sealer copies the link inline and only opens a tab when explicitly requested.
  assert.match(page, /async\s+function\s+buildAndSealCapsule\(/);
  assert.match(page, /await navigator\.clipboard\.writeText\(envelopeUrl\)/);
});

test('GENERATE button does not load splash screen or header UI in this view', () => {
  const genFuncMatch = page.match(/async\s+function\s+handleGenerateSelfContainedPage\(\)\s*\{([\s\S]*?)\n    \}/);
  assert.ok(genFuncMatch, 'handleGenerateSelfContainedPage must exist');
  const genFuncBody = genFuncMatch[1];

  // Must not transition current view into viewer shell or push hash state
  assert.doesNotMatch(genFuncBody, /renderCapsuleInViewer\(/);
  assert.doesNotMatch(genFuncBody, /window\.history\.pushState\(/);
});

test('direct capsule URL view suppresses the splash screen immediately', () => {
  // Head script sets direct-capsule-view when hash contains capsule payload
  assert.match(page, /document\.documentElement\.classList\.add\(['"]direct-capsule-view['"]\)/);
  // CSS hides splash overlay immediately
  assert.match(page, /html\.direct-capsule-view\s+#bitty-splash-overlay\s*\{[^}]*display:\s*none\s*!important/);
  // initQuantumSplash exits early when a capsule hash is present (unless ?intro is forced)
  assert.match(page, /const wantsIntro = new URLSearchParams\(window\.location\.search\)\.has\('intro'\)/);
  assert.match(page, /if \(!wantsIntro && !\(initialHash && initialHash\.length > 2/);
});

test('header UI in generated URL view omits Edit and New buttons and retains only Copy Link', () => {
  const headerMatch = page.match(/<div id="capsule-viewer-shell"[\s\S]*?<header[^>]*>([\s\S]*?)<\/header>/);
  assert.ok(headerMatch, 'capsule-viewer-shell header must exist');
  const headerContent = headerMatch[1];

  // Edit and New buttons removed
  assert.doesNotMatch(headerContent, /id="capsule-viewer-edit-btn"/);
  assert.doesNotMatch(headerContent, /id="capsule-viewer-new-btn"/);
  assert.doesNotMatch(headerContent, />\s*Edit\s*</i);
  assert.doesNotMatch(headerContent, />\s*\+\s*New\s*</i);

  // Retain Copy Link button
  assert.match(headerContent, /id="capsule-viewer-copy-btn"/);
  assert.match(headerContent, /Copy Link/);
});

test('time-lock countdown is placed in the header and footer remains empty during countdown mode', () => {
  // Header contains countdown element
  assert.match(page, /id="capsule-viewer-countdown"/);
  assert.match(page, /id="capsule-header-countdown-timer"/);

  // Functions to manage countdown in header
  assert.match(page, /function\s+startHeaderCountdown/);
  assert.match(page, /function\s+clearHeaderCountdown/);

  // Footer HUD is removed and suppressed during countdown mode
  assert.match(page, /if\s*\(twConfig\s*&&\s*twConfig\.expireMs\s*&&\s*twConfig\.expireMs\s*>\s*Date\.now\(\)\)\s*\{[\s\S]*?hud\.remove\(\);[\s\S]*?return;/);

  // Active time-locks launch header countdown and clear footer
  assert.match(page, /startHeaderCountdown\(\{[\s\S]*?targetMs:\s*expireMs/);
});
