import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const landingPath = new URL('../public/index.html', import.meta.url);

test('mobile landing avoids the page-starfield compositor path that flickers the center circle', async () => {
  const html = await readFile(landingPath, 'utf8');

  const mobileRule = html.match(
    /@media \(max-width: 768px\), \(pointer: coarse\) and \(max-width: 1024px\) \{([\s\S]*?)\n\}/,
  );
  assert.ok(mobileRule, 'mobile/coarse-pointer fallback must exist');

  const css = mobileRule[1];
  assert.match(
    css,
    /\.space-background\s*\{[^}]*display:\s*none\s*!important;/s,
    'the expensive full-page box-shadow starfield must not be composited on mobile',
  );
  assert.match(
    css,
    /#bg-stars,[\s\S]*#bg-stars3:after\s*\{[^}]*display:\s*none\s*!important;[^}]*animation:\s*none\s*!important;/s,
    'all page-starfield layers and their duplicated pseudo layers must stop on mobile',
  );
  assert.match(
    css,
    /\.stage\s*\{[^}]*backdrop-filter:\s*none\s*!important;[^}]*-webkit-backdrop-filter:\s*none\s*!important;/s,
    'the mobile stage must not continuously re-sample the animated background',
  );

  assert.match(
    html,
    /#stars,\s*#stars2,\s*#stars3\s*\{[^}]*transform:\s*translate3d\(0, 0, 0\);[^}]*will-change:\s*transform;/s,
    'the circle-owned stars should remain isolated on a compositor layer',
  );
  assert.match(
    html,
    /@keyframes pulse_3011\s*\{[^}]*opacity:\s*0\.75;[\s\S]*opacity:\s*1;/s,
    'the circle glow pulse should animate transform/opacity instead of repaint-heavy box-shadow',
  );
});
