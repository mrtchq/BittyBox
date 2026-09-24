import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const htmlPath = new URL('../docs/capsule/index.html', import.meta.url);
const cssPath = new URL('../docs/capsule/dms.css', import.meta.url);
const jsPath = new URL('../docs/capsule/dms.js', import.meta.url);

test('capsule mobile responsive layout rules enforce zero scroll and viewport fit', async () => {
  const [html, css, js] = await Promise.all([
    readFile(htmlPath, 'utf8'),
    readFile(cssPath, 'utf8'),
    readFile(jsPath, 'utf8'),
  ]);

  // 1. Mobile viewport condition detection (<= 768px)
  assert.match(css, /@media\s*\(\s*max-width:\s*768px\s*\)/, 'CSS must include media query for <= 768px');
  assert.match(js, /window\.innerWidth\s*<=\s*768/, 'JS must detect mobile viewport <= 768px');
  assert.match(js, /data-mobile/, 'JS must set mobile data attribute');

  // 2. Eliminate all scrollbars across interface
  assert.match(css, /scrollbar-width:\s*none\s*!important/, 'Must hide scrollbars via scrollbar-width: none');
  assert.match(css, /::-webkit-scrollbar\s*\{[^}]*display:\s*none\s*!important/, 'Must hide webkit scrollbars');

  // 3. Overflow suppression on relevant containers
  assert.match(css, /\.dms-pane\s*\{[^}]*overflow-y:\s*hidden\s*!important/, 'Pane must suppress vertical overflow');
  assert.match(css, /\.dms-pane\s*\{[^}]*overflow-x:\s*clip\s*!important/, 'Pane must clip horizontal overflow');
  assert.match(css, /\.dms-pane-body\s*\{[^}]*overflow:\s*hidden\s*!important/, 'Pane body must suppress overflow');

  // 4. Slide height layout constraints
  assert.match(css, /\.dms-pane\s*\{[^}]*height:\s*100%\s*!important/, 'Pane must enforce 100% height');
  assert.match(css, /\.dms-pane-body\s*\{[^}]*height:\s*100%\s*!important/, 'Pane body must enforce 100% height');

  // 5. Dynamic JS layout enforcement hook
  assert.match(js, /function enforceMobileSlideLayout\(\)/, 'JS must include enforceMobileSlideLayout function');
  assert.match(js, /window\.__BB_TEST_DMS/, 'JS must expose verification contract');
});
