import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const landingPath = new URL('../docs/index.html', import.meta.url);
const landingScriptPath = new URL('../docs/app.js', import.meta.url);

function section(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, `missing start marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing end marker: ${endMarker}`);
  return html.slice(start, end);
}

test('landing header exposes only API/MCP Server and Open Editor actions', async () => {
  const html = await readFile(landingPath, 'utf8');
  const header = section(html, '<!-- Top Navigation Header -->', '</header>');

  assert.match(header, /href="\/api\/docs"[^>]*>[\s\S]*?API\/MCP Server/);
  assert.match(header, /href="\/editor"[^>]*>[\s\S]*?Open Editor/);
  assert.equal((header.match(/<a\b/g) || []).length, 2);
  assert.equal((header.match(/<button\b/g) || []).length, 0);

  for (const removedLabel of ['Ceremony Console', 'Combos', 'Live Locks', 'Roadmap', 'Share Vault']) {
    assert.doesNotMatch(header, new RegExp(removedLabel, 'i'));
  }
});

test('landing footer exposes working legal and contact destinations', async () => {
  const html = await readFile(landingPath, 'utf8');
  const footer = section(html, '<!-- Footer -->', '</footer>');

  assert.match(html, /href="\/style\.css\?v=20260915-header-footer"/);
  assert.match(html, /src="\/app\.js\?v=20260915-header-footer"/);
  assert.match(footer, /href="\/editor#\/terms"[^>]*>Terms of Service<\/a>/);
  assert.match(footer, /href="\/editor#\/privacy"[^>]*>Privacy Policy<\/a>/);
  assert.match(footer, /href="mailto:support@bittybox\.org"[^>]*>Contact Us<\/a>/);
});

test('landing script tolerates the removed Share Vault header button', async () => {
  const script = await readFile(landingScriptPath, 'utf8');
  assert.match(script, /document\.getElementById\('btnQuickShare'\)\?\.addEventListener/);
});
