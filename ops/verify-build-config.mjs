#!/usr/bin/env node
/**
 * Fail the build when the Firebase config did not make it into the bundle.
 *
 * WHY THIS EXISTS
 *   src/lib/firebase.ts starts with:
 *
 *     const requiredEnv = (key) => {
 *       const value = import.meta.env[key];
 *       if (!value) throw new Error(`Missing required Firebase config: ${key}`);
 *       return value;
 *     };
 *
 *   That throw runs at module init, i.e. before React mounts. A build produced
 *   without the Vite env (no .env in the repo root and no VITE_* vars exported
 *   in the shell) therefore ships a bundle that dies on load and renders a
 *   completely BLANK /editor page — while every asset still returns HTTP 200
 *   with the right MIME type, so the usual curl check looks perfectly healthy.
 *   This script turns that silent production outage into a build failure.
 *
 * WHAT IT CHECKS
 *   For each REQUIRED key it loads the same env Vite would load (the repo-root
 *   .env files plus any VITE_* already exported in the environment), then
 *   asserts the corresponding VALUE is present in the built JavaScript. Checking
 *   the value — not just that a file exists — is what catches the real bug: an
 *   env that is missing, renamed, or not loaded at build time leaves a bundle
 *   with the placeholder resolved to nothing.
 *
 *   Secret values are never printed; only key names, and a value length.
 *
 * USAGE
 *   node ops/verify-build-config.mjs [buildDir]     # default: .build
 *   exit 0 = config baked in, 1 = bundle would blank the app, 2 = could not check
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(process.argv[2] || path.join(REPO, '.build'));

// Keys src/lib/firebase.ts calls requiredEnv() for. Keep in sync with that file.
const REQUIRED = [
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
];

console.log('Bitty Box build config gate');
console.log(`  repo : ${REPO}`);
console.log(`  build: ${dir}`);

// ------------------------------------------------------------------ inputs --
const assetsDir = path.join(dir, 'assets');
if (!existsSync(assetsDir)) {
  console.error(`\n  cannot evaluate: no ${assetsDir} — did the build run?`);
  process.exit(2);
}

const bundles = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
if (bundles.length === 0) {
  console.error(`\n  cannot evaluate: no .js bundle in ${assetsDir}`);
  process.exit(2);
}

// The env exactly as Vite sees it for a production build: .env files rooted at
// the repo, plus anything already exported in this shell (prefixes '').
const env = loadEnv('production', REPO, '');
const bundleText = bundles
  .map((f) => readFileSync(path.join(assetsDir, f), 'utf8'))
  .join('\n');

// ------------------------------------------------------------------- checks --
let fail = 0;
let warn = 0;

for (const key of REQUIRED) {
  const value = env[key];
  if (!value) {
    console.error(`  FAIL  ${key}: not set — the built bundle would throw at boot and render a blank page.`);
    fail += 1;
    continue;
  }
  if (!bundleText.includes(value)) {
    console.error(`  FAIL  ${key}: set in the env (${value.length} chars) but NOT baked into the bundle — the build did not load this env.`);
    fail += 1;
    continue;
  }
  console.log(`  PASS  ${key}: baked into the bundle (${value.length} chars)`);
}

// A Firebase web api key is a public, non-secret string that always starts AIza.
const apiKey = env.VITE_FIREBASE_API_KEY || '';
if (apiKey && !/^AIza[0-9A-Za-z_-]{35}$/.test(apiKey)) {
  console.warn(`  WARN  VITE_FIREBASE_API_KEY does not look like a Firebase web key (expected AIza + 35 chars).`);
  warn += 1;
}

// Guard against a bundle that would blow up on the missing-config path even if
// someone renames the env keys without updating REQUIRED above.
if (/Missing required Firebase config/.test(bundleText) === false) {
  console.warn('  WARN  the bundle has no "Missing required Firebase config" guard at all — is firebase.ts still wired up?');
  warn += 1;
}

// ------------------------------------------------------------------ verdict --
console.log('');
if (fail > 0) {
  console.error(`CONFIG GATE FAILED  ${fail} required key(s) missing from the bundle, ${warn} warning(s).`);
  console.error('');
  console.error('  This build would render a BLANK editor page in production.');
  console.error('  Fix: put the VITE_FIREBASE_* keys in the repo-root .env, e.g.');
  console.error('    cp /var/www/bittybox.org/.env ' + path.join(REPO, '.env'));
  console.error('  then rebuild. Never promote a build that fails this gate.');
  process.exit(1);
}
console.log(`CONFIG GATE PASSED  ${warn} warning(s)`);
process.exit(0);
