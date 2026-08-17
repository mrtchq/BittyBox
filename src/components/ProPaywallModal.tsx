import React, { useState } from 'react';
import {
  Crown,
  Lock,
  Zap,
  Check,
  X,
  Sparkles,
  Shield,
  Layers,
  LayoutGrid,
  Search,
  FolderArchive,
  Palette,
  QrCode,
  ArrowRight,
  RefreshCw,
  Key,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TrialTimeRemaining } from '../hooks/useProStatus';

interface ProPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  isLifetimePro: boolean;
  isTrialActive: boolean;
  trialTimeRemaining: TrialTimeRemaining;
  paywallFeature: string | null;
  onUnlockLifetime: (key?: string) => { success: boolean; message: string };
  onResetTrial: () => void;
  onExpireTrialForDemo: () => void;
  onSwitchToPro: () => void;
}

export const ProPaywallModal: React.FC<ProPaywallModalProps> = ({
  isOpen,
  onClose,
  isPro,
  isLifetimePro,
  isTrialActive,
  trialTimeRemaining,
  paywallFeature,
  onUnlockLifetime,
  onResetTrial,
  onExpireTrialForDemo,
  onSwitchToPro,
}) => {
  const [licenseInput, setLicenseInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);

  if (!isOpen) return null;

  const handleRedeemKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInput.trim()) {
      setFeedbackMsg({ text: 'Please enter a license key or activation code.', isError: true });
      return;
    }
    const result = onUnlockLifetime(licenseInput);
    if (result.success) {
      setFeedbackMsg({ text: result.message, isError: false });
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      setFeedbackMsg({ text: result.message, isError: true });
    }
  };

  const handleInstantUnlock = () => {
    const result = onUnlockLifetime('PRO-LIFETIME');
    if (result.success) {
      setFeedbackMsg({ text: '🎉 Lifetime PRO Activated Successfully!', isError: false });
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const PRO_FEATURES = [
    {
      icon: <Shield className="w-4 h-4 text-fuchsia-400" />,
      title: 'AES-256 Client-Side Encryption',
      desc: 'Lock confidential micro-apps with military-grade client cryptography',
    },
    {
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      title: 'Multi-Session Tabs & Workspaces',
      desc: 'Keep multiple live drafts open simultaneously with tabbed state',
    },
    {
      icon: <LayoutGrid className="w-4 h-4 text-cyan-400" />,
      title: 'Full Template Library & Lab',
      desc: 'Instant starter blueprints for portfolios, terminals, 3D canvases, and forms',
    },
    {
      icon: <Search className="w-4 h-4 text-amber-400" />,
      title: 'SEO & OpenGraph Social Graph Scanner',
      desc: 'Live metadata preview analyzer with Google, Twitter, & Discord simulation',
    },
    {
      icon: <FolderArchive className="w-4 h-4 text-purple-400" />,
      title: 'ZIP Package Archive Exporter',
      desc: 'One-click portable static zip export for offline hosting anywhere',
    },
    {
      icon: <Palette className="w-4 h-4 text-rose-400" />,
      title: 'All Cyber Workspace Themes',
      desc: 'Synthwave, Matrix Phosphor, and Minimalist Monochrome styling',
    },
    {
      icon: <QrCode className="w-4 h-4 text-teal-400" />,
      title: 'High-Density QR Code Transmitter',
      desc: 'Instant beam to mobile devices with direct URL fragment encoding',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-fuchsia-600/20 via-purple-600/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#09041a]/95 border-2 border-fuchsia-500/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(189,0,255,0.35)] backdrop-blur-2xl overflow-y-auto max-h-[90vh] cyber-scrollbar text-cyan-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-fuchsia-950/60 border border-fuchsia-500/40 text-fuchsia-300 hover:text-white hover:bg-fuchsia-900/60 transition"
          aria-label="Close PRO paywall"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-950/90 to-purple-950/90 border border-fuchsia-500/60 text-fuchsia-300 font-mono text-xs tracking-widest shadow-[0_0_15px_rgba(189,0,255,0.4)]">
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>BITTYBOX PRO // SYSTEM UPGRADE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-cyber tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-fuchsia-200 to-amber-200">
            Unlock the Full Power of Bitty Box
          </h2>

          <p className="text-xs sm:text-sm text-cyan-200/80 font-mono max-w-lg mx-auto leading-relaxed">
            Simple mode handles core HTML-to-URL generation. Upgrade to PRO to unlock advanced security, multi-session tabs, templates, and developer tooling.
          </p>
        </div>

        {/* Specific Paywalled Feature Alert (if triggered by a specific control) */}
        {paywallFeature && (
          <div className="mb-6 p-3 rounded-xl bg-fuchsia-950/60 border border-fuchsia-500/50 flex items-center gap-3 text-xs font-mono text-fuchsia-200 shadow-inner">
            <Lock className="w-4 h-4 text-fuchsia-400 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-amber-300">{paywallFeature}</span> is a PRO feature.
              {isTrialActive ? ' You have an active 24-hour trial available!' : ' Upgrade to lifetime access to use it.'}
            </div>
          </div>
        )}

        {/* 24-Hour Free Trial Status Card */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 via-purple-950/60 to-fuchsia-950/60 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,242,255,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(0,242,255,0.3)]">
              <Clock className="w-5 h-5 text-cyan-300 animate-spin-slow" />
            </div>
            <div className="text-left">
              <div className="text-xs font-mono font-bold text-cyan-200 flex items-center gap-2">
                <span>NEW USER 24-HOUR PASS</span>
                {isTrialActive ? (
                  <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 text-[10px] border border-emerald-500/50 rounded font-bold">
                    ACTIVE
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 bg-rose-950 text-rose-300 text-[10px] border border-rose-500/50 rounded font-bold">
                    EXPIRED
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-cyan-400/80">
                {isLifetimePro ? (
                  <span className="text-amber-300 font-bold">👑 Lifetime PRO Unlocked (Permanent Access)</span>
                ) : isTrialActive ? (
                  <span>Trial Time Remaining: <strong className="text-cyan-200">{trialTimeRemaining.formatted}</strong></span>
                ) : (
                  <span className="text-rose-300">Your initial 24h free pass has expired. Upgrade below to restore PRO features.</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Trial Switch or Reset Action */}
          {isTrialActive && !isLifetimePro && (
            <button
              onClick={() => {
                onSwitchToPro();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.6)] hover:bg-cyan-400 hover:scale-105 active:scale-95 transition"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>ENABLE PRO MODE</span>
            </button>
          )}
        </div>

        {/* Feature List Grid */}
        <div className="mb-6 space-y-2.5">
          <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>PRO CAPABILITIES INCLUDE:</span>
            <span className="text-[10px] text-fuchsia-300/70">ALL UNLOCKED IN PRO</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRO_FEATURES.map((feat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#070316]/80 border border-purple-500/30 hover:border-fuchsia-500/50 transition flex items-start gap-3"
              >
                <div className="p-1.5 rounded-md bg-purple-950/70 border border-purple-500/40 shrink-0">
                  {feat.icon}
                </div>
                <div className="text-left">
                  <div className="text-xs font-mono font-bold text-cyan-200">
                    {feat.title}
                  </div>
                  <div className="text-[10px] text-purple-200/70 font-mono leading-tight mt-0.5">
                    {feat.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback / Toast Message */}
        {feedbackMsg && (
          <div
            className={`mb-4 p-3 rounded-lg font-mono text-xs flex items-center gap-2 ${
              feedbackMsg.isError
                ? 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
            }`}
          >
            {feedbackMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Primary Unlock Actions */}
        <div className="space-y-3">
          {/* Lifetime Pro Unlock Button */}
          <button
            onClick={handleInstantUnlock}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 text-white font-mono font-bold text-sm tracking-wider flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(189,0,255,0.5)] hover:shadow-[0_0_40px_rgba(189,0,255,0.8)] hover:scale-[1.01] active:scale-95 transition-all duration-200 group"
          >
            <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>UNLOCK BITTYBOX PRO LIFETIME &bull; $19</span>
            <Sparkles className="w-4 h-4 text-cyan-200 group-hover:rotate-45 transition-transform" />
          </button>

          {/* Key Redeem Toggle / Form */}
          {!showKeyInput ? (
            <div className="flex items-center justify-between text-xs font-mono text-purple-300/70 pt-1">
              <button
                type="button"
                onClick={() => setShowKeyInput(true)}
                className="hover:text-cyan-300 underline flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Have a license key or access pass?</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="hover:text-cyan-300"
              >
                Stay in Simple Mode &rarr;
              </button>
            </div>
          ) : (
            <form onSubmit={handleRedeemKey} className="flex gap-2 pt-1 animate-in fade-in duration-150">
              <input
                type="text"
                value={licenseInput}
                onChange={e => setLicenseInput(e.target.value)}
                placeholder="Enter License Key (e.g. BITTY-PRO-2026)"
                className="flex-1 px-3 py-2 rounded-lg bg-[#04010f] border border-cyan-500/40 text-cyan-100 placeholder-cyan-600 text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-fuchsia-900/80 border border-fuchsia-500/50 hover:bg-fuchsia-800 text-fuchsia-200 text-xs font-mono font-bold tracking-wider"
              >
                REDEEM
              </button>
            </form>
          )}

          {/* Test & Demo Toolbar (Reset 24h Trial / Expire Trial) */}
          <div className="pt-4 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-purple-400/60">
            <span>TRIAL CONTROLS:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetTrial();
                  setFeedbackMsg({ text: '⚡ 24-Hour Free PRO Trial has been refreshed!', isError: false });
                }}
                className="hover:text-cyan-300 flex items-center gap-1 underline"
                title="Reset 24h Trial Timer for testing"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset 24h Pass</span>
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => {
                  onExpireTrialForDemo();
                  setFeedbackMsg({ text: '🔒 Trial expired (Simulated for testing free tier paywall).', isError: true });
                }}
                className="hover:text-rose-400 flex items-center gap-1 underline"
                title="Expire Trial immediately to test paywall"
              >
                <Lock className="w-3 h-3" />
                <span>Simulate Expired Trial</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
