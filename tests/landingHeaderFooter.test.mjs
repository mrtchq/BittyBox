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

  assert.match(html, /<img class="brand-logo" src="https:\/\/www\.image2url\.com\/r2\/default\/images\/1790357087489-d68cf9c6-4af5-4130-a9b5-9b8ffe618889\.png" alt="" aria-hidden="true" width="48" height="48">/);
  assert.equal(logo.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.match(css, /\.brand-logo\s*\{[^}]*object-fit:\s*contain/);
  assert.match(css, /\.brand-logo\s*\{\s*width:\s*40px;\s*height:\s*40px;\s*flex-basis:\s*40px;/);
});

test('landing page is a vertical carousel with 3 Bitty Box types and horizontal carousels', async () => {
  const html = await readLanding();

  // Exactly 3 vertical slides
  assert.equal((html.match(/class="v-slide\b/g) || []).length, 3);
  assert.match(html, /Bitty Page/);
  assert.match(html, /Bitty Capsule/);
  assert.match(html, /Bitty Ally/);

  // Each slide has horizontal track and cards
  assert.equal((html.match(/class="h-card-track\b/g) || []).length, 3);
  const cardCount = (html.match(/class="h-card\b/g) || []).length;
  assert.ok(cardCount >= 3 * 3, `Expected at least 3 cards per slide, got ${cardCount}`);

  // No Skillborn residue
  assert.doesNotMatch(html, /Skillborn|skillborn\.org/i);
  assert.doesNotMatch(html, /href="\/(?:accounts?|account-nav)/i);
});

test('landing navigation, calls to action, editor and capsule routes are present', async () => {
  const html = await readLanding();

  assert.match(html, /href="\/editor"[^>]*>Open Editor/);
  assert.match(html, /href="\/capsule"/);
  assert.match(html, /href="\/terms"/);
  assert.match(html, /href="\/privacy"/);
  assert.match(html, /src="\/bittybox-landing\.js\?/);
  assert.match(html, /href="\/bittybox-landing\.css\?/);
});

test('BittyBox landing scripts and styles stay local and safe', async () => {
  const [html, script, css] = await Promise.all([
    readLanding(),
    readFile(landingScriptPath, 'utf8'),
    readFile(stylesheetPath, 'utf8'),
  ]);

  assert.doesNotMatch(`${html}\n${script}`, /password|recovery phrase|master vault key|crypto infrastructure recovery/i);
  assert.doesNotMatch(script, /fetch\s*\(/);
  assert.match(script, /goToVertical/);
  assert.match(script, /goToHorizontal/);
  assert.match(script, /prefers-reduced-motion/);
  assert.match(css, /@media/);
});

test('heartbeat radar clock is embedded and animated on the capsule slide', async () => {
  const [html, css, script] = await Promise.all([
    readLanding(),
    readFile(stylesheetPath, 'utf8'),
    readFile(landingScriptPath, 'utf8'),
  ]);

  assert.match(html, /id="hero-radar"/);
  assert.match(html, /class="heartbeat-clock"/);
  assert.match(html, /id="clock-countdown"/);
  assert.match(html, /class="ecg-trace"/);
  assert.match(css, /\.heartbeat-clock/);
  assert.match(css, /clock-heart/);
  assert.match(css, /ecg-travel/);
  assert.match(script, /hero-radar/);
});
