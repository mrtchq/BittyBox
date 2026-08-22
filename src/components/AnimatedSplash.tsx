import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Radio,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Lock,
  Unlock,
  Code,
  ExternalLink,
  CheckCircle2,
  Clock,
  Timer,
  Gauge,
  Flame,
  Key,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Coins,
  RotateCcw
} from 'lucide-react';
import { CyberScrambleText } from './CyberScrambleText';
import { EdgeGripHandles } from './EdgeGripHandles';
import { PreviewDropdownPanel } from './PreviewDropdownPanel';
import { TemplatesSidePanel } from './TemplatesSidePanel';
import { StudioToolsSidePanel } from './StudioToolsSidePanel';
import { QrModal } from './QrModal';
import { TemplatePreset } from '../types';
import { exportBittyToZip } from '../utils/zipExport';

import { HoloGenerateButton } from './HoloGenerateButton';
import { HoloToggle } from './HoloToggle';
import { homeSlides } from '../content/homeSlides';
import { buildBittyUrl, compressContent, compressContentSync, getRenderedHtml } from '../utils/bittyEngine';
import { useAccount } from '../hooks/useAccount';
import { buildTimeWindow, formatHybridSummary, formatLocalDateTime, type TimeLockMode } from '../utils/timeWindow';
import { DurationTimeControl, DateRangeControl } from './TimeLockControls';
import { BittyMetadata } from '../types';

interface AnimatedSplashProps {
  onComplete: () => void;
}

interface CarouselSlide {
  id: string;
  tag: string;
  category: string;
  title: string;
  highlight: string;
  description: string;
  accentColor: 'cyan' | 'fuchsia' | 'emerald' | 'amber';
  bullets: string[];
  cta: string;
  icon: React.ReactNode;
}

function addTimeOfDayTheme(html: string): string {
  const style = `<style id="bittybox-time-theme">
    html[data-time-theme="day"] body,
    html[data-time-theme="day"] body * { color: #000 !important; }
    html[data-time-theme="day"] body { background: #fff !important; }
    html[data-time-theme="night"] body,
    html[data-time-theme="night"] body * { color: #fff !important; }
    html[data-time-theme="night"] body { background: #000 !important; }
    body { transition: background-color 300ms ease, color 300ms ease; }
  </style>`;
  const script = `<script>(function(){
    function applyTimeTheme(){
      var hour = new Date().getHours();
      document.documentElement.dataset.timeTheme = hour >= 7 && hour < 19 ? 'day' : 'night';
    }
    applyTimeTheme();
    setInterval(applyTimeTheme, 60000);
  })();<\/script>`;

  return html
    .replace(/<\/head>/i, `${style}</head>`)
    .replace(/<\/body>/i, `${script}</body>`);
}

