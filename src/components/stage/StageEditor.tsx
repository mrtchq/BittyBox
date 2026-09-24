import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Link2,
  Copy,
  FilePlus2,
  Trash2,
  Zap,
  Radio,
  GripVertical,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useStage, StageMode, useActiveLocksList } from '../../stores/stageStore';
import { ActiveLockChips } from './ActiveLockChips';
import { LockGallery } from './LockGallery';
import { HoloGenerateButton } from '../HoloGenerateButton';
import { CyberScrambleText } from '../CyberScrambleText';
import type { UseAccountResult } from '../../hooks/useAccount';
import type { BittyChainDraft } from '../../types';
import { PaymentPolicyLockPanel, PaymentPolicyDraft } from '../PaymentPolicyLockPanel';

interface StageEditorProps {
  onGenerate?: () => void;
  isGenerating?: boolean;
  bittyUrl?: string;
  chainEnabled?: boolean;
  chainIndex?: number;
  chainTotal?: number;
  chainMax?: number;
  chainDraft?: BittyChainDraft | null;
  isLastChainBox?: boolean;
  onToggleChain?: (enabled: boolean) => void;
  onCreateNextChainPage?: (mode: 'clone' | 'scratch') => void;
  onGoToChainPage?: (index: number) => void;
  onDeleteLastChainBox?: () => void;
  onDeleteChainPage?: (index: number) => void;
  account?: UseAccountResult;
  isPro?: boolean;
  onOpenPaywall?: (featureName?: string) => void;
  paymentPolicy?: PaymentPolicyDraft;
  onPaymentPolicyChange?: (value?: PaymentPolicyDraft) => void;
}

