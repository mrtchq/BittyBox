import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Cpu,
  Radio,
  Activity,
  Box,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Lock,
  QrCode,
  Layers,
  Code,
  Share2,
  FileCode,
  ExternalLink,
  Compass,
  CheckCircle2,
  Terminal,
  Database,
  WifiOff,
  Clock,
  Timer,
  Gauge,
  Flame,
  Bot,
  Brain,
  KeyRound
} from 'lucide-react';
import { CyberScrambleText } from './CyberScrambleText';
import { homeSlides } from '../content/homeSlides';

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
  accentColor: 'cyan' | 'fuchsia' | 'emerald' | 'amber' | 'violet';
  bullets: string[];
  cta: string;
  icon: React.ReactNode;
}

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<number>(1);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isWarping, setIsWarping] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

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
    const baseFreqs = [440, 523.25, 659.25, 783.99, 1046.5];
    const freq = baseFreqs[idx % baseFreqs.length] || 520;
    playTone(freq, 'sine', 0.18, 0.06);
    setTimeout(() => {
      playTone(freq * 1.5, 'triangle', 0.12, 0.03);
    }, 40);
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

      // Sci-fi laser sweep
      const laserOsc = ctx.createOscillator();
      const laserGain = ctx.createGain();
      laserOsc.type = 'sine';
      laserOsc.frequency.setValueAtTime(450, now);
      laserOsc.frequency.exponentialRampToValueAtTime(3200, now + 0.9);
      laserGain.gain.setValueAtTime(0.15, now);
      laserGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
      laserOsc.connect(laserGain);
      laserGain.connect(ctx.destination);
      laserOsc.start(now);
      laserOsc.stop(now + 1.0);
    } catch {}
  }, [soundEnabled, initAudio]);

  // Slides Definition: 5 Core Capabilities
  // Copy is authored in src/content/homeSlides.ts so the homepage deck, SEO copy,
  // and future static landing surface cannot drift apart.
  const slideChrome: Array<Omit<CarouselSlide, 'id' | 'title' | 'highlight' | 'description' | 'bullets' | 'cta'>> = [
    {
      category: 'ZERO-SERVER ARCHITECTURE',
      tag: '01 // IN-URL RUNTIME',
      accentColor: 'cyan',
      icon: (
        <img
          src="/bittybox-logo.png"
          alt="Bitty Box Logo"
          className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(0,242,255,0.8)]"
        />
      ),
    },
    {
      category: 'ZERO-KNOWLEDGE VAULT',
      tag: '02 // PASSWORD LOCK',
      accentColor: 'fuchsia',
      icon: <Lock className="w-8 h-8 text-fuchsia-300" />,
    },
    {
      category: 'TEMPORAL ACCESS CONTROL',
      tag: '03 // TIME-BASED LOCK',
      accentColor: 'amber',
      icon: <Clock className="w-8 h-8 text-amber-300" />,
    },
    {
      category: 'VPS-BACKED QUOTA CONTROL',
      tag: '04 // ACCESS LIMIT LOCK',
      accentColor: 'emerald',
      icon: <Gauge className="w-8 h-8 text-emerald-300" />,
    },
    {
      category: 'LIVE AGENT HANDSHAKE',
      tag: '05 // AGENTIC VOICE LOCK',
      accentColor: 'violet',
      icon: <Bot className="w-8 h-8 text-violet-300" />,
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
    icon: slideChrome[index]?.icon ?? <Box className="w-8 h-8 text-cyan-300" />,
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

    // Let the ring tunnel animate in 3D perspective and pan before revealing Studio
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 2600);
  }, [onComplete, playWarpSound]);

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
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape' || (e.key === 'Enter' && currentSlide === slides.length - 1)) {
        e.preventDefault();
        handleLaunch();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (currentSlide === slides.length - 1) {
          handleLaunch();
        } else {
          nextSlide();
        }
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

    // Minimum swipe threshold: 45px
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    setTouchStartX(null);
  };

  // Dynamic 3D Particle Warpfield Canvas
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

    const PARTICLE_COUNT = 180;
    interface StarParticle {
      x: number;
      y: number;
      z: number;
      color: string;
      size: number;
      speed: number;
    }

    const particles: StarParticle[] = [];
    const colorPalette = ['#00f2ff', '#bd00ff', '#00ffcc', '#d946ef', '#38bdf8', '#ffffff'];

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

    let frameCount = 0;

    const render = () => {
      frameCount++;
      ctx.fillStyle = 'rgba(3, 2, 14, 0.32)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Cyber grid lines at the bottom
      const gridSpacing = 40;
      const gridRows = 14;
      const gridCols = 20;
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.08)';
      ctx.lineWidth = 1;

      for (let r = 0; r < gridRows; r++) {
        ctx.beginPath();
        for (let c = 0; c < gridCols; c++) {
          const gx = (c - gridCols / 2) * gridSpacing;
          const gz = r * gridSpacing + 120;
          const gy = 170 + Math.sin(c * 0.4 + frameCount * 0.02 + r * 0.25) * 12;

          const fov = 300;
          const scale = fov / (fov + gz);
          const screenX = cx + gx * scale + mousePos.x * 20 * scale;
          const screenY = cy + gy * scale + mousePos.y * 15 * scale;

          if (c === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
        ctx.stroke();
      }

      // Star particles 3D movement
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move towards viewer (or warp when exiting)
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
          ctx.shadowBlur = isExiting ? 15 : 6;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Motion streak when exiting
          if (isExiting) {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(cx + (p.x + mousePos.x * 60) * (scale * 0.7), cy + (p.y + mousePos.y * 40) * (scale * 0.7));
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size * scale;
            ctx.stroke();
          }
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

  // Framer Motion Slide Variants (3D Horizontal Sliding with Depth & Blur)
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 160 : -160,
      opacity: 0,
      scale: 0.92,
      rotateY: dir > 0 ? 15 : -15,
      filter: 'blur(8px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring', stiffness: 320, damping: 32 },
        opacity: { duration: 0.35 },
        scale: { duration: 0.35 },
        rotateY: { duration: 0.4 },
        filter: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -160 : 160,
      opacity: 0,
      scale: 0.92,
      rotateY: dir > 0 ? -15 : 15,
      filter: 'blur(8px)',
      transition: {
        x: { type: 'spring', stiffness: 320, damping: 32 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 },
        rotateY: { duration: 0.3 },
        filter: { duration: 0.25 },
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
      {/* 3D Particle Starfield & Cyber Grid Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Cyberpunk Vignette & Grid Scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(3,2,14,0.92)_100%)] pointer-events-none z-1" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none z-1" />

      {/* Top HUD Header Navigation Bar */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-cyan-500/20 bg-[#060419]/75 backdrop-blur-xl">
        {/* Logo & Protocol Badge */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_20px_rgba(0,242,255,0.5)] overflow-hidden p-1">
            <img
              src="/bittybox-logo.png"
              alt="Bitty Box Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,242,255,0.7)]"
            />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-cyan-300 flex items-center gap-2">
              <span>BITTY BOX</span>
            </div>
            <div className="hidden sm:block text-[10px] font-mono text-cyan-400/60 tracking-wider">
              CLIENT-SIDE IN-URL OPERATING SYSTEM
            </div>
          </div>
        </div>

        {/* Live Slide Step Indicator (01 / 05) */}
        <div className="flex items-center gap-2 font-mono text-xs text-cyan-300/80 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-500/30">
          <span className="text-cyan-200 font-bold">0{currentSlide + 1}</span>
          <span className="text-cyan-500">/</span>
          <span className="text-cyan-400/60">0{slides.length}</span>
        </div>

        {/* Controls: Audio Toggle, AutoPlay, Skip */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Autoplay Toggle */}
          <button
            onClick={() => {
              setIsAutoPlay(!isAutoPlay);
              playTone(isAutoPlay ? 350 : 700, 'sine', 0.1, 0.04);
            }}
            className={`p-2 rounded-lg border transition-all ${
              isAutoPlay
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                : 'bg-black/40 border-cyan-500/20 text-cyan-600 hover:text-cyan-400'
            }`}
            title={isAutoPlay ? 'Pause Auto-Advance' : 'Enable Auto-Advance'}
            aria-label="Toggle carousel auto-play"
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Audio FX Toggle */}
          <button
            onClick={() => {
              initAudio();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                : 'bg-black/40 border-cyan-500/20 text-cyan-600 hover:text-cyan-400'
            }`}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
            aria-label="Toggle audio effects"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Skip Intro & Launch Button */}
          <button
            onClick={handleLaunch}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-950/90 to-purple-950/90 border border-fuchsia-500/60 hover:border-fuchsia-400 text-fuchsia-200 font-mono text-xs tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(189,0,255,0.3)] transition-all hover:scale-105 active:scale-95 group"
          >
            <span>ENTER STUDIO</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-fuchsia-300" />
          </button>
        </div>
      </header>

      {/* Main Interactive Carousel Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full px-3 sm:px-6 py-2 sm:py-4 md:py-1 max-w-5xl md:max-w-7xl mx-auto overflow-y-auto">
        {/* Prev Slide Arrow (Desktop & Tablet) */}
        <button
          onClick={prevSlide}
          className="hidden md:flex absolute left-2 lg:left-0 z-30 p-3 rounded-full bg-[#08051e]/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-300 hover:bg-cyan-950/90 shadow-[0_0_20px_rgba(0,242,255,0.25)] transition-all transform hover:scale-110 active:scale-95 backdrop-blur-md"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Carousel Slide Container */}
        <div className="w-full h-full flex items-center justify-center [perspective:1200px]">
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
              className="w-full max-w-3xl md:max-w-5xl md:min-h-[70dvh] bg-[#090620]/80 border border-cyan-500/30 rounded-2xl p-5 sm:p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.85),inset_0_0_25px_rgba(0,242,255,0.08)] backdrop-blur-2xl relative overflow-y-auto flex flex-col justify-between cursor-grab active:cursor-grabbing max-h-full min-h-0 scrollbar-thin scrollbar-thumb-cyan-500/40 scrollbar-track-transparent"
            >
              {/* Corner Sci-Fi Bracket Accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none" />

              {/* Glowing Background Radial Accents */}
              <div
                className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
                  activeSlideData.accentColor === 'fuchsia'
                    ? 'bg-fuchsia-500'
                    : activeSlideData.accentColor === 'emerald'
                    ? 'bg-emerald-500'
                    : activeSlideData.accentColor === 'violet'
                    ? 'bg-violet-500'
                    : activeSlideData.accentColor === 'amber'
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
              />

              {/* Slide Top Metadata Tag */}
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-mono text-[11px] sm:text-xs tracking-wider shadow-[0_0_12px_rgba(0,242,255,0.2)]">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <CyberScrambleText text={activeSlideData.tag} speed={20} />
                </div>
                <div className="text-[10px] sm:text-[11px] font-mono text-cyan-400/60 uppercase tracking-widest">
                  <CyberScrambleText text={activeSlideData.category} speed={15} />
                </div>
              </div>

              {/* Slide Dynamic Graphic / Interactive Animation Area */}
              <div className="my-2 sm:my-4 flex items-center justify-center py-2 sm:py-4">
                {currentSlide === 0 && (
                  /* Slide 1: 3D Holographic Cube & URL Byte Stream */
                  <div className="relative flex flex-col items-center justify-center w-full">
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center mb-3">
                      {/* Orbital Energy Rings */}
                      <div className="absolute w-32 h-32 sm:w-44 sm:h-44 rounded-full border border-cyan-400/30 animate-[spin_10s_linear_infinite]" />
                      <div className="absolute w-24 h-24 sm:w-36 sm:h-36 rounded-full border border-dashed border-fuchsia-500/40 animate-[spin_7s_linear_infinite_reverse]" />

                      {/* 3D Isometric Cyber Cube */}
                      <div
                        className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform duration-300"
                        style={{
                          transform: `perspective(600px) rotateX(${20 - mousePos.y * 25}deg) rotateY(${35 + mousePos.x * 30}deg)`,
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        <div className="absolute inset-0 border-2 border-cyan-400 bg-cyan-500/20 backdrop-blur-sm shadow-[0_0_20px_rgba(0,242,255,0.5)] [transform:translateZ(30px)] flex items-center justify-center p-1.5">
                          <img
                            src="/bittybox-logo.png"
                            alt="Bitty Box Logo"
                            className="w-12 h-12 sm:w-14 sm:h-14 object-contain animate-pulse drop-shadow-[0_0_12px_rgba(0,242,255,0.9)]"
                          />
                        </div>
                        <div className="absolute inset-0 border-2 border-fuchsia-500 bg-fuchsia-500/20 backdrop-blur-sm [transform:rotateY(180deg)_translateZ(30px)]" />
                        <div className="absolute inset-0 border-2 border-cyan-400 bg-cyan-500/20 backdrop-blur-sm [transform:rotateY(90deg)_translateZ(30px)]" />
                        <div className="absolute inset-0 border-2 border-fuchsia-500 bg-fuchsia-500/20 backdrop-blur-sm [transform:rotateY(-90deg)_translateZ(30px)]" />
                        <div className="absolute inset-0 border-2 border-emerald-400 bg-emerald-500/20 backdrop-blur-sm [transform:rotateX(90deg)_translateZ(30px)]" />
                        <div className="absolute inset-0 border-2 border-emerald-400 bg-emerald-500/20 backdrop-blur-sm [transform:rotateX(-90deg)_translateZ(30px)]" />
                      </div>
                    </div>

                    {/* Interactive URL Capsule Preview Bar */}
                    <div className="w-full max-w-md bg-[#050314] border border-cyan-500/40 rounded-lg px-3 py-2 font-mono text-[11px] sm:text-xs text-cyan-300 flex items-center justify-between shadow-[0_0_15px_rgba(0,0,0,0.6)]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-fuchsia-400 font-bold">https://bittybox.org/#</span>
                        <span className="text-cyan-200 truncate animate-pulse">H4sIAAAAAAAACmWO0Q2...</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded text-[10px] shrink-0 font-bold">
                        100% IN-URL
                      </span>
                    </div>
                  </div>
                )}

                {currentSlide === 1 && (
                  /* Slide 2: Compression Meter & AES Shield Lock */
                  <div className="relative flex flex-col items-center justify-center w-full max-w-md space-y-3">
                    <div className="flex items-center justify-center gap-6 sm:gap-10">
                      {/* Source Payload Box */}
                      <div className="flex flex-col items-center p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center">
                        <FileCode className="w-6 h-6 text-cyan-400 mb-1" />
                        <span className="text-[10px] font-mono text-cyan-400/70">RAW SOURCE</span>
                        <span className="text-sm font-mono font-bold text-cyan-200">14.8 KB</span>
                      </div>

                      {/* Animated Shrink Arrow */}
                      <div className="flex flex-col items-center">
                        <Zap className="w-6 h-6 text-fuchsia-400 animate-bounce" />
                        <span className="text-[10px] font-mono font-bold text-fuchsia-300">-92.4%</span>
                      </div>

                      {/* Compressed URL Payload Box */}
                      <div className="flex flex-col items-center p-3 rounded-xl bg-fuchsia-950/40 border border-fuchsia-500/40 text-center shadow-[0_0_20px_rgba(189,0,255,0.25)]">
                        <ShieldCheck className="w-6 h-6 text-fuchsia-400 mb-1" />
                        <span className="text-[10px] font-mono text-fuchsia-400/70">URL CAPSULE</span>
                        <span className="text-sm font-mono font-bold text-fuchsia-200">1.1 KB</span>
                      </div>
                    </div>

                    {/* Live AES Lock & Entropy Meter */}
                    <div className="w-full bg-[#050314] border border-fuchsia-500/30 rounded-lg p-2.5 font-mono text-[11px] text-fuchsia-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
                        <span className="truncate">AES-GCM 256-BIT CLIENT ENCRYPTION</span>
                      </div>
                      <span className="text-emerald-400 font-bold text-[10px] shrink-0">VERIFIED</span>
                    </div>
                  </div>
                )}

                {currentSlide === 2 && (
                  /* Slide 3: Temporal Decay & Time-Based Lock */
                  <div className="relative flex flex-col items-center justify-center w-full max-w-md space-y-3">
                    {/* High-Tech Digital Expiry Clock */}
                    <div className="relative flex items-center justify-center gap-3 sm:gap-4 p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                      {/* Hours */}
                      <div className="flex flex-col items-center">
                        <div className="px-3 py-2 rounded-lg bg-[#070514] border border-amber-400/50 text-amber-300 font-mono font-extrabold text-xl sm:text-2xl shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                          04
                        </div>
                        <span className="text-[9px] font-mono text-amber-400/70 mt-1 uppercase tracking-wider">HRS</span>
                      </div>

                      <span className="text-amber-400 font-mono text-2xl font-bold animate-pulse">:</span>

                      {/* Minutes */}
                      <div className="flex flex-col items-center">
                        <div className="px-3 py-2 rounded-lg bg-[#070514] border border-amber-400/50 text-amber-300 font-mono font-extrabold text-xl sm:text-2xl shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                          59
                        </div>
                        <span className="text-[9px] font-mono text-amber-400/70 mt-1 uppercase tracking-wider">MIN</span>
                      </div>

                      <span className="text-amber-400 font-mono text-2xl font-bold animate-pulse">:</span>

                      {/* Seconds */}
                      <div className="flex flex-col items-center">
                        <div className="px-3 py-2 rounded-lg bg-[#070514] border border-amber-400/50 text-amber-300 font-mono font-extrabold text-xl sm:text-2xl shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">
                          59
                        </div>
                        <span className="text-[9px] font-mono text-amber-400/70 mt-1 uppercase tracking-wider">SEC</span>
                      </div>

                      {/* Pulsing Expiry Beacon */}
                      <div className="hidden sm:flex items-center justify-center pl-2 border-l border-amber-500/30">
                        <div className="relative flex items-center justify-center w-10 h-10">
                          <div className="absolute w-8 h-8 rounded-full border border-dashed border-amber-400/50 animate-spin-slow" />
                          <Clock className="w-5 h-5 text-amber-300 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Temporal Status HUD */}
                    <div className="w-full bg-[#050314] border border-amber-500/30 rounded-lg p-2.5 font-mono text-[11px] text-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span className="truncate">TEMPORAL EXPIRY ENGINE // AUTO-DECAY ACTIVE</span>
                      </div>
                      <span className="text-amber-400 font-bold text-[10px] shrink-0">EPOCH SECURED</span>
                    </div>
                  </div>
                )}

                {currentSlide === 3 && (
                  /* Slide 4: View Quota & Burn-After-Reading Access Limits */
                  <div className="relative flex flex-col items-center justify-center w-full max-w-md space-y-3">
                    <div className="w-full bg-[#050314] border border-emerald-500/40 rounded-xl p-3 sm:p-4 shadow-[0_0_25px_rgba(0,255,204,0.15)] font-mono">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-3">
                        <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                          <Gauge className="w-4 h-4 text-emerald-400" />
                          <span>SESSION QUOTA METER</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-300">
                          <Flame className="w-3 h-3 text-emerald-400 animate-pulse" />
                          <span>BURN-ON-READ</span>
                        </div>
                      </div>

                      {/* Segmented Energy View Bars */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-400/80">Authorized Accesses:</span>
                          <span className="text-emerald-200 font-bold">01 / 05 Consumed</span>
                        </div>

                        {/* 5 Segmented Blocks */}
                        <div className="grid grid-cols-5 gap-1.5 h-3.5">
                          <div className="bg-emerald-400 rounded-sm shadow-[0_0_8px_rgba(0,255,204,0.8)] animate-pulse" />
                          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-sm" />
                          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-sm" />
                          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-sm" />
                          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-sm" />
                        </div>

                        <div className="flex justify-between text-[10px] text-emerald-400/60 pt-1">
                          <span>Active Session</span>
                          <span>4 Locked Quotas Remaining</span>
                        </div>
                      </div>
                    </div>

                    {/* Quota Lock HUD */}
                    <div className="w-full bg-[#050314] border border-emerald-500/30 rounded-lg p-2.5 font-mono text-[11px] text-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="truncate">TAMPER-EVIDENT CLIENT COUNTER</span>
                      </div>
                      <span className="text-emerald-400 font-bold text-[10px] shrink-0">QUOTA ENFORCED</span>
                    </div>
                  </div>
                )}

                {currentSlide === 4 && (
                  /* Slide 5: Innovative Autonomous Agentic Lock */
                  <div className="relative flex flex-col items-center justify-center w-full max-w-md space-y-3">
                    {/* Neural Agent Core Orb */}
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-36 h-36 rounded-full border border-dashed border-violet-400/40 animate-[spin_8s_linear_infinite]" />
                      <div className="absolute w-28 h-28 rounded-full border border-cyan-400/30 animate-[spin_6s_linear_infinite_reverse]" />

                      <div className="relative p-4 bg-[#070318] border-2 border-violet-400 rounded-2xl shadow-[0_0_30px_rgba(189,0,255,0.4)] flex items-center justify-center">
                        <Bot className="w-12 h-12 text-violet-300" />
                        <Brain className="w-5 h-5 text-cyan-300 animate-pulse absolute -bottom-1 -right-1" />
                      </div>
                    </div>

                    {/* AI Proof-of-Reasoning Challenge Matrix */}
                    <div className="w-full bg-[#050314] border border-violet-500/40 rounded-xl p-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-violet-500/20 pb-1.5 mb-2">
                        <div className="flex items-center gap-1.5 text-violet-300 font-bold text-[11px]">
                          <Cpu className="w-3.5 h-3.5 text-violet-400" />
                          <span>AUTONOMOUS AGENT HANDSHAKE</span>
                        </div>
                        <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded font-bold">
                          M2M GATED
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-violet-200/90 text-left font-mono">
                        <div className="flex items-center gap-2 text-cyan-300">
                          <span className="text-fuchsia-400">challenge:</span>
                          <span>ProofOfAgentChallenge.verify()</span>
                        </div>
                        <div className="text-[10px] text-violet-400/70">
                          // Semantic reasoning puzzle solved • Autonomous agent unlocked
                        </div>
                      </div>
                    </div>

                    {/* Live Agentic Status HUD */}
                    <div className="w-full bg-[#050314] border border-violet-500/30 rounded-lg p-2.5 font-mono text-[11px] text-violet-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                        <span className="truncate">AGENTIC REASONING AUTHENTICATED</span>
                      </div>
                      <span className="text-violet-300 font-bold text-[10px] shrink-0">AI-SECURED</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Slide Headline & Description */}
              <div className="text-center space-y-2 mt-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-mono tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-teal-100 to-fuchsia-300 flex flex-wrap items-center justify-center gap-x-2">
                  <CyberScrambleText text={activeSlideData.title} speed={18} />
                  <span
                    className={
                      activeSlideData.accentColor === 'fuchsia'
                        ? 'text-fuchsia-400 drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]'
                        : activeSlideData.accentColor === 'emerald'
                        ? 'text-emerald-300 drop-shadow-[0_0_15px_rgba(0,255,204,0.8)]'
                        : activeSlideData.accentColor === 'violet'
                        ? 'text-violet-300 drop-shadow-[0_0_15px_rgba(189,0,255,0.8)]'
                        : activeSlideData.accentColor === 'amber'
                        ? 'text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]'
                        : 'text-cyan-300 drop-shadow-[0_0_15px_rgba(0,242,255,0.8)]'
                    }
                  >
                    <CyberScrambleText text={activeSlideData.highlight} speed={22} delay={150} />
                  </span>
                </h2>

                <p className="text-xs sm:text-sm text-cyan-200/80 font-mono max-w-2xl mx-auto leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {activeSlideData.description}
                </p>

                <div className="grid gap-1.5 sm:grid-cols-3 max-w-3xl mx-auto pt-1 text-left">
                  {activeSlideData.bullets.slice(0, 3).map((bullet) => (
                    <div
                      key={bullet}
                      className="flex items-start gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-2.5 py-2 text-[10px] sm:text-[11px] font-mono leading-snug text-cyan-100/80"
                    >
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Next or Launch Studio */}
              <div className="mt-4 sm:mt-6 pt-3 border-t border-cyan-500/20 flex items-center justify-between gap-3">
                <button
                  onClick={prevSlide}
                  className="md:hidden p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 text-xs font-mono flex items-center gap-1"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden xs:inline">Prev</span>
                </button>

                {currentSlide === slides.length - 1 ? (
                  <button
                    id="splash-enter-btn"
                    onClick={handleLaunch}
                    className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-fuchsia-500 text-black font-mono font-extrabold text-sm sm:text-base tracking-wider flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,242,255,0.6)] hover:shadow-[0_0_45px_rgba(0,242,255,0.9)] hover:scale-[1.02] active:scale-95 transition-all duration-300"
                  >
                    <Zap className="w-5 h-5 fill-black animate-bounce" />
                    <span>{activeSlideData.cta || 'LAUNCH STUDIO WORKSPACE'}</span>
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </button>
                ) : (
                  <button
                    onClick={nextSlide}
                    className="flex-1 py-2.5 sm:py-3 px-6 rounded-xl bg-cyan-950/90 hover:bg-cyan-900/90 border border-cyan-400/60 hover:border-cyan-300 text-cyan-100 font-mono font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all hover:scale-[1.01] active:scale-95 group"
                  >
                    <span>NEXT SLIDE</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cyan-300" />
                  </button>
                )}

                <button
                  onClick={nextSlide}
                  className="md:hidden p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 text-xs font-mono flex items-center gap-1"
                  aria-label="Next slide"
                >
                  <span className="hidden xs:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Next Slide Arrow (Desktop & Tablet) */}
        <button
          onClick={nextSlide}
          className="hidden md:flex absolute right-2 lg:right-0 z-30 p-3 rounded-full bg-[#08051e]/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-300 hover:bg-cyan-950/90 shadow-[0_0_20px_rgba(0,242,255,0.25)] transition-all transform hover:scale-110 active:scale-95 backdrop-blur-md"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </main>

      {/* Bottom Horizontal Carousel Pagination & Navigation HUD */}
      <footer className="relative z-20 w-full px-4 sm:px-8 py-3.5 border-t border-cyan-500/20 bg-[#060419]/80 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-cyan-400/70">
        {/* Swipe & Keyboard Hint */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="sm:hidden text-cyan-300/80">👈 Swipe left / right to navigate 👉</span>
          <span className="hidden sm:inline">Use <kbd className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 rounded text-[10px] text-cyan-200">←</kbd> <kbd className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 rounded text-[10px] text-cyan-200">→</kbd> to browse • <kbd className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 rounded text-[10px] text-cyan-200">ESC</kbd> to jump</span>
        </div>

        {/* Interactive Glowing Carousel Indicator Pills */}
        <div className="flex items-center gap-2">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`relative h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-8 bg-gradient-to-r from-cyan-400 to-fuchsia-400 shadow-[0_0_12px_rgba(0,242,255,0.8)]'
                    : 'w-2.5 bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900/60 hover:w-4'
                }`}
                title={`Jump to ${slide.category}`}
                aria-label={`Jump to slide ${index + 1}`}
              />
            );
          })}
        </div>

        {/* Status Protocol Badge */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-cyan-400/60">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>ZERO STORAGE // 100% CLIENT COMPUTE</span>
        </div>
      </footer>

      {/* Quantum Hyperspace Ring Tunnel Warp Transition Overlay */}
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
              <span className="text-[11px] font-mono text-fuchsia-300/80 tracking-widest uppercase">
                Initializing In-URL Zero-Server Matrix...
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
