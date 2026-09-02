import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const landingPath = new URL('../public/index.html', import.meta.url);

test('splash omits the circled top-left and top-right HUD items', async () => {
  const html = await readFile(landingPath, 'utf8');
  const splashOpening = html.indexOf('<div id="bitty-splash-overlay"');
  const coreOpening = html.indexOf('<!-- 3D Gyroscopic Quantum Core Chamber -->', splashOpening);

  assert.notEqual(splashOpening, -1, 'splash overlay must still exist');
  assert.notEqual(coreOpening, -1, 'splash core must still exist');

  const splashHeader = html.slice(splashOpening, coreOpening);
  assert.doesNotMatch(splashHeader, /splash-hud-top/);
  assert.doesNotMatch(splashHeader, /BITTY BOX \/\/ QUANTUM VAULT/);
  assert.doesNotMatch(splashHeader, /CLEARANCE:/);
  assert.doesNotMatch(splashHeader, /SUPPORT@BITTYBOX\.ORG/);
  assert.doesNotMatch(splashHeader, /splash-sound-toggle|SOUND ON/);

  assert.match(html.slice(coreOpening), /id="splash-gyro-wrapper"/);
  assert.match(html.slice(coreOpening), /id="splash-enter-btn"/);
});

test('landing page omits the replay splash Intro button', async () => {
  const html = await readFile(landingPath, 'utf8');
  assert.doesNotMatch(html, /id="replay-splash-btn"/);
  assert.doesNotMatch(html, /class="replay-splash-trigger"/);
  assert.doesNotMatch(html, /<span>INTRO<\/span>/);
});
