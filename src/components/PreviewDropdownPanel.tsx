import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ExternalLink, 
  RefreshCw, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye, 
  ChevronUp, 
  Lock, 
  Key, 
  Clock, 
  Flame, 
  Shield, 
  Bot, 
  RotateCcw 
} from 'lucide-react';
import { CyberScrambleText } from './CyberScrambleText';
import { getRenderedHtml, buildBittyUrl, compressContentSync } from '../utils/bittyEngine';
import { BittyMetadata } from '../types';
import { BittyRenderer } from './BittyRenderer';

interface PreviewDropdownPanelProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  metadata?: Partial<BittyMetadata>;
  title?: string;
  bittyUrl?: string;
  onPreviewInTab?: () => void;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const PreviewDropdownPanel: React.FC<PreviewDropdownPanelProps> = ({
  isOpen,
  onClose,
  content,
  metadata,
  title,
  bittyUrl,
  onPreviewInTab,
}) => {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Active locks configured prior to generating a box
  const hasPasscode = Boolean(metadata?.password && metadata.password.trim().length > 0);
  const twConfig = metadata?.lockConfig?.timeWindow;
  const hasTimeLock = Boolean(
    twConfig &&
    (twConfig.enabled !== false) &&
    (twConfig.enabled || twConfig.mode || twConfig.notBefore || twConfig.notAfter)
  );
  const olConfig = metadata?.lockConfig?.openLimit;
  const hasAccessLimit = Boolean(olConfig && olConfig.enabled);
  const hasPaymentPolicy = Boolean(metadata?.lockConfig?.paymentPolicy);
  const hasAgentic = Boolean(metadata?.lockConfig?.agentic?.enabled);

  const activeLockCount = [
    hasPasscode,
    hasTimeLock,
    hasAccessLimit,
    hasPaymentPolicy,
    hasAgentic,
  ].filter(Boolean).length;

  const hasAnyLocks = activeLockCount > 0;

  // View mode: 'lock' (recipient lock gate) or 'content' (direct unlocked code sandbox)
  const [viewMode, setViewMode] = useState<'lock' | 'content'>('lock');

  // Set default view mode when opened or when lock presence changes
  useEffect(() => {
    if (isOpen) {
      setViewMode(hasAnyLocks ? 'lock' : 'content');
    }
  }, [isOpen, hasAnyLocks]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute rendered HTML from content
  const renderedHtml = useMemo(() => {
    const activeCode = content && content.trim().length > 0
      ? content
      : '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0a0520;color:#00f2ff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;text-align:center;}h3{font-size:1.15rem;margin:0 0 0.5rem 0;}p{color:#a78bfa;font-size:0.85rem;margin:0;}</style></head><body><div><h3>Live Sandbox Ready</h3><p>Type or paste HTML, Markdown, or code in the editor to preview.</p></div></body></html>';
    
    return getRenderedHtml(activeCode, {
      title: title || metadata?.title || 'Preview',
      language: metadata?.language || 'en',
    });
  }, [content, metadata, title]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshCount(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 350);
  };

  const handleOpenInNewTab = () => {
    if (onPreviewInTab) {
      onPreviewInTab();
      return;
    }
    if (bittyUrl) {
      window.open(bittyUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      const syncRes = compressContentSync(content, { mimeType: 'text/html' });
      if (syncRes && metadata) {
        const previewUrl = buildBittyUrl(syncRes.compressedUrl, metadata as BittyMetadata);
        if (previewUrl) {
          window.open(previewUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      }
    } catch {}

    const blob = new Blob([renderedHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const tab = window.open(blobUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none font-sans flex flex-col justify-start items-center">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
          />

          {/* Sliding Panel from Top */}
          <motion.div
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative w-full max-w-6xl h-[88vh] sm:h-[90vh] bg-[#070314]/98 border-b-2 border-x border-fuchsia-500/35 rounded-b-3xl shadow-[0_0_60px_rgba(217,70,239,0.25)] flex flex-col z-50 overflow-hidden"
          >
            {/* Ambient Neon Beam at Top */}
            <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 via-purple-400 to-cyan-400 shadow-[0_0_12px_#ff00de]" />

            {/* Organized Clean Dropdown Header */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-fuchsia-500/20 bg-[#0a0524]/95 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shrink-0">
              {/* Left Column: Icon, Title & Byte info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-fuchsia-950 to-purple-900 border border-fuchsia-400/50 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(217,70,239,0.3)]">
                  {hasAnyLocks && viewMode === 'lock' ? (
                    <Lock className="w-4 h-4 text-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  ) : (
                    <Eye className="w-4 h-4 text-fuchsia-300 drop-shadow-[0_0_6px_rgba(217,70,239,0.8)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xs sm:text-sm font-cyber font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 via-pink-200 to-cyan-200 tracking-wider">
                      <CyberScrambleText text={hasAnyLocks && viewMode === 'lock' ? "LOCK GATE PREVIEW" : "LIVE PREVIEW"} speed={20} />
                    </h2>
                    {hasAnyLocks ? (
                      <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1 shadow-sm">
                        <Lock className="w-2.5 h-2.5 text-amber-400" />
                        <span>{activeLockCount} {activeLockCount === 1 ? 'LOCK' : 'LOCKS'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40 shadow-sm">
                        SANDBOX
                      </span>
                    )}
                    <span className="text-[10px] text-purple-300/60 font-mono tabular-nums hidden sm:inline">
                      {content.length.toLocaleString()} B
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Column: Clean Segmented Switchers */}
              <div className="flex items-center gap-2">
                {/* Lock Gate vs Unlocked Switcher */}
                {hasAnyLocks && (
                  <div className="inline-flex items-center p-0.5 rounded-xl bg-black/60 border border-amber-500/35 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setViewMode('lock')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'lock'
                          ? 'bg-amber-950 text-amber-200 border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.35)]'
                          : 'text-amber-300/60 hover:text-amber-200'
                      }`}
                      title="Recipient Lock Gate View"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Lock Gate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('content')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'content'
                          ? 'bg-fuchsia-950 text-fuchsia-200 border border-fuchsia-400/60 shadow-[0_0_8px_rgba(217,70,239,0.35)]'
                          : 'text-purple-300/60 hover:text-fuchsia-200'
                      }`}
                      title="Direct Content View"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">Unlocked</span>
                    </button>
                  </div>
                )}

                {/* Viewport Mode Switcher */}
                <div className="inline-flex items-center p-0.5 rounded-xl bg-black/60 border border-fuchsia-500/30 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setViewportMode('desktop')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewportMode === 'desktop'
                        ? 'bg-fuchsia-950 text-fuchsia-200 border border-fuchsia-400/60 shadow-[0_0_8px_rgba(217,70,239,0.35)]'
                        : 'text-purple-300/60 hover:text-fuchsia-200'
                    }`}
                    title="Desktop View"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode('tablet')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewportMode === 'tablet'
                        ? 'bg-fuchsia-950 text-fuchsia-200 border border-fuchsia-400/60 shadow-[0_0_8px_rgba(217,70,239,0.35)]'
                        : 'text-purple-300/60 hover:text-fuchsia-200'
                    }`}
                    title="Tablet View (768px)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Tablet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode('mobile')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewportMode === 'mobile'
                        ? 'bg-fuchsia-950 text-fuchsia-200 border border-fuchsia-400/60 shadow-[0_0_8px_rgba(217,70,239,0.35)]'
                        : 'text-purple-300/60 hover:text-fuchsia-200'
                    }`}
                    title="Mobile View (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Mobile</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Unified Actions Toolbar */}
              <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                {hasAnyLocks && viewMode === 'lock' && (
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="h-8 px-2.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-200 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono font-medium cursor-pointer shadow-sm active:scale-[0.96]"
                    title="Reset lock state to test unlocking again"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Re-Lock</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRefresh}
                  className={`h-8 w-8 rounded-lg bg-purple-950/50 hover:bg-purple-900/70 border border-purple-500/35 text-purple-200 hover:text-white transition-all flex items-center justify-center text-xs font-mono cursor-pointer active:scale-[0.96] ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                  title="Refresh Render Preview"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="h-8 px-2.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/70 border border-purple-500/35 text-purple-200 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono font-medium cursor-pointer active:scale-[0.96]"
                  title="Open Preview in New Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Popout</span>
                </button>

                <div className="h-4 w-px bg-fuchsia-500/20 mx-0.5" />

                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-2.5 sm:px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 hover:border-rose-400 text-rose-200 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono font-semibold cursor-pointer active:scale-[0.96] shadow-sm"
                  title="Close Preview (Esc)"
                  aria-label="Close preview"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden xs:inline">Close</span>
                  <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] bg-black/40 rounded border border-rose-500/30 text-rose-300/80">ESC</kbd>
                </button>
              </div>
            </div>

            {/* Active Lock Badges Strip */}
            {hasAnyLocks && (
              <div className="px-3 sm:px-6 py-1.5 bg-[#040114]/90 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider flex items-center gap-1 mr-1">
                    <Shield className="w-3 h-3 text-amber-400" /> Active:
                  </span>
                  {hasPasscode && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-fuchsia-950/70 border border-fuchsia-500/40 text-fuchsia-300 text-[10px] font-bold shadow-sm">
                      <Key className="w-2.5 h-2.5 text-fuchsia-400" /> PIN ({metadata?.password?.length || 8}d)
                    </span>
                  )}
                  {hasTimeLock && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[10px] font-bold shadow-sm">
                      <Clock className="w-2.5 h-2.5 text-amber-400" /> Timer ({twConfig?.mode ? twConfig.mode.toUpperCase() : 'ACTIVE'})
                    </span>
                  )}
                  {hasAccessLimit && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold shadow-sm">
                      <Flame className="w-2.5 h-2.5 text-emerald-400" /> Limit ({olConfig?.maxOpens === 1 ? 'Burn' : `${olConfig?.maxOpens}x`})
                    </span>
                  )}
                  {hasPaymentPolicy && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold shadow-sm">
                      <Shield className="w-2.5 h-2.5 text-cyan-400" /> Paywall
                    </span>
                  )}
                  {hasAgentic && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/70 border border-purple-500/40 text-purple-300 text-[10px] font-bold shadow-sm">
                      <Bot className="w-2.5 h-2.5 text-purple-400" /> Agent
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-amber-300/60 hidden sm:inline">
                  {viewMode === 'lock' ? 'Testing recipient view · Enter PIN to unlock' : 'Direct live code preview'}
                </span>
              </div>
            )}

            {/* Live Sandbox or Lock Gate Canvas Container */}
            <div className="flex-1 w-full p-2.5 sm:p-4 bg-[#03010b] flex items-center justify-center min-h-0 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 flex flex-col items-center justify-center relative ${
                  viewportMode === 'desktop'
                    ? 'w-full'
                    : viewportMode === 'tablet'
                    ? 'w-[768px] max-w-full rounded-2xl border-4 border-purple-900/50 shadow-[0_0_35px_rgba(0,0,0,0.8)]'
                    : 'w-[375px] max-w-full rounded-3xl border-8 border-purple-950/70 shadow-[0_0_40px_rgba(0,0,0,0.9)]'
                }`}
              >
                {/* Device Frame Notch (Mobile only) */}
                {viewportMode === 'mobile' && (
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-3 bg-purple-950 rounded-full z-10 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-900" />
                  </div>
                )}

                {hasAnyLocks && viewMode === 'lock' ? (
                  <div key={`lock-preview-${refreshCount}`} className="w-full h-full relative rounded-lg overflow-hidden bg-[#050515] border border-fuchsia-500/30">
                    <BittyRenderer
                      hashFragment=""
                      activeContent={content}
                      metadata={metadata as BittyMetadata}
                      embedded={true}
                    />
                  </div>
                ) : (
                  <iframe
                    key={`preview-iframe-${refreshCount}`}
                    srcDoc={renderedHtml}
                    title="Live Code Preview"
                    className="w-full h-full border-0 bg-white rounded-lg shadow-inner"
                    sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-downloads"
                  />
                )}
              </div>
            </div>

            {/* Bottom Drawer Handle Bar */}
            <div 
              onClick={onClose}
              className="py-1.5 bg-[#0a0524]/90 border-t border-fuchsia-500/20 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-fuchsia-950/40 transition group"
            >
              <ChevronUp className="w-3.5 h-3.5 text-fuchsia-400/70 group-hover:text-fuchsia-300 group-hover:-translate-y-0.5 transition-transform" />
              <span className="text-[10px] font-mono tracking-widest text-fuchsia-300/70 group-hover:text-fuchsia-200 uppercase">
                CLOSE PREVIEW (ESC)
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
