// Home slide copy — single source of truth for the bittybox.org hero slides.
// Authored copy lives here, decoupled from layout/animation.

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
// 5-Step Hero Flow:
//   Slide 1 — Insert Content (Input Field Composer)
//   Slide 2 — Password Lock (Optional AES-256 GCM)
//   Slide 3 — Time-Based Lock (Optional Expiration Window / Reveal + Decay)
//   Slide 4 — Access Limit Lock (Optional Burn-on-Read / Visitor Quota)
//   Slide 5 — Review & Credit Cost (Free with no locks / PRO / Credits)
// ─────────────────────────────────────────────────────────────────────────────
const slideStubs: HomeSlideCopy[] = [
  {
    id: "create-box",
    kicker: "STEP 01 // INSERT CONTENT",
    headline: "Enter what you want to share",
    body:
      "Type or paste the HTML, CSS, JavaScript, markdown, or plain text you want to pack into a self-contained Bitty Box link. Free forever for unlimited boxes with zero server hosting. Hit Next to configure security and lock options.",
    bullets: [
      "Full HTML, JS, CSS, or markdown payload",
      "Instant client-side compression in your browser",
      "Free forever — no database, no server hosting required",
      "Hit Next to configure optional access locks",
    ],
    cta: "Next: Password Lock →",
    metaDescription:
      "Create a self-contained Bitty Box by inserting HTML, code, markdown, or text. Encoded completely in the URL.",
  },
  {
    id: "password-lock",
    kicker: "STEP 02 // PASSCODE LOCK",
    headline: "Numerical Passcode Lock (Optional)",
    body:
      "Optionally protect your Box with a numerical passcode (up to 8 digits). Bitty Box encrypts your payload with AES-256-GCM right in the browser. Zero knowledge, end to end: anyone with the link simply enters your numeric PIN to view.",
    bullets: [
      "1 to 8 digit numerical PIN — fast and easy to unlock",
      "AES-256-GCM encryption — your content remains sealed",
      "Included with PRO ($9/mo) or 5 pay-as-you-go credits",
    ],
    cta: "Next: Time-Based Lock →",
    metaDescription:
      "Passcode Lock gates any Bitty Box behind a numerical passcode with AES-GCM client-side encryption.",
  },
  {
    id: "time-based-lock",
    kicker: "STEP 03 // TIME-BASED LOCK",
    headline: "Time-Based Lock (Optional)",
    body:
      "Optionally set the clock on your Box. Tell it exactly when to wake up and when to self-destruct. Supports countdown durations, delayed drops, date ranges, and Reveal + Decay. Before its start time the Box is sealed; after its end time it is auto-revoked.",
    bullets: [
      "Expires Duration, Time Until Open, Date Range, & Reveal+Decay",
      "Auto-revoke on schedule — no leftover cache or manual cleanup",
      "Included with PRO ($9/mo) or 10 pay-as-you-go credits",
    ],
    cta: "Next: Access Limits →",
    metaDescription:
      "Time-Based Lock lets your Bitty Box wake up and self-destruct on a schedule with no cached copy left behind.",
  },
  {
    id: "access-limit-lock",
    kicker: "STEP 04 // ACCESS LIMITS",
    headline: "Access Limit Lock (Optional)",
    body:
      "Optionally set a hard limit on how many times your Box can open — 1-open burn-on-read, 3 opens, 5 opens, or custom visitor quotas. When the last open is spent, the Box seals itself permanently.",
    bullets: [
      "Visitor Quota: 1 burn-on-read, 3, 5, or custom max opens",
      "Live remaining-opens badge — count is visible on visit",
      "Included with PRO ($9/mo) or 10 pay-as-you-go credits",
    ],
    cta: "Next: Review & Summary →",
    metaDescription:
      "Access Limit Lock gives your Bitty Box a hard open cap — it seals for good after its last open with a tamper-proof counter.",
  },
  {
    id: "preview-launch",
    kicker: "STEP 05 // ESTIMATED CREDITS",
    headline: "ESTIMATED CREDITS",
    body: "",
    bullets: [],
    cta: "GENERATE BOX",
    metaDescription:
      "Calculate credit cost and generate your self-contained Bitty Box URL.",
  },
];

// Ordered hero deck: 5 sequential configuration steps
export const homeSlides: HomeSlideCopy[] = [
  slideStubs[0], // Step 1: Insert Content
  slideStubs[1], // Step 2: Password Lock
  slideStubs[2], // Step 3: Time-Based Lock
  slideStubs[3], // Step 4: Access Limit Lock
  slideStubs[4], // Step 5: Summary & Generate Box
];
