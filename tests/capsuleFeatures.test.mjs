import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const htmlPath = new URL('../docs/capsule/index.html', import.meta.url);
const cssPath = new URL('../docs/capsule/dms.css', import.meta.url);
const jsPath = new URL('../docs/capsule/dms.js', import.meta.url);

test('capsule features: SEALED back button, disarm 5s hold modal, and swipe gesture', async () => {
  const [html, css, js] = await Promise.all([
    readFile(htmlPath, 'utf8'),
    readFile(cssPath, 'utf8'),
    readFile(jsPath, 'utf8'),
  ]);

  // 1. Back button on SEALED slide
  // STEPS array has back: true for sealed
  assert.match(js, /\{\s*id:\s*['"]sealed['"][^}]+back:\s*true\s*\}/, 'SEALED step must have back: true');
  // Pane back button exists in html
  assert.match(html, /id=["']dmsPaneBack["']/, 'HTML must include pane back button on SEALED slide');
  // Both bottom back button and pane back button wired
  assert.match(js, /elPaneBack\.addEventListener\(\s*['"]click['"]/, 'JS must wire pane back button');

  // 2. Disarm confirmation modal with 5-second hold button
  assert.match(html, /id=["']dmsDisarmModal["']/, 'HTML must include disarm modal overlay');
  assert.match(html, /cannot be restarted/i, 'Modal text must state capsule cannot be restarted');
  assert.match(html, /id=["']dmsHoldDisarm["']/, 'HTML must include 5-second hold button');
  assert.match(html, /id=["']dmsCancelDisarm["']/, 'HTML must include cancel button in modal');
  assert.match(css, /\.dms-modal-overlay/, 'CSS must include modal overlay styles');
  assert.match(css, /\.dms-btn-hold/, 'CSS must include hold button styles');
  assert.match(js, /HOLD_DURATION\s*=\s*5000/, 'JS must define 5000ms hold duration');
  assert.match(js, /openDisarmModal/, 'JS must include openDisarmModal');
  assert.match(js, /closeDisarmModal/, 'JS must include closeDisarmModal');
  assert.match(js, /startHold/, 'JS must include startHold');
  assert.match(js, /cancelHold/, 'JS must include cancelHold');
  assert.match(js, /#dmsDisarm['"]\)\.addEventListener\(\s*['"]click['"],\s*(?:function\s*\(\)\s*\{\s*)?openDisarmModal/, 'Clicking disarm must open modal');

  // 3. Swipe gesture navigation
  assert.match(js, /onTouchStart/, 'JS must include touchstart listener for swipe');
  assert.match(js, /onTouchEnd/, 'JS must include touchend listener for swipe');
  assert.match(js, /triggerSwipeIfValid/, 'JS must include triggerSwipeIfValid');
  assert.match(css, /\.dms-pane\s*\{[^}]*touch-action:\s*pan-x\s*!important/, 'Pane must have touch-action: pan-x');
  assert.match(css, /\.dms-pane-body\s*\{[^}]*touch-action:\s*pan-x\s*!important/, 'Pane body must have touch-action: pan-x');
});
