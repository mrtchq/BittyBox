import React, { useEffect } from 'react';
import { 
  X, 
  Share2, 
  QrCode, 
  FolderArchive, 
  ExternalLink, 
  RefreshCw, 
  LogOut, 
  Compass, 
  Sparkles, 
  Search, 
  Sliders, 
  Shield, 
  Palette, 
  Check, 
  HardDrive, 
  Layers, 
  Crown, 
  Zap, 
  Copy, 
  UploadCloud, 
  FileCode2, 
  Activity, 
  History, 
  Info,
  ChevronRight,
  Lock,
  FileText
} from 'lucide-react';
import { BittyMetadata, BittySession, WorkspaceMode, WorkspaceTheme } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { GRIP_ICON_DATA_URL } from './EdgeGripHandles';
import { CyberScrambleText } from './CyberScrambleText';

interface StudioToolsSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
  bittyUrl: string;
  originalBytes: number;
  compressedBytes: number;
  isCopied: boolean;
  onOpenQr: () => void;
  onShare: () => void;
  onPreviewInTab: () => void;
  onExportZip?: () => void;
  onNewBox: () => void;
  onCloseSession?: () => void;
  onStartTour?: () => void;
  onReplaySplash?: () => void;
  onOpenSeo?: () => void;
  onToggleMetadata?: () => void;
  showMetadata?: boolean;
  metadata: BittyMetadata;
  onImportFile?: () => void;
  theme: WorkspaceTheme;
  onThemeChange: (theme: WorkspaceTheme) => void;
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  isPro: boolean;
  isLifetimePro: boolean;
  isTrialActive: boolean;
  trialTimeRemaining: { hours: number; minutes: number };
  onOpenPaywall: (featureName?: string) => void;
  onOpenHistory?: () => void;
  onOpenSpecs?: () => void;
  sessions?: BittySession[];
  currentSessionId?: string;
  onSwitchSession?: (sessionId: string) => void;
  onCloseSessionById?: (sessionId: string) => void;
}

const THEMES: { id: WorkspaceTheme; name: string; desc: string; previewBg: string }[] = [
  {
    id: 'synthwave',
    name: 'Neon Synthwave',
    desc: 'Deep cosmic violet, vibrant cyan glow & retro magenta highlights',
    previewBg: 'from-[#050515] via-[#240b36] to-[#00f2ff]',
  },
  {
    id: 'monochrome',
    name: 'Minimalist Monochrome',
    desc: 'High-contrast pure obsidian dark background with crisp paper-white typography',
    previewBg: 'from-[#08080c] via-[#1c1c24] to-[#f4f4f8]',
  },
  {
    id: 'matrix',
    name: 'Matrix Cyber',
    desc: 'Pure hacker green phosphor scanlines, deep carbon base & emerald rain telemetry',
    previewBg: 'from-[#020d06] via-[#052b14] to-[#00ff66]',
  },
];

