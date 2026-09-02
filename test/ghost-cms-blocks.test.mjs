import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const page = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

function extractBetween(startMarker, endMarker) {
  const start = page.indexOf(startMarker);
  const end = page.indexOf(endMarker, start);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  assert.notEqual(end, -1, `missing ${endMarker}`);
  return page.slice(start, end);
}

const cardHelpersSource = extractBetween('function escapeCardText', 'class GhostHTMLTool');
const convertSource = extractBetween('function convertEditorJSToHTML', 'async function initEditorJS');
const { parseEmbedUrl, convertEditorJSToHTML, toSafeHttpUrl } = new Function(`
  ${cardHelpersSource}
  ${convertSource}
  return { parseEmbedUrl, convertEditorJSToHTML, toSafeHttpUrl };
`)();

test('page defines Ghost-inspired EditorJS block tool classes', () => {
  assert.match(page, /class\s+GhostHTMLTool/);
  assert.match(page, /class\s+GhostEmbedTool/);
  assert.match(page, /class\s+GhostAudioTool/);
});

test('EditorJS configuration registers html, embed, and audio tools', () => {
  assert.match(page, /tools\.html\s*=\s*\{\s*class:\s*GhostHTMLTool/);
  assert.match(page, /tools\.embed\s*=\s*\{\s*class:\s*GhostEmbedTool/);
  assert.match(page, /tools\.audio\s*=\s*\{\s*class:\s*GhostAudioTool/);
});

test('editor header toolbar contains quick insert buttons for HTML, Embed, and Audio', () => {
  assert.match(page, /id="editorjs-add-html-btn"/);
  assert.match(page, /id="editorjs-add-embed-btn"/);
  assert.match(page, /id="editorjs-add-audio-btn"/);
});

test('HTML preview is isolated from the BittyBox editor document', () => {
  assert.match(page, /this\.previewEl\.replaceChildren\(\)/);
  assert.match(page, /previewFrame\.setAttribute\(['"]sandbox['"],\s*['"]['"]\)/);
  assert.match(page, /previewFrame\.srcdoc\s*=\s*val/);
  assert.doesNotMatch(page, /this\.previewEl\.innerHTML\s*=\s*val/);
});

test('capsule viewer executes custom HTML in an opaque-origin sandbox', () => {
  const iframe = page.match(/<iframe id="capsule-viewer-frame"[^>]+>/)?.[0] || '';
  assert.match(iframe, /sandbox="allow-scripts allow-forms allow-popups allow-modals"/);
  assert.doesNotMatch(iframe, /allow-same-origin/);
});

test('embed parser supports known providers and reconstructs raw iframe input safely', () => {
  const cases = [
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', /youtube\.com\/embed\/dQw4w9WgXcQ/],
    ['https://youtu.be/dQw4w9WgXcQ', 'youtube', /youtube\.com\/embed\/dQw4w9WgXcQ/],
    ['https://vimeo.com/76979871', 'vimeo', /player\.vimeo\.com\/video\/76979871/],
    ['https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT', 'spotify', /open\.spotify\.com\/embed\/track\/4cOdK2wGLETKBW3PvgPWqT/],
    ['https://soundcloud.com/artist/track-name', 'soundcloud', /w\.soundcloud\.com\/player/],
    ['https://codepen.io/username/pen/xyz123', 'codepen', /codepen\.io\/username\/embed\/xyz123/]
  ];

  for (const [url, service, expected] of cases) {
    const result = parseEmbedUrl(url);
    assert.equal(result.service, service);
    assert.match(result.embedHtml, expected);
    assert.match(result.embedHtml, /sandbox=/);
    assert.match(result.embedHtml, /referrerpolicy=/);
  }

  const raw = parseEmbedUrl('<iframe src="https://example.com/widget" onload="alert(1)" style="position:fixed"></iframe>');
  assert.equal(raw.service, 'iframe');
  assert.match(raw.embedHtml, /src="https:\/\/example\.com\/widget"/);
  assert.doesNotMatch(raw.embedHtml, /onload|position:fixed/);
});

test('embed and audio URL validation rejects active non-web schemes', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd', 'not a URL']) {
    assert.equal(toSafeHttpUrl(value), '');
    assert.equal(parseEmbedUrl(value).embedHtml, '');
    assert.equal(parseEmbedUrl(value).service, 'invalid');
  }
  assert.equal(toSafeHttpUrl('https://example.com/audio.mp3'), 'https://example.com/audio.mp3');
});

test('block conversion emits Ghost-compatible card structures', () => {
  const html = convertEditorJSToHTML({
    blocks: [
      { type: 'html', data: { html: '<div class="custom-badge">Special Content</div>' } },
      { type: 'embed', data: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: 'Classic' } },
      { type: 'audio', data: { src: 'https://example.com/audio/sample.mp3', title: 'Episode 42', artist: 'Bitty Radio', caption: 'Recorded live' } }
    ]
  });

  assert.match(html, /<div class="kg-card kg-html-card">\s*<div class="custom-badge">Special Content<\/div>\s*<\/div>/);
  assert.match(html, /<figure class="kg-card kg-embed-card">/);
  assert.match(html, /youtube\.com\/embed\/dQw4w9WgXcQ/);
  assert.match(html, /<figcaption>Classic<\/figcaption>/);
  assert.match(html, /<div class="kg-card kg-audio-card">/);
  assert.match(html, /<div class="kg-audio-title">Episode 42<\/div>/);
  assert.match(html, /<audio controls src="https:\/\/example\.com\/audio\/sample\.mp3" preload="metadata"><\/audio>/);
});

test('block conversion never trusts persisted embed markup and escapes metadata', () => {
  const html = convertEditorJSToHTML({
    blocks: [
      {
        type: 'embed',
        data: {
          url: 'https://example.com/widget',
          embed: '<img src=x onerror=alert(1)>',
          caption: '<img src=x onerror=alert(2)>'
        }
      },
      {
        type: 'audio',
        data: {
          src: 'javascript:alert(3)',
          title: '<img src=x onerror=alert(4)>',
          artist: '" onmouseover="alert(5)',
          caption: '<script>alert(6)</script>'
        }
      }
    ]
  });

  assert.doesNotMatch(html, /<img\b|<script>|src=["']javascript:|<iframe[^>]+onload=/i);
  assert.match(html, /&lt;img src=x onerror=alert\(2\)&gt;/);
  assert.match(html, /&lt;script&gt;alert\(6\)&lt;\/script&gt;/);
  assert.match(html, /&quot; onmouseover=&quot;alert\(5\)/);
  assert.doesNotMatch(html, /<audio controls src=/);
});
