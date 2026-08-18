// Home slide copy — single source of truth for the bittybox.org hero slides.
// Authored copy lives here, decoupled from layout/animation (built in Steps #7–#8).
// Each slide is a typed object so the slide builder can map over `homeSlides`.

export interface HomeSlideCopy {
  id: string;
  kicker: string;
  headline: string;
  body: string;
  bullets: string[];
  cta: string;
  metaDescription: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide 5 — Agentic Voice Lock  (task: Step #6, priority 4)
// Fully authored below. The concept: a Box that opens only through a live
// AI-agent voice handshake instead of a static password.
// ─────────────────────────────────────────────────────────────────────────────
export const agenticVoiceLockSlide: HomeSlideCopy = {
  id: "agentic-voice-lock",
  kicker: "LOCK MODE 05",
  headline: "Agentic Voice Lock",
  body:
    "Stop trusting passwords. Your Box opens only when a trusted agent speaks the unlock — live, in conversation, with the human on the other side. Authentication that sounds like a friend and guards like a vault.",
  bullets: [
    "Live agent handshake — zero static secrets to phish or leak",
    "Verifies voice + intent, not just a string match",
    "One command to revoke; the Box goes silent to everyone else",
  ],
  cta: "Talk your Box open →",
  metaDescription:
    "Agentic Voice Lock lets your Bitty Box open only through a live AI-agent voice handshake — no passwords, no static secrets, instant revoke.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Slide skeleton — populated by their own copy tasks (Steps #2–#5).
// Stubs carry only the known headline so the builder has a stable structure;
// body/bullets/cta are intentionally empty until those tasks land.
//   Slide 1 — Self-Contained Website in a URL   (Step #2)
//   Slide 2 — Password Lock                      (Step #3)
//   Slide 3 — Time-Based Lock                    (Step #4)
//   Slide 4 — Access Limit Lock                  (Step #5)
// ─────────────────────────────────────────────────────────────────────────────
const slideStubs: HomeSlideCopy[] = [
  {
    id: "self-contained-url",
    kicker: "WHAT IS IT",
    headline: "A complete website lives inside its own link.",
    body:
      "Bitty Box packs an entire micro-site — HTML, CSS, images, even scripts — into its own URL using LZMA compression. There is no server, no hosting, and no database to pay for or patch. Open the link and the page rebuilds itself in your browser, even with no internet connection. Share one link and the whole site travels inside it.",
    bullets: [
      "LZMA compression shrinks a full page down to a few kilobytes",
      "No server, no hosting, no database — nothing to manage or leak",
      "Works offline: the site reconstructs itself right in the browser",
      "One link carries everything — bittybox.org/#<your-site>",
    ],
    cta: "Build a Box →",
    metaDescription:
      "Bitty Box packs a complete website into a single URL with LZMA compression — no server, no hosting, works offline. Share one link and the whole site travels inside it.",
  },
  {
    id: "password-lock",
    kicker: "LOCK MODE 02",
    headline: "Password Lock",
    body:
      "Gate your Box with a password. Bitty Box encrypts your payload in the browser with AES-GCM, and the key is derived from your password using PBKDF2 — right on the recipient's device. The server never sees your password and never stores the key. Zero knowledge, end to end: if you forget it, not even we can open it.",
    bullets: [
      "AES-GCM encryption in the browser — your content stays unreadable in transit and at rest",
      "PBKDF2 key derivation — the password never leaves the recipient's device",
      "Zero-knowledge by design — the server stores ciphertext, never your key",
    ],
    cta: "Lock a Box →",
    metaDescription:
      "Password Lock gates any Bitty Box behind a password with AES-GCM client-side encryption and PBKDF2 key derivation — zero knowledge, no server ever stores your key.",
  },
  {
    id: "time-based-lock",
    kicker: "LOCK MODE 03",
    headline: "Time-Based Lock",
    body:
      "Set the clock on your Box. Tell it exactly when to wake up and when to self-destruct. Before its start time the Box isn't just locked — it isn't there. After its end time it's gone for good, auto-revoked with no cached copy left behind to leak. Perfect for embargoed drops, expiring secrets, and surprise reveals that land right on schedule.",
    bullets: [
      "Not-before + expires-at — your Box simply does not exist outside its window",
      "Auto-revoke on schedule — no leftover cache, no manual cleanup, no loose ends",
      "Pin it to the minute — embargoes, offers, and reveals fire exactly on time",
    ],
    cta: "Time-lock a Box →",
    metaDescription:
      "Time-Based Lock lets your Bitty Box wake up and self-destruct on a schedule — invisible before not-before, auto-revoked at expires-at, with no cached copy left behind.",
  },
  {
    id: "access-limit-lock",
    kicker: "LOCK MODE 04",
    headline: "Access Limit Lock",
    body:
      "Give your Box a heartbeat. Set exactly how many times it can open — five, fifty, one — and watch the count tick down in plain sight on every visit. When the last open is spent, the Box seals itself for good: no reset, no back door, no second chances. Made for limited drops, one-time reveals, and controlled handoffs where each open should be the very last anyone ever gets.",
    bullets: [
      "Set a hard open cap — five, fifty, or exactly one and done",
      "Live remaining-opens badge — the count is visible, never hidden",
      "Tamper-proof by design — the counter can't be reset or skipped",
    ],
    cta: "Limit a Box →",
    metaDescription:
      "Access Limit Lock gives your Bitty Box a hard open cap — it seals for good after its last open, with a live remaining-opens badge and a tamper-proof counter nobody can reset.",
  },
];

// Ordered hero deck. Slide 5 is fully authored; the rest fill in as copy lands.
export const homeSlides: HomeSlideCopy[] = [
  slideStubs[0], // Self-Contained Website in a URL
  slideStubs[1], // Password Lock
  slideStubs[2], // Time-Based Lock
  slideStubs[3], // Access Limit Lock
  agenticVoiceLockSlide, // Agentic Voice Lock
];
