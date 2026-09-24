import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Lock,
  Clock,
  Flame,
  Radio,
  FileCode,
  Layers,
  Copy,
  ExternalLink,
  QrCode,
  Download,
  Check,
  Zap,
  ArrowRight,
  Shield,
  Coins,
  RefreshCw,
  Eye,
  Sliders,
  Play
} from 'lucide-react';
import type { BittyMetadata, BittyChainDraft, AppView } from '../types';
import type { UseAccountResult } from '../hooks/useAccount';
import { compressContentSync } from '../utils/bittyEngine';

export interface LuxuryEditorCarouselProps {
  content: string;
  onChangeContent: (content: string) => void;
  metadata: BittyMetadata;
  onChangeMetadata: (metadata: BittyMetadata) => void;
  bittyUrl: string;
  onGenerate: () => Promise<void> | void;
  isGenerating?: boolean;
  originalBytes?: number;
  compressedBytes?: number;
  // Chain props
  chainEnabled?: boolean;
  chainIndex?: number;
  chainTotal?: number;
  chainMax?: number;
  chainDraft?: BittyChainDraft | null;
  isLastChainBox?: boolean;
  onToggleChain?: (enabled: boolean) => void;
  onCreateNextChainPage?: (mode: 'clone' | 'scratch') => void;
  onGoToChainPage?: (index: number) => void;
  onDeleteLastChainBox?: () => void;
  onDeleteChainPage?: (index: number) => void;
  // User & Modals
  account?: UseAccountResult;
  isPro?: boolean;
  onOpenPaywall?: (featureName?: string) => void;
  onOpenQr?: () => void;
  onOpenTemplates?: () => void;
  onExportZip?: () => void;
  onShare?: () => void;
  onNewBox?: () => void;
  onNavigateView?: (view: AppView) => void;
}

const STEPS = [
  { id: 'signal', name: 'SIGNAL', cta: 'Begin composing', back: false },
  { id: 'compose', name: 'COMPOSE', cta: 'Configure vault', back: true },
  { id: 'vault', name: 'VAULT', cta: 'Configure chain', back: true },
  { id: 'chain', name: 'CHAIN', cta: 'Seal & generate', back: true },
  { id: 'seal', name: 'SEAL', cta: 'Copy Bitty Link', back: true },
];

