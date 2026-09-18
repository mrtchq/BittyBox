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

| marker | live | fresh build from `/root/TheBittyBox/src` | meaning |
| --- | --- | --- | --- |
| `x402` | 14 | **1** | live's payments/monetize wiring is absent from `src/` |
| `FUNDING` | 3 | **0** | live has a Funding page; `src/` does not |
| `Agentic` | 3 | 4 | surface differs |
| `Live Locks` | 1 | 1 | matches |
| `Roadmap` | 2 | 1 | live carries an extra roadmap string |
| `WebAuthn` | 1 | 1 | matches |
| bundle bytes | 1,969,895 | 1,831,862 | **138 KB** of live code is not in the build |
| `index.html` | 31,919 | 2,995 | the build would replace the whole landing page |
| `style.css` | 59,757 | 881 | build copies a stale `public/style.css` |
| `editor-stars.css` | 54,781 | 4,954 | build copies a stale `public/editor-stars.css` |
| `app.js` | 66,953 | 67,026 | close, still not identical |
| `editor.html`, `hybrid-theme.css` | present | not produced | live-only files, safe from a build |

`MonetizeBoxPanel.tsx` and `FundingPage.tsx` exist only in `/root/bittybox2`'s
working tree and are **not tracked in this repository** — so the funding/x402
surface was never committed here. That is why the build cannot reproduce it.

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
