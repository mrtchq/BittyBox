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
  ExternalLink,
  Clock,
  Gauge,
  Coins,
  Cpu,
  Workflow,
  History,
  Users,
  Flame,
  CheckCheck
} from 'lucide-react';

interface ProPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  paywallFeature: string | null;
  onUnlockLifetime: (key?: string) => { success: boolean; message: string };
  onSwitchToPro?: () => void;
}

// Official Checkout Links
const PRO_MONTHLY_CHECKOUT_URL = 'https://creem.io/product/prod_3dVHhedrXPaGmitx9VecS3';
const PRO_ANNUAL_CHECKOUT_URL = 'https://creem.io/product/prod_3dVHhedrXPaGmitx9VecS3?interval=annual';

export const ProPaywallModal: React.FC<ProPaywallModalProps> = ({
  isOpen,
  onClose,
  isPro,
  paywallFeature,
  onUnlockLifetime,
}) => {
  const [activeTab, setActiveTab] = useState<'tiers' | 'credits' | 'key'>('tiers');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [licenseInput, setLicenseInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

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
    const url = billingCycle === 'annual' ? PRO_ANNUAL_CHECKOUT_URL : PRO_MONTHLY_CHECKOUT_URL;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const CREDIT_LOCK_COSTS = [
    {
      name: 'Passcode Lock',
      cost: '5 Credits',
      desc: '1-8 digit numeric PIN with AES-256 client encryption',
      icon: <Key className="w-3.5 h-3.5 text-fuchsia-400" />,
    },
    {
      name: 'Time-Based Locks',
      cost: '10 Credits',
      desc: 'Expires Duration, Time Until Open, or Date Range Schedule',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      name: 'Reveal + Decay',
      cost: '10 Credits',
      desc: 'Hybrid timed delay with automatic self-destruct',
      icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
    },
    {
      name: 'Visitor Quota',
      cost: '10 Credits',
      desc: 'Max opens / 1-open burn-on-read & visit caps',
      icon: <Gauge className="w-3.5 h-3.5 text-emerald-400" />,
    },
  ];

  const CREDIT_PACKS = [
    {
      id: 'pack_50',
      credits: 50,
      price: '$5',
      pricePerCredit: '$0.10 / CR',
      tag: 'STARTER PACK',
      popular: false,
      desc: 'Try PRO locks with no subscription required. Credits never expire.',
      checkoutUrl: 'https://creem.io/product/prod_6W2ZUtURJf1Mk02xaq6aJF',
    },
    {
      id: 'pack_150',
      credits: 150,
      price: '$12',
      pricePerCredit: '$0.08 / CR',
      tag: 'SAVE 20%',
      popular: true,
      desc: 'Ideal for creators & developers deploying secure micro-links.',
      checkoutUrl: 'https://creem.io/product/prod_1ybKpsP1FQPyKvVZUVSg0A',
    },
    {
      id: 'pack_400',
      credits: 400,
      price: '$25',
      pricePerCredit: '$0.06 / CR',
      tag: 'BEST VALUE (38% OFF)',
      popular: false,
      desc: 'Maximum flexibility for high-volume automated links and agent tools.',
      checkoutUrl: 'https://creem.io/product/prod_2qRxHcyee2IvOfAiIFKYw6',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Background Glow */}
      <div className="absolute w-[600px] h-[600px] bg-gradient-to-tr from-amber-600/15 via-purple-600/15 to-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-4xl bg-[#09041a]/95 border-2 border-amber-500/50 rounded-2xl p-5 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.25)] backdrop-blur-2xl overflow-y-auto max-h-[92vh] cyber-scrollbar text-cyan-100 font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:text-white hover:bg-amber-900/60 transition cursor-pointer z-20"
          aria-label="Close pricing modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-950/90 to-purple-950/90 border border-amber-500/60 text-amber-300 font-mono text-xs tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>BITTY BOX // PRICING &amp; PLANS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-cyber tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-amber-200 to-fuchsia-200">
            Simple, Transparent Pricing
          </h2>

          <p className="text-xs sm:text-sm text-cyan-200/80 font-mono max-w-xl mx-auto leading-relaxed">
            Create self-contained micro-webpages living 100% in a URL. Free forever with no locks, or unlock all advanced access controls with PRO.
          </p>
        </div>

        {/* Specific Paywalled Feature Alert */}
        {paywallFeature && (
          <div className="mb-5 p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center gap-3 text-xs font-mono text-amber-200 shadow-inner">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-cyan-300">{paywallFeature}</span> requires PRO membership or pay-as-you-go credits. Upgrade below for instant access.
            </div>
          </div>
        )}

        {/* Segmented Mode Navigation (Tiers | Credit Packs | Redeem Key) */}
        <div className="flex items-center justify-center gap-2 mb-6 border-b border-purple-500/20 pb-4">
          <div className="flex p-1 rounded-xl bg-[#04010f] border border-cyan-500/30 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('tiers')}
              className={`px-4 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'tiers'
                  ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'text-cyan-300 hover:text-white'
              }`}
            >
              MEMBERSHIP TIERS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('credits')}
              className={`px-4 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'credits'
                  ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(0,255,150,0.4)]'
                  : 'text-emerald-400 hover:text-emerald-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>CREDIT PACKS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('key')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'key'
                  ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(189,0,255,0.4)]'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <Key className="w-3 h-3" />
              <span>REDEEM KEY</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            VIEW 1: MEMBERSHIP TIERS (FREE / PRO / ULTRA)
           ========================================================================= */}
        {activeTab === 'tiers' && (
          <div className="space-y-6 font-mono">
            {/* Monthly / Annual Billing Toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-400'}`}>
                Monthly Billing
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                className="w-12 h-6 rounded-full bg-[#04010f] border border-amber-500/50 p-0.5 transition-colors cursor-pointer relative"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-amber-400 shadow-md transition-transform duration-200 ${
                    billingCycle === 'annual' ? 'translate-x-6 bg-emerald-400' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-emerald-300' : 'text-zinc-400'}`}>
                  Annual Billing
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                  SAVE 27%
                </span>
              </div>
            </div>

            {/* 3-Tier Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* TIER 1: FREE */}
              <div className="p-5 rounded-xl bg-[#060214] border border-cyan-500/30 flex flex-col justify-between space-y-4 hover:border-cyan-400/60 transition shadow-inner">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      FREE TIER
                    </span>
                    <span className="text-[10px] text-cyan-400/60 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      STARTER
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-3xl font-black font-cyber text-white">$0</div>
                    <div className="text-[11px] text-cyan-300/70 mt-0.5">Free forever &bull; No credit card</div>
                  </div>

                  <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                    Fall in love with Bitty Box’s core creation flow with zero friction.
                  </p>

                  <div className="space-y-2 mt-4 pt-3 border-t border-cyan-500/20 text-xs">
                    <div className="flex items-start gap-2 text-cyan-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Unlimited Bitty Boxes</span>
                    </div>
                    <div className="flex items-start gap-2 text-cyan-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Basic browser builder</span>
                    </div>
                    <div className="flex items-start gap-2 text-cyan-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Default themes</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-500">
                      <X className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                      <span>No access locks</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-500">
                      <X className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                      <span>No analytics telemetry</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-cyber hover:bg-cyan-900/60 transition cursor-pointer"
                >
                  STAY IN FREE
                </button>
              </div>

              {/* TIER 2: PRO (HERO / RECOMMENDED) */}
              <div className="p-5 rounded-xl bg-gradient-to-b from-[#14062e] via-[#09031c] to-[#050112] border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.3)] flex flex-col justify-between space-y-4 relative">
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-[9px] font-cyber font-extrabold px-3 py-0.5 rounded-full uppercase shadow-lg">
                  ⭐ RECOMMENDED
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      PRO TIER
                    </span>
                    <span className="text-[10px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
                      ALL LOCKS
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black font-cyber text-white">
                        {billingCycle === 'annual' ? '$79' : '$9'}
                      </span>
                      <span className="text-xs text-amber-200/80">
                        {billingCycle === 'annual' ? '/ year ($6.58/mo)' : '/ month'}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-300 mt-0.5">
                      {billingCycle === 'annual' ? '⚡ Billed annually (Save $29/yr)' : '⚡ Cancel anytime &bull; No contracts'}
                    </div>
                  </div>

                  <p className="text-xs text-amber-100/90 mt-2 leading-relaxed">
                    Full access to all advanced behavior control &amp; encryption locks.
                  </p>

                  <div className="space-y-2 mt-4 pt-3 border-t border-amber-500/30 text-xs">
                    <div className="flex items-start gap-2 text-amber-100 font-bold">
                      <CheckCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>Passcode Lock (Numeric PIN + AES-256)</span>
                    </div>
                    <div className="flex items-start gap-2 text-amber-100 font-bold">
                      <CheckCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>Time-Based Locks (Duration, Delay, Date Schedule)</span>
                    </div>
                    <div className="flex items-start gap-2 text-amber-100 font-bold">
                      <CheckCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>Reveal + Decay (Hybrid Timed Burn)</span>
                    </div>
                    <div className="flex items-start gap-2 text-amber-100 font-bold">
                      <CheckCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>Visitor Quota (Max Opens &amp; Burn on Read)</span>
                    </div>
                    <div className="flex items-start gap-2 text-cyan-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Premium Themes (Matrix Phosphor, Synthwave)</span>
                    </div>
                    <div className="flex items-start gap-2 text-cyan-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Basic analytics (views, unlock events)</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProCheckout}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black font-cyber font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:brightness-110 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-black fill-black" />
                  <span>UPGRADE TO PRO ({billingCycle === 'annual' ? '$79/YR' : '$9/MO'})</span>
                  <ExternalLink className="w-3.5 h-3.5 text-black" />
                </button>
              </div>

              {/* TIER 3: ULTRA (FUTURE TIER) */}
              <div className="p-5 rounded-xl bg-[#060214] border border-fuchsia-500/40 flex flex-col justify-between space-y-4 relative opacity-90 hover:opacity-100 transition">
                <div className="absolute -top-3 right-4 bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-400 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                  FUTURE TIER
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fuchsia-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
                      ULTRA TIER
                    </span>
                    <span className="text-[10px] text-fuchsia-300 bg-fuchsia-950/60 px-2 py-0.5 rounded border border-fuchsia-500/30">
                      CHAINS &amp; LOGIC
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black font-cyber text-white">
                        {billingCycle === 'annual' ? '$249' : '$29'}
                      </span>
                      <span className="text-xs text-fuchsia-200/80">
                        {billingCycle === 'annual' ? '/ year' : '/ month'}
                      </span>
                    </div>
                    <div className="text-[11px] text-fuchsia-300/70 mt-0.5">Agent-native workflow powerhouse</div>
                  </div>

                  <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                    Designed for automated chains, conditional branching &amp; team collaboration.
                  </p>

                  <div className="space-y-2 mt-4 pt-3 border-t border-fuchsia-500/20 text-xs">
                    <div className="flex items-start gap-2 text-fuchsia-200">
                      <Check className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 mt-0.5" />
                      <span>Multi-Box Chains &amp; Pipelines</span>
                    </div>
                    <div className="flex items-start gap-2 text-fuchsia-200">
                      <Check className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 mt-0.5" />
                      <span>Conditional logic &amp; dynamic routing</span>
                    </div>
                    <div className="flex items-start gap-2 text-fuchsia-200">
                      <Check className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 mt-0.5" />
                      <span>Identity-based OAuth / SAML access</span>
                    </div>
                    <div className="flex items-start gap-2 text-fuchsia-200">
                      <Check className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 mt-0.5" />
                      <span>Full version history snapshots</span>
                    </div>
                    <div className="flex items-start gap-2 text-fuchsia-200">
                      <Check className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 mt-0.5" />
                      <span>Team collaboration &amp; vaults</span>
                    </div>
                    <div className="flex items-start gap-2 text-fuchsia-200">
                      <Check className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 mt-0.5" />
                      <span>Autonomous AI Agent triggers</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-fuchsia-950/40 border border-fuchsia-500/30 text-center text-xs text-fuchsia-300 font-mono">
                  🚀 Planned Future Tier &bull; Coming Soon
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: CREDIT REFILL PACKS (PAY AS YOU GO)
           ========================================================================= */}
        {activeTab === 'credits' && (
          <div className="space-y-6 font-mono">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-[#071a17] to-cyan-950/60 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-cyber font-bold text-emerald-200 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>ADD-ON CREDITS (PAY-AS-YOU-GO)</span>
                </h3>
                <p className="text-xs text-emerald-300/80 mt-1 max-w-xl leading-relaxed">
                  Credits let FREE users try PRO locks without subscribing — and let PRO users occasionally use ULTRA features later. Credits never expire.
                </p>
              </div>
            </div>

            {/* Lock Credit Costs Reference Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                LOCK CREDIT COSTS PER GENERATION:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {CREDIT_LOCK_COSTS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#04010f] border border-cyan-500/25 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          {item.icon}
                          {item.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          {item.cost}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit Packs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {CREDIT_PACKS.map(pack => (
                <div
                  key={pack.id}
                  className={`p-5 rounded-xl flex flex-col justify-between space-y-4 transition ${
                    pack.popular
                      ? 'bg-gradient-to-b from-emerald-950/70 to-[#04010f] border-2 border-emerald-400 shadow-[0_0_25px_rgba(0,255,150,0.25)] relative'
                      : 'bg-[#060214] border border-cyan-500/30 hover:border-cyan-400/60'
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 right-4 bg-emerald-400 text-black text-[9px] font-cyber font-extrabold px-3 py-0.5 rounded-full uppercase shadow-md">
                      {pack.tag}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 uppercase">
                        {pack.credits} CREDITS
                      </span>
                      {!pack.popular && (
                        <span className="text-[9px] text-cyan-400/80 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                          {pack.tag}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-black font-cyber text-white">{pack.price}</span>
                      <span className="text-xs text-zinc-400 font-normal">one-time &bull; {pack.pricePerCredit}</span>
                    </div>

                    <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{pack.desc}</p>
                  </div>

                  <a
                    href={pack.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2.5 rounded-lg font-cyber font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      pack.popular
                        ? 'bg-emerald-400 text-black hover:brightness-110 shadow-[0_0_15px_rgba(0,255,150,0.4)]'
                        : 'bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 hover:bg-cyan-900/60'
                    }`}
                  >
                    <span>GET {pack.credits} CREDITS ({pack.price})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: REDEEM LICENSE KEY
           ========================================================================= */}
        {activeTab === 'key' && (
          <div className="max-w-md mx-auto py-6 space-y-4 font-mono">
            <div className="text-center space-y-1">
              <h3 className="text-base font-cyber font-bold text-purple-200 flex items-center justify-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                <span>ACTIVATE LICENSE KEY</span>
              </h3>
              <p className="text-xs text-purple-300/70">
                Purchased via Creem or received an official license key? Enter it below to unlock Bitty Box PRO instantly.
              </p>
            </div>

            <form onSubmit={handleRedeemKey} className="space-y-3">
              <input
                type="text"
                value={licenseInput}
                onChange={e => setLicenseInput(e.target.value)}
                placeholder="BITTY-PRO-XXXX-XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#04010f] border border-purple-500/50 text-cyan-100 placeholder-purple-600 text-xs font-mono focus:outline-none focus:border-cyan-400 text-center tracking-widest uppercase shadow-inner"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-500 text-white font-cyber font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(189,0,255,0.4)] hover:brightness-110 transition cursor-pointer"
              >
                ACTIVATE PRO ACCESS
              </button>
            </form>
          </div>
        )}

        {/* Feedback / Toast Message */}
        {feedbackMsg && (
          <div
            className={`mt-4 p-3 rounded-lg font-mono text-xs flex items-center gap-2 ${
              feedbackMsg.isError
                ? 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
            }`}
          >
            {feedbackMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

      </div>
    </div>
  );
};
