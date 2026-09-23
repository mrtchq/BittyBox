import React, { useState, useRef, useEffect } from 'react';
import { Lock, Check, ChevronLeft, ChevronRight, ChevronDown, Map, Sparkles } from 'lucide-react';
import { useStage } from '../../stores/stageStore';
import { LOCK_TYPES, LockTypeDef } from '../../data/lockTypes';
import type { PaymentPolicyDraft } from '../PaymentPolicyLockPanel';
import { LockConfigModal } from './LockConfigModal';
import { RoadmapLocksModal } from './RoadmapLocksModal';
import { isPaymentPolicyConfigured } from '../../utils/paymentPolicy';

interface LockGalleryProps {
  chainEnabled?: boolean;
  onToggleChain?: (enabled: boolean) => void;
  paymentPolicy?: PaymentPolicyDraft;
  onOpenPayment: () => void;
}

function isLockActive(
  def: LockTypeDef,
  state: ReturnType<typeof useStage>['state'],
  chainEnabled: boolean,
  paymentPolicy?: PaymentPolicyDraft
): boolean {
  switch (def.kind) {
    case 'passcode':
      return state.password.length > 0 && /^\d+$/.test(state.password);
    case 'magic-key':
      return state.password.length > 0 && (state.password.startsWith('MK-') || !/^\d+$/.test(state.password));
    case 'time-capsule':
      return state.timeLockEnabled && state.timeLockMode === 'range' && Boolean(state.timeOpenAt) && !state.timeLockAt;
    case 'burn':
      return state.accessLimitEnabled && state.accessLimitMaxOpens === 1;
    case 'max-opens':
      return state.accessLimitEnabled && state.accessLimitMaxOpens > 1;
    case 'access-window':
      return state.timeLockEnabled && state.timeLockMode === 'range' && Boolean(state.timeOpenAt) && Boolean(state.timeLockAt);
    case 'countdown':
      return state.timeLockEnabled && (state.timeLockMode === 'delay' || state.showTimeCountdown);
    case 'chain':
      return chainEnabled;
    case 'payment':
      return isPaymentPolicyConfigured(paymentPolicy);
    case 'dead-man-switch':
      return state.deadmanEnabled && Boolean(state.deadmanSwitchId);
    case 'soon':
      return false;
  }
}

interface LockColorTheme {
  inactiveCard: string;
  activeCard: string;
  inactiveIcon: string;
  activeIcon: string;
  tagline: string;
  activeBadge: string;
}

