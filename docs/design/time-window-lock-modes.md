# Time-Window Lock Modes — Definition (Step #1)

**Scope:** Defines the three user-facing "time-window lock" presets for Bitty Box
links. These are product-level presets that map 1:1 onto the existing
`timeWindowRule` in `lib/policy.v1.schema.json` (`not_before`, `expires_at`).
No schema change is required to ship any of these modes — only UI + client-side
enforcement (Step #2) and the countdown states (Step #3).

Server-side enforcement already exists in `lib/policy-evaluator.js` (a window
with `not_before` makes the link inert before that UTC instant; `expires_at`
auto-revokes it). The client-side job (Step #2) is to *surface* this with live
countdown timers and to block the unlock UI before `not_before` / after
`expires_at` instead of round-tripping to the server for a confusing error.

## Mode A — Future-Open Window (`not_before` only)
- **Policy:** `{ "type": "time_window", "not_before": "<ISO-8601 UTC>" }`
- **Behavior:** Link is inert until the set datetime, then stays open until
  manually revoked or another rule burns it.
- **Countdown UX:** A single "Unlocks in HH:MM:SS" timer. Unlock button disabled
  and greyed until `now >= not_before`. After open, no closing countdown.
- **Use case:** Scheduled reveal (launch at 9am, drip a doc, embargoed drop).

## Mode B — Limited-Time Window (`not_before` + `expires_at`)
- **Policy:** `{ "type": "time_window", "not_before": "<ISO-8601 UTC>", "expires_at": "<ISO-8601 UTC>" }`
- **Behavior:** Link is live *only* between the two instants. Inert before,
  auto-revoked after.
- **Countdown UX:** Two-phase timer.
  - Before `not_before`: "Unlocks in HH:MM:SS" (unlock disabled).
  - Between: "Locks in HH:MM:SS" (unlock enabled).
  - After `expires_at`: "Link expired" terminal state, unlock disabled, audit
    log shows auto-revoke.
- **Use case:** Webinar handout, 24h sale link, time-boxed handoff.

## Mode C — Countdown Self-Destruct (`expires_at` only, relative from create)
- **Policy:** `{ "type": "time_window", "expires_at": "<now + duration, UTC>" }`
  (duration chosen at build time: 1h / 24h / 7d presets, or custom).
- **Behavior:** Live immediately, auto-revokes after the timer burns down. No
  future open gate.
- **Countdown UX:** Always-on "Burns in HH:MM:SS" timer, visible on the lock
  screen and re-shown after each open while the grant is valid. At zero: terminal
  "Link expired" state.
- **Use case:** Ephemeral share, self-destructing secret, expiring proof link.

## Cross-cutting rules (apply to all three)
1. **Timezone:** Builder picks local time; policy stores UTC. Countdown renders
   in the viewer's local timezone via `Intl.DateTimeFormat` so "unlocks in" is
   always correct wherever opened.
2. **Source of truth is the server.** Client countdown is a *convenience*; the
   server policy-evaluator is authoritative. If client clock is off, server still
   enforces — client just shows "checking…" then the real state.
3. **Always-audited.** Per `SCOPE.md` rule 4, every open attempt (including
   blocked pre/post-window attempts) is written to the audit log.
4. **Composable.** These modes stack with `password`, `totp`, `max_opens`
   (incl. `one_time`), and `telegram_approval`. Time window is evaluated first;
   if inert/expired, downstream gates are never shown.

## Handoff to Step #2 (client-side enforcement)
Expose a tiny pure helper `evaluateTimeWindow(policy, nowMs)` returning one of:
`PENDING` (before `not_before`), `OPEN` (inside window), `EXPIRED` (past
`expires_at`), or `NONE` (no time_window rule). Step #2 renders the matching
countdown/disabled state from this + a `setInterval` tick. Step #3 owns the
visual states; this definition is the contract they consume.
