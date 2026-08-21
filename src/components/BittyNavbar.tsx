import React from 'react';
import { 
  Box, 
  Code, 
  Eye, 
  History, 
  Sparkles, 
  Info, 
  LayoutGrid, 
  Crown, 
  Lock, 
  Zap, 
  SlidersHorizontal,
  FolderArchive,
  QrCode,
  Share2,
  ExternalLink,
  RefreshCw,
  Compass,
  LogOut,
  User,
  Coins
} from 'lucide-react';
import { AppView, WorkspaceTheme, WorkspaceMode, BittyUser } from '../types';
import { GRIP_ICON_DATA_URL } from './EdgeGripHandles';
import { SessionSaveIndicator } from './SessionSaveIndicator';
import { UserAvatar } from './UserAvatar';

interface BittyNavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onOpenQr?: () => void;
  onShare?: () => void;
  onNewBox?: () => void;
  onCloseSession?: () => void;
  onPreviewInTab?: () => void;
  onExportZip?: () => void;
  onOpenTemplates?: () => void;
  onOpenTools?: () => void;
  onStartTour?: () => void;
  onReplaySplash?: () => void;
  isEncrypted: boolean;
  hasContent: boolean;
  theme: WorkspaceTheme;
  onThemeChange: (theme: WorkspaceTheme) => void;
  // PRO & Simple Mode props
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  isPro: boolean;
  isLifetimePro?: boolean;
  isTrialActive?: boolean;
  trialTimeRemaining?: any;
  onOpenPaywall: (featureName?: string) => void;
  // Session Save Status props
  lastSavedAt?: number | null;
  isSaving?: boolean;
  activeSessionTitle?: string;
  onManualSave?: () => void;
  // User Profile Account props
  user?: BittyUser | null;
  isAuthenticated?: boolean;
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
  onOpenTools,
  onStartTour,
  onReplaySplash,
  isEncrypted,
  theme,
  onThemeChange,
  mode,
  onModeChange,
  isPro,
  isLifetimePro,
  isTrialActive,
  trialTimeRemaining,
  onOpenPaywall,
  lastSavedAt,
  isSaving,
  activeSessionTitle,
  onManualSave,
  user,
  isAuthenticated,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0a0316]/90 border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
      {/* =========================================================================
          ROW 1: BRAND LOGO + VIEW SWITCHERS + MODE PILL + QUICK PANEL TRIGGERS
         ========================================================================= */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Templates Quick Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => onViewChange('editor')}
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-indigo-600 p-[2px] shadow-[0_0_20px_rgba(0,242,255,0.45)] group transition-all duration-300 hover:shadow-[0_0_28px_rgba(255,0,222,0.6)]">
              <div className="w-full h-full bg-[#090314]/90 rounded-[10px] flex items-center justify-center overflow-hidden p-1">
                <img
                  src="/bittybox-logo.png"
                  alt="Bitty Box Logo"
                  className="w-full h-full object-contain group-hover:scale-115 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(0,242,255,0.7)]"
                />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-teal-400 rounded-xl blur-sm opacity-50 group-hover:opacity-90 transition duration-300 -z-10 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-cyber font-bold text-base sm:text-lg lg:text-xl tracking-wider text-cyan-200">
                  BITTY BOX
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-fuchsia-300/70 font-mono hidden md:block">
                WEBPAGES PACKED IN A LINK
              </p>
            </div>
          </div>

          {/* Quick Left Templates Panel Trigger */}
          {onOpenTemplates && (
            <button
              id="nav-templates-btn"
              onClick={() => {
                if (mode === 'simple' && !isPro) {
                  onOpenPaywall('Template Gallery Lab');
                } else {
                  onOpenTemplates();
                }
              }}
              title="Open Templates & Presets Side Panel"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-950/80 to-purple-950/80 border border-fuchsia-500/40 text-fuchsia-200 hover:text-white hover:border-fuchsia-400 text-xs font-cyber transition shadow-sm cursor-pointer ml-2"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>TEMPLATES</span>
              {mode === 'simple' && !isPro && (
                <span className="text-[9px] bg-fuchsia-900 text-amber-300 px-1 rounded">PRO</span>
              )}
            </button>
          )}
        </div>

        {/* Center Desktop View Switchers */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-purple-950/40 p-1 rounded-xl border border-purple-500/20 backdrop-blur-md">
          <button
            id="nav-editor-btn"
            onClick={() => onViewChange('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              currentView === 'editor' || currentView === 'account'
                ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,221,255,0.25)]'
                : 'text-purple-200/70 hover:text-cyan-200 hover:bg-purple-900/30'
            }`}
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>ACCOUNT</span>
          </button>

          <button
            id="nav-history-btn"
            onClick={() => {
              if (mode === 'simple' && !isPro) {
                onOpenPaywall('Vault Capsule History');
              } else {
                onViewChange('history');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              currentView === 'history'
                ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-200 border border-teal-400/50 shadow-[0_0_12px_rgba(0,245,212,0.25)]'
                : 'text-purple-200/70 hover:text-teal-200 hover:bg-purple-900/30'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>SAVED</span>
          </button>

          <button
            id="nav-about-btn"
            onClick={() => onViewChange('about')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              currentView === 'about'
                ? 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-200 border border-purple-400/50 shadow-[0_0_12px_rgba(121,40,202,0.25)]'
                : 'text-purple-200/70 hover:text-purple-200 hover:bg-purple-900/30'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>ABOUT</span>
          </button>
        </nav>

        {/* Right Section: Session Save Status + Mode Switcher + 24h Pass + Tools Deck Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Real-time Session Browser Storage Save Indicator */}
          <SessionSaveIndicator
            lastSavedAt={lastSavedAt}
            isSaving={isSaving}
            activeSessionTitle={activeSessionTitle}
            onManualSave={onManualSave}
          />

          {/* Mode Switcher Toggle Pill */}
          <div className="flex items-center bg-[#050212] p-0.5 sm:p-1 rounded-xl border border-fuchsia-500/30 shadow-inner">
            <button
              onClick={() => onModeChange('simple')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-mono text-[10px] sm:text-[11px] font-bold tracking-wider transition-all cursor-pointer ${
                mode === 'simple'
                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,242,255,0.3)]'
                  : 'text-cyan-400/60 hover:text-cyan-200'
              }`}
              title="Simple Mode: Fast, clean HTML-to-URL generator"
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
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-mono text-[10px] sm:text-[11px] font-bold tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                mode === 'pro'
                  ? 'bg-gradient-to-r from-fuchsia-900 to-purple-900 text-fuchsia-200 border border-fuchsia-400/60 shadow-[0_0_12px_rgba(189,0,255,0.4)]'
                  : 'text-fuchsia-400/60 hover:text-fuchsia-200'
              }`}
              title="PRO Mode: Unlock encryption, multi-tabs, templates, and developer tooling"
            >
              <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>PRO</span>
            </button>
          </div>

          {/* PRO Upgrade / Membership Status Pill */}
          <button
            onClick={() => onOpenPaywall()}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-mono text-[10px] sm:text-[11px] tracking-wide border transition shadow-sm cursor-pointer ${
              isPro
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-gradient-to-r from-amber-950/70 to-fuchsia-950/70 border-amber-500/50 text-amber-200 hover:border-amber-400 hover:text-white shadow-[0_0_10px_rgba(245,158,11,0.2)]'
            }`}
            title="Click to manage Bitty Box PRO membership"
          >
            {isPro ? (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold">PRO ACTIVE</span>
              </>
            ) : (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold">UPGRADE &bull; $7/mo</span>
              </>
            )}
          </button>

          {/* Studio Tools & Control Deck Trigger Button */}
          {onOpenTools && (
            <button
              id="nav-tools-panel-btn"
              onClick={onOpenTools}
              title="Open Studio Tools & Actions Deck"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/80 to-teal-950/80 border border-cyan-500/50 text-cyan-200 hover:text-white hover:border-cyan-400 text-xs font-mono transition shadow-[0_0_12px_rgba(0,242,255,0.25)] cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline font-cyber font-bold">TOOLS</span>
            </button>
          )}

          {/* User Profile Avatar Top-Right Trigger */}
          <button
            id="nav-user-profile-btn"
            onClick={() => onViewChange('account')}
            title={
              user?.email
                ? `${user.displayName || 'Google Account'} (${user.email}) • View Account`
                : 'Account & Authentication'
            }
            className={`relative p-0.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
              currentView === 'account'
                ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0a0316] shadow-[0_0_16px_rgba(0,242,255,0.6)]'
                : 'hover:ring-1 hover:ring-cyan-400/60'
            }`}
          >
            <UserAvatar
              user={user}
              size="sm"
              showStatusDot={true}
              isOnline={isAuthenticated ?? !!user}
              altText={user?.displayName || user?.email || 'User Account'}
            />
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: MOBILE VIEW NAVIGATION (Streamlined & Clean, No Clutter)
         ========================================================================= */}
      <div className="lg:hidden w-full border-t border-cyan-500/15 bg-[#070213]/95 px-3 py-1.5 flex items-center justify-between gap-1 shadow-inner">
        <nav className="grid grid-cols-3 gap-1 w-full bg-purple-950/50 p-1 rounded-xl border border-purple-500/25">
          <button
            id="mobile-nav-editor-btn"
            onClick={() => onViewChange('editor')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              currentView === 'editor' || currentView === 'account'
                ? 'bg-gradient-to-r from-cyan-500/25 to-teal-500/25 text-cyan-200 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,221,255,0.3)]'
                : 'text-purple-200/70 hover:text-cyan-200'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>ACCOUNT</span>
          </button>

          <button
            id="mobile-nav-history-btn"
            onClick={() => {
              if (mode === 'simple' && !isPro) {
                onOpenPaywall('Vault Capsule History');
              } else {
                onViewChange('history');
              }
            }}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              currentView === 'history'
                ? 'bg-gradient-to-r from-teal-500/25 to-cyan-500/25 text-teal-200 border border-teal-400/60 shadow-[0_0_10px_rgba(0,245,212,0.3)]'
                : 'text-purple-200/70 hover:text-teal-200'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>SAVED</span>
          </button>

          <button
            id="mobile-nav-about-btn"
            onClick={() => onViewChange('about')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              currentView === 'about'
                ? 'bg-gradient-to-r from-purple-500/25 to-fuchsia-500/25 text-purple-200 border border-purple-400/60 shadow-[0_0_10px_rgba(121,40,202,0.3)]'
                : 'text-purple-200/70 hover:text-purple-200'
            }`}
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>ABOUT</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
