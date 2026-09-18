import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Settings, 
  Code2, 
  Terminal, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Zap, 
  Check, 
  KeyRound, 
  Sparkles, 
  Sliders, 
  Palette, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Layers,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkspaceTheme, WorkspaceMode } from '../types';
import { useDevMode, DEV_MODE_PASSWORD } from '../utils/devMode';
import { CyberScrambleText } from './CyberScrambleText';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: WorkspaceTheme;
  onThemeChange?: (theme: WorkspaceTheme) => void;
  mode?: WorkspaceMode;
  onModeChange?: (mode: WorkspaceMode) => void;
}

const THEME_OPTIONS: { id: WorkspaceTheme; name: string; desc: string; previewBg: string }[] = [
  {
    id: 'synthwave',
    name: 'Neon Synthwave',
    desc: 'Deep cosmic violet, vibrant cyan glow & retro magenta highlights',
    previewBg: 'from-[#050515] via-[#240b36] to-[#00f2ff]',
  },
  {
    id: 'monochrome',
    name: 'Minimalist Monochrome',
    desc: 'High-contrast obsidian dark base with crisp paper-white typography',
    previewBg: 'from-[#08080c] via-[#1c1c24] to-[#f4f4f8]',
  },
  {
    id: 'matrix',
    name: 'Matrix Cyber',
    desc: 'Pure hacker green phosphor scanlines, deep carbon base & emerald rain',
    previewBg: 'from-[#020d06] via-[#052b14] to-[#00ff66]',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme = 'monochrome',
  onThemeChange,
  mode = 'simple',
  onModeChange,
}) => {
  const { isDevMode, enableDevMode, disableDevMode } = useDevMode();
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setPasscode('');
      setErrorMsg(null);
      setSuccessMsg(null);
      setShowPrompt(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (showPrompt && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPrompt]);

  const handleToggleClick = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isDevMode) {
      // If already enabled, toggle turns it off
      disableDevMode();
      setShowPrompt(false);
      setSuccessMsg('Developer Mode deactivated. Credits system restored.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      // If currently disabled, show prompt to enter passcode
      setShowPrompt(true);
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = enableDevMode(passcode);
    if (res.success) {
      setSuccessMsg('Developer Mode unlocked! Credits system disabled for unrestricted testing.');
      setPasscode('');
      setShowPrompt(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.error || 'Incorrect passcode. Access denied.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#05010d]/80 backdrop-blur-md overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl bg-[#090314]/95 border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(0,242,255,0.25)] p-5 sm:p-7 relative text-cyan-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(0,242,255,0.3)]">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base sm:text-lg font-cyber font-bold tracking-wider text-cyan-200">
                SETTINGS // WORKSPACE & DEV
              </h2>
              <p className="text-[11px] font-mono text-cyan-300/70">
                Configure studio preferences, appearance, and developer privileges
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg border border-cyan-500/20 text-cyan-400/80 hover:text-cyan-100 hover:bg-cyan-950/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-400/60 text-emerald-200 text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTION 1: DEV MODE (Highlight Feature) */}
        <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-br from-[#060214] to-[#120429] p-4 sm:p-5 relative overflow-hidden shadow-[0_0_20px_rgba(0,242,255,0.15)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                isDevMode 
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400'
              }`}>
                {isDevMode ? <Unlock className="w-5 h-5 text-emerald-300" /> : <Code2 className="w-5 h-5 text-cyan-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-cyber font-bold text-sm sm:text-base text-cyan-200">
                    DEVELOPER MODE
                  </h3>
                  {isDevMode ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVE // CREDITS DISABLED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950/60 text-purple-300/80 border border-purple-500/30">
                      OFF
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-200/80 font-mono mt-1 leading-relaxed">
                  When enabled, the credits system is disabled, allowing unlimited testing of server locks, box chains, and agent workflows without cost constraints.
                </p>
              </div>
            </div>

            {/* Dev Mode Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isDevMode}
              onClick={handleToggleClick}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#090314] ${
                isDevMode 
                  ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.7)]' 
                  : 'bg-purple-950/70 border-cyan-500/40'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out my-auto ${
                  isDevMode ? 'translate-x-6 bg-white' : 'translate-x-0.5 bg-cyan-200'
                }`}
              />
            </button>
          </div>

          {/* Passcode Unlock Form Drawer */}
          <AnimatePresence>
            {showPrompt && !isDevMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-cyan-500/20"
              >
                <form onSubmit={handleUnlockSubmit} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Enter Dev Mode Passcode to unlock:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="password"
                      autoComplete="off"
                      value={passcode}
                      onChange={e => {
                        setPasscode(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Passcode..."
                      maxLength={20}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#030108] border border-cyan-400/40 text-sm font-mono text-cyan-100 placeholder:text-cyan-500/40 focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400 outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl font-cyber text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-black shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all cursor-pointer shrink-0"
                    >
                      ACTIVATE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPrompt(false);
                        setPasscode('');
                        setErrorMsg(null);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-mono text-cyan-300/70 hover:text-cyan-200 border border-cyan-500/20 hover:bg-cyan-950/40 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  {errorMsg && (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dev Mode Active Perks List */}
          {isDevMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 pt-3 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-emerald-300/90"
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Credits system disabled (0 CR costs)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Free server locks (Time &amp; Quota)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Unlimited multi-page box chains</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Paywall checks fully bypassed</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* SECTION 2: WORKSPACE THEME SELECTION */}
        {onThemeChange && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-cyber font-bold text-cyan-300">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>WORKSPACE PALETTE / THEME</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {THEME_OPTIONS.map(opt => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onThemeChange(opt.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/50 shadow-[0_0_15px_rgba(0,242,255,0.25)] ring-1 ring-cyan-400/50'
                        : 'border-cyan-500/20 bg-[#050210] hover:border-cyan-400/40 hover:bg-cyan-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-cyber text-xs font-bold text-cyan-100">{opt.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                    </div>
                    <div className={`h-2 rounded-full bg-gradient-to-r ${opt.previewBg} w-full opacity-80`} />
                    <p className="text-[10px] text-cyan-300/60 font-mono line-clamp-2">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: WORKSPACE MODE (Simple vs PRO) */}
        {onModeChange && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-cyber font-bold text-cyan-300">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>STUDIO CREATION MODE</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onModeChange('simple')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  mode === 'simple'
                    ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_12px_rgba(0,242,255,0.2)]'
                    : 'border-cyan-500/20 bg-[#050210] hover:border-cyan-400/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-cyber text-xs font-bold text-cyan-200">SIMPLE MODE</span>
                  {mode === 'simple' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-cyan-300/70 font-mono">
                  Clean, streamlined single-box generator focused on rapid HTML &amp; markdown publishing.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onModeChange('pro')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  mode === 'pro'
                    ? 'border-fuchsia-400 bg-fuchsia-950/40 shadow-[0_0_12px_rgba(217,70,239,0.3)]'
                    : 'border-cyan-500/20 bg-[#050210] hover:border-fuchsia-400/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-cyber text-xs font-bold text-fuchsia-200">PRO MODE</span>
                  {mode === 'pro' && <Check className="w-3.5 h-3.5 text-fuchsia-400" />}
                </div>
                <p className="text-[11px] text-fuchsia-300/70 font-mono">
                  Full studio suite with templates, live lock inspector, and developer toolchains.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-cyan-500/20 mt-1">
          <div className="text-[10px] font-mono text-cyan-400/50">
            Bitty Box System v2.0 &bull; Dev Mode Passcode protected
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-mono text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-200 border border-cyan-500/40 hover:border-cyan-300 transition-all cursor-pointer shadow-inner"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
