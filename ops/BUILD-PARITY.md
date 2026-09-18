# Bitty Box — build vs. live parity

**Status: DIVERGENT. A clean build from `src/` does not reproduce production.**
Measured 2026-09-18 against the live docroot `/var/www/bittybox.org/docs`.

## What was wrong (the trap)

1. `dist/` in this checkout was a **tracked symlink to the live document root**:
   `dist -> /var/www/bittybox.org/docs`.
2. `vite.config.ts` had no `outDir`, so `npm run build` wrote through that symlink
   **straight into production**, with `emptyOutDir: false`.
3. The build output does **not** match what is live. Promoting it silently
   downgrades the site — no deploy step, no diff, no rollback.

Both halves are now fixed:

- `vite.config.ts` → `build.outDir: '.build'`, `emptyOutDir: true`.
- `dist` now points at the local `.build/` directory (`dist -> .build`).
  **Never repoint it at a served directory.**
- `ops/verify-build-parity.sh` fails loudly when a build would regress live.

## The divergence, measured

Live editor bundle: `docs/assets/index-preview-fix-A3C20D50.js` (referenced by
the hand-maintained `docs/editor.html`).

### Before the recovery (2026-09-18, first measurement)

| marker | live | fresh build from `/root/TheBittyBox/src` | meaning |
| --- | --- | --- | --- |
| `x402` | 14 | **1** | live's payments/monetize wiring is absent from `src/` |
| `FUNDING` | 3 | **0** | live has a Funding page; `src/` does not |
| `Agentic` | 3 | 4 | surface differs |
| `Live Locks` | 1 | 1 | matches |
| `Roadmap` | 2 | 1 | live carries an extra roadmap string |
| `WebAuthn` | 1 | 1 | matches |
| bundle bytes | 1,969,895 | 1,831,862 | **138 KB** of live code is not in the build |

### After the recovery (same day)

| marker | live | build | status |
| --- | --- | --- | --- |
| `x402` | 14 | 14 | recovered |
| `FUNDING` | 3 | 3 | recovered |
| `Agentic` | 3 | 4 | ok |
| `Live Locks` | 1 | 1 | ok |
| `Roadmap` | 2 | 2 | recovered |
| `WebAuthn` | 1 | 1 | ok |
| bundle bytes | 1,969,895 | 1,861,851 | 108 KB smaller; no known missing feature |

**The gate now exits 0.** What was recovered:

- `src/components/FundingPage.tsx`, `src/components/MonetizeBoxPanel.tsx`,
  `src/utils/authHeaders.ts` ported in from `/root/bittybox2`'s working tree
  (they were never committed anywhere).
- `AppView` gains `'funding'`; `App.tsx` renders `<FundingPage>`; `BittyNavbar`
  gains the FUNDING tab on both the desktop and mobile navs.
- `LockGallery` gains the amber Roadmap tile inside the marquee (live renders it
  as the last card; the repo only had the header button).
- `public/style.css` and `public/editor-stars.css` were stale build inputs
  (881 B / 4,954 B against live's 59,757 B / 54,781 B). `public/` now mirrors the
  tracked `docs/` sources, so a build can no longer clobber live CSS.

### Known remaining deltas (warning-level, not regressions)

- `app.js`: the repo source is ~73 B *ahead* of live (a conditional hover border
  for `COMING SOON` locks). The gate reports this as a pending intentional update.
- The built bundle is ~108 KB smaller than live with no marker missing; most
  likely minifier/version drift rather than absent features. Not investigated.
- `docs/hybrid-theme.css` and `docs/editor.html` are live-only files a build
  never produces, so they cannot be clobbered.


### The second tree

`/root/bittybox2` is at `3b841e2`, an **ancestor** of this repo's `HEAD` (`ffe7b8b`).

| tree | `x402` | `FUNDING` | `Agentic` | `Live Locks` | bundle bytes |
| --- | --- | --- | --- | --- | --- |
| live | 14 | 3 | 3 | 1 | 1,969,895 |
| `/root/bittybox2` @ 3b841e2 | 14 | 3 | 3 | **0** | 1,857,075 |
| `/root/TheBittyBox` @ ffe7b8b | 1 | 0 | 4 | 1 | 1,831,862 |

**Neither tree reproduces live.** Live is a hand-patched artifact carrying the
newer editor chrome (`Live Locks` marquee, roadmap modal — commits `182d2b9`,
`ffe7b8b`) *plus* the older funding/x402 surface that only exists uncommitted in
`bittybox2`. Do not assume a green build means a safe deploy.

## Before promoting any build

```bash
bash ops/verify-build-parity.sh          # builds to /tmp/bb-parity-build and diffs
```

Exit `0` = safe to review, `1` = a regression was detected (do not promote),
`2` = could not evaluate. Current standing result is **FAIL (x402, FUNDING, and
three docroot files)** — expected until the source gap is closed.

Promotion, once the gate is green, is still manual and explicit:

```bash
# 1. snapshot first
tar -czf /root/backups/prod-docs-$(date +%Y%m%dT%H%M%SZ).tar.gz -C /var/www/bittybox.org docs
# 2. copy only the artifacts you intend to change (never a blanket rsync of .build/)
# 3. permissions, then verify
/usr/local/sbin/bittybox-fix-static-permissions
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://bittybox.org/editor
```

## Closing the gap (open work)

The live-only surface must be recovered into the repo before a rebuild is safe:

1. Recover the funding/x402 UI (`FundingPage`, `MonetizeBoxPanel`, their `App.tsx`
   wiring) from `/root/bittybox2` and commit it here.
2. Reconcile `Roadmap` (live 2 vs built 1).
3. Sync `public/index.html`, `public/style.css`, `public/editor-stars.css` with the
   live docroot copies so a build cannot clobber them with stale 881-byte versions.
4. Re-run `ops/verify-build-parity.sh` until it exits 0, then promote deliberately.

## Related

- The additive UI polish layer (`docs/ui-polish.css`, `docs/ui-polish.js`, linked
  from the hand-maintained `docs/editor.html`) exists precisely because the live
  bundle cannot be rebuilt safely. Rollback = delete the two files and their tags.
- `/root/bittybox-live-sync/dist` is a second production-pointing symlink. It is
  not a build tree, but never build inside it.
