# ADR: Access-Counter Architecture — VPS-Backed vs Client-Side

**Status:** DECIDED (VPS-backed is the source of truth) — 2026-08-18
**Owner:** T.C. · **Recorded by:** Quill (Bitty Box watchdog, Step #1)
**Project:** Bitty Box · **Todoist task:** `6hHq9v6QRRmFfhRh` (Step #1 — Evaluate and decide)
**Supersedes:** open architecture question from the Password/Time/Access-Limit build plan

---

## 1. Decision

**The access counter is VPS-backed and server-authoritative for every action that
gates or scopes access.** Client-side counters are permitted ONLY for purely cosmetic,
non-binding "vanity" display (e.g. a "viewed N times" stat) and MUST NEVER be used to
decide whether a Box opens, expires, or is exhausted.

This is already implemented and is consistent with locked `SCOPE.md` rules #3
("Gated payloads stay server-side") and #4 ("Audit everything"):

- `lib/box-store.js` → `incrementOpensUsed(id)` persists `opensUsed` to disk; the
  comment is explicit: *"opensUsed is authoritative on disk; per-session is
  best-effort sticky."*
- `lib/policy-evaluator.js` → `evaluateOpenLimit(config, currentOpensUsed)` denies
  with `open_limit_reached` when `currentOpensUsed >= max`, evaluated server-side
  before payload delivery.
- `lib/policy.v1.schema.json` models `maxOpensRule` as a server-enforced policy.

No client-side gating of `maxOpens` / `remainingOpens` exists in `src/` — and it
must not be introduced.

---

## 2. Tradeoff evaluated (as requested by the task)

| Axis | Option A — Client-Side (URL-fragment) | Option B — VPS-Backed ✅ |
|------|----------------------------------------|---------------------------|
| Infrastructure | Zero; fully serverless, works offline | Requires the running Box API + store |
| Tamper resistance | Trivially spoofable: user edits the fragment | Tamper-proof: server owns the count |
| Fit for scarcity-gating | Unsafe ("only 10 can open") | Correct: state is authoritative |
| Auditability | None | Every decision logged (SCOPE rule #4) |
| Revocation | Cannot force-fail post-revoke | `revokeLink` fails delivery immediately |
| Cost / latency | Cheapest | Negligible (single atomic increment) |

**Verdict:** For any state that affects *whether content is delivered*, Option B is
non-negotiable. Option A is acceptable only where the number is decorative.

---

## 3. The one allowed exception (client-side counter)

A Box MAY render a client-side, non-authoritative "opens" or "views" figure **if and
only if** all of the following hold:

1. It is display-only and never read back to make an allow/deny decision.
2. The real gating decision still comes from the server-side `opensUsed`.
3. The UI clearly labels it as informational (e.g. "about N views") so it is not
   mistaken for the remaining-opens scarcity badge.

The scarcity badge ("[N] opens remaining") described in Step #3/Step #4 builder tasks
is **server-derived** and is the binding value.

---

## 4. Why this unblocks the build

Every later step (Step #3 lock UI states, Step #4 builder fields, Step #5 race/
timezone tests) can now assume a single source of truth:

- The builder UI (Step #4) writes `maxOpens` / time-window into the server policy.
- The lock UI (Step #3) reads `remaining = maxOpens - opensUsed` from the server
  response, never computes it locally.
- The tests (Step #5) target `incrementOpensUsed` / `evaluateOpenLimit` directly and
  assert server-authoritative behavior, including the simultaneous-open race.

No future task should re-open "where does the counter live." It lives on the server.