const LOCK_THEMES: Record<string, LockColorTheme> = {
  // 1. Passcode: Warm Amber / Gold
  'passcode': {
    inactiveCard: 'bg-[#030208]/85 border-amber-500/30 text-amber-300 hover:border-amber-400/80 hover:text-white hover:bg-amber-950/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    activeCard: 'bg-amber-950/90 border-amber-400 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/60',
    inactiveIcon: 'bg-amber-950/80 border-amber-500/40 text-amber-400',
    activeIcon: 'bg-amber-900/90 border-amber-300 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
    tagline: 'text-amber-300/70',
    activeBadge: 'bg-amber-400',
  },
  // 2. Passphrase: Regal Purple / Violet
  'passphrase': {
    inactiveCard: 'bg-[#030208]/85 border-purple-500/30 text-purple-300 hover:border-purple-400/80 hover:text-white hover:bg-purple-950/40 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)]',
    activeCard: 'bg-purple-950/90 border-purple-400 text-purple-100 shadow-[0_0_14px_rgba(168,85,247,0.45)] ring-1 ring-purple-400/60',
    inactiveIcon: 'bg-purple-950/80 border-purple-500/40 text-purple-400',
    activeIcon: 'bg-purple-900/90 border-purple-300 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    tagline: 'text-purple-300/70',
    activeBadge: 'bg-purple-400',
  },
  // 3. Time Capsule: Timeless Emerald Green
  'time-capsule': {
    inactiveCard: 'bg-[#030208]/85 border-emerald-500/30 text-emerald-300 hover:border-emerald-400/80 hover:text-white hover:bg-emerald-950/40 hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    activeCard: 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-[0_0_14px_rgba(16,185,129,0.45)] ring-1 ring-emerald-400/60',
    inactiveIcon: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400',
    activeIcon: 'bg-emerald-900/90 border-emerald-300 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    tagline: 'text-emerald-300/70',
    activeBadge: 'bg-emerald-400',
  },
  // 4. Access Window: Electric Sky Blue
  'access-window': {
    inactiveCard: 'bg-[#030208]/85 border-sky-500/30 text-sky-300 hover:border-sky-400/80 hover:text-white hover:bg-sky-950/40 hover:shadow-[0_0_12px_rgba(56,189,248,0.2)]',
    activeCard: 'bg-sky-950/90 border-sky-400 text-sky-100 shadow-[0_0_14px_rgba(56,189,248,0.45)] ring-1 ring-sky-400/60',
    inactiveIcon: 'bg-sky-950/80 border-sky-500/40 text-sky-400',
    activeIcon: 'bg-sky-900/90 border-sky-300 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.5)]',
    tagline: 'text-sky-300/70',
    activeBadge: 'bg-sky-400',
  },
  // 5. Countdown: Cinematic Rose / Crimson
  'countdown-unlock': {
    inactiveCard: 'bg-[#030208]/85 border-rose-500/30 text-rose-300 hover:border-rose-400/80 hover:text-white hover:bg-rose-950/40 hover:shadow-[0_0_12px_rgba(244,63,94,0.2)]',
    activeCard: 'bg-rose-950/90 border-rose-400 text-rose-100 shadow-[0_0_14px_rgba(244,63,94,0.45)] ring-1 ring-rose-400/60',
    inactiveIcon: 'bg-rose-950/80 border-rose-500/40 text-rose-400',
    activeIcon: 'bg-rose-900/90 border-rose-300 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
    tagline: 'text-rose-300/70',
    activeBadge: 'bg-rose-400',
  },
  // 6. Tap-to-Unseal: Vibrant Fuchsia / Pink
  'tap-to-unseal': {
    inactiveCard: 'bg-[#030208]/85 border-fuchsia-500/30 text-fuchsia-300 hover:border-fuchsia-400/80 hover:text-white hover:bg-fuchsia-950/40 hover:shadow-[0_0_12px_rgba(217,70,239,0.2)]',
    activeCard: 'bg-fuchsia-950/90 border-fuchsia-400 text-fuchsia-100 shadow-[0_0_14px_rgba(217,70,239,0.45)] ring-1 ring-fuchsia-400/60',
    inactiveIcon: 'bg-fuchsia-950/80 border-fuchsia-500/40 text-fuchsia-400',
    activeIcon: 'bg-fuchsia-900/90 border-fuchsia-300 text-fuchsia-200 shadow-[0_0_10px_rgba(217,70,239,0.5)]',
    tagline: 'text-fuchsia-300/70',
    activeBadge: 'bg-fuchsia-400',
  },
  // 7. Chain Key: Cyber Neon Cyan
  'chain-key': {
    inactiveCard: 'bg-[#030208]/85 border-cyan-500/30 text-cyan-300 hover:border-cyan-400/80 hover:text-white hover:bg-cyan-950/40 hover:shadow-[0_0_12px_rgba(0,242,255,0.2)]',
    activeCard: 'bg-cyan-950/90 border-cyan-400 text-cyan-100 shadow-[0_0_14px_rgba(0,242,255,0.45)] ring-1 ring-cyan-400/60',
    inactiveIcon: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400',
    activeIcon: 'bg-cyan-900/90 border-cyan-300 text-cyan-200 shadow-[0_0_10px_rgba(0,242,255,0.5)]',
    tagline: 'text-cyan-300/70',
    activeBadge: 'bg-cyan-400',
  },
  // 8. One-Time Magic Key: Spark Electric Yellow
  'one-time-magic-key': {
    inactiveCard: 'bg-[#030208]/85 border-yellow-500/30 text-yellow-300 hover:border-yellow-400/80 hover:text-white hover:bg-yellow-950/40 hover:shadow-[0_0_12px_rgba(234,179,8,0.2)]',
    activeCard: 'bg-yellow-950/90 border-yellow-400 text-yellow-100 shadow-[0_0_14px_rgba(234,179,8,0.45)] ring-1 ring-yellow-400/60',
    inactiveIcon: 'bg-yellow-950/80 border-yellow-500/40 text-yellow-400',
    activeIcon: 'bg-yellow-900/90 border-yellow-300 text-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.5)]',
    tagline: 'text-yellow-300/70',
    activeBadge: 'bg-yellow-400',
  },
  // 18. Dead-Man Switch: Hourglass Violet
  'dead-man-switch': {
    inactiveCard: 'bg-[#030208]/85 border-violet-500/30 text-violet-300 hover:border-violet-400/80 hover:text-white hover:bg-violet-950/40 hover:shadow-[0_0_12px_rgba(139,92,246,0.2)]',
    activeCard: 'bg-violet-950/90 border-violet-400 text-violet-100 shadow-[0_0_14px_rgba(139,92,246,0.45)] ring-1 ring-violet-400/60',
    inactiveIcon: 'bg-violet-950/80 border-violet-500/40 text-violet-400',
    activeIcon: 'bg-violet-900/90 border-violet-300 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.5)]',
    tagline: 'text-violet-300/70',
    activeBadge: 'bg-violet-400',
  },
  // 9. TOTP: High-Security Indigo
  'totp': {
    inactiveCard: 'bg-[#030208]/85 border-indigo-500/30 text-indigo-300 hover:border-indigo-400/80 hover:text-white hover:bg-indigo-950/40 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)]',
    activeCard: 'bg-indigo-950/90 border-indigo-400 text-indigo-100 shadow-[0_0_14px_rgba(99,102,241,0.45)] ring-1 ring-indigo-400/60',
    inactiveIcon: 'bg-indigo-950/80 border-indigo-500/40 text-indigo-400',
    activeIcon: 'bg-indigo-900/90 border-indigo-300 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.5)]',
    tagline: 'text-indigo-300/70',
    activeBadge: 'bg-indigo-400',
  },
  // 10. Signed Sender: Cryptographic Teal
  'signed-sender': {
    inactiveCard: 'bg-[#030208]/85 border-teal-500/30 text-teal-300 hover:border-teal-400/80 hover:text-white hover:bg-teal-950/40 hover:shadow-[0_0_12px_rgba(20,184,166,0.2)]',
    activeCard: 'bg-teal-950/90 border-teal-400 text-teal-100 shadow-[0_0_14px_rgba(20,184,166,0.45)] ring-1 ring-teal-400/60',
    inactiveIcon: 'bg-teal-950/80 border-teal-500/40 text-teal-400',
    activeIcon: 'bg-teal-900/90 border-teal-300 text-teal-200 shadow-[0_0_10px_rgba(20,184,166,0.5)]',
    tagline: 'text-teal-300/70',
    activeBadge: 'bg-teal-400',
  },
  // 11. Invite Code: VIP Bright Orange
  'invite-code': {
    inactiveCard: 'bg-[#030208]/85 border-orange-500/30 text-orange-300 hover:border-orange-400/80 hover:text-white hover:bg-orange-950/40 hover:shadow-[0_0_12px_rgba(249,115,22,0.2)]',
    activeCard: 'bg-orange-950/90 border-orange-400 text-orange-100 shadow-[0_0_14px_rgba(249,115,22,0.45)] ring-1 ring-orange-400/60',
    inactiveIcon: 'bg-orange-950/80 border-orange-500/40 text-orange-400',
    activeIcon: 'bg-orange-900/90 border-orange-300 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.5)]',
    tagline: 'text-orange-300/70',
    activeBadge: 'bg-orange-400',
  },
  // 12. Two-Person: Multi-Sig Lime Green
  'two-person': {
    inactiveCard: 'bg-[#030208]/85 border-lime-500/30 text-lime-300 hover:border-lime-400/80 hover:text-white hover:bg-lime-950/40 hover:shadow-[0_0_12px_rgba(132,204,22,0.2)]',
    activeCard: 'bg-lime-950/90 border-lime-400 text-lime-100 shadow-[0_0_14px_rgba(132,204,22,0.45)] ring-1 ring-lime-400/60',
    inactiveIcon: 'bg-lime-950/80 border-lime-500/40 text-lime-400',
    activeIcon: 'bg-lime-900/90 border-lime-300 text-lime-200 shadow-[0_0_10px_rgba(132,204,22,0.5)]',
    tagline: 'text-lime-300/70',
    activeBadge: 'bg-lime-400',
  },
  // 13. Location: Radar Crimson Red
  'location': {
    inactiveCard: 'bg-[#030208]/85 border-red-500/30 text-red-300 hover:border-red-400/80 hover:text-white hover:bg-red-950/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]',
    activeCard: 'bg-red-950/90 border-red-400 text-red-100 shadow-[0_0_14px_rgba(239,68,68,0.45)] ring-1 ring-red-400/60',
    inactiveIcon: 'bg-red-950/80 border-red-500/40 text-red-400',
    activeIcon: 'bg-red-900/90 border-red-300 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    tagline: 'text-red-300/70',
    activeBadge: 'bg-red-400',
  },
  // 14. Browser Key: Device Cobalt Blue
  'browser-key': {
    inactiveCard: 'bg-[#030208]/85 border-blue-500/30 text-blue-300 hover:border-blue-400/80 hover:text-white hover:bg-blue-950/40 hover:shadow-[0_0_12px_rgba(59,130,246,0.2)]',
    activeCard: 'bg-blue-950/90 border-blue-400 text-blue-100 shadow-[0_0_14px_rgba(59,130,246,0.45)] ring-1 ring-blue-400/60',
    inactiveIcon: 'bg-blue-950/80 border-blue-500/40 text-blue-400',
    activeIcon: 'bg-blue-900/90 border-blue-300 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.5)]',
    tagline: 'text-blue-300/70',
    activeBadge: 'bg-blue-400',
  },
  // 15. Puzzle: Enigma Violet Orchid
  'puzzle': {
    inactiveCard: 'bg-[#030208]/85 border-violet-500/30 text-violet-300 hover:border-violet-400/80 hover:text-white hover:bg-violet-950/40 hover:shadow-[0_0_12px_rgba(139,92,246,0.2)]',
    activeCard: 'bg-violet-950/90 border-violet-400 text-violet-100 shadow-[0_0_14px_rgba(139,92,246,0.45)] ring-1 ring-violet-400/60',
    inactiveIcon: 'bg-violet-950/80 border-violet-500/40 text-violet-400',
    activeIcon: 'bg-violet-900/90 border-violet-300 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.5)]',
    tagline: 'text-violet-300/70',
    activeBadge: 'bg-violet-400',
  },
  // 16. Proof of Human: Mint Emerald
  'proof-of-human': {
    inactiveCard: 'bg-[#030208]/85 border-emerald-400/30 text-emerald-300 hover:border-emerald-300/80 hover:text-white hover:bg-emerald-950/40 hover:shadow-[0_0_12px_rgba(52,211,153,0.2)]',
    activeCard: 'bg-emerald-950/90 border-emerald-300 text-emerald-100 shadow-[0_0_14px_rgba(52,211,153,0.45)] ring-1 ring-emerald-300/60',
    inactiveIcon: 'bg-emerald-950/80 border-emerald-400/40 text-emerald-300',
    activeIcon: 'bg-emerald-900/90 border-emerald-200 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
    tagline: 'text-emerald-300/70',
    activeBadge: 'bg-emerald-300',
  },
};

