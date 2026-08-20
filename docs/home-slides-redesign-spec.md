# Bitty Box Homepage Slides — Layout & Animation Design Spec

**Step:** #7 — Design slide layout and animation system
**Date:** 2026-08-18 (UTC)
**Track:** Homepage slide redesign → Step #5 (copy, done) → **#7 (this)** → #8 (build/integrate) → #9 (QA/deploy)
**Copy source of truth:** `src/content/homeSlides.ts` — `HomeSlideCopy` = `{ id, kicker, headline, body, bullets[], cta, metaDescription }`
**Status:** Design decision record. No source files were modified.

---

## 1. Deck composition (fixed order, from `homeSlides`)

| # | id | kicker | role |
|---|----|--------|------|
| 1 | `self-contained-url` | WHAT IS IT | hero explainer |
| 2 | `password-lock` | LOCK MODE 02 | feature |
| 3 | `time-based-lock` | LOCK MODE 03 | feature |
| 4 | `access-limit-lock` | LOCK MODE 04 | feature |
| 5 | `agentic-voice-lock` | LOCK MODE 05 | feature |

All five are fully authored in `homeSlides.ts`. No stubs remain.

---

## 2. Advance mode — DECISION: hybrid (auto + manual override)

**Reject scroll-triggered.** Use auto-advance with full manual control.

- **Auto-advance every 7s.**
- **Pause** on `mouseenter` / `focus-within` / tab hidden (`visibilitychange`).
- **Manual override:** prev/next chevrons, clickable dot indicators, `ArrowLeft`/`ArrowRight` keys, and touch swipe on mobile.
- Any manual interaction **resets** the 7s timer.
- `prefers-reduced-motion: reduce` → **auto-advance OFF**, still fully navigable by hand.

**Why:** auto-advance carries the story for passive visitors (the majority of homepage traffic); manual controls kill the "trapped in a carousel" frustration and keep every slide reachable for SEO + assistive tech.

---

## 3. Transition style — DECISION: cross-fade + 12px vertical drift

- Outgoing/incoming slides are **absolutely stacked** layers; animate `opacity` + `translateY(12px → 0)`.
- Duration **480ms**, `ease-out`. No horizontal slide (avoids motion sickness + RTL breakage).
- Optional 1px accent hairline wipe using the Nexus accent token.
- Reduced-motion: duration 0, no drift.

---

## 4. Mobile-first layout

- **Base (≤767px) — stacked:** visual/icon block on top (full-width, ~16:10), then `kicker → headline → body → bullets → CTA` beneath. CTA tap target ≥ 44px.
- **≥768px — two-column:** left = visual (~45%), right = text block (kicker, headline, body, bullets, CTA), vertically centered.
- **≥1280px:** cap deck content at ~1100px, center it, give the visual more breathing room.
- Headline `clamp(1.6rem, 4vw, 2.6rem)`; all spacing from Nexus tokens.

---

## 5. Per-slide visual (inline SVG, themeable, zero network)

Distinct accent-colored glyph per slide (not photos):

| id | glyph |
|----|-------|
| `self-contained-url` | nested box / link |
| `password-lock` | padlock |
| `time-based-lock` | clock-with-slash |
| `access-limit-lock` | decreasing pips / counter |
| `agentic-voice-lock` | sound wave / mic |

One accent color per slide reinforces the "LOCK MODE 0X" identity.

---

## 6. Explicitly rejected

- **Scroll-triggered / scroll-jacking** — hijacks the page, breaks back-button, hurts SEO + a11y, fights the rest of the normal-scroll page. **Rejected.**
- **Click-only, no auto-advance** — passive visitors see one slide and bounce.
- **Horizontal swipe-only on desktop** — awkward with a mouse.

---

## 7. Animation / engineering system

- All motion via **CSS custom properties + `transition`/`@keyframes`**; no JS rAF loop for the cross-fade.
- Drive `activeIndex` with React state; render all slides stacked, toggle `.is-active`.
- `setInterval` for auto-advance — **cleared on unmount**, reset on manual nav.
- **Accessibility:**
  - Deck `aria-roledescription="slide"`, `aria-live="off"`.
  - Dots are real `<button>`s: `aria-label="Go to slide N — <headline>"`.
  - Visible focus ring; expose a pause/play control.
- **SEO:** all 5 slides stay in the DOM (use `opacity`/`visibility`, never `display:none`) so crawlers read every slide's copy.

---

## 8. Recommended component skeleton (for Step #8)

```tsx
<SlideDeck slides={homeSlides} />   // slides: HomeSlideCopy[]

// internal
state:   activeIndex, isPaused
effects: autoAdvance interval, visibilitychange, keydown(ArrowLeft/Right)
subcomps:
  <SlideVisual id={slide.id} />   // inline-SVG switch (§5)
  <SlideCopy slide={slide} />     // kicker / headline / body / bullets / cta
  <SlideDots />                   // buttons, aria-labels
  <SlideControls />               // prev/next + pause/play

// CTA routing (decide in #8): app currently has no per-slide route —
// point all CTAs at /studio (or "#") until routing lands.
```

---

## 9. Acceptance criteria (hand to Step #9 QA)

- [ ] Renders correctly stacked (≤767) and 2-col (≥768) at 375 / 768 / 1280px.
- [ ] Auto-advance pauses on hover / focus / tab-hidden and resumes after.
- [ ] Keyboard (arrows + dots) and touch swipe both work.
- [ ] `prefers-reduced-motion` disables auto-advance + drift; content fully readable.
- [ ] All 5 slides present in DOM for crawlers.
- [ ] Cross-browser: latest Chrome, Firefox, Safari.

---

*Authored by Quill watchdog (Bitty Box Step #7 — Design slide layout and animation system). Non-destructive: adds a design decision record only; no source files modified.*
