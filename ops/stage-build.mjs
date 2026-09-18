#!/usr/bin/env node
/**
 * Stage a Vite build for deliberate promotion.
 *
 * WHY: the docroot's `index.html` is the hand-maintained lock-lab landing page
 * (~32 KB). A Vite build emits its own React shell as `index.html`, and copying
 * the build output into the docroot would replace the landing page with a
 * ~3 KB shell. The app is actually served from `editor.html` (the server maps
 * /editor, /editor.html, /app to it), so the shell is renamed on the spot.
 *
 * Nothing here touches the docroot. It only rewrites files under the local
 * build output directory.
 *
 * Usage: node ops/stage-build.mjs [buildDir]   (default: .build)
 */
import { existsSync, renameSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] || '.build');
const html = path.join(dir, 'index.html');
const shell = path.join(dir, 'editor.html');

if (!existsSync(html)) {
  console.error(`[stage-build] no ${html} — did the build run?`);
  process.exit(1);
}

const bytes = statSync(html).size;
const text = readFileSync(html, 'utf8');

// Sanity: refuse to rename something that is obviously not the React shell.
if (!/<div id="root">/.test(text)) {
  console.error(`[stage-build] ${html} has no <div id="root"> — refusing to treat it as the app shell.`);
  process.exit(1);
}
if (bytes > 20000) {
  console.error(
    `[stage-build] ${html} is ${bytes} bytes. That is landing-page sized, not shell sized.\n` +
    `[stage-build] Refusing to rename it to editor.html — check the Vite entry point.`
  );
  process.exit(1);
}

renameSync(html, shell);
console.log(`[stage-build] index.html (${bytes} B) -> editor.html`);
console.log('[stage-build] the landing-page slot in this build output is now empty; the docroot keeps its own index.html.');
