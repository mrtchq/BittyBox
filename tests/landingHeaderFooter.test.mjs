import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const landingPath = new URL('../docs/index.html', import.meta.url);
const stylesheetPath = new URL('../docs/bittybox-landing.css', import.meta.url);
const landingScriptPath = new URL('../docs/bittybox-landing.js', import.meta.url);
const headerLogoPath = new URL('../docs/bittybox-header-mark.png', import.meta.url);

const readLanding = () => readFile(landingPath, 'utf8');

test('header uses the supplied transparent Bitty Box mark without distortion', async () => {
  const [html, css, logo] = await Promise.all([
    readLanding(),
    readFile(stylesheetPath, 'utf8'),
    readFile(headerLogoPath),
  ]);

  assert.match(html, /<img class="brand-logo" src="\/bittybox-header-mark\.png\?v=20260924-logo-1" alt="" aria-hidden="true" width="48" height="48">/);
  assert.equal(logo.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.match(css, /\.brand-logo\s*\{[^}]*object-fit:\s*contain/);
  assert.match(css, /\.brand-logo\s*\{\s*width:\s*40px;\s*height:\s*40px;\s*flex-basis:\s*40px;/);
});

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

test('heartbeat card presents callouts and timer in separate ordered rows', async () => {
  const [html, css, script] = await Promise.all([
    readLanding(),
    readFile(stylesheetPath, 'utf8'),
    readFile(landingScriptPath, 'utf8'),
  ]);

  const metaAt = html.indexOf('class="clock-meta"');
  const dialAt = html.indexOf('id="hero-radar"');
  const readoutAt = html.indexOf('class="clock-readout"');
  const switchAt = html.indexOf('class="hero-quick-switch"');
  assert.ok(metaAt >= 0 && metaAt < dialAt);
  assert.ok(dialAt < readoutAt && readoutAt < switchAt);
  assert.equal((html.match(/id="clock-countdown"/g) || []).length, 1);
  assert.equal((html.match(/id="clock-next-checkin"/g) || []).length, 1);

  const clockFace = html.slice(html.indexOf('<svg class="clock-face"'), html.indexOf('</svg>', html.indexOf('<svg class="clock-face"')));
  assert.doesNotMatch(clockFace, /clock-countdown|clock-demo-label/);
  assert.match(css, /\.clock-meta\s*\{[\s\S]*?display:\s*grid/);
  assert.match(css, /\.clock-state-strip\s*\{/);
  assert.doesNotMatch(css, /\.clock-stage \.tag-[abc]\s*\{[^}]*position:\s*absolute/);
  assert.match(script, /clock-next-checkin/);
  assert.match(script, /setMeta\(tagB, 'HEARTBEAT', 'MISSED'/);
});
