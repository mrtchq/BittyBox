import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Check
} from 'lucide-react';
import { CyberScrambleText } from './CyberScrambleText';
import { HoloGenerateButton } from './HoloGenerateButton';
import { homeSlides } from '../content/homeSlides';
import { buildBittyUrl, compressContent, getRenderedHtml } from '../utils/bittyEngine';
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

  const [timeLockEnabled, setTimeLockEnabled] = useState<boolean>(false);
  const [timeExpiryHours, setTimeExpiryHours] = useState<number>(24);
  const [showTimeCountdown, setShowTimeCountdown] = useState<boolean>(true);

  const [accessLimitEnabled, setAccessLimitEnabled] = useState<boolean>(false);
  const [accessLimitMaxOpens, setAccessLimitMaxOpens] = useState<number>(1);
  const [showRemainingAccessCount, setShowRemainingAccessCount] = useState<boolean>(true);

  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

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
      category: 'SUMMARY & LAUNCH',
      tag: '05 // REVIEW & GENERATE',
      accentColor: 'cyan',
      icon: <Sparkles className="w-6 h-6 text-cyan-300" />,
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

  // Generate Bitty Box with all active lock configurations
  const handleGenerateFinal = useCallback(async () => {
    const source = boxContent.trim() || DEFAULT_STARTER_CODE;

    // 1. Open new tab synchronously in direct user click gesture to prevent browser popup blocking
    let newTab: Window | null = null;
    try {
      newTab = window.open('', '_blank');
    } catch {}

    try {
      const html = addTimeOfDayTheme(getRenderedHtml(source, {
        title: boxTitle || 'Bitty Box',
        language: 'en',
      }));

      const pass = passwordEnabled && passwordValue.trim() ? passwordValue.trim() : undefined;

      const encoded = await compressContent(html, {
        password: pass,
        mimeType: 'text/html',
        isRawHtml: true,
      });

      if (!encoded) {
        if (newTab) newTab.close();
        return;
      }

      const meta: BittyMetadata = {
        title: boxTitle || 'Bitty Box',
        description: 'A self-contained webpage living entirely in a URL',
        favicon: '📦',
        includeMetadata: true,
      };

      if (timeLockEnabled) {
        meta.lockConfig = {
          timeWindow: {
            enabled: true,
            notBefore: null,
            notAfter: new Date(Date.now() + timeExpiryHours * 3600 * 1000).toISOString(),
            showCountdown: showTimeCountdown,
          },
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
        try {
          const res = await fetch('/api/boxes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: boxTitle || 'Bitty Box',
              bittyUrl: encoded.compressedUrl,
              lockConfig: {
                openLimit: {
                  enabled: true,
                  maxOpens: accessLimitMaxOpens,
                  opensUsed: 0,
                  showRemainingCount: showRemainingAccessCount,
                },
                timeWindow: timeLockEnabled ? meta.lockConfig?.timeWindow : null,
              },
            }),
          });
          const data = await res.json();
          if (data.boxId) {
            meta.boxId = data.boxId;
          }
        } catch {
          // Client-side fallback
        }
      }

      const longUrl = buildBittyUrl(encoded.compressedUrl, meta);
      setGeneratedUrl(longUrl);

      try {
        await navigator.clipboard.writeText(longUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3500);
      } catch {}

      if (newTab && !newTab.closed) {
        newTab.location.href = longUrl;
      } else {
        window.open(longUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Failed to generate Bitty Box:', err);
      if (newTab) newTab.close();
    }
  }, [boxContent, boxTitle, passwordEnabled, passwordValue, timeLockEnabled, timeExpiryHours, showTimeCountdown, accessLimitEnabled, accessLimitMaxOpens, showRemainingAccessCount]);

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

        {/* Controls: Audio Toggle, Enter Studio */}
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
            onClick={handleLaunch}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-fuchsia-950/90 to-purple-950/90 border border-fuchsia-500/60 hover:border-fuchsia-400 text-fuchsia-200 font-mono text-xs tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(189,0,255,0.25)] transition-all hover:scale-105 active:scale-95 group"
          >
            <span>ENTER STUDIO</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-fuchsia-300" />
          </button>
        </div>
      </header>

      {/* Main Interactive Carousel Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full px-3 sm:px-6 py-2 max-w-5xl lg:max-w-6xl mx-auto min-h-0 overflow-y-auto">
        <button
          onClick={prevSlide}
          className="hidden md:flex absolute left-2 lg:left-0 z-30 p-2.5 rounded-full bg-[#08051e]/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-300 hover:bg-cyan-950/90 shadow-[0_0_15px_rgba(0,242,255,0.25)] transition-all transform hover:scale-110 active:scale-95 backdrop-blur-md"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

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
                      SLIDE 1 (Index 0): TEXT INPUT / COMPOSER FIELD
                      ========================================================= */}
                  {currentSlide === 0 && (
                    <div className="w-full bg-[#050314]/90 border border-cyan-500/40 rounded-xl p-3 sm:p-3.5 shadow-[0_0_25px_rgba(0,242,255,0.15)] font-mono flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
                        <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
                          <Code className="w-3.5 h-3.5 text-cyan-400" />
                          <span>INSERT CONTENT</span>
                        </div>
                        <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded font-bold">
                          {boxContent.length} BYTES
                        </span>
                      </div>

                      <textarea
                        value={boxContent}
                        onChange={e => setBoxContent(e.target.value)}
                        onFocus={() => setIsAutoPlay(false)}
                        onPointerDown={e => e.stopPropagation()}
                        aria-label="Content for your Bitty Box"
                        placeholder="Paste HTML or type the content for your new Bitty Box…"
                        className="w-full flex-1 min-h-[110px] sm:min-h-[130px] md:min-h-[140px] resize-none rounded-lg border border-cyan-400/30 bg-[#02010a] p-2.5 text-xs leading-5 text-cyan-100 placeholder:text-cyan-400/40 outline-none transition focus:border-cyan-300 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                      />

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
                          <div className="text-[11px] text-amber-300/80 font-bold">SELECT EXPIRATION DURATION:</div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[1, 6, 24, 168].map(hrs => (
                              <button
                                key={hrs}
                                type="button"
                                onClick={() => setTimeExpiryHours(hrs)}
                                className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all ${
                                  timeExpiryHours === hrs
                                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                    : 'bg-amber-950/30 border-amber-500/30 text-amber-400 hover:bg-amber-900/40'
                                }`}
                              >
                                {hrs === 168 ? '7 Days' : `${hrs}h`}
                              </button>
                            ))}
                          </div>

                          <label className="flex items-center gap-2 pt-1 text-[11px] text-amber-200 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={showTimeCountdown}
                              onChange={e => setShowTimeCountdown(e.target.checked)}
                              className="w-3.5 h-3.5 rounded border border-amber-500/50 bg-[#02010a] text-amber-500 accent-amber-400 focus:ring-1 focus:ring-amber-400"
                            />
                            <span className="font-mono text-[10px] sm:text-[11px] text-amber-200/90">
                              Show live countdown timer to viewers
                            </span>
                          </label>

                          <div className="flex items-center gap-1.5 text-[10px] text-amber-300/80 pt-0.5">
                            <Timer className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">AUTO-DECAY // SELF-DESTRUCTS AFTER DURATION</span>
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

                          <label className="flex items-center gap-2 pt-1 text-[11px] text-emerald-200 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={showRemainingAccessCount}
                              onChange={e => setShowRemainingAccessCount(e.target.checked)}
                              className="w-3.5 h-3.5 rounded border border-emerald-500/50 bg-[#02010a] text-emerald-500 accent-emerald-400 focus:ring-1 focus:ring-emerald-400"
                            />
                            <span className="font-mono text-[10px] sm:text-[11px] text-emerald-200/90">
                              Show remaining unlocks counter to viewers
                            </span>
                          </label>

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
                      SLIDE 5 (Index 4): FINAL CONFIGURATION SUMMARY
                      ========================================================= */}
                  {currentSlide === 4 && (
                    <div className="w-full bg-[#050314]/90 border border-cyan-500/40 rounded-xl p-3 sm:p-3.5 shadow-[0_0_25px_rgba(0,242,255,0.2)] font-mono text-left flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
                        <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          <span>CONFIGURATION SUMMARY</span>
                        </div>
                        <span className="text-[9px] text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                          READY TO PACK
                        </span>
                      </div>

                      {/* 2x2 Compact Summary Cards Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* 1. Content */}
                        <div className="p-2 rounded-lg bg-[#08031a] border border-cyan-500/30 flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-cyan-300 text-[10px]">CONTENT</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                              {boxContent.length} B
                            </span>
                          </div>
                          <div className="text-[10px] text-cyan-300/70 truncate mt-1">
                            {boxContent.trim() ? (boxContent.slice(0, 24) + '…') : 'Default Starter'}
                          </div>
                        </div>

                        {/* 2. Passcode */}
                        <div className={`p-2 rounded-lg border flex flex-col justify-between ${
                          passwordEnabled && passwordValue.trim()
                            ? 'bg-fuchsia-950/30 border-fuchsia-500/40'
                            : 'bg-[#08031a] border-zinc-800'
                        }`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-bold text-[10px] ${passwordEnabled && passwordValue.trim() ? 'text-fuchsia-300' : 'text-zinc-400'}`}>PASSCODE</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                              passwordEnabled && passwordValue.trim()
                                ? 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500/50'
                                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                            }`}>
                              {passwordEnabled && passwordValue.trim() ? 'LOCKED' : 'OFF'}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400/80 truncate mt-1">
                            {passwordEnabled && passwordValue.trim() ? `${passwordValue.length}-Digit PIN` : 'Public URL'}
                          </div>
                        </div>

                        {/* 3. Timed Lock */}
                        <div className={`p-2 rounded-lg border flex flex-col justify-between ${
                          timeLockEnabled
                            ? 'bg-amber-950/30 border-amber-500/40'
                            : 'bg-[#08031a] border-zinc-800'
                        }`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-bold text-[10px] ${timeLockEnabled ? 'text-amber-300' : 'text-zinc-400'}`}>EXPIRY</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                              timeLockEnabled
                                ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                            }`}>
                              {timeLockEnabled ? `${timeExpiryHours === 168 ? '7d' : `${timeExpiryHours}h`}` : 'OFF'}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400/80 truncate mt-1">
                            {timeLockEnabled ? (showTimeCountdown ? 'With Timer' : 'Hidden') : 'Indefinite'}
                          </div>
                        </div>

                        {/* 4. Access Limit */}
                        <div className={`p-2 rounded-lg border flex flex-col justify-between ${
                          accessLimitEnabled
                            ? 'bg-emerald-950/30 border-emerald-500/40'
                            : 'bg-[#08031a] border-zinc-800'
                        }`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-bold text-[10px] ${accessLimitEnabled ? 'text-emerald-300' : 'text-zinc-400'}`}>QUOTA</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                              accessLimitEnabled
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                            }`}>
                              {accessLimitEnabled ? `${accessLimitMaxOpens}` : 'OFF'}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400/80 truncate mt-1">
                            {accessLimitEnabled ? `${accessLimitMaxOpens === 1 ? 'Burn on Read' : `${accessLimitMaxOpens} Opens`}` : 'Unlimited'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    RIGHT COLUMN (md:col-span-6): Slide Info & Actions
                    ───────────────────────────────────────────────────────────── */}
                <div className="md:col-span-6 flex flex-col justify-between space-y-3 sm:space-y-4">
                  {/* Slide Top Metadata Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] sm:text-[11px] tracking-wider shadow-[0_0_12px_rgba(0,242,255,0.2)]">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <CyberScrambleText text={activeSlideData.tag} speed={20} />
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest">
                      <CyberScrambleText text={activeSlideData.category} speed={15} />
                    </div>
                  </div>

                  {/* Slide Headline & Description */}
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

                  {/* Feature Bullets */}
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

        <button
          onClick={nextSlide}
          className="hidden md:flex absolute right-2 lg:right-0 z-30 p-2.5 rounded-full bg-[#08051e]/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-300 hover:bg-cyan-950/90 shadow-[0_0_15px_rgba(0,242,255,0.25)] transition-all transform hover:scale-110 active:scale-95 backdrop-blur-md"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
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
