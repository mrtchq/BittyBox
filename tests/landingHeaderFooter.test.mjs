import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const landingPath = new URL('../docs/index.html', import.meta.url);
const stylesheetPath = new URL('../docs/bittybox-landing.css', import.meta.url);
const landingScriptPath = new URL('../docs/bittybox-landing.js', import.meta.url);

const readLanding = () => readFile(landingPath, 'utf8');

test('landing page is the BittyBox-branded Skillborn-style experience', async () => {
  const html = await readLanding();

  assert.match(html, /<title>BITTYBOX — The Dead Man's Switch Reimagined<\/title>/);
  assert.match(html, /Don’t just leave a message\.<br><em>Leave a world\.<\/em>/);
  assert.match(html, /BITTYBOX DIFFERENT/);
  assert.doesNotMatch(html, /Skillborn|skillborn\.org/i);
  assert.doesNotMatch(html, /href="\/(?:accounts?|account-nav)/i);
  assert.equal((html.match(/class="feature-card\b/g) || []).length, 10);
});

test('landing navigation, calls to action, preview disclaimer, and editor route are present', async () => {
  const html = await readLanding();

  for (const anchor of ['overview', 'mechanics', 'simulator', 'capsules', 'philosophy', 'faq', 'start']) {
    assert.match(html, new RegExp(`id="${anchor}"`));
  }
  assert.match(html, /href="\/editor"[^>]*>Open Editor<\/a>/);
  assert.match(html, /href="\/editor"[^>]*>START BUILDING NOW/);
  assert.match(html, /does not monitor activity, encrypt or publish a real payload, contact recipients, or trigger a release/);
  assert.match(html, /SIMULATED · NOT MONITORING/);
  assert.match(html, /src="\/bittybox-landing\.js\?/);
  assert.match(html, /href="\/bittybox-landing\.css\?/);
});

test('BittyBox landing demo stays local and contains no real recovery-secret prompt', async () => {
  const [html, script, css] = await Promise.all([
    readLanding(),
    readFile(landingScriptPath, 'utf8'),
    readFile(stylesheetPath, 'utf8'),
  ]);

  assert.match(html, /data-secret="OPEN THE FAMILY PHOTO ARCHIVE AFTER THE LETTER IS RECEIVED\."/);
  assert.doesNotMatch(`${html}\n${script}`, /password|recovery phrase|master vault key|crypto infrastructure recovery/i);
  assert.doesNotMatch(script, /fetch\s*\(/);
  assert.match(script, /generateMysteryCapsule/);
  assert.match(script, /toggleRedaction/);
  assert.match(script, /prefers-reduced-motion/);
  assert.match(css, /@media/);
});
