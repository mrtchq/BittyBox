import {
  Hash,
  Type,
  CalendarClock,
  Flame,
  Gauge,
  CalendarRange,
  Timer,
  MousePointerClick,
  Link2,
  KeyRound,
  KeySquare,
  PenLine,
  Mail,
  Wallet,
  Ticket,
  UserCheck,
  Users,
  Hourglass,
  MapPin,
  ScanLine,
  Smartphone,
  MonitorSmartphone,
  Puzzle,
  Bot,
  Coins,
  type LucideIcon,
} from 'lucide-react';

export type LockCategory = 'core' | 'identity' | 'contextual';

/**
 * Config modal backing for a lock type.
 *  - passcode / passphrase / time-capsule / burn / max-opens /
 *    access-window / countdown → stage-store backed (fully functional)
 *  - chain   → toggles chained-sequence mode (functional)
 *  - payment → opens the existing x402 payment policy panel (functional)
 *  - soon    → informational only, enforcement not yet available
 */
export type LockKind =
  | 'passcode'
  | 'passphrase'
  | 'time-capsule'
  | 'burn'
  | 'max-opens'
  | 'access-window'
  | 'countdown'
  | 'chain'
  | 'payment'
  | 'magic-key'
  | 'soon';

export interface LockTypeDef {
  id: string;
  num: string;
  category: LockCategory;
  name: string;
  tagline: string;
  description: string;
  useCase: string;
  icon: LucideIcon;
  kind: LockKind;
  canGoLiveToday: boolean;
  blockerType?: 'software' | 'hardware';
  blockerCategory?: 'Special Software Engineering' | 'Physical Hardware';
  whyNotToday?: string;
  plannedArch?: string;
}

export const LOCK_CATEGORIES: Array<{ id: LockCategory; name: string; blurb: string }> = [
  { id: 'core', name: 'Core Locks', blurb: 'PINs, timers, quotas & seals' },
  { id: 'identity', name: 'Identity & Trust', blurb: 'Proof of who may open' },
  { id: 'contextual', name: 'Contextual', blurb: 'Where, what & how you prove' },
];

