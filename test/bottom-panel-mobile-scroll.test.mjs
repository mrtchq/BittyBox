import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

test('bottom locks panel uses the dynamic mobile viewport', () => {
  const panel = html.match(/\.bottom-panel\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
  assert.match(panel, /height:\s*100vh\s*;/);
  assert.match(panel, /height:\s*100dvh\s*;/);
  assert.match(panel, /max-height:\s*100dvh\s*;/);
  assert.match(panel, /overflow:\s*hidden\s*;/);
});

test('bottom locks panel gives its flex scroll body ownership of overflow', () => {
  const scrollRules = html.match(/\.bottom-panel\s*>\s*\.overflow-y-auto\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
  assert.match(scrollRules, /min-height:\s*0\s*;/);
  assert.match(scrollRules, /padding-bottom:\s*calc\(2rem\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\)\s*;/);
});

test('bottom locks panel enables touch scrolling and contains scroll chaining', () => {
  const scrollRules = html.match(/\.bottom-panel\s+\.panel-scroll\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
  assert.match(scrollRules, /-webkit-overflow-scrolling:\s*touch\s*;/);
  assert.match(scrollRules, /overscroll-behavior:\s*contain\s*;/);
});
