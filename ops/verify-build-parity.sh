#!/bin/bash
# =============================================================================
# Bitty Box — build-vs-live parity gate
# -----------------------------------------------------------------------------
# WHY THIS EXISTS
#   The live /editor bundle (docs/assets/index-preview-fix-A3C20D50.js) is a
#   HAND-PATCHED artifact. A clean `vite build` from src/ does NOT reproduce it:
#
#     marker        live      fresh build from /root/TheBittyBox/src
#     x402          14        1        <- live's payments/monetize surface
#     FUNDING        3        0        <- live has a Funding page, src does not
#     Agentic        3        4
#     Live Locks     1        1
#     Roadmap        2        1
#     bundle bytes   1,969,895  1,831,862
#
#   Every one of those is a silent downgrade if the build is promoted blind.
#   This script builds into a scratch directory and FAILS LOUDLY instead.
#
# USAGE
#   bash ops/verify-build-parity.sh                # build + compare, human table
#   bash ops/verify-build-parity.sh --no-build     # compare the last scratch build
#   exit 0 = parity sane, 1 = regression detected, 2 = could not evaluate
#
# It never writes to the document root and never restarts a service.
# =============================================================================
set -uo pipefail

REPO="${REPO:-/root/TheBittyBox}"
LIVE="${LIVE:-/var/www/bittybox.org/docs}"
SCRATCH="${SCRATCH:-/tmp/bb-parity-build}"
DO_BUILD=1
[ "${1:-}" = "--no-build" ] && DO_BUILD=0

fail=0
warn=0
note() { printf '  %s\n' "$*"; }
ok()   { printf '  \033[32mPASS\033[0m  %s\n' "$*"; }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$*"; fail=$((fail+1)); }
wrn()  { printf '  \033[33mWARN\033[0m  %s\n' "$*"; warn=$((warn+1)); }

echo "Bitty Box build-vs-live parity gate"
echo "  repo    : $REPO"
echo "  live    : $LIVE"
echo "  scratch : $SCRATCH"
echo

# ---------------------------------------------------------------- 0. inputs --
if [ ! -f "$LIVE/editor.html" ]; then
  echo "cannot evaluate: $LIVE/editor.html missing"; exit 2
fi

LIVE_BUNDLE_REL=$(grep -o '/assets/index-[A-Za-z0-9_.-]*\.js' "$LIVE/editor.html" | head -1)
LIVE_BUNDLE="$LIVE${LIVE_BUNDLE_REL}"
echo "live editor bundle: ${LIVE_BUNDLE_REL:-<none found>}"
if [ ! -f "$LIVE_BUNDLE" ]; then
  echo "cannot evaluate: live bundle $LIVE_BUNDLE not found"; exit 2
fi

# ----------------------------------------------------------------- 1. build --
if [ "$DO_BUILD" = "1" ]; then
  echo; echo "[1/4] building to scratch (never to dist/ or the docroot)"
  rm -rf "$SCRATCH"
  ( cd "$REPO" && CI=1 npx vite build --outDir "$SCRATCH" --emptyOutDir ) >/tmp/bb-parity-build.log 2>&1
  rc=$?
  if [ $rc -ne 0 ]; then
    echo "  build failed (rc=$rc); see /tmp/bb-parity-build.log"; exit 2
  fi
  note "build ok -> $SCRATCH"
  # Apply the same staging step `npm run build` uses, so the gate inspects what
  # would actually be promoted (shell staged as editor.html).
  if ( cd "$REPO" && node ops/stage-build.mjs "$SCRATCH" ) >>/tmp/bb-parity-build.log 2>&1; then
    note "staged: index.html -> editor.html"
  else
    echo "  staging step failed; see /tmp/bb-parity-build.log"; exit 2
  fi
else
  echo; echo "[1/4] skipping build (--no-build)"
fi

BUILT_BUNDLE=$(ls "$SCRATCH"/assets/index-*.js 2>/dev/null | head -1)
if [ -z "$BUILT_BUNDLE" ]; then
  echo "cannot evaluate: no bundle in $SCRATCH/assets"; exit 2
fi

# ------------------------------------------------------ 2. marker surfaces --
echo; echo "[2/4] feature-surface markers (live must not be silently dropped)"
count() { grep -o -- "$2" "$1" 2>/dev/null | wc -l; }

printf '  %-16s %-10s %-10s %s\n' MARKER LIVE BUILD VERDICT
check_marker() { # name, minimum
  local name="$1" min="$2"
  local l b
  l=$(count "$LIVE_BUNDLE" "$name")
  b=$(count "$BUILT_BUNDLE" "$name")
  if [ "$l" -gt 0 ] && [ "$b" -lt "$l" ]; then
    printf '  %-16s %-10s %-10s ' "$name" "$l" "$b"
    printf '\033[31mREGRESSION\033[0m\n'; fail=$((fail+1))
  elif [ "$l" -gt 0 ] && [ "$b" -eq 0 ]; then
    printf '  %-16s %-10s %-10s ' "$name" "$l" "$b"
    printf '\033[31mLOST\033[0m\n'; fail=$((fail+1))
  else
    printf '  %-16s %-10s %-10s \033[32mok\033[0m\n' "$name" "$l" "$b"
  fi
}
check_marker x402 1
check_marker FUNDING 1
check_marker Agentic 1
check_marker "Live Locks" 1
check_marker Roadmap 1
check_marker WebAuthn 1