export const LOCK_TYPES: LockTypeDef[] = [
  // ── Core locks ──────────────────────────────────────────────
  {
    id: 'passcode',
    num: '01',
    category: 'core',
    name: 'Passcode Lock',
    tagline: '8–12 digit PIN',
    description: 'Numeric PIN entry, typically 4–8 digits, with cryptographic key derivation.',
    useCase: 'Private notes, digital gifts, family links, and quick mobile unlocking.',
    icon: Hash,
    kind: 'passcode',
    canGoLiveToday: true,
  },
  {
    id: 'time-capsule',
    num: '03',
    category: 'core',
    name: 'Time Capsule Lock',
    tagline: 'Opens on date',
    description: 'Timestamp verification prevents decryption until a specified date and time.',
    useCase: 'Birthday messages, New Year notes, future letters, and scheduled announcements.',
    icon: CalendarClock,
    kind: 'time-capsule',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'Decentralized client-side timelocks require verifiable delay functions or trusted time-oracle witness services.',
    plannedArch: 'Drand threshold timelock encryption network or signed witness beacon decryption.',
  },
  {
    id: 'burn-after-reading',
    num: '04',
    category: 'core',
    name: 'Burn-After-Reading Lock',
    tagline: '1 view, then gone',
    description: 'Destroys the ciphertext and in-memory decryption context after the first opening.',
    useCase: 'Secrets, surprises, one-time credentials, and ephemeral confessions.',
    icon: Flame,
    kind: 'burn',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'A decentralized client-side URL vault cannot enforce single-read destruction across multiple browser clients without a centralized or edge state store to coordinate atomic burn.',
    plannedArch: 'Cloudflare Worker KV / Redis ephemeral atomic burn counter with one-time decryption token release.',
  },
  {
    id: 'max-opens',
    num: '05',
    category: 'core',
    name: 'Max Opens Lock',
    tagline: 'Strict view quota',
    description: 'Enforces a strict maximum number of successful views, then permanently locks.',
    useCase: 'Limited invitations, confidential board decks, and exclusive beta links.',
    icon: Gauge,
    kind: 'max-opens',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'In a purely client-side URL vault, client localStorage cannot prevent other recipients or incognito tabs from opening the vault repeatedly without an authoritative server counter.',
    plannedArch: 'Edge-synchronized atomic increment quota service verifying signed open tickets before releasing decryption key.',
  },
  {
    id: 'access-window',
    num: '06',
    category: 'core',
    name: 'Access Window Lock',
    tagline: 'Start → end dates',
    description: 'Opens only within a specified start and end date/time window.',
    useCase: 'Live event pages, flash releases, timed exhibition portals, and temporary links.',
    icon: CalendarRange,
    kind: 'access-window',
    canGoLiveToday: true,
  },
  {
    id: 'countdown-unlock',
    num: '07',
    category: 'core',
    name: 'Countdown Unlock Lock',
    tagline: 'Cinematic timer',
    description: 'Requires the recipient to wait through an active cinematic countdown timer.',
    useCase: 'Dramatic reveals, interactive unboxing, and suspenseful gift unsealing.',
    icon: Timer,
    kind: 'countdown',
    canGoLiveToday: true,
  },
  {
    id: 'tap-to-unseal',
    num: '08',
    category: 'core',
    name: 'Tap-to-Unseal Lock',
    tagline: 'Deliberate gesture',
    description: 'Requires deliberate tactile interaction, such as breaking a seal or tearing an envelope.',
    useCase: 'Surprise sequences, intentional consent, and agreement moments.',
    icon: MousePointerClick,
    kind: 'soon',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'Requires interactive tactile unsealing physics and multi-stage seal tear interaction shaders.',
    plannedArch: 'Canvas-based particle tear simulation and Web Animations API gesture unsealing.',
  },
  {
    id: 'chain-key',
    num: '09',
    category: 'core',
    name: 'Chain Key Lock',
    tagline: 'Unlocks in sequence',
    description: 'Unlocks only after validating cryptographic output from a previous Bitty Box.',
    useCase: 'Treasure hunts, multi-part serial narratives, and step-by-step onboarding sequences.',
    icon: Link2,
    kind: 'chain',
    canGoLiveToday: true,
  },
  {
    id: 'one-time-magic-key',
    num: '10',
    category: 'core',
    name: 'One-Time Magic Key Lock',
    tagline: 'Single-use fragment',
    description: 'Uses a single-use asymmetric, ephemeral key fragment to unlock one target Box.',
    useCase: 'Personalized VIP delivery without requiring recipient account registration.',
    icon: KeyRound,
    kind: 'magic-key',
    canGoLiveToday: true,
  },

  // ── Identity & trust locks ──────────────────────────────────
  {
    id: 'totp',
    num: '11',
    category: 'identity',
    name: 'TOTP Lock',
    tagline: 'Authenticator code',
    description: 'Validates a six-digit rolling authenticator-app code based on RFC 6238.',
    useCase: 'Sensitive recovery notes, crypto seeds, master passwords, and operations playbooks.',
    icon: KeySquare,
    kind: 'soon',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'TOTP RFC 6238 derivation requires trusted clock synchronization to prevent client device clock skew replay attacks.',
    plannedArch: 'Network Time Protocol (NTP) synchronized WebCrypto HMAC-SHA1 TOTP validator.',
  },
  {
    id: 'recipient-email',
    num: '13',
    category: 'identity',
    name: 'Recipient Email Lock',
    tagline: 'Verified address',
    description: 'Sends a signed, one-time verification token to one designated email address.',
    useCase: 'Client delivery, confidential corporate proposals, and contractor invoices.',
    icon: Mail,
    kind: 'soon',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'Sending emails and validating OTP challenges requires a backend server with transactional email API (e.g. Resend/SendGrid) and rate-limited verification endpoints.',
    plannedArch: 'Resend API backend integration with DKIM/SPF signed magic link verification service.',
  },
  {
    id: 'wallet-signature',
    num: '14',
    category: 'identity',
    name: 'Wallet Signature Lock',
    tagline: 'Web3 challenge',
    description: 'Requires the recipient to sign a cryptographic challenge proving control of a Web3 wallet address.',
    useCase: 'Token-holder drops, DAO governance secrets, and Web3 collector perks.',
    icon: Wallet,
    kind: 'soon',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'Requires Web3 wallet extension dependencies (EIP-1193 provider like MetaMask or WalletConnect modal) and Ethereum JSON-RPC signature verification logic.',
    plannedArch: 'EIP-712 typed data signing with Viem/Wagmi and multi-chain RPC verification.',
  },
  {
    id: 'invite-code',
    num: '15',
    category: 'identity',
    name: 'Invite-Code Lock',
    tagline: 'Gated tokens',
    description: 'Gates access using reusable or quota-bounded invitation tokens.',
    useCase: 'Private alpha communities, secret societies, club access, and gated launches.',
    icon: Ticket,
    kind: 'soon',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'P2P invite-only rendezvous is managed directly via the Live Chat interface; retired from editor locks.',
    plannedArch: 'Trystero WebRTC ephemeral signaling with scoped box token validation.',
  },
  {
    id: 'approval',
    num: '16',
    category: 'identity',
    name: 'Approval Lock',
    tagline: 'Manual review',
    description: 'The creator manually reviews and cryptographically approves unlock requests.',
    useCase: 'High-trust documents, classified drafts, and VIP early-access previews.',
    icon: UserCheck,
    kind: 'soon',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'Requires an asynchronous push notification protocol (Web Push / Telegram / email), an active inbox for the creator, and a secure approval callback relay.',
    plannedArch: 'WebPush / Telegram bot integration with Ed25519 creator signature authorization tokens.',
  },
  {
    id: 'two-person',
    num: '17',
    category: 'identity',
    name: 'Two-Person Lock',
    tagline: 'Shamir sharing',
    description: 'Uses Shamir Secret Sharing so two independent keyholders must reconstruct the key.',
    useCase: 'Escrow releases, shared family wealth vaults, and dual-founder corporate actions.',
    icon: Users,
    kind: 'soon',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'Requires split-secret key assembly ceremony and asynchronous dual-holder rendezvous.',
    plannedArch: 'Client-side 2-of-2 Shamir Secret Sharing (SSS) with peer rendezvous via WebRTC relay.',
  },
  {
    id: 'dead-man-switch',
    num: '18',
    category: 'identity',
    name: 'Dead-Man Switch Lock',
    tagline: 'Liveness-gated',
    description: 'Reveals content only if the creator fails to confirm continued liveness during a defined interval.',
    useCase: 'Legacy letters, estate contingency plans, and emergency survival instructions.',
    icon: Hourglass,
    kind: 'soon',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'A recipient browser cannot reliably determine creator inactivity without a persistent server-side cron service or decentralized Nostr relay daemon that tracks heartbeat timestamps.',
    plannedArch: 'Automated Nostr NIP-01 relay listener paired with serverless heartbeat verification cron.',
  },

  // ── Contextual locks ────────────────────────────────────────
  {
    id: 'proximity',
    num: '20',
    category: 'contextual',
    name: 'Proximity Lock',
    tagline: 'QR / NFC scan',
    description: 'Requires optical scanning of a companion physical QR code or NFC tag.',
    useCase: 'Physical packaging, printed art, conference installations, and in-person drops.',
    icon: ScanLine,
    kind: 'soon',
    canGoLiveToday: false,
    blockerType: 'hardware',
    blockerCategory: 'Physical Hardware',
    whyNotToday: 'Requires physical companion hardware tags (printed security tokens, NFC chips, physical installation hardware) deployed in the physical world.',
    plannedArch: 'Web NFC API (NDEFReader) and BarcodeDetector API for physical hardware scanning.',
  },
  {
    id: 'device-pairing',
    num: '21',
    category: 'contextual',
    name: 'Device Pairing Lock',
    tagline: 'Bound to device',
    description: 'Binds the encryption key to the first device’s WebCrypto or Secure Enclave environment.',
    useCase: 'Personal journals, sovereign offline vaults, and device-locked notebooks.',
    icon: Smartphone,
    kind: 'soon',
    canGoLiveToday: false,
    blockerType: 'hardware',
    blockerCategory: 'Physical Hardware',
    whyNotToday: 'Requires platform hardware authenticators (Apple Secure Enclave, Android StrongBox, Windows Hello, or FIDO2 YubiKey USB token).',
    plannedArch: 'W3C WebAuthn Level 3 credentials.create() with PRF extension for hardware key derivation.',
  },
  {
    id: 'browser-key',
    num: '22',
    category: 'contextual',
    name: 'Browser Key Lock',
    tagline: 'Seamless return visits',
    description: 'Uses a locally stored IndexedDB private key to enable seamless unlocking on recurring visits.',
    useCase: 'Frictionless private workspace access without conventional usernames or passwords.',
    icon: MonitorSmartphone,
    kind: 'soon',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'Cross-origin and incognito boundaries isolate IndexedDB storage, requiring device backup recovery fallback.',
    plannedArch: 'IndexedDB non-extractable CryptoKey storage with WebAuthn PRF fallback derivation.',
  },
  {
    id: 'payment',
    num: '25',
    category: 'contextual',
    name: 'Payment Lock',
    tagline: 'Pay to reveal',
    description: 'Releases the decryption key after confirmed payment or a microtransaction.',
    useCase: 'Paid creator drops, indie software releases, premium guides, and digital goods.',
    icon: Coins,
    kind: 'payment',
    canGoLiveToday: false,
    blockerType: 'software',
    blockerCategory: 'Special Software Engineering',
    whyNotToday: 'Requires payment gateway rails, Lightning Network L402 HTLCs, or Stripe webhook settlement processing.',
    plannedArch: 'HTTP 402 Payment Required protocol with Bitcoin Lightning LNURL/L402 preimage verification and Stripe Checkout webhooks.',
  },
];

export function getLockType(id: string | null | undefined): LockTypeDef | null {
  if (!id) return null;
  return LOCK_TYPES.find(l => l.id === id) || null;
}
