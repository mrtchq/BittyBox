import React, { useState } from 'react';
import {
  Link2,
  Copy,
  FilePlus2,
  Trash2,
  Zap,
  Radio,
  GripVertical,
} from 'lucide-react';
import { useStage, StageMode } from '../../stores/stageStore';
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
  calculatedCreditCost?: number;
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
  calculatedCreditCost = 0,
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
  account,
  isPro = false,
  onOpenPaywall,
  paymentPolicy,
  onPaymentPolicyChange,
}) => {
  const { state, setTitle, setDescription, setContent, enterMode } = useStage();
  const [isCopied, setIsCopied] = useState(false);
  const [paymentPanelOpen, setPaymentPanelOpen] = useState(false);

  const handleGenerateClick = () => {
    if (state.password.length > 0 && state.password.length < 8) {
      enterMode('passwordLock');
      return;
    }
    if (onGenerate) {
      onGenerate();
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

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-300/80 text-[10px] sm:text-xs font-bold"
            title="Generation cost with active server locks"
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
            <span>
              {calculatedCreditCost === 0 ? (
                <strong className="text-emerald-400">100% Free (0 CR)</strong>
              ) : (
                <span>Requires <strong className="text-amber-300">{calculatedCreditCost} CR</strong></span>
              )}
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

          <div className="flex items-center gap-1">
            {Array.from({ length: chainTotal }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onGoToChainPage?.(idx)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  idx === chainIndex
                    ? 'bg-cyan-400 text-black shadow-[0_0_8px_rgba(0,242,255,0.6)]'
                    : 'bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/50'
                }`}
              >
                {idx + 1}
              </button>
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
        </div>
      )}

      {/* Generation & Credit Cost Footer - Mobile optimized */}
      <div className="pt-2 sm:pt-3 border-t border-cyan-500/20 flex flex-col items-center justify-center gap-2 text-center">
        <div className="w-full flex items-center justify-center text-center">
          <HoloGenerateButton
            onClick={handleGenerateClick}
            isCopied={isCopied}
            label={calculatedCreditCost > 0 && (!account?.user || (account.user.credits || 0) < calculatedCreditCost) && !isPro ? `GET CREDITS (${calculatedCreditCost} CR)` : 'GENERATE BOX'}
            className="my-0 mx-auto scale-[0.82] sm:scale-[0.88] origin-center"
          />
        </div>
      </div>
    </div>
  );
};
