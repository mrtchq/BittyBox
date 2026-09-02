import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const page = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

test('page defines Ghost CMS compatible block tool classes', () => {
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

test('convertEditorJSToHTML supports Ghost CMS HTML card', () => {
  assert.match(page, /case\s+['"]html['"]:/);
  assert.match(page, /kg-card\s+kg-html-card/);
});

test('convertEditorJSToHTML supports Ghost CMS Embed card', () => {
  assert.match(page, /case\s+['"]embed['"]:/);
  assert.match(page, /kg-card\s+kg-embed-card/);
  assert.match(page, /kg-embed-container/);
});

test('convertEditorJSToHTML supports Ghost CMS Audio card', () => {
  assert.match(page, /case\s+['"]audio['"]:/);
  assert.match(page, /kg-card\s+kg-audio-card/);
  assert.match(page, /kg-audio-player-container/);
  assert.match(page, /kg-audio-thumbnail/);
  assert.match(page, /<audio\s+controls/);
});

test('parseEmbedUrl helper correctly formats embeds for YouTube, Vimeo, Spotify, SoundCloud, CodePen, and iframes', () => {
  const fnMatch = page.match(/function\s+parseEmbedUrl\s*\([\s\S]*?\n\s{4}\}/);
  assert.ok(fnMatch, 'parseEmbedUrl function found in index.html');
  const parseEmbedUrl = new Function(`${fnMatch[0]}; return parseEmbedUrl;`)();

  // YouTube standard watch URL
  const yt1 = parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(yt1.service, 'youtube');
  assert.match(yt1.embedHtml, /https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ/);

  // YouTube short URL
  const yt2 = parseEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
  assert.equal(yt2.service, 'youtube');
  assert.match(yt2.embedHtml, /https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ/);

  // Vimeo
  const vimeo = parseEmbedUrl('https://vimeo.com/76979871');
  assert.equal(vimeo.service, 'vimeo');
  assert.match(vimeo.embedHtml, /https:\/\/player\.vimeo\.com\/video\/76979871/);

  // Spotify track
  const spotify = parseEmbedUrl('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
  assert.equal(spotify.service, 'spotify');
  assert.match(spotify.embedHtml, /https:\/\/open\.spotify\.com\/embed\/track\/4cOdK2wGLETKBW3PvgPWqT/);

  // SoundCloud
  const sc = parseEmbedUrl('https://soundcloud.com/artist/track-name');
  assert.equal(sc.service, 'soundcloud');
  assert.match(sc.embedHtml, /w\.soundcloud\.com\/player/);

  // CodePen
  const cp = parseEmbedUrl('https://codepen.io/username/pen/xyz123');
  assert.equal(cp.service, 'codepen');
  assert.match(cp.embedHtml, /https:\/\/codepen\.io\/username\/embed\/xyz123/);

  // Raw iframe
  const rawIframe = '<iframe src="https://example.com/widget" width="500" height="300"></iframe>';
  const parsedIframe = parseEmbedUrl(rawIframe);
  assert.equal(parsedIframe.service, 'iframe');
  assert.equal(parsedIframe.embedHtml, rawIframe);
});

test('convertEditorJSToHTML roundtrip produces Ghost CMS compatible HTML structure', () => {
  const fnMatch = page.match(/function\s+convertEditorJSToHTML\s*\([\s\S]*?\n\s{4}\}/);
  const parseEmbedMatch = page.match(/function\s+parseEmbedUrl\s*\([\s\S]*?\n\s{4}\}/);
  assert.ok(fnMatch, 'convertEditorJSToHTML found');
  assert.ok(parseEmbedMatch, 'parseEmbedUrl found');

  const convertEditorJSToHTML = new Function(`${parseEmbedMatch[0]}; ${fnMatch[0]}; return convertEditorJSToHTML;`)();

  const mockData = {
    blocks: [
      {
        type: 'header',
        data: { text: 'Test Capsule', level: 2 }
      },
      {
        type: 'html',
        data: { html: '<div class="custom-badge">Special Content</div>' }
      },
      {
        type: 'embed',
        data: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          caption: 'Rick Astley Classic'
        }
      },
      {
        type: 'audio',
        data: {
          src: 'https://example.com/audio/sample.mp3',
          title: 'Podcast Episode 42',
          artist: 'Bitty Radio',
          caption: 'Recorded live'
        }
      }
    ]
  };

  const html = convertEditorJSToHTML(mockData);

  // Verify HTML card
  assert.match(html, /<div class="kg-card kg-html-card">\s*<div class="custom-badge">Special Content<\/div>\s*<\/div>/);

  // Verify Embed card
  assert.match(html, /<figure class="kg-card kg-embed-card">/);
  assert.match(html, /https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ/);
  assert.match(html, /<figcaption>Rick Astley Classic<\/figcaption>/);

  // Verify Audio card
  assert.match(html, /<div class="kg-card kg-audio-card">/);
  assert.match(html, /<div class="kg-audio-title">Podcast Episode 42<\/div>/);
  assert.match(html, /<div class="kg-audio-artist">Bitty Radio<\/div>/);
  assert.match(html, /<audio controls src="https:\/\/example\.com\/audio\/sample\.mp3" preload="metadata"><\/audio>/);
  assert.match(html, /<div class="kg-audio-caption">Recorded live<\/div>/);
});
