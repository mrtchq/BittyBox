import React, { useState } from 'react';
import { Eye, ArrowLeft, ExternalLink, Copy, Check, Lock, Key, Clock, Flame, Shield, Hourglass } from 'lucide-react';
import { useStage } from '../../stores/stageStore';
import { BittyRenderer } from '../BittyRenderer';
import { buildBittyUrl } from '../../utils/bittyEngine';
import { buildTimeWindow } from '../../utils/timeWindow';

export const PreviewStage: React.FC = () => {
  const { state, exitMode } = useStage();
  const [copied, setCopied] = useState(false);

  const twConfig = state.timeLockEnabled
    ? buildTimeWindow({
        enabled: true,
        mode: state.timeLockMode,
        expiryHours: state.timeExpiryHours,
        delayHours: state.timeDelayHours,
        openAt: state.timeOpenAt,
        lockAt: state.timeLockAt,
        hybridRevealMode: state.hybridRevealMode,
        hybridSelfDestructHours: state.hybridSelfDestructHours,
        showCountdown: state.showTimeCountdown,
      })
    : null;

  const olConfig = state.accessLimitEnabled
    ? {
        enabled: true,
        maxOpens: state.accessLimitMaxOpens,
        showRemainingCount: state.showRemainingAccessCount,
      }
    : null;

  const dmConfig = state.deadmanEnabled && state.deadmanSwitchId
    ? {
        enabled: true,
        switchId: state.deadmanSwitchId,
        intervalMinutes: state.deadmanIntervalMinutes,
        graceMinutes: state.deadmanGraceEnabled ? state.deadmanGraceMinutes : 0,
        graceDisabled: !state.deadmanGraceEnabled,
        creatorEmail: state.deadmanCreatorEmail.trim() || undefined,
        recipientEmail: state.deadmanRecipientEmail.trim() || undefined,
        recipientName: state.deadmanRecipientName.trim() || undefined,
        note: state.deadmanNote.trim() || undefined,
      }
    : null;

  const lockConfig = (twConfig || olConfig || dmConfig || state.agenticEnabled) ? {
    timeWindow: twConfig || undefined,
    openLimit: olConfig || undefined,
    deadmanSwitch: dmConfig || undefined,
    agentic: state.agenticEnabled ? {
      enabled: true,
      requireMcp: state.agenticRequireMcp,
      roleFilter: state.agenticRoleFilter || undefined,
    } : undefined,
  } : undefined;

  const effectiveBoxId = state.boxId || `box_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const previewMeta = {
    title: state.title,
    description: state.description,
    favicon: state.favicon,
    boxId: effectiveBoxId,
    password: state.password.trim() ? state.password.trim() : undefined,
    includeMetadata: true,
    lockConfig,
  };

  const url = buildBittyUrl(state.content, previewMeta);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="w-full flex flex-col gap-4 font-mono select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 flex-wrap gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exitMode}
            className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/50 transition-all cursor-pointer"
            title="Return to editor"
            aria-label="Back to editor"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,242,255,0.3)]">
            <Eye className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-cyan-200 tracking-wide font-cyber">LIVE PREVIEW</h2>
              {/* Active Lock Badges */}
              {state.password && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-950/80 border border-fuchsia-500/50 text-fuchsia-300 text-[10px] font-bold">
                  <Key className="w-2.5 h-2.5 text-fuchsia-400" /> PIN LOCKED ({state.password.length} DIGITS)
                </span>
              )}
              {state.timeLockEnabled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-bold">
                  <Clock className="w-2.5 h-2.5 text-amber-400" /> TIMER ACTIVE
                </span>
              )}
              {state.accessLimitEnabled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold">
                  <Flame className="w-2.5 h-2.5 text-emerald-400" /> {state.accessLimitMaxOpens === 1 ? 'BURN ON READ' : `${state.accessLimitMaxOpens} VIEWS`}
                </span>
              )}
              {state.deadmanEnabled && state.deadmanSwitchId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/50 text-violet-300 text-[10px] font-bold">
                  <Hourglass className="w-2.5 h-2.5 text-violet-400" /> DEAD-MAN SWITCH
                </span>
              )}
              {!state.password && !state.timeLockEnabled && !state.accessLimitEnabled && !state.deadmanEnabled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400/80 text-[10px]">
                  UNRESTRICTED
                </span>
              )}
            </div>
            <p className="text-[10px] text-cyan-400/70">Experience your Bitty Box with configured locks as recipients see it</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs hover:bg-cyan-900/50 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy URL'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.open(url, '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs hover:bg-cyan-900/50 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in Tab</span>
          </button>
        </div>
      </div>

      {/* Embedded Live Renderer Frame */}
      <div className="w-full min-h-[440px] rounded-xl border border-cyan-500/30 bg-[#02010a]/90 overflow-hidden shadow-inner flex flex-col relative">
        <BittyRenderer
          hashFragment=""
          activeContent={state.content}
          metadata={previewMeta}
          onEdit={() => exitMode()}
          onHome={() => exitMode()}
          embedded={true}
        />
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-3 pt-3 border-t border-cyan-500/20">
        <button
          type="button"
          onClick={exitMode}
          className="flex-1 py-2.5 rounded-xl bg-cyan-950/60 border border-cyan-400/40 text-cyan-200 text-xs font-bold hover:bg-cyan-900/50 hover:border-cyan-300 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Editor
        </button>
      </div>
    </div>
  );
};
