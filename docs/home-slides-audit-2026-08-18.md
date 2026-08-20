# Bitty Box Homepage Slides — Content Audit & Archive

**Archive date:** 2026-08-18 (UTC)
**Source of truth:** `src/content/homeSlides.ts`
**Captured from git revision:** `2d7e177`
**Purpose:** Baseline snapshot before the slide redesign track (Steps #5 Write Copy → #7 Layout/Animation → #8 Build/Integrate → #9 QA/Deploy). Keep this file read-only as the reference of *what shipped today*.

---

## Deck order (as exported by `homeSlides`)

1. `self-contained-url` — A complete website lives inside its own link.
2. `password-lock` — Password Lock
3. `time-based-lock` — Time-Based Lock
4. `access-limit-lock` — Access Limit Lock  *(EMPTY STUB — copy pending Step #5)*
5. `agentic-voice-lock` — Agentic Voice Lock

---

## Slide 1 — Self-Contained Website in a URL
- **kicker:** WHAT IS IT
- **headline:** A complete website lives inside its own link.
- **body (chars):** 388
- **bullets (4):**
  - LZMA compression shrinks a full page down to a few kilobytes
  - No server, no hosting, no database — nothing to manage or leak
  - Works offline: the site reconstructs itself right in the browser
  - One link carries everything — bittybox.org/#<your-site>
- **cta:** Build a Box →
- **metaDescription (chars):** 174

## Slide 2 — Password Lock
- **kicker:** LOCK MODE 02
- **headline:** Password Lock
- **body (chars):** 365
- **bullets (3):**
  - AES-GCM encryption in the browser — your content stays unreadable in transit and at rest
  - PBKDF2 key derivation — the password never leaves the recipient's device
  - Zero-knowledge by design — the server stores ciphertext, never your key
- **cta:** Lock a Box →
- **metaDescription (chars):** 186

## Slide 3 — Time-Based Lock
- **kicker:** LOCK MODE 03
- **headline:** Time-Based Lock
- **body (chars):** 416
- **bullets (3):**
  - Not-before + expires-at — your Box simply does not exist outside its window
  - Auto-revoke on schedule — no leftover cache, no manual cleanup, no loose ends
  - Pin it to the minute — embargoes, offers, and reveals fire exactly on time
- **cta:** Time-lock a Box →
- **metaDescription (chars):** 197

## Slide 4 — Access Limit Lock  ⚠ EMPTY STUB
- **kicker:** LOCK MODE 04
- **headline:** Access Limit Lock
- **body:** *(empty — pending Step #5 copy)*
- **bullets:** *(none)*
- **cta:** *(empty)*
- **metaDescription:** *(empty)*
- **Note:** This is the only slot with no authored copy. Step #5 ("Write copy for Slide 4: Access Limit Lock") owns filling it. The deck builder already maps over it, so an empty slide currently renders with no body/cta.

## Slide 5 — Agentic Voice Lock
- **kicker:** LOCK MODE 05
- **headline:** Agentic Voice Lock
- **body (chars):** 336
- **bullets (3):**
  - Live agent handshake — zero static secrets to phish or leak
  - Verifies voice + intent, not just a string match
  - One command to revoke; the Box goes silent to everyone else
- **cta:** Talk your Box open →
- **metaDescription (chars):** 187

---

## Audit observations (for the redesign track)

- **Only 1 of 5 slides is a true stub.** Slide 4 (Access Limit Lock) has headline + kicker but no body/bullets/cta/meta. Everything else is fully authored.
- **Body length band:** 336–416 chars across authored slides. Keep new Slide 4 copy in this band for visual consistency (target ~340–400 chars).
- **CTA pattern:** every authored slide ends with a directional `→` CTA ("Build a Box →", "Lock a Box →", etc.). Slide 4 should follow the same `Verb a Box →` convention.
- **Kicker convention:** "LOCK MODE 0X" for lock slides, "WHAT IS IT" for the hero explainer. Slide 4 should stay "LOCK MODE 04".
- **Provenance:** re-capture from `git show 2d7e177:src/content/homeSlides.ts` if this archive ever diverges from the live file.

---

*Archived by Quill watchdog (Bitty Box Step #1 — Audit & archive current homepage slide content). Non-destructive: this file only adds a reference snapshot; no source files were modified.*
