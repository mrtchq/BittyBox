# Password Lock — UX Flow Map

**Owner:** Quill (Bitty Box watchdog)
**Date:** 2026-08-18
**Source of truth:** live code in `src/components/BittyRenderer.tsx`, `src/components/BittyEditor.tsx`, `src/App.tsx`, `src/utils/bittyCrypto.ts`
**Security model:** Zero-knowledge, fully client-side. The password is never transmitted or embedded in the URL. Key = `PBKDF2(SHA-256, random 16-byte salt, 310,000 iters)`; cipher = `AES-GCM-256` with a random 96-bit IV per encryption. Wrong password → AES-GCM auth-tag mismatch → `WrongPasswordError` ("Incorrect password. Try again.").

This document maps the **actual** user journey and the **real** UI states currently in the codebase, then flags the gaps between what ships today and the ideal states described in the task brief.

---

## CREATOR JOURNEY (Studio / Box builder)

| Step | What happens in code | State / UI |
|------|----------------------|------------|
| 1. Open Box builder | `BittyEditor.tsx` renders the security panel. | Bento workspace, "Security" cell visible. |
| 2. Enable / set password | `PasswordStrengthMeter` (`BittyEditor.tsx:1370`) bound to `metadata.password`. `onChangeMetadata` writes the password into box metadata. | **PRO gate:** `isLocked={mode === 'simple' && !isPro}` — in `simple` mode the password field is locked behind the PRO paywall (`onOpenPaywall` fires). In PRO / studio mode it is editable. Live strength meter + generator active while typing. |
| 3. Build shareable link | `App.tsx:504` — when `metadata.password` is set, payload is encrypted with `encryptBox(plaintext, password)` before being packed into the URL fragment. `App.tsx:559` flags `encrypted: !!metadata.password`. | Payload leaves the browser **already encrypted**. URL fragment contains ciphertext + salt + IV, never the password. |
| 4. Copy & share | Standard share flow (`App.tsx` build/share path). | Creator copies the encrypted URL and sends it out-of-band. No server call, no key exchange. |

**Creator states that exist:** idle (field blank), typing (live strength feedback), locked (PRO prompt in simple mode).
**Creator states NOT yet explicit in UI:** none missing for the core loop — the brief's "generates the encrypted URL → copies and shares it" is handled by the existing share flow.

---

## RECIPIENT JOURNEY (Unlock screen)

Rendered by `BittyRenderer.tsx` when `needsPassword` is true.

| Step | What happens in code | State / UI |
|------|----------------------|------------|
| 1. Open link | `BittyRenderer` detects encrypted payload, renders full-screen lock overlay (`fixed inset-0 … z-50`). | **Idle lock screen:** fuchsia `Lock` icon (pulsing), "ENCRYPTED BITTY BOX" (CyberScrambleText), "This payload is encrypted with AES-256 cipher. Enter the secret passcode to view." |
| 2. Enter password | `passwordInput` state; input is `autoFocus`. | **Typing:** field active, `Show/Hide` toggle (`Eye`/`EyeOff`) works, Unlock button enabled only when input non-empty (`disabled={isLoading || !passwordInput.trim()}`). Typing clears any prior error (`if (error) setError(null)`). |
| 3. Submit | `handlePasswordSubmit` → `loadData(passwordInput)`. | **Submitting:** button shows `RefreshCw` spinner + "DECRYPTING PAYLOAD…", input + button disabled. |
| 4. Wrong password | `decryptBox` throws `WrongPasswordError` → `setError`. | **Error:** inline rose banner (`AlertTriangle` + message). No page reload. User retries. ⚠️ *See gap #1.* |
| 5. Correct password | `decryptBox` succeeds → `content` set → `getRenderedHtml(content, metadata)` renders in iframe. | **Success:** lock overlay unmounts, content renders. ⚠️ *See gap #2.* |
| 6. Unrecoverable decode error | Non-password corruption path. | **Decode error:** "TRANSMISSION DECODE ERROR" fallback with "OPEN STUDIO TO REBUILD" CTA (if `onEdit`). |

**Zero backend calls:** confirmed — all crypto runs in `SubtleCrypto` locally; the URL fragment alone never yields plaintext without the password.

---

## GAPS vs. IDEAL BRIEF (actionable)

1. **Error state lacks the shake animation.** Brief asks for "shake animation on input" on wrong password. Today it is an inline banner only. *Fix:* add a `shake` keyframe + apply a transient class to the input on `WrongPasswordError`.
2. **Success unlock has no explicit transition.** Brief asks for "smooth fade/dissolve transition" on unlock. Today the overlay simply unmounts. *Fix:* wrap overlay exit in a fade/dissolve (e.g. `animate-out fade-out duration-300`) before content mounts.
3. **No password hint / recovery path.** By design (zero-knowledge) there is no reset — document this explicitly in the lock screen copy so recipients don't expect one.
4. **PRO-gate visibility.** The `simple`-mode lock behind PRO is a business rule, not a security one. Consider a one-line note in the lock UI when `isLocked` so simple-mode creators understand why the field is disabled.

---

## DECISION NOTES
- Security posture is sound and matches the v1 SCOPE.md rule "Gated payloads stay server-side / zero-knowledge." No changes required to the crypto.
- The only work needed to fully satisfy the brief is **front-end polish** (gap #1, #2) — both are low-risk, non-destructive CSS/state tweaks, good candidates for a follow-up Step #3 build task.