const DEFAULT_THEME: LockColorTheme = {
  inactiveCard: 'bg-[#030208]/85 border-cyan-500/30 text-cyan-300 hover:border-cyan-400/80 hover:text-white hover:bg-cyan-950/40 hover:shadow-[0_0_12px_rgba(0,242,255,0.2)]',
  activeCard: 'bg-cyan-950/90 border-cyan-400 text-cyan-100 shadow-[0_0_14px_rgba(0,242,255,0.45)] ring-1 ring-cyan-400/60',
  inactiveIcon: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400',
  activeIcon: 'bg-cyan-900/90 border-cyan-300 text-cyan-200 shadow-[0_0_10px_rgba(0,242,255,0.5)]',
  tagline: 'text-cyan-300/70',
  activeBadge: 'bg-cyan-400',
};

const EXCLUDED_LOCK_IDS = new Set([
  'passphrase',
  'invite-code',
  'time-capsule',
  'tap-to-unseal',
  'totp',
  'signed-sender',
  'two-person',
  'location',
  'browser-key',
  'puzzle',
  'proof-of-human',
  // Chain Key is no longer a gallery tile — it now lives as the shimmering
  // CHAIN button in the editor header (clone this page / start blank).
  'chain-key',
]);

export const LockGallery: React.FC<LockGalleryProps> = ({
  chainEnabled = false,
  onToggleChain,
  paymentPolicy,
  onOpenPayment,
}) => {
  const { state } = useStage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(false);
  // SPEC §1/§31 progressive disclosure: the wall of lock tiles is collapsed by
  // default on a fresh Box. It opens on demand ("ADD LOCKS") so the Dead Man's
  // Switch flow fronts the create experience instead of 18 lock types.
  const [expanded, setExpanded] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Deep-link handoff: the dashboard's CREATE A DEAD MAN'S SWITCH CTA writes
  // bitty_pending_lock into sessionStorage and navigates to the editor. We
  // consume it once on mount — expand the gallery and open the DMS builder
  // directly, so the create journey starts at the Switch, not at lock-hunting.
  useEffect(() => {
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem('bitty_pending_lock');
      if (pending) sessionStorage.removeItem('bitty_pending_lock');
    } catch {}
    if (pending) {
      setExpanded(true);
      const def = LOCK_TYPES.find(l => l.id === pending);
      if (def && def.kind === 'payment') onOpenPayment();
      else setSelectedId(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liveLocks = LOCK_TYPES.filter(l => l.canGoLiveToday && !EXCLUDED_LOCK_IDS.has(l.id));
  const roadmapLocks = LOCK_TYPES.filter(l => !l.canGoLiveToday);
  const anyActive = liveLocks.some(l => isLockActive(l, state, chainEnabled, paymentPolicy));
  // Auto-expand once the Box carries at least one lock (or during an active
  // DMS flow) so existing/locked Boxes never hide their configuration;
  // fresh Boxes start collapsed behind the ADD LOCKS toggle.
  const showGallery = expanded || anyActive || state.deadmanEnabled;

  const handlePress = (def: LockTypeDef) => {
    if (state.deadmanEnabled && def.kind !== 'dead-man-switch') return;
    if (def.kind === 'payment') {
      onOpenPayment();
      return;
    }
    setSelectedId(def.id);
  };

  const scrollByAmount = (distance: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-1.5 pt-1 border-t border-cyan-500/20 font-mono select-none">
      {/* Collapsed state: single ADD LOCKS row (progressive disclosure, SPEC §1/§31) */}
      {!showGallery && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-950/30 text-cyan-300 hover:text-cyan-100 hover:border-cyan-300/70 hover:bg-cyan-900/40 transition-all cursor-pointer text-[11px] font-bold uppercase tracking-wider"
          title="Add locks to this Box"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Add Locks</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
      )}

      {showGallery && (<>
      {/* Header Bar with Live Badge & Chevrons */}
      <div className="flex items-center justify-between gap-2 px-0.5 pt-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[10px] sm:text-[11px] text-cyan-300 font-bold uppercase tracking-wider truncate">
            Live Locks ({liveLocks.length})
          </span>
          <span className="text-[9px] text-emerald-400/80 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded hidden xs:inline">
            Single Row Marquee
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!anyActive && !state.deadmanEnabled && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-[9px] text-cyan-400/60 hover:text-cyan-200 transition-colors cursor-pointer uppercase tracking-wider mr-1"
              title="Collapse the lock gallery"
            >
              Hide
            </button>
          )}
          {/* Marquee Navigation Chevrons */}
          <div className="hidden sm:flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => scrollByAmount(-220)}
              className="w-6 h-6 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 hover:border-cyan-300 flex items-center justify-center transition-all cursor-pointer text-xs"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(220)}
              className="w-6 h-6 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 hover:border-cyan-300 flex items-center justify-center transition-all cursor-pointer text-xs"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SINGLE HORIZONTAL ROW MARQUEE CONTAINER */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-1 px-1 touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {liveLocks.map(def => {
          const Icon = def.icon;
          const active = isLockActive(def, state, chainEnabled, paymentPolicy);
          const disabled = state.deadmanEnabled && def.kind !== 'dead-man-switch';
          const theme = LOCK_THEMES[def.id] || DEFAULT_THEME;
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => handlePress(def)}
              disabled={disabled}
              aria-disabled={disabled}
              className={`relative flex items-center gap-2 p-2 rounded-xl border text-left transition-all snap-start shrink-0 w-36 sm:w-42 select-none ${
                disabled
                  ? 'opacity-35 grayscale cursor-not-allowed border-slate-700/50 bg-slate-950/50 text-slate-500'
                  : `cursor-pointer ${active ? theme.activeCard : theme.inactiveCard}`
              }`}
              title={`${def.name} — ${def.tagline}`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                  active ? theme.activeIcon : theme.inactiveIcon
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[10px] sm:text-[11px] font-bold leading-tight truncate">
                  <span className="truncate">{def.name}</span>
                </div>
                <div className={`text-[8px] sm:text-[9px] opacity-75 truncate ${theme.tagline}`}>
                  {def.tagline}
                </div>
              </div>

              {active && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${theme.activeBadge} border border-[#02010a] flex items-center justify-center shadow`}>
                  <Check className="w-2.5 h-2.5 text-black" strokeWidth={3.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Swipe Hint for Mobile */}
      <div className="text-[9px] text-cyan-400/40 text-center uppercase tracking-wider sm:hidden">
        ← swipe horizontally for all {liveLocks.length} live locks →
      </div>
      </>)}

      {/* Lock Configuration Modal */}
      {selectedId && (
        <LockConfigModal
          lockId={selectedId}
          onClose={() => setSelectedId(null)}
          chainEnabled={chainEnabled}
          onToggleChain={onToggleChain}
        />
      )}

      {/* Roadmap Modal (Vertically Scrollable) */}
      <RoadmapLocksModal
        isOpen={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
      />
    </div>
  );
};
