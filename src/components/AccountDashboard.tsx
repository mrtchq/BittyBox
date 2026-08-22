import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Key,
  Coins,
  History,
  Bot,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Plus,
  Shield,
  Clock,
  Flame,
  Zap,
  Lock,
  Sparkles,
  RefreshCw,
  LogOut,
  Terminal,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Info,
  Code,
  Layers,
  Search,
  SlidersHorizontal,
  Crown,
  Share2,
  QrCode,
  Mail,
  Send,
  Inbox,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Volume2,
  VolumeX,
  CheckCheck
} from "lucide-react";
import { BittyUser, ApiKeyMeta, TrackedBittyBox } from "../types";
import { UseAccountResult } from "../hooks/useAccount";
import { CyberScrambleText } from "./CyberScrambleText";
import { PrismCheckbox } from "./PrismCheckbox";
import { UserAvatar } from "./UserAvatar";

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

interface AccountDashboardProps {
  account: UseAccountResult;
  onNavigateToSlide01?: () => void;
  onOpenQr?: (url: string) => void;
}

export const AccountDashboard: React.FC<AccountDashboardProps> = ({
  account,
  onNavigateToSlide01,
  onOpenQr,
}) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    signInWithGoogle,
    login,
    register,
    logout,
    refreshUser,
    generateApiKey,
    revokeApiKey,
    testApiKey,
    purchaseCredits,
    deleteTrackedBox,
  } = account;

  // Navigation tab inside Account Dashboard
  const [activeTab, setActiveTab] = useState<"boxes" | "keys" | "credits" | "mcp">("boxes");

  // Auth form states (Google & Magic Link)
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [trustDeviceOnLogin, setTrustDeviceOnLogin] = useState<boolean>(() => {
    try {
      return localStorage.getItem("bitty_device_trusted") !== "false";
    } catch {
      return true;
    }
  });
  const [displayName, setDisplayName] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicSentEmail, setMagicSentEmail] = useState("");

  // Key creation state
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("My AI Agent Key");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["links:create", "links:read", "mcp:access"]);
  const [revealedKey, setRevealedKey] = useState<{ rawKey: string; key: ApiKeyMeta } | null>(null);
  const [isCopiedRawKey, setIsCopiedRawKey] = useState(false);

  // Key testing state
  const [testKeyInput, setTestKeyInput] = useState("");
  const [testKeyResult, setTestKeyResult] = useState<any>(null);
  const [isTestingKey, setIsTestingKey] = useState(false);

  // Box search & filter
  const [boxSearchQuery, setBoxSearchQuery] = useState("");
  const [copiedBoxId, setCopiedBoxId] = useState<string | null>(null);

  // Credit purchasing state
  const [purchasingPkg, setPurchasingPkg] = useState<string | null>(null);
  const [purchaseSuccessMsg, setPurchaseSuccessMsg] = useState<string | null>(null);

  // Canvas starfield background
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({
      x: (clientX / innerWidth) * 2 - 1,
      y: (clientY / innerHeight) * 2 - 1,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particleCount = 75;
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      size: number;
      color: string;
      speed: number;
    }> = [];

    const colors = ["#00f2ff", "#bd00ff", "#ffffff", "#00ff9d", "#ff0077"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 1000,
        size: Math.random() * 1.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 0.4 + 0.1,
      });
    }

    const render = () => {
      ctx.fillStyle = "rgba(3, 2, 14, 0.28)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.z -= p.speed;

        if (p.z <= 0) {
          p.z = 1000;
          p.x = (Math.random() - 0.5) * width * 2;
          p.y = (Math.random() - 0.5) * height * 2;
        }

        const fov = 400;
        const scale = fov / (fov + p.z);
        const sx = cx + (p.x + mousePos.x * 40) * scale;
        const sy = cy + (p.y + mousePos.y * 30) * scale;

        if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.7, p.size * scale), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [mousePos]);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setAuthMsg(null);
    try {
      const ok = await signInWithGoogle();
      if (!ok && account.error) {
        setAuthMsg(account.error);
      }
    } catch (err: any) {
      setAuthMsg(err.message || "Google sign-in encountered an issue.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Magic Link Submission
  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setAuthMsg("Please enter a valid email address.");
      return;
    }
    setAuthSubmitting(true);
    setAuthMsg(null);

    const res = await account.requestMagicLink(email.trim(), displayName.trim(), trustDeviceOnLogin);
    setAuthSubmitting(false);

    if (res.success) {
      setMagicLinkSent(true);
      setMagicSentEmail(email.trim());
    } else {
      setAuthMsg(res.error || "Failed to dispatch magic link. Please check your email.");
    }
  };

  // Handle Key Generation
  const handleGenerateKey = async () => {
    setIsCreatingKey(true);
    const created = await generateApiKey(newKeyLabel, newKeyScopes);
    setIsCreatingKey(false);
    if (created) {
      setRevealedKey(created);
      setNewKeyLabel("New Key");
    }
  };

  // Handle Key Copy
  const handleCopyRawKey = () => {
    if (revealedKey?.rawKey) {
      navigator.clipboard.writeText(revealedKey.rawKey);
      setIsCopiedRawKey(true);
      setTimeout(() => setIsCopiedRawKey(false), 2500);
    }
  };

  // Handle Box URL Copy
  const handleCopyBoxUrl = (box: TrackedBittyBox) => {
    navigator.clipboard.writeText(box.url);
    setCopiedBoxId(box.id);
    setTimeout(() => setCopiedBoxId(null), 2500);
  };

  // Handle Test Key
  const handleRunTestKey = async () => {
    if (!testKeyInput.trim()) return;
    setIsTestingKey(true);
    const res = await testApiKey(testKeyInput.trim());
    setTestKeyResult(res);
    setIsTestingKey(false);
  };

  // Handle Credit Refill
  const handleBuyCredits = async (packageId: string, amount: number, costCents: number) => {
    setPurchasingPkg(packageId);
    setPurchaseSuccessMsg(null);
    const success = await purchaseCredits(packageId, amount, costCents);
    setPurchasingPkg(null);
    if (success) {
      setPurchaseSuccessMsg(`Successfully added ${amount} Credits to your account!`);
      setTimeout(() => setPurchaseSuccessMsg(null), 4000);
    }
  };

  // Filtered Boxes
  const filteredBoxes = (user?.links || []).filter(box => {
    if (!boxSearchQuery.trim()) return true;
    const query = boxSearchQuery.toLowerCase();
    return (
      (box.title && box.title.toLowerCase().includes(query)) ||
      (box.format && box.format.toLowerCase().includes(query)) ||
      box.url.toLowerCase().includes(query)
    );
  });

  // =========================================================================
  // VIEW 1: NOT AUTHENTICATED -> STUDIO CYBER SIGN IN / REGISTER
  // =========================================================================
  if (!isAuthenticated || !user) {
    return (
      <div
        onMouseMove={handleMouseMove}
        className="relative min-h-[calc(100vh-4rem)] bg-[#03020e] text-cyan-100 font-sans py-8 px-4 sm:px-6 overflow-hidden flex items-center justify-center select-none"
      >
        {/* 3D Canvas Background */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

        {/* Cyber Vignette & Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(3,2,14,0.92)_100%)] pointer-events-none z-1" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none z-1" />

        <div className="w-full max-w-lg relative z-10">
          {/* Main Cyber Bento Login Card */}
          <div className="bg-[#08041c]/95 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,242,255,0.2)] font-mono relative overflow-hidden">
            {/* Bento Corner Accents */}
            <div className="bento-corner-accent top-l" />
            <div className="bento-corner-accent top-r" />
            <div className="bento-corner-accent bot-l" />
            <div className="bento-corner-accent bot-r" />

            {/* Cyber scanlines overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.35)_51%)] bg-[length:100%_4px] pointer-events-none opacity-25" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,242,255,0.12),transparent_70%)] pointer-events-none" />

            {/* Card Header Badge */}
            <div className="text-center space-y-2 mb-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 font-mono text-[10px] tracking-widest shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>BITTY BOX // QUANTUM AUTH TERMINAL</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-cyber text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-teal-200 to-fuchsia-200 tracking-wide mt-2">
                <CyberScrambleText text="AUTHENTICATE IDENTITY" speed={20} />
              </h2>

              <p className="text-xs text-cyan-300/80 max-w-sm mx-auto leading-relaxed">
                Sign in to manage your credits balance, tracked Bitty Boxes, API keys, and autonomous AI Agent tools.
              </p>
            </div>

            {/* 100 Credits Allotment Rule Banner */}
            <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-cyan-500/20 border-2 border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] relative overflow-hidden z-10 animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-400/20 border border-amber-400/70 text-amber-300 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                  <Coins className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-cyber font-bold text-xs text-amber-200 tracking-wider">
                      ONE-TIME ALLOTMENT: 100 FREE CREDITS
                    </span>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-gradient-to-r from-amber-400 to-amber-300 text-black font-extrabold shadow-sm">
                      GOOGLE SIGN-IN ONLY
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100/90 font-mono mt-1 leading-relaxed">
                    To be eligible for the <strong className="text-amber-300 font-bold">100 free credits</strong> allotment for new accounts, you must use <strong className="text-cyan-300 font-bold">"Continue with Google"</strong> below. <span className="text-rose-300 font-semibold">No credits are issued if you use magic link.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Google Sign In Button */}
            <div className="mb-5 relative z-10">
              <button
                id="google-signin-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || authSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-sans font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#0d1c30] via-[#10243d] to-[#0c1c2e] hover:from-[#132845] hover:to-[#173254] border-2 border-cyan-400/70 hover:border-cyan-300 active:scale-[0.99] transition-all duration-200 shadow-[0_0_30px_rgba(0,242,255,0.3)] cursor-pointer disabled:opacity-50 flex items-center justify-between group"
              >
                {googleLoading ? (
                  <div className="flex items-center justify-center gap-2 w-full">
                    <RefreshCw className="w-4 h-4 text-cyan-300 animate-spin" />
                    <span className="font-mono text-xs text-cyan-200">AUTHENTICATING WITH GOOGLE...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-md p-1 group-hover:scale-105 transition-transform">
                        <GoogleIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-100 group-hover:text-white font-mono tracking-wide">
                        CONTINUE WITH GOOGLE
                      </span>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/50 px-2 py-0.5 rounded-full">
                      🎁 +100 CREDITS
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Visual Divider */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400/60">
                OR PASSWORDLESS EMAIL (0 CREDITS)
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            </div>

            {/* Magic Link Disclaimer Banner */}
            <div className="mb-4 p-2.5 rounded-xl bg-[#050414] border border-cyan-500/30 text-[11px] font-mono text-cyan-200/80 flex items-start gap-2 relative z-10">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <span className="text-cyan-300 font-bold">Magic Link Notice:</span> Accounts created via Magic Link start with <strong className="text-rose-300">0 credits</strong>. Sign in with Google above to receive your 100 free credits.
              </p>
            </div>

            {magicLinkSent ? (
              <div className="p-6 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-center space-y-4 animate-in zoom-in-95 duration-200 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(0,242,255,0.4)]">
                  <Mail className="w-7 h-7 text-cyan-300 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-cyber text-base font-bold text-white tracking-wide">
                    <CyberScrambleText text="TRANSMISSION DISPATCHED" speed={20} />
                  </h3>
                  <p className="text-xs text-cyan-200 font-mono mt-1.5 break-all">
                    Sent to: <span className="font-bold text-cyan-300">{magicSentEmail}</span>
                  </p>
                  <p className="text-[11px] text-cyan-300/70 mt-2 leading-relaxed">
                    Check your email inbox and click the magic link to instantly access your account.
                    The link is single-use and valid for 15 minutes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setAuthMsg(null);
                  }}
                  className="w-full py-2.5 rounded-xl border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-900/40 transition cursor-pointer"
                >
                  SEND TO A DIFFERENT EMAIL
                </button>
              </div>
            ) : (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                    YOUR EMAIL ADDRESS:
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="developer@yourdomain.com"
                      className="w-full bg-[#02010c] border border-cyan-500/40 rounded-xl pl-9 pr-3 py-2.5 text-xs text-cyan-100 placeholder:text-cyan-600 outline-none focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(0,242,255,0.3)] transition font-mono shadow-inner"
                    />
                    <Mail className="w-4 h-4 text-cyan-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                    CALLSIGN / DISPLAY NAME (OPTIONAL):
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Cypher_01, Alex Developer"
                    className="w-full bg-[#02010c] border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-xs text-cyan-100 placeholder:text-cyan-600 outline-none focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(0,242,255,0.3)] transition font-mono shadow-inner"
                  />
                </div>

                {authMsg && (
                  <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{authMsg}</span>
                  </div>
                )}

                <div className="py-1">
                  <PrismCheckbox
                    checked={trustDeviceOnLogin}
                    onChange={(checked) => {
                      setTrustDeviceOnLogin(checked);
                      try {
                        localStorage.setItem("bitty_device_trusted", String(checked));
                      } catch {}
                    }}
                    label="Trust this device for 30 days"
                    description="Stay signed in without having to re-authenticate on this device."
                  />
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3 rounded-xl font-cyber font-bold text-xs tracking-wider text-black bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:brightness-110 active:scale-[0.99] transition shadow-[0_0_25px_rgba(0,242,255,0.4)] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {authSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>DISPATCHING MAGIC LINK...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>SEND MAGIC SIGN-IN LINK</span>
                    </>
                  )}
                </button>
                <div className="text-[10px] text-cyan-400/60 text-center font-mono">
                  ⚡ Instant access via email • 0 starter credits (Sign in with Google for 100 CR)
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED -> COMPLETE STUDIO BENTO DASHBOARD
  // =========================================================================
  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-[calc(100vh-4rem)] bg-[#03020e] text-cyan-100 font-sans py-6 sm:py-8 px-3 sm:px-6 overflow-hidden select-none"
    >
      {/* 3D Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Cyber Vignette & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(3,2,14,0.92)_100%)] pointer-events-none z-1" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none z-1" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">

        {/* =========================================================================
            TOP PROFILE & SYSTEM TELEMETRY BENTO HEADER
           ========================================================================= */}
        <div className="bg-[#08041c]/95 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-2xl p-4 sm:p-6 shadow-[0_0_40px_rgba(0,242,255,0.18)] font-mono relative overflow-hidden">
          {/* Bento Corner Accents */}
          <div className="bento-corner-accent top-l" />
          <div className="bento-corner-accent top-r" />
          <div className="bento-corner-accent bot-l" />
          <div className="bento-corner-accent bot-r" />

          {/* Scanlines & Glow */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.35)_51%)] bg-[length:100%_4px] pointer-events-none opacity-25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,242,255,0.1),transparent_70%)] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4 mb-4 relative z-10">
            {/* User Details */}
            <div className="flex items-center gap-3.5">
              <UserAvatar
                user={user}
                size="xl"
                showStatusDot={true}
                isOnline={true}
                altText={user.displayName || user.email}
              />

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-cyber font-bold text-lg sm:text-xl text-cyan-200 flex items-center gap-2">
                    <CyberScrambleText text={user.displayName || "Bitty Builder"} speed={25} />
                  </h1>
                  <span className="text-[10px] uppercase font-mono font-bold bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 px-2 py-0.5 rounded shadow-sm">
                    {user.tier || "PRO BUILDER"}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400/60 hidden sm:inline">
                    ID: {user.id}
                  </span>
                </div>
                <div className="text-xs text-cyan-300/70 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{user.email}</span>
                  <span>•</span>
                  <span>Member since {new Date(user.joinedDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Create Box, Sign Out) */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              {onNavigateToSlide01 && (
                <button
                  type="button"
                  onClick={onNavigateToSlide01}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-cyan-500/20 border border-cyan-400/60 hover:border-cyan-300 text-cyan-100 hover:text-white text-xs font-cyber font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.25)] hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4 text-cyan-300" />
                  <span>LAUNCH STUDIO BUILDER</span>
                </button>
              )}
              <button
                type="button"
                onClick={logout}
                className="px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer hover:scale-105 active:scale-95"
                title="Sign out of this session"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">SIGN OUT</span>
              </button>
            </div>
          </div>

          {/* High-Level Stat Bento Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
            {/* Stat 1: Credits Balance */}
            <div className="p-3.5 rounded-xl bg-[#03010f] border border-cyan-500/30 flex flex-col justify-between relative group hover:border-cyan-400 transition shadow-inner">
              <div className="text-[10px] text-cyan-400/80 font-bold uppercase flex items-center justify-between">
                <span>CREDITS BALANCE</span>
                <Coins className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-cyber text-cyan-200 mt-1">
                {user.credits} <span className="text-xs font-mono text-cyan-400/60 font-normal">PTS</span>
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                {user.creditsUsedTotal} credits used total
              </div>
            </div>

            {/* Stat 2: Tracked Bitty Boxes */}
            <div className="p-3.5 rounded-xl bg-[#03010f] border border-fuchsia-500/30 flex flex-col justify-between relative group hover:border-fuchsia-400 transition shadow-inner">
              <div className="text-[10px] text-fuchsia-400/80 font-bold uppercase flex items-center justify-between">
                <span>TRACKED BOXES</span>
                <History className="w-3.5 h-3.5 text-fuchsia-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-cyber text-fuchsia-200 mt-1">
                {(user.links || []).length}
              </div>
              <div className="text-[10px] text-fuchsia-400/70 mt-0.5">
                Auto-saved upon generation
              </div>
            </div>

            {/* Stat 3: Active API Keys */}
            <div className="p-3.5 rounded-xl bg-[#03010f] border border-amber-500/30 flex flex-col justify-between relative group hover:border-amber-400 transition shadow-inner">
              <div className="text-[10px] text-amber-400/80 font-bold uppercase flex items-center justify-between">
                <span>ACTIVE API KEYS</span>
                <Key className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-cyber text-amber-200 mt-1">
                {(user.apiKeys || []).length}
              </div>
              <div className="text-[10px] text-amber-400/70 mt-0.5">
                REST & MCP server enabled
              </div>
            </div>

            {/* Stat 4: Programmatic Usage */}
            <div className="p-3.5 rounded-xl bg-[#03010f] border border-teal-500/30 flex flex-col justify-between relative group hover:border-teal-400 transition shadow-inner">
              <div className="text-[10px] text-teal-400/80 font-bold uppercase flex items-center justify-between">
                <span>MCP & API CALLS</span>
                <Bot className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-cyber text-teal-200 mt-1">
                {(user.creditsMcpUsed || 0) + (user.creditsApiUsed || 0)}
              </div>
              <div className="text-[10px] text-teal-400/70 mt-0.5">
                Autonomous AI Agent hits
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MAIN SEGMENTED TAB NAVIGATION (BOXES | API KEYS | CREDITS & BILLING | MCP)
           ========================================================================= */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#08041c]/95 border-2 border-cyan-500/30 rounded-2xl overflow-x-auto font-mono text-xs shadow-lg backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setActiveTab("boxes")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-cyber font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "boxes"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,242,255,0.45)]"
                : "text-cyan-300/70 hover:text-cyan-100 hover:bg-cyan-950/40"
            }`}
          >
            <History className="w-4 h-4" />
            <span>TRACKED BITTY BOXES ({(user.links || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("keys")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-cyber font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "keys"
                ? "bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.45)]"
                : "text-amber-300/70 hover:text-amber-100 hover:bg-amber-950/40"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API & AGENT KEYS ({(user.apiKeys || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("credits")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-cyber font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "credits"
                ? "bg-emerald-400 text-black shadow-[0_0_15px_rgba(0,255,150,0.45)]"
                : "text-emerald-300/70 hover:text-emerald-100 hover:bg-emerald-950/40"
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>CREDITS & PLANS ({user.credits})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mcp")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-cyber font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "mcp"
                ? "bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(189,0,255,0.45)]"
                : "text-fuchsia-300/70 hover:text-fuchsia-100 hover:bg-fuchsia-950/40"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>MCP SERVER CONFIG</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: TRACKED BITTY BOXES LOG
           ========================================================================= */}
        {activeTab === "boxes" && (
          <div className="bg-[#08041c]/95 backdrop-blur-2xl border-2 border-cyan-500/30 rounded-2xl p-5 sm:p-7 shadow-[0_0_35px_rgba(0,242,255,0.15)] font-mono space-y-4 relative overflow-hidden">
            {/* Bento Corner Accents */}
            <div className="bento-corner-accent top-l" />
            <div className="bento-corner-accent top-r" />
            <div className="bento-corner-accent bot-l" />
            <div className="bento-corner-accent bot-r" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-3 relative z-10">
              <div>
                <h2 className="text-base sm:text-lg font-cyber font-bold text-cyan-200 flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>DEDICATED ACCOUNT TRANSMISSION LOG</span>
                </h2>
                <p className="text-xs text-cyan-300/70 mt-0.5">
                  Bitty Boxes generated while signed in are automatically preserved here with 1-click sharing and metadata inspection.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-cyan-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={boxSearchQuery}
                  onChange={e => setBoxSearchQuery(e.target.value)}
                  placeholder="Filter by title / format..."
                  className="w-full bg-[#02010c] border border-cyan-500/40 rounded-xl pl-9 pr-3 py-2 text-xs text-cyan-100 placeholder:text-cyan-600 outline-none focus:border-cyan-300 focus:shadow-[0_0_12px_rgba(0,242,255,0.25)] transition shadow-inner"
                />
              </div>
            </div>

            {/* Boxes List */}
            {filteredBoxes.length === 0 ? (
              <div className="py-14 text-center text-cyan-400/60 space-y-3 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.25)]">
                  <History className="w-7 h-7 text-cyan-400 animate-pulse" />
                </div>
                <div className="text-sm font-cyber font-bold text-cyan-200">NO TRACKED BITTY BOXES FOUND</div>
                <p className="text-xs text-cyan-300/70 max-w-sm mx-auto">
                  {boxSearchQuery
                    ? "No boxes matched your search query."
                    : "Create a Bitty Box in the studio builder while logged in, and it will appear here automatically!"}
                </p>
                {onNavigateToSlide01 && (
                  <button
                    type="button"
                    onClick={onNavigateToSlide01}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-bold font-cyber hover:brightness-110 transition cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                  >
                    + CREATE YOUR FIRST BOX
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 relative z-10">
                {filteredBoxes.map(box => (
                  <div
                    key={box.id}
                    className="p-4 rounded-xl bg-[#03010b] border border-cyan-500/30 hover:border-cyan-400 transition flex flex-col justify-between gap-3 shadow-inner group relative"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs text-cyan-200 line-clamp-1 group-hover:text-white transition-colors">
                          {box.title || "Untitled Bitty Box"}
                        </div>
                        <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/50 text-cyan-300 shrink-0">
                          {box.format || "HTML"}
                        </span>
                      </div>

                      {/* URL Preview */}
                      <div className="text-[10px] text-cyan-400/70 font-mono truncate mt-2 bg-black/60 p-2 rounded-lg border border-cyan-500/20 select-all">
                        {box.url}
                      </div>

                      {/* Metadata row: Date, Size, Locks */}
                      <div className="flex items-center gap-2 mt-2.5 text-[10px] text-cyan-300/70 flex-wrap">
                        <span>{new Date(box.createdAt).toLocaleDateString()}</span>
                        {box.stats?.rawLength && (
                          <>
                            <span>•</span>
                            <span>{box.stats.rawLength} Bytes</span>
                          </>
                        )}
                        {box.locks?.password && (
                          <span className="inline-flex items-center gap-1 text-fuchsia-300 bg-fuchsia-950/80 border border-fuchsia-500/40 px-2 py-0.5 rounded">
                            <Lock className="w-3 h-3 text-fuchsia-400" /> Passcode (5 CR)
                          </span>
                        )}
                        {box.locks?.timeWindow && (
                          <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-amber-400" /> Time Lock (10 CR)
                          </span>
                        )}
                        {box.locks?.accessLimit && (
                          <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                            <Flame className="w-3 h-3 text-emerald-400" /> Visitor Quota (10 CR)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-1 pt-2.5 border-t border-cyan-500/20 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyBoxUrl(box)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-900 text-[10px] font-cyber font-bold flex items-center gap-1.5 transition cursor-pointer"
                          title="Copy full URL"
                        >
                          {copiedBoxId === box.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">COPIED</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-cyan-400" />
                              <span>COPY LINK</span>
                            </>
                          )}
                        </button>

                        <a
                          href={box.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-200 hover:bg-purple-900 text-[10px] font-cyber font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3 text-purple-400" />
                          <span>OPEN</span>
                        </a>

                        {onOpenQr && (
                          <button
                            type="button"
                            onClick={() => onOpenQr(box.url)}
                            className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-[10px] transition cursor-pointer"
                            title="Show QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteTrackedBox(box.id)}
                        className="p-1.5 rounded-lg text-cyan-400/50 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete from log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: API KEYS GENERATOR & MANAGEMENT
           ========================================================================= */}
        {activeTab === "keys" && (
          <div className="space-y-4 font-mono">
            {/* Key Reveal Dialog (if freshly generated) */}
            {revealedKey && (
              <div className="p-5 rounded-2xl bg-amber-950/90 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.35)] space-y-3 animate-in fade-in duration-300 relative overflow-hidden">
                <div className="flex items-center gap-2 text-amber-200 font-cyber font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                  <span>SAVE YOUR NEW API KEY SECURELY</span>
                </div>
                <p className="text-xs text-amber-300/80">
                  Please copy this key now. For your security, this secret token will never be shown again.
                </p>
                <div className="flex items-center gap-2 bg-black/90 p-3 rounded-xl border border-amber-500/50">
                  <code className="text-xs text-amber-200 font-mono break-all flex-1 select-all">
                    {revealedKey.rawKey}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyRawKey}
                    className="px-3.5 py-2 rounded-lg bg-amber-400 text-black font-cyber font-bold text-xs flex items-center gap-1.5 shrink-0 hover:bg-amber-300 transition cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  >
                    {isCopiedRawKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-black" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-black" />
                        <span>COPY KEY</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setRevealedKey(null)}
                    className="text-[11px] text-amber-300/80 hover:text-white underline cursor-pointer"
                  >
                    I have safely saved my secret token &rarr; Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Keys Table & Generator Card */}
            <div className="bg-[#08041c]/95 backdrop-blur-2xl border-2 border-amber-500/30 rounded-2xl p-5 sm:p-7 shadow-[0_0_35px_rgba(245,158,11,0.15)] space-y-4 relative overflow-hidden">
              {/* Bento Corner Accents */}
              <div className="bento-corner-accent top-l" />
              <div className="bento-corner-accent top-r" />
              <div className="bento-corner-accent bot-l" />
              <div className="bento-corner-accent bot-r" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3 relative z-10">
                <div>
                  <h2 className="text-base sm:text-lg font-cyber font-bold text-amber-200 flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>API & MCP ACCESS KEYS</span>
                  </h2>
                  <p className="text-xs text-amber-300/70 mt-0.5">
                    Generate developer keys to authenticate against the REST API and Streamable HTTP MCP Server.
                  </p>
                </div>

                {/* Generate New Key Inline Form */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newKeyLabel}
                    onChange={e => setNewKeyLabel(e.target.value)}
                    placeholder="Key Label (e.g. Claude MCP)"
                    className="bg-[#02010c] border border-amber-500/40 rounded-xl px-3.5 py-2 text-xs text-amber-100 placeholder:text-amber-600 outline-none focus:border-amber-300 transition w-48 shadow-inner"
                  />
                  <button
                    type="button"
                    disabled={isCreatingKey}
                    onClick={handleGenerateKey}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-black font-cyber font-bold text-xs hover:brightness-110 transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>GENERATE KEY</span>
                  </button>
                </div>
              </div>

              {/* Existing Keys List */}
              {(user.apiKeys || []).length === 0 ? (
                <div className="py-12 text-center text-amber-400/60 space-y-2 relative z-10">
                  <Key className="w-10 h-10 mx-auto text-amber-500/30" />
                  <div className="text-sm font-cyber font-bold text-amber-300">NO API KEYS GENERATED YET</div>
                  <p className="text-xs text-amber-400/70 max-w-sm mx-auto">
                    Create an API key above to connect Claude Desktop, Cursor, Antigravity, or your scripts to Bitty Box.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 relative z-10">
                  {(user.apiKeys || []).map(k => (
                    <div
                      key={k.id}
                      className="p-3.5 rounded-xl bg-[#03010b] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-amber-200">{k.label}</span>
                          <span className="text-[10px] text-amber-400/80 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded">
                            {k.prefix}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-300/70 mt-1.5 flex items-center gap-2 flex-wrap">
                          <span>Created {new Date(k.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{k.requestCount || 0} Requests</span>
                          {k.lastUsedAt && (
                            <>
                              <span>•</span>
                              <span>Last active {new Date(k.lastUsedAt).toLocaleDateString()}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="text-amber-300">Scopes: {(k.scopes || []).join(", ")}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => revokeApiKey(k.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900 text-[10px] font-cyber font-bold self-start sm:self-center transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>REVOKE</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Key Tester */}
            <div className="bg-[#08041c]/95 backdrop-blur-2xl border-2 border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-inner space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2 text-cyan-200 font-cyber font-bold text-sm">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>LIVE API KEY VALIDATOR</span>
              </div>
              <p className="text-xs text-cyan-300/70">
                Paste any Bitty Box API Key (`bb_live_...`) to test network connection, scope permissions, and linked account balance.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testKeyInput}
                  onChange={e => setTestKeyInput(e.target.value)}
                  placeholder="Paste bb_live_... key to test"
                  className="flex-1 bg-[#02010c] border border-cyan-500/40 rounded-xl px-3.5 py-2 text-xs text-cyan-100 placeholder:text-cyan-600 outline-none focus:border-cyan-300 transition shadow-inner"
                />
                <button
                  type="button"
                  disabled={isTestingKey || !testKeyInput.trim()}
                  onClick={handleRunTestKey}
                  className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-cyber font-bold text-xs hover:brightness-110 transition cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                >
                  {isTestingKey ? "TESTING..." : "TEST KEY"}
                </button>
              </div>

              {testKeyResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    testKeyResult.valid
                      ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                      : "bg-rose-950/70 border-rose-500/50 text-rose-200"
                  }`}
                >
                  {testKeyResult.valid ? (
                    <div className="space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>API KEY IS VALID & ACTIVE</span>
                      </div>
                      <div className="text-[11px] opacity-90">
                        Account: {testKeyResult.user?.displayName} ({testKeyResult.user?.email}) • Credits: {testKeyResult.user?.credits}
                      </div>
                      <div className="text-[10px] opacity-75">
                        Key Label: {testKeyResult.key?.label} • Scopes: {(testKeyResult.key?.scopes || []).join(", ")}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{testKeyResult.error || "Invalid or revoked API key"}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: CREDITS BALANCE & REFILL PACKAGES
           ========================================================================= */}
        {activeTab === "credits" && (
          <div className="space-y-4 font-mono">
            {purchaseSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,150,0.3)] animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{purchaseSuccessMsg}</span>
              </div>
            )}

            <div className="bg-[#08041c]/95 backdrop-blur-2xl border-2 border-emerald-500/30 rounded-2xl p-5 sm:p-7 shadow-[0_0_35px_rgba(0,255,150,0.15)] space-y-5 relative overflow-hidden">
              {/* Bento Corner Accents */}
              <div className="bento-corner-accent top-l" />
              <div className="bento-corner-accent top-r" />
              <div className="bento-corner-accent bot-l" />
              <div className="bento-corner-accent bot-r" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3 relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-cyber font-bold text-emerald-200 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <span>CREDITS BALANCE & USAGE METER</span>
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>CUSTOMER CREDITS ACCOUNT</span>
                    </span>
                  </div>
                  <p className="text-xs text-emerald-300/70 mt-1">
                    Credits are issued, incremented, and decremented across every generated Bitty Box, REST API creation, or MCP tool call.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-400/60 text-emerald-200 font-cyber font-bold text-sm shadow-[0_0_15px_rgba(0,255,150,0.3)]">
                    {user.credits} CREDITS AVAILABLE
                  </div>
                  {user.creemCreditAccountId && (
                    <div className="text-[10px] font-mono text-emerald-400/60">
                      Ledger ID: {user.creemCreditAccountId}
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                <div className="p-3.5 rounded-xl bg-[#03010b] border border-cyan-500/30 space-y-1">
                  <div className="text-[10px] text-cyan-400/80 font-bold uppercase">HUMAN BROWSER USAGE</div>
                  <div className="text-xl font-bold font-cyber text-cyan-200">
                    {user.creditsHumanUsed || 0}
                  </div>
                  <div className="text-[10px] text-cyan-400/60">Boxes generated via UI</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#03010b] border border-amber-500/30 space-y-1">
                  <div className="text-[10px] text-amber-400/80 font-bold uppercase">REST API CALLS</div>
                  <div className="text-xl font-bold font-cyber text-amber-200">
                    {user.creditsApiUsed || 0}
                  </div>
                  <div className="text-[10px] text-amber-400/60">Programmatic API endpoint hits</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#03010b] border border-fuchsia-500/30 space-y-1">
                  <div className="text-[10px] text-fuchsia-400/80 font-bold uppercase">MCP SERVER CALLS</div>
                  <div className="text-xl font-bold font-cyber text-fuchsia-200">
                    {user.creditsMcpUsed || 0}
                  </div>
                  <div className="text-[10px] text-fuchsia-400/60">Autonomous AI Agent Tool Invocations</div>
                </div>
              </div>

              {/* Membership Plans Overview */}
              <div className="space-y-3 pt-2 relative z-10">
                <div className="text-xs font-bold text-emerald-300 font-cyber flex items-center justify-between">
                  <span>MEMBERSHIP TIERS:</span>
                  <span className="text-[10px] text-amber-300/80">FREE &bull; PRO ($9/MO) &bull; ULTRA ($29/MO)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tier 1: FREE */}
                  <div className="p-4.5 rounded-xl bg-[#03010b] border border-cyan-500/30 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-200 font-cyber">FREE TIER</span>
                        <span className="text-[9px] font-mono bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/40">
                          $0 / FOREVER
                        </span>
                      </div>
                      <div className="text-xl font-extrabold font-cyber text-white mt-1">
                        UNLIMITED BOXES
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                        Unlimited Bitty Boxes, basic builder, and default themes with zero server storage.
                      </p>
                      <div className="mt-3 pt-2 border-t border-cyan-500/20 text-[10px] text-zinc-400 space-y-1">
                        <div>&bull; No access locks included</div>
                        <div>&bull; Use add-on credits for locks</div>
                      </div>
                    </div>
                    <div className="py-2 text-center text-[10px] text-cyan-400/80 bg-cyan-950/40 rounded-lg border border-cyan-500/30 font-mono">
                      CURRENT BASE ACCESS
                    </div>
                  </div>

                  {/* Tier 2: PRO */}
                  <div className="p-4.5 rounded-xl bg-gradient-to-b from-[#14062e] via-[#09031c] to-[#050112] border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] flex flex-col justify-between space-y-3 relative">
                    <div className="absolute -top-2.5 right-3 bg-amber-400 text-black text-[9px] font-cyber font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow-md">
                      ⭐ RECOMMENDED
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-200 font-cyber flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          BITTY BOX PRO
                        </span>
                        <span className="text-[9px] font-mono bg-amber-950 px-2 py-0.5 rounded text-amber-300 border border-amber-500/50">
                          $9/MO &bull; $79/YR
                        </span>
                      </div>
                      <div className="text-xl font-extrabold font-cyber text-white mt-1">
                        ALL CURRENT LOCKS
                      </div>
                      <p className="text-[11px] text-amber-100/90 mt-1 leading-relaxed">
                        Passcode (numeric), Time Locks (Duration, Delay, Date Schedule), Reveal + Decay, Visitor Quota, and premium themes.
                      </p>
                      <div className="mt-2 pt-2 border-t border-amber-500/30 text-[10px] text-amber-200/90 space-y-0.5">
                        <div className="text-emerald-300 font-bold">&bull; Unlimited lock generation with 0 credits</div>
                        <div>&bull; Basic views &amp; unlock event telemetry</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href="https://creem.io/product/prod_21AwXWmmf6vUmr7Z4JJ3sO"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black font-cyber font-bold text-[10px] tracking-wider flex items-center justify-center gap-1 transition shadow-sm hover:brightness-110"
                      >
                        <span className="line-through decoration-rose-600/80 mr-1">$17</span>
                        <span>$7 / MO</span>
                        <ExternalLink className="w-3 h-3 text-black" />
                      </a>
                      <a
                        href="https://creem.io/product/prod_21AwXWmmf6vUmr7Z4JJ3sO"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 rounded-lg bg-amber-950 border border-amber-400/60 text-amber-200 font-cyber font-bold text-[10px] tracking-wider flex items-center justify-center gap-1 transition hover:bg-amber-900"
                        title="Includes 1,000 monthly credits"
                      >
                        <span>1,000 CR/MO</span>
                        <ExternalLink className="w-3 h-3 text-amber-300" />
                      </a>
                    </div>
                  </div>

                  {/* Tier 3: ULTRA (FUTURE) */}
                  <div className="p-4.5 rounded-xl bg-[#03010b] border border-fuchsia-500/40 flex flex-col justify-between space-y-3 opacity-90 hover:opacity-100 transition">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-fuchsia-200 font-cyber flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
                          ULTRA TIER
                        </span>
                        <span className="text-[9px] font-mono bg-fuchsia-950 px-2 py-0.5 rounded text-fuchsia-300 border border-fuchsia-500/40">
                          $29/MO &bull; $249/YR
                        </span>
                      </div>
                      <div className="text-xl font-extrabold font-cyber text-fuchsia-300 mt-1">
                        CHAINS &amp; LOGIC
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                        Agent-native workflow powerhouse: multi-box chains, conditional logic, OAuth identity access, and agent triggers.
                      </p>
                      <div className="mt-2 pt-2 border-t border-fuchsia-500/20 text-[10px] text-fuchsia-300/70 space-y-0.5">
                        <div>&bull; Version history &amp; snapshots</div>
                        <div>&bull; Team collaboration &amp; vaults</div>
                      </div>
                    </div>

                    <div className="py-2 text-center text-[10px] text-fuchsia-300 font-mono bg-fuchsia-950/40 rounded-lg border border-fuchsia-500/30">
                      🚀 PLANNED FUTURE TIER
                    </div>
                  </div>
                </div>
              </div>

              {/* Lock Credit Costs Reference Bar */}
              <div className="p-4 rounded-xl bg-[#03010b] border border-cyan-500/30 space-y-2 relative z-10">
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                  <span>PAY-AS-YOU-GO LOCK CREDIT COSTS:</span>
                  <span className="text-[10px] text-emerald-400 font-bold">CREDITS NEVER EXPIRE</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/60 border border-cyan-500/25 flex items-center justify-between">
                    <span className="text-zinc-300 text-[11px]">Passcode (PIN)</span>
                    <span className="font-bold text-fuchsia-400">5 CR</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-cyan-500/25 flex items-center justify-between">
                    <span className="text-zinc-300 text-[11px]">Time-Based Locks</span>
                    <span className="font-bold text-amber-400">10 CR</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-cyan-500/25 flex items-center justify-between">
                    <span className="text-zinc-300 text-[11px]">Reveal + Decay</span>
                    <span className="font-bold text-rose-400">10 CR</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-cyan-500/25 flex items-center justify-between">
                    <span className="text-zinc-300 text-[11px]">Visitor Quota</span>
                    <span className="font-bold text-emerald-400">10 CR</span>
                  </div>
                </div>
              </div>

              {/* Credit Top-Up Packages */}
              <div className="space-y-3 pt-2 relative z-10">
                <div className="text-xs font-bold text-emerald-300 font-cyber">CREDIT REFILL PACKAGES:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Pack 1: 100 Credits */}
                  <div className="p-4.5 rounded-xl bg-[#03010b] border border-cyan-500/40 hover:border-cyan-300 transition flex flex-col justify-between space-y-3 shadow-inner">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-200 font-cyber flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-cyan-400" />
                          100 CREDITS
                        </span>
                        <span className="text-[10px] font-mono bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/40">
                          $1.00
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold font-cyber text-cyan-300 mt-2">
                        100 <span className="text-xs font-normal text-cyan-400/70 font-mono">CREDITS</span>
                      </div>
                      <p className="text-[11px] text-cyan-300/70 mt-1 leading-relaxed">
                        Trial top-up: $0.01 / credit. Test PRO access locks with almost no spend.
                      </p>
                    </div>

                    <a
                      href="https://creem.io/product/prod_RZv35BDis62xNpVbtwhZT"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-200 font-cyber font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
                    >
                      <span>BUY 100 CREDITS ($1)</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
                    </a>
                  </div>

                  {/* Pack 2: 500 Credits */}
                  <div className="p-4.5 rounded-xl bg-gradient-to-b from-emerald-950/40 to-[#03010b] border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(0,255,150,0.2)] flex flex-col justify-between space-y-3 relative">
                    <div className="absolute -top-2.5 right-3 bg-emerald-400 text-black text-[9px] font-cyber font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow-md">
                      POPULAR &bull; BEST VALUE
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-200 font-cyber flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-emerald-400" />
                          500 CREDITS
                        </span>
                        <span className="text-[10px] font-mono bg-emerald-950 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/40">
                          $5.00
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold font-cyber text-emerald-300 mt-2">
                        500 <span className="text-xs font-normal text-emerald-400/70 font-mono">CREDITS</span>
                      </div>
                      <p className="text-[11px] text-emerald-300/80 mt-1 leading-relaxed">
                        Creator top-up: $0.01 / credit. Ideal for secured &amp; scheduled micro-links.
                      </p>
                    </div>

                    <a
                      href="https://creem.io/product/prod_7TpN3lpNqR0lIcD6tRZNDM"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-emerald-400 text-black font-cyber font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition shadow-[0_0_15px_rgba(0,255,150,0.4)] hover:brightness-110 active:scale-[0.99]"
                    >
                      <span>BUY 500 CREDITS ($5)</span>
                      <ExternalLink className="w-3.5 h-3.5 text-black" />
                    </a>
                  </div>

                  {/* Pack 3: 2500 Credits */}
                  <div className="p-4.5 rounded-xl bg-[#03010b] border border-cyan-500/40 hover:border-cyan-300 transition flex flex-col justify-between space-y-3 shadow-inner">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-200 font-cyber flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-cyan-400" />
                          2,500 CREDITS
                        </span>
                        <span className="text-[10px] font-mono bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/40">
                          $10.00
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold font-cyber text-cyan-300 mt-2">
                        2,500 <span className="text-xs font-normal text-cyan-400/70 font-mono">CREDITS</span>
                      </div>
                      <p className="text-[11px] text-cyan-300/70 mt-1 leading-relaxed">
                        Pro power bundle: $0.004 / credit. Maximum volume for automated links &amp; agents.
                      </p>
                    </div>

                    <a
                      href="https://creem.io/product/prod_4qidrzVKMckokpFYgp8NM4"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-200 font-cyber font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
                    >
                      <span>BUY 2,500 CREDITS ($10)</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Transactions Log */}
              <div className="space-y-2 pt-3 border-t border-emerald-500/20 relative z-10">
                <div className="text-xs font-bold text-emerald-300 font-cyber">CREDIT TRANSACTION HISTORY:</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(user.transactions || []).map(t => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-lg bg-[#02010c] border border-emerald-500/20 text-[11px] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[9px] uppercase ${
                            t.type === "purchase"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                              : "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                          }`}
                        >
                          {t.type}
                        </span>
                        <span className="text-emerald-100">{t.description}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-emerald-400/70 shrink-0">
                        <span className="font-bold text-emerald-300">+{t.amount} PTS</span>
                        <span>•</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: MCP SERVER CONFIGURATION
           ========================================================================= */}
        {activeTab === "mcp" && (
          <div className="bg-[#08041c]/95 backdrop-blur-2xl border-2 border-fuchsia-500/30 rounded-2xl p-5 sm:p-7 shadow-[0_0_35px_rgba(189,0,255,0.15)] font-mono space-y-4 relative overflow-hidden">
            {/* Bento Corner Accents */}
            <div className="bento-corner-accent top-l" />
            <div className="bento-corner-accent top-r" />
            <div className="bento-corner-accent bot-l" />
            <div className="bento-corner-accent bot-r" />

            <div className="border-b border-fuchsia-500/20 pb-3 relative z-10">
              <h2 className="text-base sm:text-lg font-cyber font-bold text-fuchsia-200 flex items-center gap-2">
                <Bot className="w-4 h-4 text-fuchsia-400" />
                <span>MODEL CONTEXT PROTOCOL (MCP) INTEGRATION</span>
              </h2>
              <p className="text-xs text-fuchsia-300/70 mt-0.5">
                Connect Claude Desktop, Cursor, Antigravity, and AI Agents to Bitty Box via Streamable HTTP.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/70 border border-fuchsia-500/30 space-y-2 relative z-10">
              <div className="text-xs font-bold text-fuchsia-300 font-cyber">MCP SERVER ENDPOINT:</div>
              <div className="flex items-center gap-2 bg-[#02010c] p-2.5 rounded-xl border border-fuchsia-500/20">
                <code className="text-xs text-cyan-200 font-mono flex-1 select-all">
                  https://bittybox.org/mcp
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText("https://bittybox.org/mcp")}
                  className="px-3 py-1.5 rounded-lg bg-fuchsia-950 border border-fuchsia-500/40 text-fuchsia-200 text-[10px] font-bold font-cyber hover:bg-fuchsia-900 cursor-pointer transition"
                >
                  COPY URL
                </button>
              </div>
            </div>

            {/* Claude Desktop Config Snippet */}
            <div className="p-4 rounded-xl bg-black/70 border border-fuchsia-500/30 space-y-2 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fuchsia-300 font-cyber">CLAUDE DESKTOP CONFIG:</span>
                <span className="text-[10px] text-fuchsia-400/60">claude_desktop_config.json</span>
              </div>
              <pre className="text-[11px] text-cyan-200 bg-[#02010c] p-3.5 rounded-xl border border-fuchsia-500/20 overflow-x-auto select-all leading-5">
{`{
  "mcpServers": {
    "bittybox": {
      "url": "https://bittybox.org/mcp",
      "headers": {
        "Authorization": "Bearer ${user.apiKeys?.[0]?.prefix ? "YOUR_API_KEY" : "YOUR_API_KEY"}"
      }
    }
  }
}`}
              </pre>
            </div>

            {/* Available MCP Tools */}
            <div className="space-y-2 pt-2 relative z-10">
              <div className="text-xs font-bold text-fuchsia-300 font-cyber">EXPOSED MCP TOOLS:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#02010c] border border-fuchsia-500/25 space-y-1.5">
                  <div className="font-bold font-cyber text-cyan-200">create_bitty_link</div>
                  <div className="text-[10px] text-fuchsia-300/70 leading-relaxed">
                    Creates universal compressed browser links for any HTML, markdown, code, or data with optional passcode and time locks.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#02010c] border border-fuchsia-500/25 space-y-1.5">
                  <div className="font-bold font-cyber text-cyan-200">create_code_bitty_link</div>
                  <div className="text-[10px] text-fuchsia-300/70 leading-relaxed">
                    Creates syntax-highlighted code viewers with line numbers, copy actions, and custom themes.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
