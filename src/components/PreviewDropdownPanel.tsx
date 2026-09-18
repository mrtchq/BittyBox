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
  Sparkles,
  ChevronUp,
  Maximize2,
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
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-40"
          />

          {/* Sliding Panel from Top with Drop-down Animation */}
          <motion.div
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-6xl h-[88vh] sm:h-[90vh] bg-[#060317]/98 border-b-2 border-x-2 border-fuchsia-500/50 rounded-b-3xl shadow-[0_0_60px_rgba(217,70,239,0.35)] flex flex-col z-50 overflow-hidden"
          >
            {/* Ambient Neon Beam at Top */}
            <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 via-purple-400 to-cyan-400 shadow-[0_0_15px_#ff00de]" />

            {/* Dropdown Header */}
            <div className="px-4 sm:px-6 py-3 border-b border-fuchsia-500/25 bg-[#0a0524]/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Title and Icon */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-950 to-purple-900 border border-fuchsia-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.4)]">
                  {hasAnyLocks && viewMode === 'lock' ? (
                    <Lock className="w-5 h-5 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
                  ) : (
                    <Eye className="w-5 h-5 text-fuchsia-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-cyber font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-pink-200 to-cyan-300">
                      <CyberScrambleText text={hasAnyLocks && viewMode === 'lock' ? "RECIPIENT LOCK PREVIEW" : "PREVIEW RENDER"} speed={20} />
                    </h2>
                    {hasAnyLocks ? (
                      <span className="text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)] flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-400" />
                        {activeLockCount} LOCK{activeLockCount > 1 ? 'S' : ''} ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold bg-fuchsia-950 text-fuchsia-300 px-2 py-0.5 rounded-full border border-fuchsia-500/40">
                        LIVE SANDBOX
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-purple-300/70 font-mono hidden sm:block">
                    {hasAnyLocks
                      ? `Recipient preview with configured locks & self-destruct mechanisms (${content.length} bytes)`
                      : `Live rendered output directly from your text editor (${content.length} bytes)`}
                  </p>
                </div>
              </div>

              {/* View Mode & Viewport Switchers */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Lock Gate vs Content Toggle */}
                {hasAnyLocks && (
                  <div className="flex items-center gap-1 bg-black/60 border border-amber-500/40 rounded-xl p-1 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setViewMode('lock')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                        viewMode === 'lock'
                          ? 'bg-amber-950 text-amber-200 border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                          : 'text-amber-300/60 hover:text-amber-200'
                      }`}
                      title="Recipient Lock Screen: test PIN and live countdowns"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Lock Gate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('content')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                        viewMode === 'content'
                          ? 'bg-fuchsia-950 text-fuchsia-200 border border-fuchsia-400/60 shadow-[0_0_8px_rgba(217,70,239,0.4)]'
                          : 'text-purple-300/60 hover:text-fuchsia-200'
                      }`}
                      title="Direct Content: bypass locks and view rendered page"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Unlocked</span>
                    </button>
                  </div>
                )}

                {/* Center Viewport Switcher */}
                <div className="flex items-center gap-1 bg-black/60 border border-fuchsia-500/30 rounded-xl p-1 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setViewportMode('desktop')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                      viewportMode === 'desktop'
                        ? 'bg-fuchsia-950 text-fuchsia-200 border border-fuchsia-400/60 shadow-[0_0_8px_rgba(217,70,239,0.4)]'
                        : 'text-purple-300/60 hover:text-fuchsia-200'
                    }`}
                    title="Desktop Full Viewport"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode('tablet')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                      viewportMode === 'tablet'
                        ? 'bg-fuchsia-950 text-fuchsia-200 border border-fuchsia-400/60 shadow-[0_0_8px_rgba(217,70,239,0.4)]'
                        : 'text-purple-300/60 hover:text-fuchsia-200'
                    }`}
                    title="Tablet Viewport (768px)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Tablet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode('mobile')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                      viewportMode === 'mobile'
                        ? 'bg-fuchsia-950 text-fuchsia-200 border border-fuchsia-400/60 shadow-[0_0_8px_rgba(217,70,239,0.4)]'
                        : 'text-purple-300/60 hover:text-fuchsia-200'
                    }`}
                    title="Mobile Viewport (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Mobile</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons & Close */}
              <div className="flex items-center gap-2">
                {hasAnyLocks && viewMode === 'lock' && (
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 hover:text-white transition flex items-center gap-1.5 text-xs font-mono cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                    title="Reset lock state to test unlocking again"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">RE-LOCK</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRefresh}
                  className={`p-2 rounded-xl bg-purple-950/70 hover:bg-fuchsia-950 border border-purple-500/40 text-purple-200 hover:text-white transition flex items-center gap-1 text-xs font-mono cursor-pointer ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                  title="Refresh Render Preview"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-fuchsia-950 border border-purple-500/40 text-purple-200 hover:text-white transition flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                  title="Open Preview in New Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">POPOUT</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-900/90 to-purple-900/90 hover:from-fuchsia-800 hover:to-purple-800 border border-fuchsia-400/70 text-white font-mono text-xs tracking-wider flex items-center gap-1 shadow-[0_0_15px_rgba(217,70,239,0.4)] transition cursor-pointer"
                  title="Close Preview Dropdown (ESC)"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>CLOSE</span>
                </button>
              </div>
            </div>

            {/* Active Lock Badges Strip (Visible prior to generating a box) */}
            {hasAnyLocks && (
              <div className="px-4 sm:px-6 py-2 bg-[#040114] border-b border-amber-500/30 flex flex-wrap items-center gap-2 text-xs font-mono shrink-0">
                <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-400" /> CONFIGURED LOCKS:
                </span>
                {hasPasscode && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-fuchsia-950/90 border border-fuchsia-500/60 text-fuchsia-200 text-[10px] font-bold shadow-[0_0_8px_rgba(217,70,239,0.3)]">
                    <Key className="w-2.5 h-2.5 text-fuchsia-400" /> PIN LOCKED ({metadata?.password?.length || 8} DIGITS)
                  </span>
                )}
                {hasTimeLock && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/90 border border-amber-500/60 text-amber-200 text-[10px] font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                    <Clock className="w-2.5 h-2.5 text-amber-400" /> TIMER ({twConfig?.mode ? twConfig.mode.toUpperCase() : 'ACTIVE'})
                  </span>
                )}
                {hasAccessLimit && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-[10px] font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                    <Flame className="w-2.5 h-2.5 text-emerald-400" /> ACCESS LIMIT ({olConfig?.maxOpens === 1 ? '1 VIEW BURN' : `${olConfig?.maxOpens} VIEWS`})
                  </span>
                )}
                {hasPaymentPolicy && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 text-[10px] font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]">
                    <Shield className="w-2.5 h-2.5 text-cyan-400" /> PAYWALL ACTIVE
                  </span>
                )}
                {hasAgentic && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/90 border border-purple-500/60 text-purple-200 text-[10px] font-bold shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                    <Bot className="w-2.5 h-2.5 text-purple-400" /> WEBMCP AGENT LOCK
                  </span>
                )}
                <span className="ml-auto text-[10px] text-amber-300/70 hidden md:inline">
                  {viewMode === 'lock' ? 'Testing recipient lock gate · Enter PIN to unlock' : 'Viewing un-gated live code output'}
                </span>
              </div>
            )}

            {/* Live Sandbox or Lock Gate Container */}
            <div className="flex-1 w-full p-3 sm:p-4 bg-[#03010b] flex items-center justify-center min-h-0 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 flex flex-col items-center justify-center relative ${
                  viewportMode === 'desktop'
                    ? 'w-full'
                    : viewportMode === 'tablet'
                    ? 'w-[768px] max-w-full rounded-2xl border-4 border-purple-900/60 shadow-[0_0_35px_rgba(0,0,0,0.8)]'
                    : 'w-[375px] max-w-full rounded-3xl border-8 border-purple-950/80 shadow-[0_0_40px_rgba(0,0,0,0.9)]'
                }`}
              >
                {/* Device Frame Notch (Mobile only) */}
                {viewportMode === 'mobile' && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-3 bg-purple-950 rounded-full z-10 flex items-center justify-center">
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
              className="py-2 bg-[#0a0524]/80 border-t border-fuchsia-500/20 flex items-center justify-center gap-2 cursor-pointer hover:bg-fuchsia-950/40 transition group"
            >
              <ChevronUp className="w-3.5 h-3.5 text-fuchsia-400 group-hover:-translate-y-0.5 transition-transform" />
              <span className="text-[10px] font-cyber font-bold tracking-widest text-fuchsia-300/80 group-hover:text-fuchsia-200 uppercase">
                CLICK OR PRESS ESC TO CLOSE PREVIEW
              </span>
              <ChevronUp className="w-3.5 h-3.5 text-fuchsia-400 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