export const StudioToolsSidePanel: React.FC<StudioToolsSidePanelProps> = ({
  isOpen,
  onClose,
  onGenerate,
  bittyUrl,
  originalBytes,
  compressedBytes,
  isCopied,
  onOpenQr,
  onShare,
  onPreviewInTab,
  onExportZip,
  onNewBox,
  onCloseSession,
  onStartTour,
  onReplaySplash,
  onOpenSeo,
  onToggleMetadata,
  showMetadata = false,
  metadata,
  onImportFile,
  theme,
  onThemeChange,
  mode,
  onModeChange,
  isPro,
  isLifetimePro,
  isTrialActive,
  trialTimeRemaining,
  onOpenPaywall,
  onOpenHistory,
  onOpenSpecs,
  sessions = [],
  currentSessionId,
  onSwitchSession,
  onCloseSessionById,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const compressionRatio =
    originalBytes > 0
      ? Math.max(0, Math.round(((originalBytes - compressedBytes) / originalBytes) * 100))
      : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Full Screen Sliding Panel from Right */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: '0%', opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 right-0 w-full max-w-4xl bg-[#040d18]/98 border-l border-cyan-500/40 shadow-[0_0_50px_rgba(0,242,255,0.3)] flex flex-col z-50 overflow-hidden"
          >
            {/* Ambient Top Glow Beam */}
            <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-teal-400 to-purple-500 shadow-[0_0_15px_#00f2ff]" />

            {/* Panel Header */}
            <div className="p-4 sm:p-6 border-b border-cyan-500/25 bg-[#051426]/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tl from-cyan-950 to-teal-900 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)]">
                  <img
                    src={GRIP_ICON_DATA_URL}
                    alt="Tools Grip Icon"
                    className="w-5 h-5 filter invert-[80%] sepia-[90%] saturate-[600%] hue-rotate-[140deg] brightness-[120%]"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-cyber font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-fuchsia-300">
                      <CyberScrambleText text="STUDIO TOOLS & CONTROLS" speed={25} />
                    </h2>
                    <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40">
                      CONTROL DECK
                    </span>
                  </div>
                  <p className="text-xs text-cyan-300/70 font-mono hidden sm:block">
                    Full transmission deck, telemetry, export tools &amp; environment settings.
                  </p>
                </div>
              </div>

              {/* Close / Dismiss */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 hover:text-white transition flex items-center gap-1 text-xs font-mono cursor-pointer"
                title="Close Tools Panel"
              >
                <span className="hidden sm:inline">CLOSE</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 cyber-scrollbar space-y-6">
              {/* =========================================================================
                  SECTION 1: TRANSMISSION & INSTANT SHARING
                 ========================================================================= */}
              <div className="rounded-2xl bg-gradient-to-b from-[#06182c]/80 to-[#030d1a]/80 border border-cyan-500/30 p-4 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2 text-cyan-300 font-cyber font-bold text-xs uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>TRANSMISSION &amp; ZERO-SERVER LINK</span>
                  </div>
                  <div className="text-[11px] font-mono text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
                    {compressionRatio > 0 ? `${compressionRatio}% COMPRESSED` : 'LIVE PACKED'}
                  </div>
                </div>

                {/* Big Generate & Copy Button */}
                <button
                  id="panel-generate-copy-btn"
                  onClick={onGenerate}
                  className={`w-full py-3 px-4 rounded-xl font-cyber text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                    isCopied
                      ? 'bg-teal-500 text-black font-extrabold shadow-[0_0_20px_rgba(20,184,166,0.6)]'
                      : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-black font-extrabold shadow-[0_0_20px_rgba(0,242,255,0.4)]'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>{isCopied ? 'BITTY URL COPIED TO CLIPBOARD! 🚀' : 'GENERATE & COPY BITTY LINK'}</span>
                </button>

                {/* Telemetry row */}
                <div className="grid grid-cols-3 gap-2 mt-3 text-center font-mono">
                  <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                    <div className="text-[10px] text-cyan-400/70 uppercase">Raw Size</div>
                    <div className="text-xs font-bold text-cyan-200">{originalBytes} B</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                    <div className="text-[10px] text-teal-400/70 uppercase">Packed Size</div>
                    <div className="text-xs font-bold text-teal-300">{compressedBytes} B</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                    <div className="text-[10px] text-fuchsia-400/70 uppercase">Cipher</div>
                    <div className="text-xs font-bold text-fuchsia-300">
                      {metadata.password ? 'AES-256' : 'GZIP'}
                    </div>
                  </div>
                </div>

                {/* Share Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
                  <button
                    id="nav-qr-btn"
                    onClick={() => {
                      if (mode === 'simple' && !isPro) {
                        onOpenPaywall('QR Code Transmitter');
                      } else {
                        onOpenQr();
                      }
                    }}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-mono transition cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>QR HOLOGRAM</span>
                  </button>

                  <button
                    id="nav-share-btn"
                    onClick={onShare}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-fuchsia-950/60 hover:bg-fuchsia-900 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-mono transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-fuchsia-400" />
                    <span>SYSTEM SHARE</span>
                  </button>

                  <button
                    id="nav-popout-btn"
                    onClick={onPreviewInTab}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-teal-950/60 hover:bg-teal-900 border border-teal-500/40 text-teal-200 text-xs font-mono transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-teal-400" />
                    <span>OPEN TAB</span>
                  </button>
                </div>
              </div>

              {/* =========================================================================
                  SECTION 2: EXPORT, IMPORT & SECURITY
                 ========================================================================= */}
              <div className="rounded-2xl bg-gradient-to-b from-[#0a0520]/80 to-[#060214]/80 border border-purple-500/30 p-4 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-500/20">
                  <div className="flex items-center gap-2 text-fuchsia-300 font-cyber font-bold text-xs uppercase tracking-wider">
                    <FolderArchive className="w-4 h-4 text-fuchsia-400" />
                    <span>PACKAGING, IMPORT &amp; VAULT SECURITY</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {onExportZip && (
                    <button
                      id="nav-zip-btn"
                      onClick={() => {
                        if (mode === 'simple' && !isPro) {
                          onOpenPaywall('ZIP Archive Export');
                        } else {
                          onExportZip();
                        }
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#0c0422] hover:bg-purple-950/80 border border-purple-500/40 text-left transition cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-950 border border-purple-500/50 flex items-center justify-center text-fuchsia-400 group-hover:text-cyan-300">
                        <FolderArchive className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-cyber font-bold text-xs text-fuchsia-200 group-hover:text-cyan-200 flex items-center gap-1.5">
                          <span>EXPORT TO ZIP</span>
                          {mode === 'simple' && !isPro && <Crown className="w-3 h-3 text-amber-400" />}
                        </div>
                        <p className="text-[10px] text-purple-300/60 font-mono">
                          Download standalone HTML + README package
                        </p>
                      </div>
                    </button>
                  )}

                  {onImportFile && (
                    <button
                      id="bitty-import-btn"
                      onClick={onImportFile}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#0c0422] hover:bg-cyan-950/80 border border-cyan-500/40 text-left transition cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 group-hover:text-fuchsia-300">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-cyber font-bold text-xs text-cyan-200 group-hover:text-cyan-100">
                          <span>IMPORT LOCAL FILE</span>
                        </div>
                        <p className="text-[10px] text-cyan-300/60 font-mono">
                          Load HTML, text, or SVG from disk
                        </p>
                      </div>
                    </button>
                  )}

                  {onOpenSeo && (
                    <button
                      id="bitty-seo-btn"
                      onClick={onOpenSeo}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#0c0422] hover:bg-teal-950/80 border border-teal-500/40 text-left transition cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-teal-950 border border-teal-500/50 flex items-center justify-center text-teal-400 group-hover:text-white">
                        <Search className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-cyber font-bold text-xs text-teal-200 group-hover:text-teal-100 flex items-center gap-1.5">
                          <span>SEO &amp; DISCOVERABILITY</span>
                          {mode === 'simple' && !isPro && <Crown className="w-3 h-3 text-amber-400" />}
                        </div>
                        <p className="text-[10px] text-teal-300/60 font-mono">
                          Analyze Open Graph tags, titles &amp; metadata
                        </p>
                      </div>
                    </button>
                  )}

                  {onToggleMetadata && (
                    <button
                      id="bitty-meta-btn"
                      onClick={onToggleMetadata}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#0c0422] hover:bg-purple-950/80 border border-purple-500/40 text-left transition cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-950 border border-purple-500/50 flex items-center justify-center text-purple-300 group-hover:text-white">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-cyber font-bold text-xs text-purple-200 group-hover:text-white flex items-center justify-between">
                          <span>PARAMS &amp; META TAGS</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-900/60 text-cyan-300">
                            {showMetadata ? 'EXPANDED' : 'COLLAPSED'}
                          </span>
                        </div>
                        <p className="text-[10px] text-purple-300/60 font-mono">
                          Configure title, favicon, description &amp; password
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* =========================================================================
                  SECTION 3: WORKSPACE THEMES & PRO MODE
                 ========================================================================= */}
              <div className="rounded-2xl bg-gradient-to-b from-[#051524]/80 to-[#020b14]/80 border border-cyan-500/30 p-4 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2 text-cyan-300 font-cyber font-bold text-xs uppercase tracking-wider">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <span>CYBER WORKSPACE THEMES</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {THEMES.map(t => {
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        id={t.id === 'synthwave' ? 'nav-theme-toggle-btn' : undefined}
                        onClick={() => {
                          if (mode === 'simple' && !isPro) {
                            onOpenPaywall('Cyber Workspace Themes');
                          } else {
                            onThemeChange(t.id);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gradient-to-b from-purple-900/60 to-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                            : 'bg-black/40 hover:bg-black/60 border-cyan-500/20 text-purple-200/80 hover:border-cyan-500/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className={`w-6 h-6 rounded-full bg-gradient-to-tr ${t.previewBg} p-[1px] shadow-sm flex items-center justify-center`}
                            >
                              <div className="w-3.5 h-3.5 rounded-full bg-black/50" />
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <h4 className="font-cyber font-bold text-xs text-cyan-200 mb-1">
                            {t.name}
                          </h4>
                          <p className="text-[10px] text-purple-300/60 font-mono line-clamp-2">
                            {t.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Workspace Mode Pill */}
                <div className="mt-4 pt-3 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-300">Workspace Mode:</span>
                    <div className="flex items-center bg-black/60 p-1 rounded-xl border border-cyan-500/30">
                      <button
                        onClick={() => onModeChange('simple')}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                          mode === 'simple'
                            ? 'bg-cyan-950 text-cyan-200 border border-cyan-400 shadow-sm'
                            : 'text-purple-300/60 hover:text-cyan-200'
                        }`}
                      >
                        SIMPLE
                      </button>
                      <button
                        onClick={() => {
                          if (mode === 'pro') {
                            onOpenPaywall();
                          } else {
                            onModeChange('pro');
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
                          mode === 'pro'
                            ? 'bg-gradient-to-r from-fuchsia-900 to-purple-900 text-fuchsia-200 border border-fuchsia-400 shadow-sm'
                            : 'text-fuchsia-400/60 hover:text-fuchsia-200'
                        }`}
                      >
                        <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>PRO</span>
                      </button>
                    </div>
                  </div>

                  {/* 24h Pass / Lifetime badge */}
                  <button
                    onClick={() => onOpenPaywall()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/80 to-fuchsia-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono transition hover:border-amber-300 shadow-sm cursor-pointer"
                  >
                    {isLifetimePro ? (
                      <>
                        <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>LIFETIME PRO UNLOCKED</span>
                      </>
                    ) : isTrialActive ? (
                      <>
                        <Zap className="w-3.5 h-3.5 text-fuchsia-400 animate-bounce" />
                        <span>
                          24H PASS: {trialTimeRemaining.hours}h {trialTimeRemaining.minutes}m
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                        <span>UPGRADE TO PRO</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* =========================================================================
                  SECTION 4: SESSIONS & NAVIGATION
                 ========================================================================= */}
              <div className="rounded-2xl bg-gradient-to-b from-[#09021c]/80 to-[#050110]/80 border border-purple-500/30 p-4 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-500/20">
                  <div className="flex items-center gap-2 text-purple-300 font-cyber font-bold text-xs uppercase tracking-wider">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>SYSTEM GUIDES, VAULT &amp; SESSIONS</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {onOpenHistory && (
                    <button
                      onClick={() => {
                        onOpenHistory();
                        onClose();
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0c0422] hover:bg-teal-950/70 border border-teal-500/30 text-center transition cursor-pointer"
                    >
                      <History className="w-5 h-5 text-teal-400 mb-1" />
                      <span className="font-cyber font-bold text-xs text-teal-200">VAULT HISTORY</span>
                    </button>
                  )}

                  {onOpenSpecs && (
                    <button
                      onClick={() => {
                        onOpenSpecs();
                        onClose();
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0c0422] hover:bg-purple-950/70 border border-purple-500/30 text-center transition cursor-pointer"
                    >
                      <Info className="w-5 h-5 text-purple-300 mb-1" />
                      <span className="font-cyber font-bold text-xs text-purple-200">SYSTEM SPECS</span>
                    </button>
                  )}

                  {onStartTour && (
                    <button
                      id="nav-tour-btn"
                      onClick={() => {
                        onClose();
                        setTimeout(() => onStartTour(), 150);
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0c0422] hover:bg-cyan-950/70 border border-cyan-500/30 text-center transition cursor-pointer"
                    >
                      <Compass className="w-5 h-5 text-cyan-400 mb-1 animate-spin-slow" />
                      <span className="font-cyber font-bold text-xs text-cyan-200">START TOUR</span>
                    </button>
                  )}

                  {onReplaySplash && (
                    <button
                      id="nav-splash-btn"
                      onClick={() => {
                        onClose();
                        onReplaySplash();
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0c0422] hover:bg-fuchsia-950/70 border border-fuchsia-500/30 text-center transition cursor-pointer"
                    >
                      <Sparkles className="w-5 h-5 text-fuchsia-400 mb-1" />
                      <span className="font-cyber font-bold text-xs text-fuchsia-200">REPLAY INTRO</span>
                    </button>
                  )}
                </div>

                {/* Session Reset & Close */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-purple-500/20">
                  <button
                    id="nav-new-btn"
                    onClick={() => {
                      onNewBox();
                      onClose();
                    }}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-mono transition cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-purple-300" />
                    <span>NEW BITTY BOX / RESET</span>
                  </button>

                  {onCloseSession && (
                    <button
                      id="nav-close-session-btn"
                      onClick={() => {
                        onClose();
                        onCloseSession();
                      }}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-950/60 hover:bg-rose-950/80 border border-amber-500/40 hover:border-rose-400 text-amber-300 hover:text-white text-xs font-cyber transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-amber-400" />
                      <span>CLOSE ACTIVE SESSION</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
