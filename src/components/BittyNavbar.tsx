import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Code, 
  Eye, 
  History, 
  Sparkles, 
  QrCode, 
  Share2, 
  Shield, 
  Info, 
  ExternalLink, 
  RefreshCw, 
  FolderArchive,
  Palette,
  Terminal,
  Contrast,
  ChevronDown,
  Check,
  LayoutGrid,
  Compass,
  LogOut
} from 'lucide-react';
import { AppView, WorkspaceTheme } from '../types';

interface BittyNavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onOpenQr: () => void;
  onShare: () => void;
  onNewBox: () => void;
  onCloseSession?: () => void;
  onPreviewInTab: () => void;
  onExportZip?: () => void;
  onOpenTemplates?: () => void;
  onStartTour?: () => void;
  onReplaySplash?: () => void;
  isEncrypted: boolean;
  hasContent: boolean;
  theme: WorkspaceTheme;
  onThemeChange: (theme: WorkspaceTheme) => void;
}

export const BittyNavbar: React.FC<BittyNavbarProps> = ({
  currentView,
  onViewChange,
  onOpenQr,
  onShare,
  onNewBox,
  onCloseSession,
  onPreviewInTab,
  onExportZip,
  onOpenTemplates,
  onStartTour,
  onReplaySplash,
  isEncrypted,
  hasContent,
  theme,
  onThemeChange,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const THEMES: { id: WorkspaceTheme; name: string; icon: React.ReactNode; desc: string; previewBg: string }[] = [
    {
      id: 'monochrome',
      name: 'Minimalist Monochrome',
      icon: <Contrast className="w-3.5 h-3.5 text-white" />,
      desc: 'High-contrast dark slate & pure white',
      previewBg: 'from-zinc-100 via-zinc-400 to-zinc-800',
    },
    {
      id: 'synthwave',
      name: 'Neon Synthwave',
      icon: <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />,
      desc: 'Cyberpunk purple & cyan glow',
      previewBg: 'from-fuchsia-600 via-purple-700 to-cyan-500',
    },
    {
      id: 'matrix',
      name: 'Matrix Cyber',
      icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />,
      desc: 'Phosphor green terminal & rain (Pure Green & Black)',
      previewBg: 'from-emerald-500 via-green-600 to-black',
    },
  ];

  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0a0316]/80 border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => onViewChange('editor')}>
          <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-600 via-purple-700 to-cyan-500 p-[1.5px] shadow-[0_0_15px_rgba(0,221,255,0.4)] group">
            <div className="w-full h-full bg-[#090314] rounded-[7px] flex items-center justify-center">
              <Box className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-lg blur opacity-40 group-hover:opacity-80 transition duration-300 -z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cyber font-bold text-lg sm:text-xl tracking-wider text-cyan-200">
                BITTY BOX
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-fuchsia-300/70 font-mono hidden sm:block">
              WHOLE WEBPAGES INSIDE A URL
            </p>
          </div>
        </div>

        {/* View Switchers */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-purple-950/40 p-1 rounded-xl border border-purple-500/20 backdrop-blur-md">
          <button
            id="nav-editor-btn"
            onClick={() => onViewChange('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              currentView === 'editor'
                ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,221,255,0.25)]'
                : 'text-purple-200/70 hover:text-cyan-200 hover:bg-purple-900/30'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>STUDIO</span>
          </button>

          <button
            id="nav-preview-btn"
            onClick={() => onViewChange('viewer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              currentView === 'viewer'
                ? 'bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 text-fuchsia-200 border border-fuchsia-400/50 shadow-[0_0_12px_rgba(255,0,222,0.25)]'
                : 'text-purple-200/70 hover:text-fuchsia-200 hover:bg-purple-900/30'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>VIEWER</span>
          </button>

          <button
            id="nav-history-btn"
            onClick={() => onViewChange('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              currentView === 'history'
                ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-200 border border-teal-400/50 shadow-[0_0_12px_rgba(0,245,212,0.25)]'
                : 'text-purple-200/70 hover:text-teal-200 hover:bg-purple-900/30'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline">VAULT</span>
            <span className="md:hidden">VAULT</span>
          </button>

          <button
            id="nav-about-btn"
            onClick={() => onViewChange('about')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              currentView === 'about'
                ? 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-200 border border-purple-400/50 shadow-[0_0_12px_rgba(121,40,202,0.25)]'
                : 'text-purple-200/70 hover:text-purple-200 hover:bg-purple-900/30'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SPECS</span>
          </button>
        </nav>

        {/* Action Controls & Theme Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Template Gallery Direct Trigger */}
          {onOpenTemplates && (
            <button
              id="nav-templates-btn"
              onClick={onOpenTemplates}
              title="Open Template Gallery Lab"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-950/70 to-purple-950/70 border border-fuchsia-500/40 text-fuchsia-200 hover:text-white hover:border-fuchsia-400 text-xs font-cyber transition shadow-sm"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="hidden lg:inline">TEMPLATES</span>
            </button>
          )}

          {/* PERSISTENT THEME TOGGLE DROPDOWN */}
          <div className="relative" ref={themeMenuRef}>
            <button
              id="nav-theme-toggle-btn"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/50 border border-purple-500/40 text-purple-200 hover:bg-purple-900/50 hover:text-white text-xs font-mono transition shadow-sm"
              title={`Workspace Theme: ${currentThemeObj.name} (Click to switch)`}
            >
              {currentThemeObj.icon}
              <span className="hidden xl:inline text-[11px] font-bold">{currentThemeObj.name}</span>
              <ChevronDown className="w-3 h-3 text-purple-400" />
            </button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0a0316] border border-cyan-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-purple-500/20 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>WORKSPACE THEMES</span>
                  <Palette className="w-3 h-3 text-cyan-400" />
                </div>

                <div className="p-1 space-y-1">
                  {THEMES.map(t => {
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          onThemeChange(t.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition ${
                          isSelected
                            ? 'bg-purple-900/40 border border-cyan-400/50 text-cyan-200 shadow-sm'
                            : 'hover:bg-purple-950/60 text-purple-200/80 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${t.previewBg} p-[1px] shadow-sm flex items-center justify-center`}>
                            <div className="w-2.5 h-2.5 rounded-full bg-black/40" />
                          </div>
                          <div>
                            <div className="font-cyber font-bold text-xs flex items-center gap-1.5">
                              {t.name}
                            </div>
                            <div className="text-[10px] text-purple-300/60 font-mono">
                              {t.desc}
                            </div>
                          </div>
                        </div>

                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Guided Onboarding Walkthrough Trigger */}
          {onStartTour && (
            <button
              id="nav-tour-btn"
              onClick={onStartTour}
              title="Launch Guided Onboarding Walkthrough"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-950/70 to-cyan-950/70 border border-teal-500/40 text-teal-200 hover:text-white hover:border-teal-300 hover:shadow-[0_0_12px_rgba(20,184,166,0.4)] text-xs font-cyber transition shadow-sm"
            >
              <Compass className="w-3.5 h-3.5 text-teal-300 animate-spin-slow" />
              <span className="hidden sm:inline">TOUR</span>
            </button>
          )}

          {/* Replay Holographic Splash Intro */}
          {onReplaySplash && (
            <button
              id="nav-splash-btn"
              onClick={onReplaySplash}
              title="Replay Holographic Intro Boot"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-950/70 to-purple-950/70 border border-fuchsia-500/40 text-fuchsia-200 hover:text-white hover:border-fuchsia-300 hover:shadow-[0_0_12px_rgba(217,70,239,0.4)] text-xs font-cyber transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-300 animate-spin-slow" />
              <span className="hidden sm:inline">INTRO</span>
            </button>
          )}

          {isEncrypted && (
            <span className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-fuchsia-400 bg-fuchsia-950/80 px-2.5 py-1 rounded-md border border-fuchsia-500/40">
              <Shield className="w-3 h-3 text-fuchsia-400" />
              AES-256
            </span>
          )}

          {onExportZip && (
            <button
              id="nav-zip-btn"
              onClick={onExportZip}
              title="Export to Portable ZIP Package"
              className="p-2 rounded-lg bg-purple-950/50 border border-purple-500/30 text-purple-200 hover:bg-purple-900/50 hover:text-white hover:shadow-[0_0_12px_rgba(189,0,255,0.4)] transition"
            >
              <FolderArchive className="w-4 h-4" />
            </button>
          )}

          <button
            id="nav-qr-btn"
            onClick={onOpenQr}
            title="Generate QR Hologram"
            className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 hover:text-white hover:shadow-[0_0_12px_rgba(0,221,255,0.4)] transition"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            id="nav-share-btn"
            onClick={onShare}
            title="Share Bitty Box"
            className="p-2 rounded-lg bg-fuchsia-950/50 border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-900/40 hover:text-white hover:shadow-[0_0_12px_rgba(255,0,222,0.4)] transition"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            id="nav-popout-btn"
            onClick={onPreviewInTab}
            title="Launch in New Tab"
            className="p-2 rounded-lg bg-teal-950/50 border border-teal-500/30 text-teal-300 hover:bg-teal-900/40 hover:text-white hover:shadow-[0_0_12px_rgba(0,245,212,0.4)] transition"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            id="nav-new-btn"
            onClick={onNewBox}
            title="New Bitty Box / Reset Session"
            className="p-2 rounded-lg bg-purple-950/50 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40 hover:text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Close Opened Session Trigger */}
          {onCloseSession && (
            <button
              id="nav-close-session-btn"
              onClick={onCloseSession}
              title="Close Active Session (with confirmation warning)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-950/70 to-rose-950/70 border border-amber-500/40 text-amber-300 hover:text-white hover:border-rose-400 hover:bg-rose-900/70 text-xs font-cyber transition shadow-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">CLOSE SESSION</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