const STARTER_PRESETS: { label: string; title: string; code: string; icon: string }[] = [
  {
    label: 'Interactive App',
    title: 'Pulse Counter',
    icon: '⚡',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pulse Counter</title>
  <style>
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: radial-gradient(circle at center, #1b0a14 0%, #06070a 100%);
      color: #faf7f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .card {
      background: rgba(18, 21, 29, 0.85); border: 1px solid rgba(225, 29, 72, 0.4);
      padding: 32px 40px; border-radius: 24px; text-align: center;
      box-shadow: 0 0 40px rgba(201, 24, 59, 0.35); backdrop-filter: blur(16px);
    }
    h1 { margin: 0 0 8px; font-size: 26px; color: #faf7f2; letter-spacing: 0.04em; }
    p { margin: 0 0 24px; color: #ded2bd; font-size: 14px; }
    .val { font-size: 64px; font-weight: 800; color: #e11d48; margin-bottom: 24px; font-variant-numeric: tabular-nums; text-shadow: 0 0 24px rgba(225, 29, 72, 0.6); }
    button {
      background: linear-gradient(135deg, #c9183b, #8a0e23); color: #faf7f2;
      border: 1px solid rgba(250, 247, 242, 0.3); padding: 14px 32px;
      font-size: 16px; font-weight: 700; border-radius: 999px; cursor: pointer;
      box-shadow: 0 0 20px rgba(201, 24, 59, 0.5); transition: transform 0.15s ease;
    }
    button:active { transform: scale(0.95); }
  </style>
</head>
<body>
  <div class="card">
    <h1>Velvet Pulse</h1>
    <p>Zero backend • Compressed in URL</p>
    <div class="val" id="count">0</div>
    <button onclick="document.getElementById('count').textContent = ++c">PULSE</button>
  </div>
  <script>let c = 0;</script>
</body>
</html>`
  },
  {
    label: 'Markdown Doc',
    title: 'Secret Dispatch',
    icon: '📜',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Secret Dispatch</title>
  <style>
    body {
      margin: 0; padding: 40px 20px; min-height: 100vh;
      background: #06070a; color: #ede4d3; font-family: Georgia, serif;
      line-height: 1.7; display: flex; justify-content: center;
    }
    article { max-width: 600px; width: 100%; }
    h1 { font-size: 32px; color: #faf7f2; border-bottom: 1px solid rgba(223, 194, 145, 0.25); padding-bottom: 12px; margin-bottom: 24px; }
    p { font-size: 17px; color: #ded2bd; margin-bottom: 20px; }
    blockquote {
      margin: 24px 0; padding: 12px 20px; border-left: 3px solid #e11d48;
      background: rgba(201, 24, 59, 0.08); font-style: italic; color: #faf7f2;
    }
  </style>
</head>
<body>
  <article>
    <h1>The Sovereign Ledger</h1>
    <p>This message was encoded without touching a server database. It exists only as a compressed fragment in the browser address bar.</p>
    <blockquote>"The future of software is stateless, serverless, and self-contained."</blockquote>
    <p>Everything you need is preserved here with client-side verification.</p>
  </article>
</body>
</html>`
  },
  {
    label: 'Blank Slate',
    title: 'New Bitty Box',
    icon: '✨',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bitty Box</title>
  <style>
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: #06070a; color: #faf7f2; font-family: sans-serif;
    }
    .box {
      border: 1px solid rgba(246, 241, 230, 0.15); padding: 32px; border-radius: 16px;
      background: rgba(18, 21, 29, 0.7); text-align: center;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>📦 Bitty Box</h1>
    <p>Craft your application here.</p>
  </div>
</body>
</html>`
  }
];

export const LuxuryEditorCarousel: React.FC<LuxuryEditorCarouselProps> = ({
  content,
  onChangeContent,
  metadata,
  onChangeMetadata,
  bittyUrl,
  onGenerate,
  isGenerating = false,
  originalBytes = 0,
  compressedBytes = 0,
  chainEnabled = false,
  chainIndex = 0,
  chainTotal = 1,
  chainMax = 8,
  chainDraft = null,
  isLastChainBox = true,
  onToggleChain,
  onCreateNextChainPage,
  onGoToChainPage,
  onDeleteLastChainBox,
  account,
  isPro = false,
  onOpenPaywall,
  onOpenQr,
  onOpenTemplates,
  onExportZip,
  onShare,
  onNewBox,
  onNavigateView
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'desktop' | 'mobile'>('mobile');

  // Vault form state
  const [passwordEnabled, setPasswordEnabled] = useState<boolean>(Boolean(metadata.password));
  const [passwordVal, setPasswordVal] = useState<string>(metadata.password || '');
  const [timeLockEnabled, setTimeLockEnabled] = useState<boolean>(Boolean(metadata.lockConfig?.timeWindow?.enabled));
  const [timeMode, setTimeMode] = useState<'expiry' | 'delay'>('expiry');
  const [timeHours, setTimeHours] = useState<number>(24);
  const [accessLimitEnabled, setAccessLimitEnabled] = useState<boolean>(Boolean(metadata.lockConfig?.openLimit?.enabled));
  const [maxOpens, setMaxOpens] = useState<number>(metadata.lockConfig?.openLimit?.maxOpens || 1);
  const [deadmanEnabled, setDeadmanEnabled] = useState<boolean>(Boolean(metadata.lockConfig?.deadmanSwitch?.enabled));
  const [deadmanInterval, setDeadmanInterval] = useState<number>(metadata.lockConfig?.deadmanSwitch?.intervalMinutes || 10080);
  const [deadmanEmail, setDeadmanEmail] = useState<string>(metadata.lockConfig?.deadmanSwitch?.recipientEmail || '');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackRef = useRef<HTMLElement | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 2800);
  };

  // Stardust Canvas particle physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const mouse = { x: -1000, y: -1000, radius: 110 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    const colors = [
      'rgba(250, 247, 242, ',
      'rgba(244, 238, 227, ',
      'rgba(223, 194, 145, ',
      'rgba(225, 29, 72, ',
      'rgba(201, 24, 59, '
    ];

    class StardustParticle {
      x = Math.random() * width;
      y = Math.random() * height;
      size = Math.random() * 2 + 0.6;
      speedY = -(Math.random() * 0.35 + 0.1);
      speedX = (Math.random() - 0.5) * 0.22;
      colorBase = colors[Math.floor(Math.random() * colors.length)];
      maxAlpha = Math.random() * 0.5 + 0.2;
      currentAlpha = this.maxAlpha;
      pulse = Math.random() * Math.PI;
      pulseSpeed = Math.random() * 0.028 + 0.01;

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 8;
        this.size = Math.random() * 2 + 0.6;
        this.speedY = -(Math.random() * 0.35 + 0.1);
        this.speedX = (Math.random() - 0.5) * 0.22;
        this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        this.maxAlpha = Math.random() * 0.5 + 0.2;
        this.currentAlpha = this.maxAlpha;
        this.pulse = Math.random() * Math.PI;
        this.pulseSpeed = Math.random() * 0.028 + 0.01;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.pulse) * 0.18;
        this.pulse += this.pulseSpeed;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = 1 - dist / mouse.radius;
          this.x -= (dx / dist) * force * 1.4;
          this.y -= (dy / dist) * force * 1.4;
          this.currentAlpha = Math.min(1, this.maxAlpha + force * 0.45);
        } else {
          this.currentAlpha = this.maxAlpha * (0.6 + 0.4 * Math.sin(this.pulse));
        }

        if (this.y < -10 || this.x < -10 || this.x > width + 10) {
          this.reset(false);
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.colorBase + this.currentAlpha + ')';
        ctx.shadowBlur = this.size > 1.8 ? 8 : 4;
        ctx.shadowColor = this.colorBase + '0.7)';
        ctx.fill();
      }
    }

    const particles: StardustParticle[] = [];
    const count = 55;
    for (let i = 0; i < count; i++) {
      particles.push(new StardustParticle());
    }

    let isRunning = true;
    const loop = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      requestAnimationFrame(loop);
    };
    loop();

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Sync scroll on carousel track
  const scrollToStep = useCallback((stepIdx: number, smooth = true) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(STEPS.length - 1, stepIdx));
    setCurrentStep(clamped);
    const targetLeft = clamped * track.clientWidth;
    track.scrollTo({ left: targetLeft, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const handleTrackScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth <= 0) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    if (idx !== currentStep && idx >= 0 && idx < STEPS.length) {
      setCurrentStep(idx);
    }
  };

  // Touch swipe support
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, button, a, select')) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX > 40 && absX > absY * 1.15 && dt < 800) {
      if (dx < 0 && currentStep < STEPS.length - 1) {
        scrollToStep(currentStep + 1);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      } else if (dx > 0 && currentStep > 0) {
        scrollToStep(currentStep - 1);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight' && currentStep < STEPS.length - 1) {
        scrollToStep(currentStep + 1);
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        scrollToStep(currentStep - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, scrollToStep]);

  // Synchronize Vault form modifications with parent metadata
  const applyVaultToMetadata = () => {
    const nextLocks: Record<string, any> = { ...(metadata.lockConfig || {}) };

    if (timeLockEnabled) {
      nextLocks.timeWindow = {
        enabled: true,
        mode: timeMode,
        expiryHours: timeMode === 'expiry' ? timeHours : 0,
        delayHours: timeMode === 'delay' ? timeHours : 0,
        showCountdown: true
      };
    } else {
      delete nextLocks.timeWindow;
    }

    if (accessLimitEnabled) {
      nextLocks.openLimit = {
        enabled: true,
        maxOpens: maxOpens,
        showRemainingCount: true
      };
    } else {
      delete nextLocks.openLimit;
    }

    if (deadmanEnabled) {
      nextLocks.deadmanSwitch = {
        enabled: true,
        switchId: metadata.lockConfig?.deadmanSwitch?.switchId || `dms_${Date.now()}`,
        intervalMinutes: deadmanInterval,
        recipientEmail: deadmanEmail.trim() || undefined
      };
    } else {
      delete nextLocks.deadmanSwitch;
    }

    onChangeMetadata({
      ...metadata,
      password: passwordEnabled && passwordVal.trim() ? passwordVal.trim() : undefined,
      lockConfig: Object.keys(nextLocks).length > 0 ? nextLocks : undefined
    });
  };

  // Primary Action Button Handler
  const handlePrimaryClick = async () => {
    if (currentStep === 0) {
      scrollToStep(1);
    } else if (currentStep === 1) {
      applyVaultToMetadata();
      scrollToStep(2);
    } else if (currentStep === 2) {
      applyVaultToMetadata();
      scrollToStep(3);
    } else if (currentStep === 3) {
      applyVaultToMetadata();
      if (onGenerate) {
        await onGenerate();
      }
      scrollToStep(4);
    } else if (currentStep === 4) {
      // Copy Bitty Link
      if (bittyUrl) {
        try {
          await navigator.clipboard.writeText(bittyUrl);
          showNotification('Bitty Link copied to clipboard!');
        } catch {
          showNotification('Link ready: check address bar');
        }
      } else if (onGenerate) {
        await onGenerate();
        showNotification('Box generated successfully!');
      }
    }
  };

  // Real-time byte calculation
  const currentByteCount = new Blob([content]).size;
  const estimatedCompressed = Math.max(1, Math.round(currentByteCount * 0.38));
  const savingsPct = currentByteCount > 0 ? Math.round((1 - estimatedCompressed / currentByteCount) * 100) : 0;

  return (
    <div className="dms-app" data-step={currentStep}>
      {/* Interactive Stardust Particle Physics Canvas */}
      <canvas ref={canvasRef} className="luxury-canvas" aria-hidden="true" />

      {/* Ambient Depth Layers */}
      <div className="dms-ambient" aria-hidden="true">
        <div className="dms-aurora dms-aurora-a" />
        <div className="dms-aurora dms-aurora-b" />
        <div className="dms-aurora dms-aurora-c" />
        <div className="dms-grid" />
        <div className="dms-grain" />
        <div className="dms-scan" />
        <div className="dms-vignette" />
      </div>

      {/* Haute Horlogerie Rail (Header) */}
      <header className="dms-rail">
        <div className="dms-rail-head">
          <a href="/" className="dms-brand" aria-label="BITTYBOX Home">
            <img
              className="dms-brand-logo"
              src="/bittybox-header-mark.png?v=20260924-logo-1"
              alt="Bitty Box"
              width={26}
              height={26}
            />
            <span className="dms-brand-title">
              <b>BITTYBOX</b>
              <small>EDITOR</small>
            </span>
            <span className="dms-brand-dot" aria-hidden="true" />
          </a>

          <div className="dms-rail-actions">
            {onOpenTemplates && (
              <button type="button" className="dms-rail-btn" onClick={onOpenTemplates} title="Browse Templates">
                <Sparkles size={12} className="text-[#dfc291]" />
                <span className="hidden sm:inline">Templates</span>
              </button>
            )}
            {onNewBox && (
              <button type="button" className="dms-rail-btn" onClick={onNewBox} title="New Clean Box">
                <FileCode size={12} />
                <span className="hidden sm:inline">New</span>
              </button>
            )}
            {onNavigateView && (
              <button
                type="button"
                className="dms-rail-btn"
                onClick={() => onNavigateView('account')}
                title="Account Settings"
              >
                <Shield size={12} />
                <span className="hidden sm:inline">Account</span>
              </button>
            )}
          </div>

          <span className="dms-stepname">{STEPS[currentStep].name}</span>
        </div>

        {/* Tappable Segmented Progress Bar */}
        <nav className="dms-progress" aria-label="Editor Stages">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              className={`dms-seg ${idx < currentStep ? 'is-past' : ''} ${idx === currentStep ? 'is-active' : ''}`}
              onClick={() => scrollToStep(idx)}
              aria-label={`Step ${idx + 1}: ${s.name}`}
            >
              <i />
            </button>
          ))}
        </nav>
      </header>

      {/* Horizontal Snap Track (Carousel Panes) */}
      <main
        ref={trackRef}
        className="dms-track"
        onScroll={handleTrackScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        tabIndex={-1}
      >
        {/* ── 00 · SIGNAL / ATELIER INTRO ─────────────────────────────────── */}
        <section className={`dms-pane ${currentStep === 0 ? 'is-live' : ''}`} data-pane="signal">
          <div className="dms-pane-body dms-center">
            <div className="dms-pulse" aria-hidden="true">
              <span className="dms-pulse-ring" />
              <span className="dms-pulse-ring dms-d2" />
              <span className="dms-pulse-ring dms-d3" />
              <svg className="dms-ecg" viewBox="0 0 240 64" preserveAspectRatio="none">
                <path className="dms-ecg-line" d="M0 32 H44 l7 -22 l9 44 l8 -30 l6 8 H240" />
              </svg>
              <span className="dms-pulse-core" />
            </div>

            <p className="dms-kicker dms-reveal" data-r="0">BITTY BOX · ATELIER</p>
            <h1 className="dms-display dms-reveal" data-r="1">
              The Instant Box<br /><em>Atelier</em>
            </h1>
            <p className="dms-lead dms-reveal" data-r="2">
              Zero backend. Zero database. Encoded entirely into the compressed URL fragment and decoded in pure client memory.
            </p>

            <ul className="dms-stats dms-reveal" data-r="3">
              <li><b>0 KB</b><span>Database</span></li>
              <li><b>100%</b><span>In-Memory</span></li>
              <li><b>AES-256</b><span>Encrypted</span></li>
            </ul>

            <div className="w-full flex flex-col items-center gap-2 mt-2 dms-reveal" data-r="4">
              <p className="dms-hint-top">QUICK START PRESET</p>
              <div className="dms-chips dms-chips-center">
                {STARTER_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="dms-chip"
                    onClick={() => {
                      onChangeContent(p.code);
                      onChangeMetadata({ ...metadata, title: p.title, favicon: p.icon });
                      showNotification(`Loaded ${p.label} template`);
                      scrollToStep(1);
                    }}
                  >
                    <span>{p.icon} {p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="dms-swipecue dms-reveal" data-r="5" aria-hidden="true">
              <span>Swipe through the creation stages</span>
              <i className="dms-swipe-arrow" />
            </p>
          </div>
        </section>

        {/* ── 01 · COMPOSE / CODE CHAMBER ─────────────────────────────────── */}
        <section className={`dms-pane ${currentStep === 1 ? 'is-live' : ''}`} data-pane="compose">
          <div className="dms-pane-body">
            <p className="dms-kicker dms-reveal" data-r="0">01 — COMPOSE</p>
            <h2 className="dms-h2 dms-reveal" data-r="1">What goes inside the box?</h2>
            <p className="dms-help dms-reveal" data-r="2">
              Name your creation, assign a symbol, and author your HTML, CSS, or script.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 dms-reveal" data-r="3">
              <div className="sm:col-span-3 dms-field">
                <label htmlFor="edTitle">NAME THIS BOX</label>
                <input
                  id="edTitle"
                  className="dms-input"
                  type="text"
                  value={metadata.title}
                  onChange={(e) => onChangeMetadata({ ...metadata, title: e.target.value })}
                  placeholder="My Luxury Creation"
                />
              </div>
              <div className="sm:col-span-1 dms-field">
                <label htmlFor="edFavicon">SYMBOL</label>
                <input
                  id="edFavicon"
                  className="dms-input text-center text-xl"
                  type="text"
                  maxLength={4}
                  value={metadata.favicon || '📦'}
                  onChange={(e) => onChangeMetadata({ ...metadata, favicon: e.target.value })}
                />
              </div>
            </div>

            <div className="dms-field dms-reveal" data-r="4">
              <div className="dms-code-chamber">
                <div className="dms-code-head">
                  <div className="flex items-center gap-2">
                    <span className="dms-cardlabel m-0">SOURCE CODE</span>
                    <span className="dms-byte-pill">{currentByteCount} BYTES</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="dms-chip text-[11px] py-1 px-2.5 min-h-[30px]"
                      onClick={() => onChangeContent('<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>' + (metadata.title || 'Bitty Box') + '</title>\n</head>\n<body>\n  \n</body>\n</html>')}
                      title="Insert HTML5 Boilerplate"
                    >
                      +HTML5
                    </button>
                    <button
                      type="button"
                      className="dms-chip text-[11px] py-1 px-2.5 min-h-[30px]"
                      onClick={() => onChangeContent(content + '\n<style>\n  body { background: #06070a; color: #faf7f2; }\n</style>')}
                      title="Insert Style Block"
                    >
                      +CSS
                    </button>
                    <button
                      type="button"
                      className="dms-chip text-[11px] py-1 px-2.5 min-h-[30px]"
                      onClick={() => onChangeContent(content + '\n<script>\n  console.log("Bitty Box running in memory");\n</script>')}
                      title="Insert Script Block"
                    >
                      +JS
                    </button>
                  </div>
                </div>

                <textarea
                  id="edContent"
                  className="dms-input dms-textarea w-full font-mono text-sm leading-relaxed border-0 rounded-none bg-transparent p-4 min-h-[260px]"
                  value={content}
                  onChange={(e) => onChangeContent(e.target.value)}
                  placeholder="<!-- Author your raw HTML, CSS, and JS here -->"
                  spellCheck="false"
                  autoCapitalize="off"
                />
              </div>
              <div className="dms-row dms-between mt-2">
                <p className="dms-hint">Runs sandboxed in memory with zero backend dependencies.</p>
                <p className="dms-count">~{estimatedCompressed} B compressed ({savingsPct}% savings)</p>
              </div>
            </div>

            <div className="dms-field dms-reveal" data-r="5">
              <label htmlFor="edDesc">DESCRIPTION <span className="dms-opt">optional</span></label>
              <input
                id="edDesc"
                className="dms-input"
                type="text"
                value={metadata.description || ''}
                onChange={(e) => onChangeMetadata({ ...metadata, description: e.target.value })}
                placeholder="A short note explaining what this box does"
              />
            </div>
          </div>
        </section>

        {/* ── 02 · VAULT / SECURITY POLICIES ───────────────────────────────── */}
        <section className={`dms-pane ${currentStep === 2 ? 'is-live' : ''}`} data-pane="vault">
          <div className="dms-pane-body">
            <p className="dms-kicker dms-reveal" data-r="0">02 — VAULT</p>
            <h2 className="dms-h2 dms-reveal" data-r="1">Arm your security policy</h2>
            <p className="dms-help dms-reveal" data-r="2">
              Protect your payload behind client-side cryptography, time gates, or burn limits.
            </p>

            {/* Password Lock */}
            <div className="dms-card dms-card-interactive dms-reveal" data-r="3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#181e2b] border border-[rgba(246,241,230,0.15)] flex items-center justify-center text-[#dfc291]">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-[#faf7f2] m-0">Password Lock</h4>
                    <p className="text-xs text-[#b8ab96] m-0">Client-side AES-256-GCM encryption</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="dms-switch"
                  role="switch"
                  aria-checked={passwordEnabled}
                  style={{ width: 'auto', padding: '6px 10px' }}
                  onClick={() => setPasswordEnabled(!passwordEnabled)}
                >
                  <span className="dms-switch-track"><i /></span>
                </button>
              </div>

              {passwordEnabled && (
                <div className="mt-4 pt-3 border-t border-[rgba(246,241,230,0.08)] flex flex-col gap-2">
                  <label htmlFor="edPassword" className="dms-cardlabel">PIN OR PASSPHRASE</label>
                  <input
                    id="edPassword"
                    className="dms-input"
                    type="password"
                    value={passwordVal}
                    onChange={(e) => setPasswordVal(e.target.value)}
                    placeholder="Enter secret passphrase (min 8 chars)"
                  />
                  <p className="dms-hint">Content will be fully encrypted; zero plaintext will exist in the URL.</p>
                </div>
              )}
            </div>

            {/* Time Lock */}
            <div className="dms-card dms-card-interactive dms-reveal" data-r="4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#181e2b] border border-[rgba(246,241,230,0.15)] flex items-center justify-center text-[#e11d48]">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-[#faf7f2] m-0">Time Lock</h4>
                    <p className="text-xs text-[#b8ab96] m-0">Self-destruct expiry or delayed reveal</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="dms-switch"
                  role="switch"
                  aria-checked={timeLockEnabled}
                  style={{ width: 'auto', padding: '6px 10px' }}
                  onClick={() => setTimeLockEnabled(!timeLockEnabled)}
                >
                  <span className="dms-switch-track"><i /></span>
                </button>
              </div>

              {timeLockEnabled && (
                <div className="mt-4 pt-3 border-t border-[rgba(246,241,230,0.08)] flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`dms-chip flex-1 ${timeMode === 'expiry' ? 'dms-on' : ''}`}
                      onClick={() => setTimeMode('expiry')}
                    >
                      Expires After
                    </button>
                    <button
                      type="button"
                      className={`dms-chip flex-1 ${timeMode === 'delay' ? 'dms-on' : ''}`}
                      onClick={() => setTimeMode('delay')}
                    >
                      Locked Until
                    </button>
                  </div>
                  <div className="dms-chips dms-chips-center">
                    {[1, 6, 24, 72, 168].map((h) => (
                      <button
                        key={h}
                        type="button"
                        className={`dms-chip ${timeHours === h ? 'dms-on' : ''}`}
                        onClick={() => setTimeHours(h)}
                      >
                        {h < 24 ? `${h} hrs` : `${h / 24} days`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Access Limit / Burn after reading */}
            <div className="dms-card dms-card-interactive dms-reveal" data-r="5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#181e2b] border border-[rgba(246,241,230,0.15)] flex items-center justify-center text-[#fb7185]">
                    <Flame size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-[#faf7f2] m-0">Access Limits</h4>
                    <p className="text-xs text-[#b8ab96] m-0">Burn after reading / maximum opens</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="dms-switch"
                  role="switch"
                  aria-checked={accessLimitEnabled}
                  style={{ width: 'auto', padding: '6px 10px' }}
                  onClick={() => setAccessLimitEnabled(!accessLimitEnabled)}
                >
                  <span className="dms-switch-track"><i /></span>
                </button>
              </div>

              {accessLimitEnabled && (
                <div className="mt-4 pt-3 border-t border-[rgba(246,241,230,0.08)] flex flex-col gap-2">
                  <p className="dms-cardlabel">ALLOWED OPENS BEFORE DESTRUCTION</p>
                  <div className="dms-chips">
                    {[1, 3, 5, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`dms-chip ${maxOpens === n ? 'dms-on' : ''}`}
                        onClick={() => setMaxOpens(n)}
                      >
                        {n === 1 ? '🔥 Burn after 1 open' : `${n} opens`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dead Man's Switch */}
            <div className="dms-card dms-card-interactive dms-reveal" data-r="6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#181e2b] border border-[rgba(246,241,230,0.15)] flex items-center justify-center text-[#e11d48]">
                    <Radio size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-[#faf7f2] m-0">Dead Man’s Switch</h4>
                    <p className="text-xs text-[#b8ab96] m-0">Heartbeat release if you go quiet</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="dms-switch"
                  role="switch"
                  aria-checked={deadmanEnabled}
                  style={{ width: 'auto', padding: '6px 10px' }}
                  onClick={() => setDeadmanEnabled(!deadmanEnabled)}
                >
                  <span className="dms-switch-track"><i /></span>
                </button>
              </div>

              {deadmanEnabled && (
                <div className="mt-4 pt-3 border-t border-[rgba(246,241,230,0.08)] flex flex-col gap-2">
                  <label htmlFor="edDmsMail" className="dms-cardlabel">GUARDIAN EMAIL RECIPIENT</label>
                  <input
                    id="edDmsMail"
                    className="dms-input"
                    type="email"
                    value={deadmanEmail}
                    onChange={(e) => setDeadmanEmail(e.target.value)}
                    placeholder="guardian@example.com"
                  />
                  <p className="dms-hint">
                    Check-in cadence: 7 days. For deep atelier configuration, visit <a href="/capsule" className="text-[#dfc291] underline">bittybox.org/capsule</a>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 03 · CHAIN / MULTI-PAGE SEQUENCING ──────────────────────────── */}
        <section className={`dms-pane ${currentStep === 3 ? 'is-live' : ''}`} data-pane="chain">
          <div className="dms-pane-body">
            <p className="dms-kicker dms-reveal" data-r="0">03 — CHAIN</p>
            <h2 className="dms-h2 dms-reveal" data-r="1">Multi-page Bitty Chain</h2>
            <p className="dms-help dms-reveal" data-r="2">
              Link multiple Boxes into a self-contained multi-page sequence without any server.
            </p>

            <div className="dms-card dms-reveal" data-r="3">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#181e2b] border border-[rgba(246,241,230,0.15)] flex items-center justify-center text-[#dfc291]">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-[#faf7f2] m-0">Sequence Chaining</h4>
                    <p className="text-xs text-[#b8ab96] m-0">Tail-linked cryptographic pages</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="dms-switch"
                  role="switch"
                  aria-checked={chainEnabled}
                  style={{ width: 'auto', padding: '6px 10px' }}
                  onClick={() => onToggleChain?.(!chainEnabled)}
                >
                  <span className="dms-switch-track"><i /></span>
                </button>
              </div>

              {chainEnabled ? (
                <div className="flex flex-col gap-3 pt-3 border-t border-[rgba(246,241,230,0.08)]">
                  <p className="dms-cardlabel">SEQUENCE PAGES ({chainTotal} OF {chainMax})</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {Array.from({ length: chainTotal }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`dms-chip ${idx === chainIndex ? 'dms-on' : ''}`}
                        onClick={() => onGoToChainPage?.(idx)}
                      >
                        Page {idx + 1}
                      </button>
                    ))}
                    {chainTotal < chainMax && onCreateNextChainPage && (
                      <button
                        type="button"
                        className="dms-chip text-[#dfc291] border-[#dfc291]/30 hover:border-[#dfc291]"
                        onClick={() => onCreateNextChainPage('clone')}
                      >
                        + Add Next Page
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    {onCreateNextChainPage && (
                      <button
                        type="button"
                        className="dms-btn dms-btn-ghost flex-1 text-xs"
                        onClick={() => onCreateNextChainPage('scratch')}
                      >
                        + Blank Page
                      </button>
                    )}
                    {chainTotal > 1 && onDeleteLastChainBox && (
                      <button
                        type="button"
                        className="dms-btn dms-btn-ghost dms-btn-danger flex-1 text-xs"
                        onClick={onDeleteLastChainBox}
                      >
                        Delete Page
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="dms-hint">
                  Enable Bitty Chain to create multi-step apps, multi-chapter books, or full websites stored purely in linked URL fragments.
                </p>
              )}
            </div>

            <div className="dms-review dms-reveal" data-r="4">
              <p className="dms-cardlabel">SPECIFICATION READ</p>
              <dl className="dms-review-list">
                <div><dt>Title</dt><dd>{metadata.title || 'Untitled Box'}</dd></div>
                <div><dt>Symbol</dt><dd>{metadata.favicon || '📦'}</dd></div>
                <div><dt>Cipher</dt><dd>{passwordEnabled ? 'AES-256-GCM Locked' : 'Open Access'}</dd></div>
                <div><dt>Time Policy</dt><dd>{timeLockEnabled ? `${timeMode === 'expiry' ? 'Expires' : 'Opens'} in ${timeHours}h` : 'Indefinite'}</dd></div>
                <div><dt>Chained Pages</dt><dd>{chainEnabled ? `${chainTotal} Pages` : 'Single Box'}</dd></div>
              </dl>
            </div>
          </div>
        </section>

        {/* ── 04 · SEAL & LIVE SANDBOX ────────────────────────────────────── */}
        <section className={`dms-pane ${currentStep === 4 ? 'is-live' : ''}`} data-pane="seal">
          <div className="dms-pane-body">
            <div className="dms-sealed-head">
              <div className="dms-sealmark" aria-hidden="true">
                <span className="dms-seal-ring" />
                <span className="dms-seal-ring dms-d2" />
                <span className="dms-seal-check">✓</span>
              </div>
              <p className="dms-kicker dms-reveal" data-r="0">04 — SEALED</p>
              <h2 className="dms-h2 dms-reveal" data-r="1">Your box is sealed.</h2>
              <p className="dms-help dms-reveal" data-r="2">
                Compressed into a permanent URL fragment. Ready to copy, share, or preview live.
              </p>
            </div>

            {/* Live Sealed Card */}
            <div className="dms-livecard dms-reveal" data-r="3">
              <div className="dms-row dms-between mb-3">
                <span className="dms-livepill"><i></i> READY</span>
                <span className="dms-mono text-xs text-[#dfc291]">
                  {metadata.boxId ? `#${metadata.boxId}` : 'IN-MEMORY'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-[rgba(246,241,230,0.08)] text-center">
                <div>
                  <span className="block font-mono text-[10px] text-[#847a6b] uppercase tracking-wider mb-1">ORIGINAL</span>
                  <b className="font-mono text-sm text-[#faf7f2]">{originalBytes || currentByteCount} B</b>
                </div>
                <div>
                  <span className="block font-mono text-[10px] text-[#847a6b] uppercase tracking-wider mb-1">COMPRESSED</span>
                  <b className="font-mono text-sm text-[#e11d48]">{compressedBytes || estimatedCompressed} B</b>
                </div>
                <div>
                  <span className="block font-mono text-[10px] text-[#847a6b] uppercase tracking-wider mb-1">SAVINGS</span>
                  <b className="font-mono text-sm text-[#dfc291]">
                    {originalBytes > 0 && compressedBytes > 0
                      ? `${Math.round((1 - compressedBytes / originalBytes) * 100)}%`
                      : `${savingsPct}%`}
                  </b>
                </div>
              </div>

              {/* Bitty URL Output row */}
              <div className="mt-4">
                <label htmlFor="edFinalUrl" className="dms-cardlabel">SECRET BITTY LINK</label>
                <div className="dms-copyrow">
                  <input
                    id="edFinalUrl"
                    className="dms-input dms-mono dms-small"
                    type="text"
                    readOnly
                    value={bittyUrl || 'https://bittybox.org/#Generating...'}
                  />
                  <button
                    type="button"
                    className="dms-btn dms-btn-copy"
                    onClick={async () => {
                      if (bittyUrl) {
                        await navigator.clipboard.writeText(bittyUrl);
                        showNotification('Bitty Link copied!');
                      } else if (onGenerate) {
                        await onGenerate();
                        showNotification('Link generated & copied!');
                      }
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dms-actions dms-reveal" data-r="4">
              {bittyUrl && (
                <a
                  href={bittyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dms-btn dms-btn-ghost flex-1"
                >
                  <ExternalLink size={14} /> Open in Tab
                </a>
              )}
              {onOpenQr && (
                <button type="button" className="dms-btn dms-btn-ghost flex-1" onClick={onOpenQr}>
                  <QrCode size={14} /> Show QR Code
                </button>
              )}
              {onExportZip && (
                <button type="button" className="dms-btn dms-btn-ghost flex-1" onClick={onExportZip}>
                  <Download size={14} /> Export ZIP
                </button>
              )}
            </div>

            {/* Live Sandbox Preview Card */}
            <div className="dms-card dms-reveal mt-2" data-r="5">
              <div className="flex items-center justify-between mb-3">
                <span className="dms-cardlabel m-0">LIVE SANDBOX PREVIEW</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className={`dms-chip text-[10px] py-1 px-2.5 min-h-[28px] ${previewTab === 'mobile' ? 'dms-on' : ''}`}
                    onClick={() => setPreviewTab('mobile')}
                  >
                    Phone
                  </button>
                  <button
                    type="button"
                    className={`dms-chip text-[10px] py-1 px-2.5 min-h-[28px] ${previewTab === 'desktop' ? 'dms-on' : ''}`}
                    onClick={() => setPreviewTab('desktop')}
                  >
                    Full
                  </button>
                </div>
              </div>

              <div
                className={`w-full rounded-xl overflow-hidden border border-[rgba(246,241,230,0.12)] bg-[#050608] mx-auto transition-all duration-300 ${
                  previewTab === 'mobile' ? 'max-w-[340px] h-[380px]' : 'h-[380px]'
                }`}
              >
                <iframe
                  title="Live Sandbox Preview"
                  srcDoc={content}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-modals"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Thumb-Reachable Haute Horlogerie Action Bar */}
      <footer className="dms-bar">
        {currentStep > 0 ? (
          <button
            type="button"
            className="dms-btn dms-btn-back"
            onClick={() => scrollToStep(currentStep - 1)}
          >
            ← Back
          </button>
        ) : (
          <div className="w-[90px]" />
        )}

        <button
          type="button"
          className="dms-btn dms-btn-primary"
          onClick={handlePrimaryClick}
          disabled={isGenerating}
        >
          <span className="dms-btn-label">
            {isGenerating ? 'Encoding Box…' : STEPS[currentStep].cta}
          </span>
          <span className="dms-btn-glow" aria-hidden="true" />
        </button>
      </footer>

      {/* Luxury Toast Notification */}
      <div className={`dms-toast ${showToast ? 'is-visible' : ''}`} role="status">
        {toastMessage}
      </div>
    </div>
  );
};
