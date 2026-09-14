import React, { useState, useRef } from 'react';
import { Lock, Check, ChevronLeft, ChevronRight, Map, Sparkles } from 'lucide-react';
import { useStage } from '../../stores/stageStore';
import { LOCK_TYPES, LockTypeDef } from '../../data/lockTypes';
import type { PaymentPolicyDraft } from '../PaymentPolicyLockPanel';
import { LockConfigModal } from './LockConfigModal';
import { RoadmapLocksModal } from './RoadmapLocksModal';

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
    case 'passphrase':
      return state.password.length > 0 && /\D/.test(state.password);
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
      return Boolean(paymentPolicy);
    default:
      return false;
  }
}

export const LockGallery: React.FC<LockGalleryProps> = ({
  chainEnabled = false,
  onToggleChain,
  paymentPolicy,
  onOpenPayment,
}) => {
  const { state } = useStage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const liveLocks = LOCK_TYPES.filter(l => l.canGoLiveToday);
  const roadmapLocks = LOCK_TYPES.filter(l => !l.canGoLiveToday);

  const handlePress = (def: LockTypeDef) => {
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
      {/* Header Bar with Live Badge & Roadmap Launcher */}
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
          {/* Roadmap Modal Trigger Button */}
          <button
            type="button"
            onClick={() => setIsRoadmapOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/50 hover:bg-amber-900/80 hover:border-amber-400 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
            title="View locks deferred to roadmap"
          >
            <Map className="w-3 h-3 text-amber-400" />
            <span>Roadmap ({roadmapLocks.length})</span>
          </button>

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
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => handlePress(def)}
              className={`relative flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer snap-start shrink-0 w-36 sm:w-42 select-none ${
                active
                  ? 'bg-cyan-950/80 border-cyan-400/70 text-cyan-100 shadow-[0_0_12px_rgba(0,242,255,0.35)] ring-1 ring-cyan-400/40'
                  : 'bg-[#02010a]/80 border-cyan-500/25 text-cyan-300 hover:border-cyan-400/60 hover:text-white hover:bg-cyan-950/40'
              }`}
              title={`${def.name} — ${def.tagline}`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                  active
                    ? 'bg-cyan-900/90 border-cyan-400/70 text-cyan-200 shadow-[0_0_8px_rgba(0,242,255,0.4)]'
                    : 'bg-cyan-950/90 border-cyan-500/30 text-cyan-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[10px] sm:text-[11px] font-bold leading-tight truncate flex items-center gap-1">
                  <span className="text-cyan-500 text-[8px] sm:text-[9px]">#{def.num}</span>
                  <span className="truncate">{def.name}</span>
                </div>
                <div className="text-[8px] sm:text-[9px] opacity-70 truncate text-cyan-300/80">
                  {def.tagline}
                </div>
              </div>

              {active && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border border-[#02010a] flex items-center justify-center shadow">
                  <Check className="w-2.5 h-2.5 text-black" strokeWidth={3.5} />
                </span>
              )}
            </button>
          );
        })}

        {/* Roadmap Modal End-Card */}
        <button
          type="button"
          onClick={() => setIsRoadmapOpen(true)}
          className="relative flex items-center gap-2 p-2 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 hover:border-amber-400 text-amber-200 transition-all cursor-pointer snap-start shrink-0 w-36 sm:w-42 shadow-[0_0_10px_rgba(245,158,11,0.15)] select-none"
          title="View all 9 locks requiring hardware or special software engineering"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-amber-500/40 bg-amber-950/90 flex items-center justify-center shrink-0 text-amber-400">
            <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] sm:text-[11px] font-bold leading-tight truncate text-amber-300">
              Roadmap ({roadmapLocks.length})
            </div>
            <div className="text-[8px] sm:text-[9px] opacity-80 truncate text-amber-400/80">
              HW &amp; Engineering
            </div>
          </div>
        </button>
      </div>

      {/* Swipe Hint for Mobile */}
      <div className="text-[9px] text-cyan-400/40 text-center uppercase tracking-wider sm:hidden">
        ← swipe horizontally for all 16 live locks →
      </div>

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
