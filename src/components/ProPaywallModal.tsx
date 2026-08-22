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
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface ProPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  paywallFeature: string | null;
  onUnlockLifetime: (key?: string) => { success: boolean; message: string };
  onSwitchToPro?: () => void;
}

const PRO_CHECKOUT_URL = 'https://creem.io/product/prod_3dVHhedrXPaGmitx9VecS3';

export const ProPaywallModal: React.FC<ProPaywallModalProps> = ({
  isOpen,
  onClose,
  isPro,
  paywallFeature,
  onUnlockLifetime,
}) => {
  const [licenseInput, setLicenseInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);

  if (!isOpen) return null;

  const handleRedeemKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInput.trim()) {
      setFeedbackMsg({ text: 'Please enter a valid license key or activation code.', isError: true });
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

  const handleProCheckout = () => {
    window.open(PRO_CHECKOUT_URL, '_blank', 'noopener,noreferrer');
  };

  const PRO_FEATURES = [
    {
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      title: '10,000 Monthly Builder Credits',
      desc: 'Automatic monthly allowance for human box creation, API calls, and MCP agent tool execution',
    },
    {
      icon: <Shield className="w-4 h-4 text-fuchsia-400" />,
      title: 'AES-256 Client-Side Encryption',
      desc: 'Lock confidential micro-apps with military-grade zero-knowledge client cryptography',
    },
    {
      icon: <Lock className="w-4 h-4 text-emerald-400" />,
      title: 'Time Window & Quota Access Locks',
      desc: 'Create burn-on-read boxes, strict visit limits, and auto-expiring countdown URLs',
    },
    {
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      title: 'Multi-Session Tabs & Workspaces',
      desc: 'Keep multiple live drafts open simultaneously with persistent state',
    },
    {
      icon: <LayoutGrid className="w-4 h-4 text-amber-400" />,
      title: 'Full Template Library & Lab',
      desc: 'Instant starter blueprints for portfolios, terminals, 3D canvases, and interactive tools',
    },
    {
      icon: <FolderArchive className="w-4 h-4 text-purple-400" />,
      title: 'Portable ZIP Archive Exporter',
      desc: 'One-click portable static zip export for offline hosting anywhere',
    },
    {
      icon: <Palette className="w-4 h-4 text-rose-400" />,
      title: 'All Cyber Workspace Themes',
      desc: 'Synthwave, Matrix Phosphor, and Minimalist Monochrome workspace styling',
    },
    {
      icon: <QrCode className="w-4 h-4 text-teal-400" />,
      title: 'Priority MCP Server & API Access',
      desc: 'Full programmatic tool invocation via https://bittybox.org/mcp',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-amber-600/20 via-purple-600/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#09041a]/95 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.25)] backdrop-blur-2xl overflow-y-auto max-h-[90vh] cyber-scrollbar text-cyan-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:text-white hover:bg-amber-900/60 transition cursor-pointer"
          aria-label="Close PRO upgrade modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-950/90 to-purple-950/90 border border-amber-500/60 text-amber-300 font-mono text-xs tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>BITTY BOX PRO // MONTHLY MEMBERSHIP</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-cyber tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-amber-200 to-fuchsia-200">
            Upgrade to Bitty Box PRO
          </h2>

          <p className="text-xs sm:text-sm text-cyan-200/80 font-mono max-w-lg mx-auto leading-relaxed">
            Unlock 2,500 monthly credits, client-side encryption, time locks, visit quotas, and priority MCP server agent access.
          </p>
        </div>

        {/* Specific Paywalled Feature Alert */}
        {paywallFeature && (
          <div className="mb-6 p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center gap-3 text-xs font-mono text-amber-200 shadow-inner">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-cyan-300">{paywallFeature}</span> is a PRO feature. Upgrade below for instant access.
            </div>
          </div>
        )}

        {/* Pricing Banner */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-950/70 via-purple-950/70 to-cyan-950/70 border border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="text-left">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <span>MEMBERSHIP PLAN</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded border border-amber-400/40">
                PRO BUILDER
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-cyber text-white">$25</span>
              <span className="text-xs text-amber-200/80">/ month &bull; cancel anytime</span>
            </div>
            <div className="text-[11px] text-cyan-300/80 mt-0.5">
              Includes 10,000 monthly credits &amp; secure Merchant of Record billing.
            </div>
          </div>

          <button
            onClick={handleProCheckout}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black font-cyber font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:brightness-110 hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
          >
            <span>SUBSCRIBE TO PRO</span>
            <ExternalLink className="w-3.5 h-3.5 text-black" />
          </button>
        </div>

        {/* Feature List Grid */}
        <div className="mb-6 space-y-2.5">
          <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>ALL PRO FEATURES INCLUDED:</span>
            <span className="text-[10px] text-amber-300/80">10,000 CREDITS/MO</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRO_FEATURES.map((feat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#070316]/80 border border-purple-500/30 hover:border-amber-500/50 transition flex items-start gap-3"
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

        {/* Primary Action Button */}
        <div className="space-y-3">
          <button
            onClick={handleProCheckout}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-fuchsia-600 to-cyan-500 text-white font-mono font-bold text-sm tracking-wider flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.7)] hover:scale-[1.01] active:scale-95 transition-all duration-200 group cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>UPGRADE TO BITTY BOX PRO &bull; $25 / MO</span>
            <Sparkles className="w-4 h-4 text-cyan-200 group-hover:rotate-45 transition-transform" />
          </button>

          {/* Key Redeem Form */}
          {!showKeyInput ? (
            <div className="flex items-center justify-between text-xs font-mono text-purple-300/70 pt-1">
              <button
                type="button"
                onClick={() => setShowKeyInput(true)}
                className="hover:text-cyan-300 underline flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Have a PRO license key?</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="hover:text-cyan-300 cursor-pointer"
              >
                Stay in Free Mode &rarr;
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
                className="px-4 py-2 rounded-lg bg-amber-900/80 border border-amber-500/50 hover:bg-amber-800 text-amber-200 text-xs font-mono font-bold tracking-wider cursor-pointer"
              >
                REDEEM
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