echo
lsz=$(stat -c%s "$LIVE_BUNDLE"); bsz=$(stat -c%s "$BUILT_BUNDLE")
delta=$(( lsz - bsz ))
printf '  bundle bytes: live=%s built=%s delta=%s\n' "$lsz" "$bsz" "$delta"
if [ "$delta" -gt 50000 ]; then
  wrn "built bundle is ${delta} bytes smaller than live - review before promoting"
fi

# ------------------------------------------- 3. destructive-overwrite check --
echo; echo "[3/4] files the build would overwrite in the docroot"
# Hand-maintained pages that live in the docroot but are NOT build artifacts.
# Overwriting one of these with a build output is the destructive case.
HANDMADE="index.html app.js style.css editor-stars.css hybrid-theme.css assets/lockEngine.js"
for f in $HANDMADE; do
  if [ -f "$SCRATCH/$f" ] && [ -f "$LIVE/$f" ]; then
    if cmp -s "$SCRATCH/$f" "$LIVE/$f"; then
      printf '  %-24s identical to live\n' "$f"
    elif [ -f "$REPO/docs/$f" ] && cmp -s "$SCRATCH/$f" "$REPO/docs/$f"; then
      # The build reproduces the repo's tracked source, and live is simply behind.
      # That is a pending intentional change, not a clobber.
      printf '  %-24s \033[33mpending intentional update\033[0m (build == repo source; live is older)\n' "$f"
      warn=$((warn+1))
    else
      printf '  %-24s \033[31mWOULD BE REPLACED with content that is NOT in the repo source\033[0m (live=%s built=%s)\n' \
        "$f" "$(stat -c%s "$LIVE/$f")" "$(stat -c%s "$SCRATCH/$f")"
      fail=$((fail+1))
    fi
  elif [ -f "$SCRATCH/$f" ]; then
    printf '  %-24s \033[33mnot in docroot; would be added\033[0m\n' "$f"; warn=$((warn+1))
  else
    printf '  %-24s build does not produce it (live-only, safe)\n' "$f"
  fi
done
# The React shell must arrive as `editor.html` (see ops/stage-build.mjs), never as
# `index.html` — that slot belongs to the hand-maintained landing page.
norm() { sed -e 's/^[[:space:]]*//' -e 's/\(index\|editor\)-[A-Za-z0-9_-]*\.\(js\|css\)/BUNDLE.\2/g' "$1"; }
if [ -f "$SCRATCH/index.html" ]; then
  bad "build emitted index.html ($(stat -c%s "$SCRATCH/index.html") B vs live $(stat -c%s "$LIVE/index.html") B) - it must be staged to editor.html, not the landing-page slot"
else
  ok "build did not emit index.html (landing-page slot untouched)"
fi
if [ -f "$SCRATCH/editor.html" ]; then
  if diff -q <(norm "$SCRATCH/editor.html" | sort) <(norm "$LIVE/editor.html" | sort) >/dev/null 2>&1; then
    ok "staged editor.html matches live (bundle hash normalised, tag order ignored)"
  else
    wrn "staged editor.html differs from live beyond the bundle hash and tag order - review before promoting"
  fi
else
  bad "build produced no editor.html - the app shell is missing from the staging output"
fi

# --------------------------------------------------- 4. build path safety ----
echo; echo "[4/4] build output path safety"
if [ -L "$REPO/dist" ]; then
  tgt=$(readlink -f "$REPO/dist")
  if [ "$tgt" = "$(readlink -f "$LIVE")" ]; then
    bad "$REPO/dist still symlinks to the LIVE docroot - a bare 'vite build --outDir dist' would publish to production"
  else
    ok "$REPO/dist -> $tgt (not the docroot)"
  fi
else
  ok "$REPO/dist is not a symlink into production"
fi
cfg_out=$(grep -oE "outDir:\s*'[^']+'" "$REPO/vite.config.ts" | head -1)
case "$cfg_out" in
  *dist*) bad "vite.config.ts $cfg_out - build output must not be named dist" ;;
  "")     wrn "could not read build.outDir from vite.config.ts" ;;
  *)      ok "vite.config.ts $cfg_out" ;;
esac

# ------------------------------------------------------------------ verdict --
echo
if [ "$fail" -gt 0 ]; then
  printf '\033[31mGATE FAILED\033[0m  %s hard finding(s), %s warning(s)\n' "$fail" "$warn"
  echo "Do NOT promote this build to $LIVE."
  exit 1
fi
printf '\033[32mGATE PASSED\033[0m  %s warning(s)\n' "$warn"
exit 0