const DEFAULT_STARTER_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Hello Bitty Box</title>
  <style>
    body { background: #050515; color: #00f2ff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .box { border: 1px solid #00f2ff; padding: 2rem; border-radius: 12px; box-shadow: 0 0 25px rgba(0,242,255,0.3); }
    button { background: #00f2ff; color: #000; border: none; padding: 0.6rem 1.2rem; font-weight: bold; border-radius: 6px; cursor: pointer; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Welcome to Bitty Box</h1>
    <p>A self-contained webpage living entirely inside its URL.</p>
    <button onclick="alert('Working 100% in-browser!')">Click Me</button>
  </div>
</body>
</html>`;

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<number>(1);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isWarping, setIsWarping] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Configuration state across the 5 slides
  const [boxContent, setBoxContent] = useState<string>(DEFAULT_STARTER_CODE);
  const [boxTitle, setBoxTitle] = useState<string>('My Bitty Box');
  const [passwordEnabled, setPasswordEnabled] = useState<boolean>(false);
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [slide1ViewMode, setSlide1ViewMode] = useState<'text' | 'split' | 'preview'>('text');

  const [timeLockEnabled, setTimeLockEnabled] = useState<boolean>(false);
  const [timeLockMode, setTimeLockMode] = useState<TimeLockMode>('expiry');
  const [timeExpiryHours, setTimeExpiryHours] = useState<number>(24);
  const [timeDelayHours, setTimeDelayHours] = useState<number>(24);
  const [timeOpenAt, setTimeOpenAt] = useState<string>(formatLocalDateTime(new Date(Date.now() + 24 * 3600 * 1000)));
  const [timeLockAt, setTimeLockAt] = useState<string>(formatLocalDateTime(new Date(Date.now() + 48 * 3600 * 1000)));
  const [hybridRevealMode, setHybridRevealMode] = useState<'delay' | 'date'>('delay');
  const [hybridSelfDestructHours, setHybridSelfDestructHours] = useState<number>(24);
  const [showTimeCountdown, setShowTimeCountdown] = useState<boolean>(true);

  const [accessLimitEnabled, setAccessLimitEnabled] = useState<boolean>(false);
  const [accessLimitMaxOpens, setAccessLimitMaxOpens] = useState<number>(1);
  const [showRemainingAccessCount, setShowRemainingAccessCount] = useState<boolean>(true);

  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isLeftTemplatesPanelOpen, setIsLeftTemplatesPanelOpen] = useState<boolean>(false);
  const [isRightToolsPanelOpen, setIsRightToolsPanelOpen] = useState<boolean>(false);
  const [isPreviewDropdownOpen, setIsPreviewDropdownOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrModalUrl, setQrModalUrl] = useState<string>('');
  const account = useAccount();

  const { user, isAuthenticated } = useAccount();

  const isPasscodeActive = Boolean(passwordEnabled && passwordValue.trim().length > 0);
  const isTimeLockActive = Boolean(timeLockEnabled);
  const isAccessLimitActive = Boolean(accessLimitEnabled);

  const timeLockSummary = useMemo(() => {
    if (!timeLockEnabled) return 'Disabled';
    if (timeLockMode === 'expiry') return `Expires after ${timeExpiryHours === 168 ? '7 Days' : `${timeExpiryHours}h`}`;
    if (timeLockMode === 'delay') return `Unlocks in ${timeDelayHours === 168 ? '7 Days' : `${timeDelayHours}h`}`;
    if (timeLockMode === 'hybrid') return formatHybridSummary({ hybridRevealMode, delayHours: timeDelayHours, openAt: timeOpenAt, hybridSelfDestructHours });
    return `Opens ${timeOpenAt ? new Date(timeOpenAt).toLocaleString() : '—'} · Locks ${timeLockAt ? new Date(timeLockAt).toLocaleString() : '—'}`;
  }, [timeLockEnabled, timeLockMode, timeExpiryHours, timeDelayHours, timeOpenAt, timeLockAt, hybridRevealMode, hybridSelfDestructHours]);

  const calculatedCreditCost = useMemo(() => {
    let cost = 1; // Base Generation Cost
    if (isPasscodeActive) cost += 1;
    if (isTimeLockActive) cost += 1;
    if (isAccessLimitActive) cost += 1;
    return cost;
  }, [isPasscodeActive, isTimeLockActive, isAccessLimitActive]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesized Web Audio Sound FX
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, gainValue = 0.05) => {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, [soundEnabled, initAudio]);

  const playSlideSound = useCallback((idx: number) => {
    if (!soundEnabled) return;
    const baseFreqs = [440, 523.25, 659.25, 783.99];
    const freq = baseFreqs[idx % baseFreqs.length] || 520;
    playTone(freq, 'sine', 0.18, 0.06);
  }, [soundEnabled, playTone]);

  const playWarpSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Sub-bass drop
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(240, now);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + 1.2);
      subGain.gain.setValueAtTime(0.25, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 1.2);
    } catch {}
  }, [soundEnabled, initAudio]);

  // 5 Slides Definition (Content -> Password -> Time -> Access Limits -> Summary & Generate)
  const slideChrome: Array<Omit<CarouselSlide, 'id' | 'title' | 'highlight' | 'description' | 'bullets' | 'cta'>> = [
    {
      category: 'YOUR CONTENT',
      tag: '01 // INSERT CONTENT',
      accentColor: 'cyan',
      icon: <Code className="w-6 h-6 text-cyan-300" />,
    },
    {
      category: 'PASSCODE LOCK',
      tag: '02 // PASSCODE LOCK',
      accentColor: 'fuchsia',
      icon: <Key className="w-6 h-6 text-fuchsia-300" />,
    },
    {
      category: 'TIMED LOCK',
      tag: '03 // TIME-BASED LOCK',
      accentColor: 'amber',
      icon: <Clock className="w-6 h-6 text-amber-300" />,
    },
    {
      category: 'UNLOCK LIMITS',
      tag: '04 // ACCESS LIMIT LOCK',
      accentColor: 'emerald',
      icon: <Gauge className="w-6 h-6 text-emerald-300" />,
    },
    {
      category: 'CREDIT COST',
      tag: '05 // ESTIMATED CREDITS',
      accentColor: 'cyan',
      icon: <Coins className="w-6 h-6 text-amber-300" />,
    },
  ];

  const slides: CarouselSlide[] = homeSlides.map((slide, index) => ({
    id: slide.id,
    category: slideChrome[index]?.category ?? slide.kicker,
    tag: slideChrome[index]?.tag ?? slide.kicker,
    title: slide.kicker,
    highlight: slide.headline,
    description: slide.body,
    bullets: slide.bullets,
    cta: slide.cta,
    accentColor: slideChrome[index]?.accentColor ?? 'cyan',
    icon: slideChrome[index]?.icon ?? <Code className="w-6 h-6 text-cyan-300" />,
  }));

  // Slide navigation handlers
  const goToSlide = useCallback((newIndex: number, newDirection?: number) => {
    const dir = newDirection !== undefined ? newDirection : newIndex > currentSlide ? 1 : -1;
    setDirection(dir);
    setCurrentSlide(newIndex);
    playSlideSound(newIndex);
  }, [currentSlide, playSlideSound]);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1, 1);
    } else {
      goToSlide(0, 1);
    }
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1, -1);
    } else {
      goToSlide(slides.length - 1, -1);
    }
  }, [currentSlide, slides.length, goToSlide]);

  // Handle Exit and launch into app
  const handleLaunch = useCallback(() => {
    playWarpSound();
    setIsWarping(true);
    setIsAutoPlay(false);

    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 2600);
  }, [onComplete, playWarpSound]);

  // Rendered preview HTML for Slide 05 Preview Window
  const slidePreviewHtml = useMemo(() => {
    const source = boxContent.trim() || DEFAULT_STARTER_CODE;
    return addTimeOfDayTheme(getRenderedHtml(source, {
      title: boxTitle || 'Bitty Box',
      language: 'en',
    }));
  }, [boxContent, boxTitle]);

  // Pre-generate / sync URL continuously so it is immediately available on click
  const [readyUrl, setReadyUrl] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;
    const generatePreviewUrl = async () => {
      try {
        const source = boxContent.trim() || DEFAULT_STARTER_CODE;
        const html = addTimeOfDayTheme(getRenderedHtml(source, {
          title: boxTitle || 'Bitty Box',
          language: 'en',
        }));

        const pass = passwordEnabled && passwordValue.trim() ? passwordValue.trim() : undefined;

        let compressedFragment = '';
        if (!pass) {
          const syncRes = compressContentSync(html, { mimeType: 'text/html', isRawHtml: true });
          if (syncRes) {
            compressedFragment = syncRes.compressedUrl;
          }
        }
        if (!compressedFragment) {
          const encoded = await compressContent(html, {
            password: pass,
            mimeType: 'text/html',
            isRawHtml: true,
          });
          if (encoded) {
            compressedFragment = encoded.compressedUrl;
          }
        }

        if (isCancelled || !compressedFragment) return;

        const meta: BittyMetadata = {
          title: boxTitle || 'Bitty Box',
          description: 'A self-contained webpage living entirely in a URL',
          favicon: '📦',
          includeMetadata: true,
        };

        if (timeLockEnabled) {
          meta.lockConfig = {
            timeWindow: buildTimeWindow({
              enabled: timeLockEnabled,
              mode: timeLockMode,
              expiryHours: timeExpiryHours,
              delayHours: timeDelayHours,
              openAt: timeOpenAt,
              lockAt: timeLockAt,
              hybridRevealMode,
              hybridSelfDestructHours,
              showCountdown: showTimeCountdown,
            })!,
          };
        }

        if (accessLimitEnabled) {
          meta.lockConfig = {
            ...(meta.lockConfig || {}),
            openLimit: {
              enabled: true,
              maxOpens: accessLimitMaxOpens,
              opensUsed: 0,
              showRemainingCount: showRemainingAccessCount,
            },
          };
        }

        const fullUrl = buildBittyUrl(compressedFragment, meta);
        if (!isCancelled) {
          setReadyUrl(fullUrl);
        }
      } catch {}
    };

    generatePreviewUrl();
    return () => {
      isCancelled = true;
    };
  }, [boxContent, boxTitle, passwordEnabled, passwordValue, timeLockEnabled, timeLockMode, timeExpiryHours, timeDelayHours, timeOpenAt, timeLockAt, hybridRevealMode, hybridSelfDestructHours, showTimeCountdown, accessLimitEnabled, accessLimitMaxOpens, showRemainingAccessCount]);

  // Start Over / Reset All State
  const handleStartOver = useCallback(() => {
    setBoxContent(DEFAULT_STARTER_CODE);
    setBoxTitle('My Bitty Box');
    setSlide1ViewMode('text');
    setPasswordEnabled(false);
    setPasswordValue('');
    setShowPassword(false);
    setTimeLockEnabled(false);
    setTimeLockMode('expiry');
    setTimeExpiryHours(6);
    setTimeDelayHours(24);
    setTimeOpenAt(formatLocalDateTime(new Date(Date.now() + 24 * 3600 * 1000)));
    setTimeLockAt(formatLocalDateTime(new Date(Date.now() + 48 * 3600 * 1000)));
    setHybridRevealMode('delay');
    setHybridSelfDestructHours(24);
    setShowTimeCountdown(true);
    setAccessLimitEnabled(false);
    setAccessLimitMaxOpens(1);
    setShowRemainingAccessCount(true);
    setReadyUrl('');
    setGeneratedUrl('');
    setIsCopied(false);
    setCurrentSlide(0);
  }, []);

  // Generate Bitty Box with all active lock configurations
  const handleGenerateFinal = useCallback(async () => {
    const source = boxContent.trim() || DEFAULT_STARTER_CODE;
    const html = addTimeOfDayTheme(getRenderedHtml(source, {
      title: boxTitle || 'Bitty Box',
      language: 'en',
    }));

    const pass = passwordEnabled && passwordValue.trim() ? passwordValue.trim() : undefined;
    const uniqueBoxId = `bbx_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    let compressedFragment = '';
    if (!pass) {
      try {
        const syncRes = compressContentSync(html, { mimeType: 'text/html', isRawHtml: true });
        if (syncRes) {
          compressedFragment = syncRes.compressedUrl;
        }
      } catch {}
    }

    if (!compressedFragment) {
      try {
        const encoded = await compressContent(html, {
          password: pass,
          mimeType: 'text/html',
          isRawHtml: true,
        });
        if (encoded) {
          compressedFragment = encoded.compressedUrl;
        }
      } catch (err) {
        console.error('Compression failed:', err);
      }
    }

    if (!compressedFragment) return;

    const meta: BittyMetadata = {
      title: boxTitle || 'Bitty Box',
      description: 'A self-contained webpage living entirely in a URL',
      favicon: '📦',
      includeMetadata: true,
      boxId: (accessLimitEnabled || timeLockEnabled) ? uniqueBoxId : undefined,
    };

    if (timeLockEnabled) {
      meta.lockConfig = {
        timeWindow: buildTimeWindow({
          enabled: timeLockEnabled,
          mode: timeLockMode,
          expiryHours: timeExpiryHours,
          delayHours: timeDelayHours,
          openAt: timeOpenAt,
          lockAt: timeLockAt,
          hybridRevealMode,
          hybridSelfDestructHours,
          showCountdown: showTimeCountdown,
        })!,
      };
    }

    if (accessLimitEnabled) {
      meta.lockConfig = {
        ...(meta.lockConfig || {}),
        openLimit: {
          enabled: true,
          maxOpens: accessLimitMaxOpens,
          opensUsed: 0,
          showRemainingCount: showRemainingAccessCount,
        },
      };
    }

    const longUrl = buildBittyUrl(compressedFragment, meta);
    if (!longUrl) return;

    setGeneratedUrl(longUrl);

    // 2. Open new tab directly with the target URL in direct user gesture context
    let tabOpened = false;
    try {
      const openedWin = window.open(longUrl, '_blank', 'noopener,noreferrer');
      if (openedWin) {
        tabOpened = true;
      }
    } catch {}

    if (!tabOpened) {
      try {
        const link = document.createElement('a');
        link.href = longUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        tabOpened = true;
      } catch {}
    }

    // 3. Copy to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(longUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = longUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3500);
    } catch {}

    // 4. Background registration if access limit is configured
    if (accessLimitEnabled && longUrl) {
      try {
        await fetch('/api/boxes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: uniqueBoxId,
            boxId: uniqueBoxId,
            title: boxTitle || 'Bitty Box',
            bittyUrl: compressedFragment || longUrl,
            lockConfig: {
              openLimit: {
                enabled: true,
                maxOpens: accessLimitMaxOpens,
                opensUsed: 0,
                showRemainingCount: showRemainingAccessCount,
              },
              timeWindow: timeLockEnabled
                ? buildTimeWindow({
                    enabled: timeLockEnabled,
                    mode: timeLockMode,
                    expiryHours: timeExpiryHours,
                    delayHours: timeDelayHours,
                    openAt: timeOpenAt,
                    lockAt: timeLockAt,
                    hybridRevealMode,
                    hybridSelfDestructHours,
                    showCountdown: showTimeCountdown,
                  })
                : null,
            },
          }),
        });
      } catch {
        // Fallback gracefully
      }
    }

    // 5. Automatically save to logged-in user's account log
    try {
      const sid = localStorage.getItem('bitty_session_id');
      if (sid && longUrl) {
        await fetch('/api/accounts/links', {
          method: 'POST',
          headers: {
            'X-Session-Id': sid,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: boxTitle || 'Bitty Box',
            url: longUrl,
            format: 'html',
            byteSize: boxContent.length,
            encrypted: Boolean(passwordEnabled && passwordValue),
            cost: calculatedCreditCost,
            locks: {
              password: Boolean(passwordEnabled && passwordValue),
              timeWindow: Boolean(timeLockEnabled),
              accessLimit: Boolean(accessLimitEnabled),
            },
          }),
        });
      }
    } catch {}
  }, [readyUrl, boxContent, boxTitle, passwordEnabled, passwordValue, timeLockEnabled, timeLockMode, timeExpiryHours, timeDelayHours, timeOpenAt, timeLockAt, hybridRevealMode, hybridSelfDestructHours, showTimeCountdown, accessLimitEnabled, accessLimitMaxOpens, showRemainingAccessCount, calculatedCreditCost]);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay || isExiting) return;
    autoPlayTimerRef.current = setInterval(() => {
      nextSlide();
    }, 6500);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlay, isExiting, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape' || (e.key === 'Enter' && currentSlide === slides.length - 1)) {
        e.preventDefault();
        handleLaunch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slides.length, nextSlide, prevSlide, handleLaunch]);

  // Mouse & Touch gestures
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({
      x: (clientX / innerWidth - 0.5) * 2,
      y: (clientY / innerHeight - 0.5) * 2,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    setTouchStartX(null);
  };

  // Dynamic 3D Particle Canvas
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
    window.addEventListener('resize', handleResize);

    const PARTICLE_COUNT = 160;
    interface StarParticle {
      x: number;
      y: number;
      z: number;
      color: string;
      size: number;
      speed: number;
    }

    const particles: StarParticle[] = [];
    const colorPalette = ['#00f2ff', '#bd00ff', '#00ffcc', '#d946ef', '#38bdf8', '#ffe0a6'];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 1000 + 1,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 2 + 1,
      });
    }

    const render = () => {
      ctx.fillStyle = 'rgba(3, 2, 14, 0.32)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const warpMultiplier = isExiting ? 28 : 1;
        p.z -= p.speed * warpMultiplier;

        if (p.z <= 0) {
          p.z = 1000;
          p.x = (Math.random() - 0.5) * width * 2;
          p.y = (Math.random() - 0.5) * height * 2;
        }

        const fov = 400;
        const scale = fov / (fov + p.z);
        const sx = cx + (p.x + mousePos.x * 60) * scale;
        const sy = cy + (p.y + mousePos.y * 40) * scale;

        if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.8, p.size * scale * (isExiting ? 2.5 : 1)), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mousePos, isExiting]);

  // Framer Motion Slide Variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 120 : -120,
      opacity: 0,
      scale: 0.94,
      rotateY: dir > 0 ? 10 : -10,
      filter: 'blur(6px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring', stiffness: 340, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
        rotateY: { duration: 0.35 },
        filter: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -120 : 120,
      opacity: 0,
      scale: 0.94,
      rotateY: dir > 0 ? -10 : 10,
      filter: 'blur(6px)',
      transition: {
        x: { type: 'spring', stiffness: 340, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
        rotateY: { duration: 0.25 },
        filter: { duration: 0.2 },
      },
    }),
  };

  const activeSlideData = slides[currentSlide];

  return (
    <div
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`fixed inset-0 z-50 overflow-hidden bg-[#03020e] text-cyan-100 flex flex-col justify-between select-none h-[100dvh] transition-all duration-700 ${
        isExiting ? 'scale-115 opacity-0 blur-xl filter' : 'opacity-100'
      }`}
    >
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Cyber Vignette & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(3,2,14,0.92)_100%)] pointer-events-none z-1" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none z-1" />

      {/* Top HUD Header Navigation Bar */}
      <header className="relative z-20 w-full px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between border-b border-cyan-500/20 bg-[#060419]/75 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_15px_rgba(0,242,255,0.4)] overflow-hidden p-1">
            <img
              src="/bittybox-logo.png"
              alt="Bitty Box Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_6px_rgba(0,242,255,0.6)]"
            />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-cyan-300 flex items-center gap-2">
              <span>BITTY BOX</span>
            </div>
            <div className="hidden sm:block text-[9px] font-mono text-cyan-400/60 tracking-wider">
              CLIENT-SIDE IN-URL OPERATING SYSTEM
            </div>
          </div>
        </div>

        {/* Live Slide Step Indicator (01 / 05) */}
        <div className="flex items-center gap-1.5 font-mono text-xs text-cyan-300/80 bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
          <span className="text-cyan-200 font-bold">0{currentSlide + 1}</span>
          <span className="text-cyan-500">/</span>
          <span className="text-cyan-400/60">0{slides.length}</span>
        </div>

        {/* Controls: Audio Toggle, Sign In / Account */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => {
              initAudio();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-1.5 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                : 'bg-black/40 border-cyan-500/20 text-cyan-600 hover:text-cyan-400'
            }`}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
            aria-label="Toggle audio effects"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsRightToolsPanelOpen(true)}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-fuchsia-950/90 to-purple-950/90 border border-fuchsia-500/60 hover:border-fuchsia-400 text-fuchsia-200 font-mono text-xs tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(189,0,255,0.25)] transition-all hover:scale-105 active:scale-95 group cursor-pointer"
            title={isAuthenticated || user ? 'Account & Tools' : 'Create Account / Sign In'}
          >
            <span>{isAuthenticated || user ? 'ACCOUNT' : 'CREATE ACCOUNT'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-fuchsia-300" />
          </button>
        </div>
      </header>

      {/* Main Interactive Carousel Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full px-3 sm:px-6 py-2 max-w-5xl lg:max-w-6xl mx-auto min-h-0 overflow-y-auto">


        <div className="w-full flex items-center justify-center [perspective:1200px] my-auto">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_e, { offset, velocity }) => {
                const swipe = offset.x;
                if (swipe < -50 || velocity.x < -200) {
                  nextSlide();
                } else if (swipe > 50 || velocity.x > 200) {
                  prevSlide();
                }
              }}
              className="w-full max-w-4xl lg:max-w-5xl bg-[#090620]/85 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 md:p-6 shadow-[0_0_40px_rgba(0,0,0,0.85),inset_0_0_20px_rgba(0,242,255,0.08)] backdrop-blur-2xl relative cursor-grab active:cursor-grabbing scrollbar-thin scrollbar-thumb-cyan-500/40 scrollbar-track-transparent"
            >
              {/* Corner Accents */}
              <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none" />

              {/* Glowing Radial Accent */}
              <div
                className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none ${
                  activeSlideData.accentColor === 'fuchsia'
                    ? 'bg-fuchsia-500'
                    : activeSlideData.accentColor === 'emerald'
                    ? 'bg-emerald-500'
                    : activeSlideData.accentColor === 'amber'
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
              />

              {/* Two-Column Responsive Grid Layout on Desktop */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-stretch w-full">
                {/* ─────────────────────────────────────────────────────────────
                    LEFT COLUMN (md:col-span-6): Interactive Tool Panel
                    ───────────────────────────────────────────────────────────── */}
                <div
                  className="md:col-span-6 flex flex-col justify-center min-h-0"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                >
                  {/* =========================================================
                      SLIDE 1 (Index 0): TEXT INPUT / COMPOSER FIELD (TEXT / SPLIT / PREVIEW)
                      ========================================================= */}
                  {currentSlide === 0 && (
                    <div className="w-full bg-[#050314]/90 border border-cyan-500/40 rounded-xl p-3 sm:p-3.5 shadow-[0_0_25px_rgba(0,242,255,0.15)] font-mono flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      {/* Top Bar: Mode Tabs (TEXT / SPLIT / PREVIEW) and Bytes Counter */}
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2 gap-2">
                        <div className="flex items-center gap-1 bg-black/60 border border-cyan-500/30 rounded-lg p-0.5 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => setSlide1ViewMode('text')}
                            className={`px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
                              slide1ViewMode === 'text'
                                ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/60 shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                                : 'text-cyan-400/60 hover:text-cyan-200'
                            }`}
                            title="Code / Text Editor only"
                          >
                            TEXT
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlide1ViewMode('split')}
                            className={`px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
                              slide1ViewMode === 'split'
                                ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/60 shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                                : 'text-cyan-400/60 hover:text-cyan-200'
                            }`}
                            title="Split View: Editor and Rendered Preview side-by-side"
                          >
                            SPLIT
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlide1ViewMode('preview')}
                            className={`px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
                              slide1ViewMode === 'preview'
                                ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/60 shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                                : 'text-cyan-400/60 hover:text-cyan-200'
                            }`}
                            title="Live Rendered Output from the TEXT tab"
                          >
                            PREVIEW
                          </button>
                        </div>

                        <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded font-bold shrink-0">
                          {boxContent.length} BYTES
                        </span>
                      </div>

                      {/* View Modes Content */}
                      {(slide1ViewMode === 'text' || slide1ViewMode === 'split') && (
                        <textarea
                          value={boxContent}
                          onChange={e => setBoxContent(e.target.value)}
                          onFocus={() => setIsAutoPlay(false)}
                          onPointerDown={e => e.stopPropagation()}
                          aria-label="Content for your Bitty Box"
                          placeholder="Paste HTML or type the content for your new Bitty Box…"
                          className="w-full flex-1 min-h-[110px] sm:min-h-[130px] md:min-h-[140px] resize-none rounded-lg border border-cyan-400/30 bg-[#02010a] p-2.5 text-xs leading-5 text-cyan-100 placeholder:text-cyan-400/40 outline-none transition focus:border-cyan-300 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                        />
                      )}

                      {slide1ViewMode === 'preview' && (
                        <div className="w-full flex-1 min-h-[110px] sm:min-h-[130px] md:min-h-[140px] relative bg-[#000000] rounded-lg border border-cyan-500/30 overflow-hidden shadow-inner">
                          <iframe
                            srcDoc={slidePreviewHtml}
                            title="Live Rendered Output Preview"
                            className="w-full h-full border-0 absolute inset-0 bg-[#000000]"
                            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-downloads"
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2 pt-2 border-t border-cyan-500/20 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-cyan-400/60 text-[10px]">PRESET:</span>
                          <button
                            type="button"
                            onClick={() => setBoxContent(DEFAULT_STARTER_CODE)}
                            className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] hover:bg-cyan-900 transition-colors"
                          >
                            Starter Box
                          </button>
                          <button
                            type="button"
                            onClick={() => setBoxContent('<h1>Secret Note</h1>\n<p>Only visible to those with the link.</p>')}
                            className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] hover:bg-cyan-900 transition-colors"
                          >
                            Note
                          </button>
                        </div>
                        {boxContent && (
                          <button
                            type="button"
                            onClick={() => setBoxContent('')}
                            className="text-[10px] text-cyan-400/60 hover:text-rose-400 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      SLIDE 2 (Index 1): NUMERICAL PASSCODE LOCK (OPTIONAL)
                      ========================================================= */}
                  {currentSlide === 1 && (
                    <div className="w-full bg-[#050314]/90 border border-fuchsia-500/40 rounded-xl p-3 sm:p-4 shadow-[0_0_25px_rgba(189,0,255,0.18)] font-mono flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      <div className="flex items-center justify-between border-b border-fuchsia-500/20 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2 text-fuchsia-300 text-xs font-bold">
                          <Key className="w-4 h-4 text-fuchsia-400" />
                          <span>ENABLE PASSCODE LOCK</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPasswordEnabled(!passwordEnabled)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            passwordEnabled
                              ? 'bg-fuchsia-500 text-black shadow-[0_0_12px_rgba(217,70,239,0.8)]'
                              : 'bg-fuchsia-950/60 border border-fuchsia-500/40 text-fuchsia-400'
                          }`}
                        >
                          {passwordEnabled ? 'ENABLED' : 'OPTIONAL (OFF)'}
                        </button>
                      </div>

                      {passwordEnabled ? (
                        <div className="space-y-2.5 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-fuchsia-300/80">
                            <span>NUMERICAL PASSCODE (1-8 DIGITS)</span>
                            <span className="bg-fuchsia-950/80 border border-fuchsia-500/40 px-1.5 py-0.5 rounded text-fuchsia-200 font-bold">
                              {passwordValue.length} / 8
                            </span>
                          </div>

                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={8}
                              value={passwordValue}
                              onChange={e => {
                                const numbersOnly = e.target.value.replace(/\D/g, '').slice(0, 8);
                                setPasswordValue(numbersOnly);
                              }}
                              placeholder="1-8 numbers (e.g. 1234)..."
                              className="w-full rounded-lg border border-fuchsia-400/50 bg-[#02010a] px-3 py-2 text-center text-base tracking-[0.25em] text-fuchsia-100 placeholder:text-fuchsia-400/40 placeholder:text-xs placeholder:tracking-normal outline-none focus:border-fuchsia-300 pr-9 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fuchsia-400 hover:text-fuchsia-200"
                              title={showPassword ? 'Hide passcode' : 'Show passcode'}
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 pt-0.5 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-fuchsia-400/60 text-[10px]">PIN:</span>
                              {['1234', '7777', '90210', '12345678'].map(pin => (
                                <button
                                  key={pin}
                                  type="button"
                                  onClick={() => setPasswordValue(pin)}
                                  className="px-1.5 py-0.5 rounded bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300 text-[10px] hover:bg-fuchsia-900"
                                >
                                  {pin}
                                </button>
                              ))}
                            </div>
                            {passwordValue && (
                              <button
                                type="button"
                                onClick={() => setPasswordValue('')}
                                className="text-[10px] text-rose-400 hover:underline"
                              >
                                CLEAR
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-fuchsia-300/80 pt-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">AES-GCM 256-BIT // ZERO-KNOWLEDGE ENCRYPTION</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-xs text-fuchsia-200/70 space-y-2">
                          <Unlock className="w-8 h-8 text-fuchsia-400/50" />
                          <p className="text-[11px] text-fuchsia-300/80">No passcode required. Anyone with the URL will be able to view the Box.</p>
                          <button
                            type="button"
                            onClick={() => setPasswordEnabled(true)}
                            className="px-3 py-1 rounded bg-fuchsia-950 border border-fuchsia-500/40 text-fuchsia-300 text-[10px] font-bold hover:bg-fuchsia-900 transition-colors"
                          >
                            + Enable PIN Lock
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================================
                      SLIDE 3 (Index 2): TIME-BASED LOCK (OPTIONAL)
                      ========================================================= */}
                  {currentSlide === 2 && (
                    <div className="w-full bg-[#050314]/90 border border-amber-500/40 rounded-xl p-3 sm:p-4 shadow-[0_0_25px_rgba(245,158,11,0.18)] font-mono flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span>ENABLE TIME-BASED LOCK</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTimeLockEnabled(!timeLockEnabled)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            timeLockEnabled
                              ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                              : 'bg-amber-950/60 border border-amber-500/40 text-amber-400'
                          }`}
                        >
                          {timeLockEnabled ? 'ENABLED' : 'OPTIONAL (OFF)'}
                        </button>
                      </div>

                      {timeLockEnabled ? (
                        <div className="space-y-3 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
                          {/* Mode selector */}
                          <div className="space-y-1.5">
                            <div className="text-[11px] text-amber-300/80 font-bold">LOCK MODE:</div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {([
                                { id: 'expiry', label: 'Expires', sub: 'Duration' },
                                { id: 'delay', label: 'Time Until Open', sub: 'Sleeper' },
                                { id: 'range', label: 'Date Range', sub: 'Scheduled' },
                                { id: 'hybrid', label: 'Reveal + Decay', sub: 'Hybrid' },
                              ] as const).map(m => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setTimeLockMode(m.id)}
                                  className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold leading-tight transition-all ${
                                    timeLockMode === m.id
                                      ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                      : 'bg-amber-950/30 border-amber-500/30 text-amber-400 hover:bg-amber-900/40'
                                  }`}
                                >
                                  <div>{m.label}</div>
                                  <div className="text-[8px] opacity-70 uppercase tracking-wide">{m.sub}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Expiry (current behavior) */}
                          {timeLockMode === 'expiry' && (
                            <DurationTimeControl
                              label="SELECT EXPIRATION DURATION:"
                              presets={[1, 6, 24, 168]}
                              value={timeExpiryHours}
                              onChange={setTimeExpiryHours}
                              hint="Link self-destructs after this duration."
                            />
                          )}

                          {/* Delay (Time Until Open) */}
                          {timeLockMode === 'delay' && (
                            <DurationTimeControl
                              label="UNLOCKS AFTER (TIME UNTIL OPEN):"
                              presets={[6, 24, 72, 168]}
                              value={timeDelayHours}
                              onChange={setTimeDelayHours}
                              hint="Link stays inert & unopenable until then."
                            />
                          )}

                          {/* Date Range (Opens at / Locks on) */}
                          {timeLockMode === 'range' && (
                            <DateRangeControl
                              openAt={timeOpenAt}
                              lockAt={timeLockAt}
                              onOpenAt={setTimeOpenAt}
                              onLockAt={setTimeLockAt}
                            />
                          )}

                          {/* Hybrid (Reveal + Self-Destruct) */}
                          {timeLockMode === 'hybrid' && (
                            <div className="space-y-2">
                              <div className="text-[10px] text-amber-300/80 font-bold">REVEAL INSTANT:</div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {([{ id: 'delay', label: 'After Delay' }, { id: 'date', label: 'On Date' }] as const).map(o => (
                                  <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => setHybridRevealMode(o.id)}
                                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all ${
                                      hybridRevealMode === o.id
                                        ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                        : 'bg-amber-950/30 border-amber-500/30 text-amber-400 hover:bg-amber-900/40'
                                    }`}
                                  >
                                    {o.label}
                                  </button>
                                ))}
                              </div>

                              {hybridRevealMode === 'delay' ? (
                                <DurationTimeControl
                                  label="REVEALS AFTER (TIME UNTIL OPEN):"
                                  presets={[6, 24, 72, 168]}
                                  value={timeDelayHours}
                                  onChange={setTimeDelayHours}
                                  compact
                                />
                              ) : (
                                <div className="space-y-1.5">
                                  <div className="text-[10px] text-amber-300/80 font-bold">REVEALS ON (DATE/TIME):</div>
                                  <input
                                    type="datetime-local"
                                    value={timeOpenAt}
                                    onChange={e => setTimeOpenAt(e.target.value)}
                                    className="w-full rounded-lg border border-amber-400/50 bg-[#02010a] px-2 py-1.5 text-[11px] text-amber-100 outline-none focus:border-amber-300 font-mono"
                                  />
                                </div>
                              )}

                              <DurationTimeControl
                                label="SELF-DESTRUCTS AFTER REVEAL:"
                                presets={[1, 6, 24, 168]}
                                value={hybridSelfDestructHours}
                                onChange={setHybridSelfDestructHours}
                                compact
                              />
                              <div className="text-[9px] text-amber-300/60 truncate">Reveals at scheduled instant, then auto-burns after the decay window.</div>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-[10px] text-amber-300/80 pt-0.5">
                            <Timer className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">
                              {timeLockMode === 'expiry' && 'AUTO-DECAY // SELF-DESTRUCTS AFTER DURATION'}
                              {timeLockMode === 'delay' && 'SLEEPER // REVEALS ITSELF AFTER COUNTDOWN'}
                              {timeLockMode === 'range' && 'SCHEDULED // ANCHORED TO CALENDAR'}
                              {timeLockMode === 'hybrid' && 'HYBRID // SCHEDULED REVEAL + SELF-DESTRUCT'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-xs text-amber-200/70 space-y-2">
                          <Clock className="w-8 h-8 text-amber-400/50" />
                          <p className="text-[11px] text-amber-300/80">No time expiration set. The Box will remain accessible indefinitely.</p>
                          <button
                            type="button"
                            onClick={() => setTimeLockEnabled(true)}
                            className="px-3 py-1 rounded bg-amber-950 border border-amber-500/40 text-amber-300 text-[10px] font-bold hover:bg-amber-900 transition-colors"
                          >
                            + Enable Expiry Window
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================================
                      SLIDE 4 (Index 3): ACCESS LIMIT LOCK (OPTIONAL)
                      ========================================================= */}
                  {currentSlide === 3 && (
                    <div className="w-full bg-[#050314]/90 border border-emerald-500/40 rounded-xl p-3 sm:p-4 shadow-[0_0_25px_rgba(0,255,204,0.18)] font-mono flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                          <Gauge className="w-4 h-4 text-emerald-400" />
                          <span>ENABLE ACCESS LIMIT LOCK</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAccessLimitEnabled(!accessLimitEnabled)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            accessLimitEnabled
                              ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(0,255,204,0.8)]'
                              : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                          }`}
                        >
                          {accessLimitEnabled ? 'ENABLED' : 'OPTIONAL (OFF)'}
                        </button>
                      </div>

                      {accessLimitEnabled ? (
                        <div className="space-y-3 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
                          <div className="text-[11px] text-emerald-300/80 font-bold">SET ALLOWABLE OPEN QUOTA:</div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[1, 3, 5, 10].map(q => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => setAccessLimitMaxOpens(q)}
                                className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all ${
                                  accessLimitMaxOpens === q
                                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(0,255,204,0.4)]'
                                    : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                                }`}
                              >
                                {q === 1 ? '1 (Burn)' : `${q} Opens`}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-300/80 pt-0.5">
                            <Flame className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">TAMPER-PROOF COUNTER // SEALS PERMANENTLY</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-xs text-emerald-200/70 space-y-2">
                          <Gauge className="w-8 h-8 text-emerald-400/50" />
                          <p className="text-[11px] text-emerald-300/80">Unlimited opens. No access cap will be enforced.</p>
                          <button
                            type="button"
                            onClick={() => setAccessLimitEnabled(true)}
                            className="px-3 py-1 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold hover:bg-emerald-900 transition-colors"
                          >
                            + Enable Open Quota
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================================
                      SLIDE 5 (Index 4): CONFIGURED LOCKS SUMMARY
                      ========================================================= */}
                  {currentSlide === 4 && (
                    <div className="w-full bg-[#050314]/90 border border-cyan-500/40 rounded-xl p-3 sm:p-3.5 shadow-[0_0_25px_rgba(0,242,255,0.2)] font-mono text-left flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
                        <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold font-cyber">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>CONFIGURED LOCKS</span>
                        </div>
                        <span className="text-[9px] text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                          {boxContent.length} BYTES
                        </span>
                      </div>

                      {/* Lock Status Items */}
                      <div className="space-y-2 text-xs flex-1 flex flex-col justify-around">
                        {/* 1. Passcode Lock */}
                        <div className={`p-2 sm:p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                          passwordEnabled && passwordValue.trim()
                            ? 'bg-fuchsia-950/40 border-fuchsia-500/50 text-fuchsia-200'
                            : 'bg-[#08031a]/60 border-zinc-800/80 text-zinc-500'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Key className={`w-4 h-4 shrink-0 ${passwordEnabled && passwordValue.trim() ? 'text-fuchsia-400' : 'text-zinc-600'}`} />
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] truncate">PASSCODE LOCK</div>
                              <div className="text-[10px] opacity-80 truncate">
                                {passwordEnabled && passwordValue.trim() ? `${passwordValue.length}-Digit PIN (AES-256-GCM)` : 'Disabled'}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded border shrink-0 ${
                            passwordEnabled && passwordValue.trim()
                              ? 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]'
                              : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                          }`}>
                            {passwordEnabled && passwordValue.trim() ? 'ON' : 'OFF'}
                          </span>
                        </div>

                        {/* 2. Timed Lock */}
                        <div className={`p-2 sm:p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                          timeLockEnabled
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                            : 'bg-[#08031a]/60 border-zinc-800/80 text-zinc-500'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className={`w-4 h-4 shrink-0 ${timeLockEnabled ? 'text-amber-400' : 'text-zinc-600'}`} />
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] truncate">TIME-BASED LOCK</div>
                              <div className="text-[10px] opacity-80 truncate">
                                {timeLockSummary}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded border shrink-0 ${
                            timeLockEnabled
                              ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                              : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                          }`}>
                            {timeLockEnabled ? 'ON' : 'OFF'}
                          </span>
                        </div>

                        {/* 3. Access Limit Lock */}
                        <div className={`p-2 sm:p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                          accessLimitEnabled
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                            : 'bg-[#08031a]/60 border-zinc-800/80 text-zinc-500'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Gauge className={`w-4 h-4 shrink-0 ${accessLimitEnabled ? 'text-emerald-400' : 'text-zinc-600'}`} />
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] truncate">ACCESS LIMIT LOCK</div>
                              <div className="text-[10px] opacity-80 truncate">
                                {accessLimitEnabled ? (accessLimitMaxOpens === 1 ? '1 Open (Burn on Read)' : `${accessLimitMaxOpens} Opens Allowed`) : 'Disabled'}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded border shrink-0 ${
                            accessLimitEnabled
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(0,255,150,0.5)]'
                              : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                          }`}>
                            {accessLimitEnabled ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    RIGHT COLUMN (md:col-span-6): Slide Info & Actions
                    ───────────────────────────────────────────────────────────── */}
                <div className="md:col-span-6 flex flex-col justify-between space-y-3 sm:space-y-4">
                  {/* Slide 01 SPLIT Mode: Live Preview Window completely takes over right side */}
                  {currentSlide === 0 && slide1ViewMode === 'split' ? (
                    <div className="flex-1 w-full bg-[#050314]/90 border border-cyan-500/40 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(0,242,255,0.2)] flex flex-col min-h-[220px] md:min-h-[260px] font-mono">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-[#09051f] border-b border-cyan-500/25 text-[10px] text-cyan-300">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <CyberScrambleText text="PREVIEW" speed={20} />
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>LIVE RENDERED OUTPUT</span>
                        </div>
                      </div>
                      <div className="flex-1 w-full relative min-h-[160px] sm:min-h-[190px] bg-[#000000]">
                        <iframe
                          srcDoc={slidePreviewHtml}
                          title="Slide 01 Live Rendered Output Preview"
                          className="w-full h-full border-0 absolute inset-0 bg-[#000000]"
                          sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-downloads"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Slide Top Metadata Tag */}
                      <div className="flex items-center justify-between gap-2 min-h-[32px]">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] sm:text-[11px] tracking-wider shadow-[0_0_12px_rgba(0,242,255,0.2)]">
                          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                          <CyberScrambleText text={activeSlideData.tag} speed={20} />
                        </div>
                        {currentSlide === 1 ? (
                          <div className="flex items-center justify-end scale-[0.52] sm:scale-[0.58] origin-right -my-3 -mr-1">
                            <HoloToggle
                              id="holo-toggle-slide-02"
                              checked={passwordEnabled}
                              onChange={setPasswordEnabled}
                            />
                          </div>
                        ) : currentSlide === 2 ? (
                          <div className="flex items-center justify-end scale-[0.52] sm:scale-[0.58] origin-right -my-3 -mr-1">
                            <HoloToggle
                              id="holo-toggle-slide-03"
                              checked={timeLockEnabled}
                              onChange={setTimeLockEnabled}
                            />
                          </div>
                        ) : currentSlide === 3 ? (
                          <div className="flex items-center justify-end scale-[0.52] sm:scale-[0.58] origin-right -my-3 -mr-1">
                            <HoloToggle
                              id="holo-toggle-slide-04"
                              checked={accessLimitEnabled}
                              onChange={setAccessLimitEnabled}
                            />
                          </div>
                        ) : currentSlide === 4 ? (
                          <button
                            type="button"
                            onClick={handleStartOver}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900/90 border border-rose-500/50 hover:border-rose-400 text-rose-300 hover:text-white text-[10px] sm:text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] cursor-pointer"
                            title="Reset all settings and start over fresh"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>START OVER</span>
                          </button>
                        ) : (
                          <div className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest">
                            <CyberScrambleText text={activeSlideData.category} speed={15} />
                          </div>
                        )}
                      </div>

                      {/* Slide Headline & Description (Only on slides 1-4) */}
                      {currentSlide !== 4 && (
                        <div className="space-y-1.5 text-left">
                          <h2 className="text-base sm:text-lg md:text-xl font-extrabold font-mono tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-teal-100 to-fuchsia-300 leading-tight">
                            <CyberScrambleText text={activeSlideData.title} speed={18} />
                            <span
                              className={`block text-sm sm:text-base md:text-lg mt-0.5 ${
                                activeSlideData.accentColor === 'fuchsia'
                                  ? 'text-fuchsia-400 drop-shadow-[0_0_12px_rgba(217,70,239,0.8)]'
                                  : activeSlideData.accentColor === 'emerald'
                                  ? 'text-emerald-300 drop-shadow-[0_0_12px_rgba(0,255,204,0.8)]'
                                  : activeSlideData.accentColor === 'amber'
                                  ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                                  : 'text-cyan-300 drop-shadow-[0_0_12px_rgba(0,242,255,0.8)]'
                              }`}
                            >
                              <CyberScrambleText text={activeSlideData.highlight} speed={22} delay={150} />
                            </span>
                          </h2>

                          <p className="text-[11px] sm:text-xs text-cyan-200/80 font-mono leading-relaxed line-clamp-3 md:line-clamp-4">
                            {activeSlideData.description}
                          </p>
                        </div>
                      )}

                      {/* Feature Bullets (Only on slides 1-4) */}
                      {currentSlide !== 4 && activeSlideData.bullets.length > 0 && (
                        <div className="space-y-1.5 text-left">
                          {activeSlideData.bullets.slice(0, 3).map((bullet) => (
                            <div
                              key={bullet}
                              className="flex items-start gap-1.5 rounded-md border border-cyan-500/20 bg-cyan-950/20 px-2 py-1 text-[10px] sm:text-[11px] font-mono leading-tight text-cyan-100/90"
                            >
                              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" />
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Slide 05: Dynamic Credit Cost Calculation Box */}
                      {currentSlide === 4 && (
                        <div className="flex-1 w-full bg-[#050314]/95 border border-cyan-500/40 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(0,242,255,0.2)] flex flex-col justify-between p-3 font-mono relative group min-h-[140px] sm:min-h-[160px]">
                          {/* Ambient glow and cyber scanlines */}
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,242,255,0.12),transparent_70%)] pointer-events-none" />
                          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.35)_51%)] bg-[length:100%_4px] pointer-events-none opacity-30" />

                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 relative z-10">
                            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold font-cyber">
                              <Coins className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                              <CyberScrambleText text="ESTIMATED GENERATION COST" speed={20} />
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400/40 text-cyan-300 shadow-[0_0_8px_rgba(0,242,255,0.3)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              <span>LIVE QUOTA</span>
                            </div>
                          </div>

                          {/* Hero Animated Total Cost Display */}
                          <div className="my-1.5 py-1.5 sm:py-2 px-3 rounded-lg bg-[#08041d]/90 border border-cyan-500/30 flex items-center justify-between gap-2 relative z-10 shadow-inner">
                            <div className="min-w-0">
                              <div className="text-[10px] text-cyan-400/90 uppercase tracking-wider font-bold">
                                REQUIRED CREDITS
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate">
                                {isPasscodeActive || isTimeLockActive || isAccessLimitActive
                                  ? `Base (1) + ${[isPasscodeActive && 'PIN (+1)', isTimeLockActive && 'Time (+1)', isAccessLimitActive && 'Quota (+1)'].filter(Boolean).join(' + ')}`
                                  : 'Standard URL Payload (No Locks)'}
                              </div>
                            </div>

                            <div className="flex items-baseline gap-1.5 shrink-0">
                              <motion.span
                                key={calculatedCreditCost}
                                initial={{ scale: 1.35, opacity: 0.5, y: -2 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                className="text-2xl sm:text-3xl font-black font-cyber text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-300 to-fuchsia-300 drop-shadow-[0_0_12px_rgba(0,242,255,0.7)]"
                              >
                                {calculatedCreditCost}
                              </motion.span>
                              <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 tracking-wider">
                                {calculatedCreditCost === 1 ? 'CREDIT' : 'CREDITS'}
                              </span>
                            </div>
                          </div>

                          {/* Itemized Cost Breakdown Grid */}
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] relative z-10">
                            {/* Base Payload */}
                            <div className="p-1.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 flex items-center justify-between">
                              <span className="truncate flex items-center gap-1">
                                <Code className="w-3 h-3 text-cyan-400 shrink-0" />
                                Base Payload
                              </span>
                              <span className="font-bold text-cyan-300 shrink-0">1 CR</span>
                            </div>

                            {/* Passcode Lock */}
                            <div className={`p-1.5 rounded border flex items-center justify-between transition-all duration-200 ${
                              isPasscodeActive
                                ? 'bg-fuchsia-950/40 border-fuchsia-500/50 text-fuchsia-200 shadow-[0_0_8px_rgba(217,70,239,0.3)]'
                                : 'bg-black/30 border-zinc-800/80 text-zinc-600'
                            }`}>
                              <span className="truncate flex items-center gap-1">
                                <Key className={`w-3 h-3 shrink-0 ${isPasscodeActive ? 'text-fuchsia-400' : 'text-zinc-600'}`} />
                                PIN Lock
                              </span>
                              <span className={`font-bold shrink-0 ${isPasscodeActive ? 'text-fuchsia-300' : 'text-zinc-600'}`}>
                                {isPasscodeActive ? '+1 CR' : '0 CR'}
                              </span>
                            </div>

                            {/* Time-Based Lock */}
                            <div className={`p-1.5 rounded border flex items-center justify-between transition-all duration-200 ${
                              isTimeLockActive
                                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                : 'bg-black/30 border-zinc-800/80 text-zinc-600'
                            }`}>
                              <span className="truncate flex items-center gap-1">
                                <Clock className={`w-3 h-3 shrink-0 ${isTimeLockActive ? 'text-amber-400' : 'text-zinc-600'}`} />
                                Time Lock
                              </span>
                              <span className={`font-bold shrink-0 ${isTimeLockActive ? 'text-amber-300' : 'text-zinc-600'}`}>
                                {isTimeLockActive ? '+1 CR' : '0 CR'}
                              </span>
                            </div>

                            {/* Access Limit Lock */}
                            <div className={`p-1.5 rounded border flex items-center justify-between transition-all duration-200 ${
                              isAccessLimitActive
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-[0_0_8px_rgba(0,255,204,0.3)]'
                                : 'bg-black/30 border-zinc-800/80 text-zinc-600'
                            }`}>
                              <span className="truncate flex items-center gap-1">
                                <Gauge className={`w-3 h-3 shrink-0 ${isAccessLimitActive ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                Quota Lock
                              </span>
                              <span className={`font-bold shrink-0 ${isAccessLimitActive ? 'text-emerald-300' : 'text-zinc-600'}`}>
                                {isAccessLimitActive ? '+1 CR' : '0 CR'}
                              </span>
                            </div>
                          </div>

                          {/* Account Balance & Auto-Deduct Footer */}
                          <div className="mt-1.5 pt-1.5 border-t border-cyan-500/20 flex items-center justify-between text-[10px] text-cyan-400/80 relative z-10">
                            <div className="flex items-center gap-1 truncate">
                              <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{user ? `Balance: ${user.credits} CR` : '100 Free Starter Credits'}</span>
                            </div>
                            <span className="text-emerald-400 font-bold shrink-0">
                              {user ? `After: ${Math.max(0, (user.credits || 0) - calculatedCreditCost)} CR` : 'Zero Server Cost'}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Buttons Bar */}
                  <div
                    className="pt-2 border-t border-cyan-500/20 flex items-center justify-between gap-2"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={prevSlide}
                      className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 text-xs font-mono flex items-center gap-1 shrink-0 transition-colors"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline text-[11px]">Prev</span>
                    </button>

                    {currentSlide === slides.length - 1 ? (
                      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                        <HoloGenerateButton
                          onClick={handleGenerateFinal}
                          isCopied={isCopied}
                          label="GENERATE BOX"
                          className="my-0 scale-85 sm:scale-95"
                        />
                        {isCopied && (
                          <div className="mt-0.5 text-center text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1 animate-in fade-in">
                            <Check className="w-3 h-3" />
                            <span>URL copied! Opening in new tab…</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={nextSlide}
                        className="flex-1 py-2 sm:py-2.5 px-4 rounded-lg bg-cyan-950/90 hover:bg-cyan-900/90 border border-cyan-400/60 hover:border-cyan-300 text-cyan-100 font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,242,255,0.25)] transition-all hover:scale-[1.01] active:scale-95 group"
                      >
                        <span>{activeSlideData.cta || 'NEXT STEP'}</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-cyan-300" />
                      </button>
                    )}

                    <button
                      onClick={nextSlide}
                      className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 text-xs font-mono flex items-center gap-1 shrink-0 transition-colors"
                      aria-label="Next slide"
                    >
                      <span className="hidden xs:inline text-[11px]">Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>


      </main>

      {/* Bottom Horizontal Carousel Indicators */}
      <footer className="relative z-20 w-full px-4 sm:px-6 py-2 sm:py-2.5 border-t border-cyan-500/20 bg-[#060419]/80 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-cyan-400/70 shrink-0">
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px]">
          <span className="sm:hidden text-cyan-300/80">👈 Swipe left / right to configure 👉</span>
          <span className="hidden sm:inline">Use <kbd className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 rounded text-[9px] text-cyan-200">←</kbd> <kbd className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 rounded text-[9px] text-cyan-200">→</kbd> to navigate steps</span>
        </div>

        <div className="flex items-center gap-1.5">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`relative h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-7 bg-gradient-to-r from-cyan-400 to-fuchsia-400 shadow-[0_0_10px_rgba(0,242,255,0.8)]'
                    : 'w-2 bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900/60 hover:w-3.5'
                }`}
                title={`Jump to ${slide.category}`}
                aria-label={`Jump to slide ${index + 1}`}
              />
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10px] text-cyan-400/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>ZERO STORAGE // 100% IN-URL</span>
        </div>
      </footer>

      {/* Edge Grip Handles on Center Top (PREVIEW) & Center Bottom (ACCOUNT) */}
      <EdgeGripHandles
        onOpenPreview={() => setIsPreviewDropdownOpen(true)}
        onOpenAccount={() => setIsRightToolsPanelOpen(true)}
        isPreviewOpen={isPreviewDropdownOpen}
        isAccountOpen={isRightToolsPanelOpen}
      />

      {/* Live Preview Dropdown Panel (Sliding down from Top) */}
      <PreviewDropdownPanel
        isOpen={isPreviewDropdownOpen}
        onClose={() => setIsPreviewDropdownOpen(false)}
        content={boxContent}
        title={boxTitle}
        bittyUrl={generatedUrl}
        onPreviewInTab={() => {
          if (generatedUrl) window.open(generatedUrl, '_blank');
        }}
      />

      {/* Templates Side Panel (Sliding from Left) */}
      <TemplatesSidePanel
        isOpen={isLeftTemplatesPanelOpen}
        onClose={() => setIsLeftTemplatesPanelOpen(false)}
        onSelectTemplate={(tpl: TemplatePreset) => {
          setBoxContent(tpl.content);
          setBoxTitle(tpl.title);
          setCurrentSlide(0);
          setIsLeftTemplatesPanelOpen(false);
        }}
        currentContentLength={boxContent.length}
      />

      {/* Studio Tools & Account Side Panel (Sliding from Right) */}
      <StudioToolsSidePanel
        isOpen={isRightToolsPanelOpen}
        onClose={() => setIsRightToolsPanelOpen(false)}
        account={account}
        bittyUrl={generatedUrl}
        originalBytes={boxContent.length}
        compressedBytes={generatedUrl.length}
        isCopied={isCopied}
        onOpenQr={(url) => {
          setQrModalUrl(url || generatedUrl);
          setIsQrModalOpen(true);
        }}
        onShare={() => {
          if (navigator.share && generatedUrl) {
            navigator.share({ title: boxTitle, url: generatedUrl }).catch(() => {});
          }
        }}
        onPreviewInTab={() => {
          if (generatedUrl) window.open(generatedUrl, '_blank');
        }}
        onExportZip={() => {
          exportBittyToZip(boxContent, { title: boxTitle }, generatedUrl);
        }}
        onNewBox={() => {
          setBoxContent('<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>New Box</title>\n</head>\n<body>\n  <h1>Hello Bitty Box</h1>\n</body>\n</html>');
          setBoxTitle('My Bitty Box');
          setCurrentSlide(0);
        }}
        onNavigateToSlide01={() => {
          setCurrentSlide(0);
          setIsRightToolsPanelOpen(false);
        }}
      />

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <QrModal
          url={qrModalUrl || generatedUrl || window.location.href}
          title={boxTitle}
          onClose={() => setIsQrModalOpen(false)}
        />
      )}


      {/* Warp Transition Overlay */}
      <AnimatePresence>
        {isWarping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(24px)' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="rings-warp-portal-container"
          >
            <div className="rings anim-pan">
              <div style={{ '--delay': '06' } as React.CSSProperties} className="ring anim-zoomIn" />
              <div style={{ '--delay': '04' } as React.CSSProperties} className="ring anim-zoomIn" />
              <div style={{ '--delay': '03' } as React.CSSProperties} className="ring anim-zoomIn" />
              <div style={{ '--delay': '02' } as React.CSSProperties} className="ring anim-zoomIn" />
              <div style={{ '--delay': '01' } as React.CSSProperties} className="ring anim-zoomIn" />
              <div style={{ '--delay': '00' } as React.CSSProperties} className="ring anim-zoomIn" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mt-8 flex flex-col items-center gap-2 z-10"
            >
              <div className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#070318]/90 border border-cyan-400/60 shadow-[0_0_30px_rgba(0,242,255,0.45)] backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-cyber font-bold text-xs sm:text-sm tracking-widest text-cyan-200">
                  WARPING TO STUDIO WORKSPACE
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