const DEFAULT_STARTER_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bitty Box</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #050414;
      color: #00f2ff;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
    .card {
      border: 1px solid rgba(0,242,255,0.4);
      padding: 2rem;
      border-radius: 1rem;
      background: rgba(0,242,255,0.04);
      box-shadow: 0 0 30px rgba(0,242,255,0.2);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>📦 Bitty Box</h1>
    <p>Zero backend • Compressed in URL • Runs anywhere</p>
  </div>
</body>
</html>`;

export const StageEditor: React.FC<StageEditorProps> = ({
  onGenerate,
  isGenerating = false,
  bittyUrl = '',
  chainEnabled = false,
  chainIndex = 0,
  chainTotal = 1,
  chainMax = 8,
  chainDraft = null,
  isLastChainBox = true,
  onToggleChain,
  onCreateNextChainPage,
  onGoToChainPage,
  onDeleteLastChainBox,
  onDeleteChainPage,
  account,
  isPro = false,
  onOpenPaywall,
  paymentPolicy,
  onPaymentPolicyChange,
}) => {
  const { state, setTitle, setDescription, setContent, enterMode, setThresholdRequired } = useStage();
  const activeLocks = useActiveLocksList();
  const lockCount = activeLocks.length;
  const [isCopied, setIsCopied] = useState(false);
  const [paymentPanelOpen, setPaymentPanelOpen] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [chainPromptOpen, setChainPromptOpen] = useState(false);

  useEffect(() => {
    if (deleteConfirmIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeleteConfirmIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteConfirmIndex]);

  const handleGenerateClick = () => {
    if (state.password.length > 0 && state.password.length < 8) {
      enterMode('passwordLock');
      return;
    }
    if (onGenerate) {
      onGenerate();
    }
  };

  /**
   * Chain Key entry point (relocated out of the lock gallery).
   * Choosing a mode both enables the chain and appends the next page —
   * `createChainDraftFromCurrent` sets `enabled: true`, so we must NOT
   * also call onToggleChain here or the draft would be toggled twice.
   */
  const handleChainStart = (mode: 'clone' | 'scratch') => {
    setChainPromptOpen(false);
    if (!onCreateNextChainPage) {
      if (!chainEnabled) onToggleChain?.(true);
      return;
    }
    if (chainEnabled || chainTotal > 1) {
      onCreateNextChainPage(mode);
    } else {
      // First press on a single box: enable the sequence, then add page two.
      onToggleChain?.(true);
      onCreateNextChainPage(mode);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 sm:gap-3.5 font-mono select-none">
      {/* Top Header Bar: Title, Byte Counter & Preview */}
      <div className="flex items-center justify-between gap-2 pb-1.5 sm:pb-2.5 border-b border-cyan-500/20">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 text-[10px] sm:text-xs font-bold tracking-wider shadow-[0_0_12px_rgba(0,242,255,0.2)]">
            <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 animate-pulse shrink-0" />
            <span className="hidden xs:inline">BITTY STAGE //</span>
            <span>BOX COMPOSER</span>
          </div>
          <span className="text-[10px] sm:text-xs text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.5 rounded-md font-bold shadow-inner">
            {state.content.length} BYTES
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Chain Key — moved here from the lock gallery. Shimmers to invite
              the press; opens a prompt to clone this page or start blank. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setChainPromptOpen(v => !v)}
              className={`chain-shimmer-btn inline-flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-wider cursor-pointer ${
                chainEnabled ? 'chain-shimmer-btn-active' : ''
              }`}
              title="Chain Key — link this box into a sequence"
              aria-haspopup="menu"
              aria-expanded={chainPromptOpen}
            >
              <Link2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden xs:inline">CHAIN</span>
              {chainEnabled && (
                <span className="text-[9px] opacity-80 tabular-nums">
                  {chainIndex + 1}/{chainTotal}
                </span>
              )}
            </button>

            <AnimatePresence>
              {chainPromptOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setChainPromptOpen(false)}
                    aria-hidden="true"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-full mt-2 z-50 w-64 p-2 rounded-xl bg-[#050212]/98 border border-cyan-400/50 shadow-[0_0_30px_rgba(0,242,255,0.28)] backdrop-blur-xl"
                    role="menu"
                  >
                    <div className="px-1.5 pb-1.5 mb-1 border-b border-cyan-500/20">
                      <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                        Chain Key
                      </div>
                      <div className="text-[9px] text-cyan-400/60">
                        Add the next box in this sequence
                      </div>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleChainStart('clone')}
                      className="w-full flex items-start gap-2 p-2 rounded-lg text-left hover:bg-cyan-950/70 border border-transparent hover:border-cyan-400/40 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-cyan-300 mt-0.5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold text-cyan-200">
                          Clone this page
                        </span>
                        <span className="block text-[9px] text-cyan-400/60">
                          Copy the current content &amp; locks
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleChainStart('scratch')}
                      className="w-full flex items-start gap-2 p-2 rounded-lg text-left hover:bg-cyan-950/70 border border-transparent hover:border-cyan-400/40 transition-colors cursor-pointer"
                    >
                      <FilePlus2 className="w-3.5 h-3.5 text-fuchsia-300 mt-0.5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold text-fuchsia-200">
                          Start with a blank slate
                        </span>
                        <span className="block text-[9px] text-fuchsia-400/60">
                          Empty editor, no locks carried over
                        </span>
                      </span>
                    </button>

                    {chainEnabled && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setChainPromptOpen(false);
                          onToggleChain?.(false);
                        }}
                        className="w-full mt-1 pt-1.5 border-t border-cyan-500/20 text-left text-[10px] text-rose-300/80 hover:text-rose-300 px-2 py-1 cursor-pointer"
                      >
                        Unlink chain
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Status badge */}
          <div
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-300/80 text-[10px] sm:text-xs font-bold"
            title="Client-side self-contained Bitty Box"
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong className="text-emerald-400">100% Free</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Metadata Row: Title & Description Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
        <input
          type="text"
          value={state.title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Box Title (e.g. My Secure Note)"
          maxLength={80}
          className="rounded-xl border border-cyan-400/30 bg-[#02010a] px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs text-cyan-100 placeholder:text-cyan-400/40 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-500/30 font-mono transition-colors select-text"
        />
        <input
          type="text"
          value={state.description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional description for social cards & search"
          maxLength={180}
          className="rounded-xl border border-cyan-400/30 bg-[#02010a] px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs text-cyan-100 placeholder:text-cyan-400/40 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-500/30 font-mono transition-colors select-text"
        />
      </div>

      {/* The Central Content Editor Canvas - Height optimized for mobile */}
      <div className="w-full flex-1 relative flex flex-col min-h-[140px] xs:min-h-[160px] sm:min-h-[240px] md:min-h-[300px] editor-glow-shell">
        <textarea
          value={state.content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type or paste HTML, JavaScript, CSS, Markdown, JSON, SVG, or plain text notes here... everything is packed into a single self-contained link."
          className="w-full flex-1 min-h-[140px] xs:min-h-[160px] sm:min-h-[240px] md:min-h-[300px] resize-y rounded-xl border border-cyan-400/40 bg-[#02010a]/90 p-2.5 sm:p-4 text-xs sm:text-sm leading-relaxed text-cyan-100 placeholder:text-cyan-400/40 outline-none transition-colors duration-200 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30 font-mono select-text"
        />
      </div>

      {/* Starter Code & Preset Buttons Bar */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap py-0.5">
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs flex-wrap">
          <span className="text-[9px] sm:text-[10px] text-cyan-400/60 font-bold uppercase">PRESETS:</span>
          <button
            type="button"
            onClick={() => setContent(DEFAULT_STARTER_CODE)}
            className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[9px] sm:text-[10px] hover:bg-cyan-900 hover:border-cyan-300 transition-all cursor-pointer"
          >
            Starter HTML
          </button>
          <button
            type="button"
            onClick={() => setContent('# Secret Note\n\nOnly accessible to holders of the decrypted link.')}
            className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[9px] sm:text-[10px] hover:bg-cyan-900 hover:border-cyan-300 transition-all cursor-pointer"
          >
            Markdown Note
          </button>
          {state.content && (
            <button
              type="button"
              onClick={() => setContent('')}
              className="px-2 py-0.5 text-[9px] sm:text-[10px] text-cyan-400/60 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Persistent Active Locks Strip */}
      <div className="p-1.5 sm:p-2 rounded-xl bg-[#030112]/90 border border-cyan-500/20 flex flex-col gap-1 shadow-inner">
        <ActiveLockChips onOpenMode={mode => enterMode(mode)} />

        {/* Unlock rule (M-of-N). Only meaningful once 2+ locks are active:
            pick how many of them must be satisfied before the box decrypts. */}
        {lockCount > 1 && (
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1.5 mt-0.5 border-t border-cyan-500/15">
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-300/80 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Unlock rule</span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {Array.from({ length: lockCount }, (_, i) => i + 1).map(n => {
                const isSelected =
                  state.thresholdRequired === n ||
                  (state.thresholdRequired === 0 && n === lockCount);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setThresholdRequired(state.thresholdRequired === n ? 0 : n)}
                    title={
                      n === lockCount
                        ? `All ${lockCount} locks must be satisfied`
                        : `Any ${n} of the ${lockCount} active locks unlock the box`
                    }
                    className={`px-2 py-0.5 rounded-md border text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-100 shadow-[0_0_10px_rgba(0,242,255,0.3)]'
                        : 'bg-cyan-950/70 border-cyan-500/30 text-cyan-400/70 hover:bg-cyan-900/70 hover:border-cyan-400/50'
                    }`}
                  >
                    {n} of {lockCount}
                  </button>
                );
              })}
              <span className="text-[9px] text-cyan-400/50 ml-1">
                {state.thresholdRequired > 0 && state.thresholdRequired < lockCount
                  ? `${state.thresholdRequired} of ${lockCount} must be satisfied`
                  : `all ${lockCount} required`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lock Gallery: Single Marquee Row for all 16 Live Locks + Roadmap Modal Trigger */}
      <LockGallery
        chainEnabled={chainEnabled}
        onToggleChain={onToggleChain}
        paymentPolicy={paymentPolicy}
        onOpenPayment={() => setPaymentPanelOpen(true)}
      />

      {paymentPanelOpen && onPaymentPolicyChange && (
        <PaymentPolicyLockPanel
          value={paymentPolicy}
          onChange={onPaymentPolicyChange}
          onClose={() => setPaymentPanelOpen(false)}
        />
      )}

      {chainEnabled && (
        <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-cyan-300">
            <Link2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">Chained Sequence:</span>
            <span>Box {chainIndex + 1} of {chainTotal}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {Array.from({ length: chainTotal }).map((_, idx) => (
                <div key={idx} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => onGoToChainPage?.(idx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      idx === chainIndex
                        ? 'bg-cyan-400 text-black shadow-[0_0_8px_rgba(0,242,255,0.6)]'
                        : 'bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/50'
                    }`}
                    title={`Switch to Box ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                  {chainTotal > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmIndex(idx);
                      }}
                      className="ml-0.5 p-0.5 rounded text-rose-400/60 hover:text-rose-300 hover:bg-rose-950/80 transition-colors cursor-pointer"
                      title={`Delete Box ${idx + 1} from sequence`}
                      aria-label={`Delete Box ${idx + 1}`}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
              {chainTotal < chainMax && (
                <button
                  type="button"
                  onClick={() => onCreateNextChainPage?.('clone')}
                  className="p-1 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-900 transition-colors cursor-pointer"
                  title="Add next box in chain"
                >
                  <FilePlus2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {chainTotal > 1 && (
              <button
                type="button"
                onClick={() => setDeleteConfirmIndex(chainIndex)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/80 hover:border-rose-400 hover:text-white transition-all cursor-pointer text-[10px] font-bold"
                title={`Delete current Box ${chainIndex + 1}`}
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Delete Box {chainIndex + 1}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pop-up confirmation prompt for deleting a chained box */}
      <AnimatePresence>
        {deleteConfirmIndex !== null && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setDeleteConfirmIndex(null)}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-chain-title"
              aria-describedby="delete-chain-desc"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-rose-500/50 bg-[#070314] p-5 font-mono text-cyan-100 shadow-[0_0_50px_rgba(244,63,94,0.3)]"
            >
              <button
                type="button"
                onClick={() => setDeleteConfirmIndex(null)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 id="delete-chain-title" className="text-base font-bold text-white leading-tight">
                    Delete Chained Box {deleteConfirmIndex + 1}?
                  </h3>
                  <p id="delete-chain-desc" className="text-xs text-rose-200/80 mt-2 leading-relaxed">
                    Are you sure you want to delete <strong className="text-white">Box {deleteConfirmIndex + 1}</strong> from this chained sequence?
                    All text content, title, and lock configurations configured for this box will be permanently removed from the sequence.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-5 pt-3.5 border-t border-rose-500/20">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmIndex(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = deleteConfirmIndex;
                    setDeleteConfirmIndex(null);
                    if (onDeleteChainPage) {
                      onDeleteChainPage(idx);
                    } else if (onDeleteLastChainBox) {
                      onDeleteLastChainBox();
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Box</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generation Footer - Mobile optimized */}
      <div className="pt-2 sm:pt-3 border-t border-cyan-500/20 flex flex-col items-center justify-center gap-2 text-center">
        <div className="w-full flex items-center justify-center text-center">
          <HoloGenerateButton
            onClick={handleGenerateClick}
            isCopied={isCopied}
            label="GENERATE BOX"
            className="my-0 mx-auto scale-[0.82] sm:scale-[0.88] origin-center"
          />
        </div>
      </div>
    </div>
  );
};
