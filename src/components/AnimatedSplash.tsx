import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, Zap, Terminal, Volume2, VolumeX, ArrowRight, ShieldCheck, Cpu, Radio, Orbit, Activity, Box } from 'lucide-react';

interface AnimatedSplashProps {
  onComplete: () => void;
}

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'boot' | 'assemble' | 'ready' | 'exit'>('boot');
  const [bootProgress, setBootProgress] = useState(0);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [scrambleTitle, setScrambleTitle] = useState('BITTYBOX PROTOCOL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [telemetry, setTelemetry] = useState({
    fps: 60,
    entropy: '0x8F9A2C',
    qubits: 1024,
    compressionRate: 92.4,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioInitializedRef = useRef(false);

  // Initialize Web Audio API Synthesizer (Pure native web audio, zero external dependencies)
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
    audioInitializedRef.current = true;
  }, []);

  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, gainValue = 0.05) => {
    if (!soundEnabled || !audioCtxRef.current) return;
    try {
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
  }, [soundEnabled]);

  const playWarpSound = useCallback(() => {
    if (!soundEnabled || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      
      // Deep sub bass drop
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(220, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + 1.2);
      subGain.gain.setValueAtTime(0.2, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 1.2);

      // High frequency laser sweep
      const laserOsc = ctx.createOscillator();
      const laserGain = ctx.createGain();
      laserOsc.type = 'sine';
      laserOsc.frequency.setValueAtTime(400, now);
      laserOsc.frequency.exponentialRampToValueAtTime(2400, now + 0.8);
      laserGain.gain.setValueAtTime(0.12, now);
      laserGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      laserOsc.connect(laserGain);
      laserGain.connect(ctx.destination);
      laserOsc.start(now);
      laserOsc.stop(now + 0.9);
    } catch {}
  }, [soundEnabled]);

  // Handle Exit and Transition to Full App
  const handleEnter = useCallback(() => {
    initAudio();
    playWarpSound();
    setPhase('exit');
    setTimeout(() => {
      onComplete();
    }, 1100);
  }, [initAudio, onComplete, playWarpSound]);

  // Keyboard shortcut: ESC / Enter to jump in
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnter]);

  // Track mouse coordinates for interactive 3D parallax & particle steering
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2;
    const y = (clientY / innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  };

  // Text Decryption Scramble Effect
  useEffect(() => {
    const TARGET = 'BITTYBOX // V2.0';
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=<>[]{}~';
    let iteration = 0;
    const interval = setInterval(() => {
      setScrambleTitle(
        TARGET.split('')
          .map((letter, index) => {
            if (index < iteration) return letter;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );
      if (iteration >= TARGET.length) {
        clearInterval(interval);
      }
      iteration += 1 / 3;
    }, 35);
    return () => clearInterval(interval);
  }, []);

  // Boot sequence logs & progress counter
  useEffect(() => {
    const logs = [
      '>> INITIALIZING ZERO-SERVER QUANTUM KERNEL...',
      '>> ALLOCATING BUFFER: MEM_BLOCK_0x7FFE99014',
      '>> LOADING PACO / DEFLATE COMPRESSION ENGINE [OK]',
      '>> PARSING BASE64URL HASH CAPSULE SPEC [OK]',
      '>> SYNCHRONIZING REALTIME DOM SANDBOX [OK]',
      '>> CALIBRATING 1024-BIT CLIENT-SIDE CRYPTOGRAPHIC ENGINE [OK]',
      '>> ESTABLISHING QUANTUM ISOLATION MATRIX...',
      '>> SYSTEM ARMED: ZERO DATABASE // ZERO COOKIES // 100% IN-URL',
    ];

    let currentLogIndex = 0;
    const logTimer = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setTerminalLines(prev => [...prev.slice(-4), logs[currentLogIndex]]);
        playTone(350 + currentLogIndex * 60, 'sine', 0.08, 0.03);
        currentLogIndex++;
      }
    }, 280);

    const progressTimer = setInterval(() => {
      setBootProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        const step = Math.floor(Math.random() * 8) + 3;
        return Math.min(100, prev + step);
      });
    }, 80);

    const phase1Timer = setTimeout(() => {
      setPhase('assemble');
      playTone(880, 'triangle', 0.25, 0.08);
    }, 1400);

    const phase2Timer = setTimeout(() => {
      setPhase('ready');
      playTone(1046.5, 'sine', 0.35, 0.1);
    }, 2900);

    return () => {
      clearInterval(logTimer);
      clearInterval(progressTimer);
      clearTimeout(phase1Timer);
      clearTimeout(phase2Timer);
    };
  }, [playTone]);

  // Interactive 3D Quantum Matrix Canvas Animation
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

    // Particle nodes for 3D sphere / warp field
    const PARTICLE_COUNT = 240;
    interface Particle {
      x: number;
      y: number;
      z: number;
      originX: number;
      originY: number;
      originZ: number;
      vx: number;
      vy: number;
      vz: number;
      size: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = ['#00f2ff', '#bd00ff', '#ff007f', '#00ffcc', '#ffffff'];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 180 + Math.random() * 220;

      const px = radius * Math.sin(phi) * Math.cos(theta);
      const py = radius * Math.sin(phi) * Math.sin(theta);
      const pz = radius * Math.cos(phi);

      particles.push({
        x: px,
        y: py,
        z: pz,
        originX: px,
        originY: py,
        originZ: pz,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let angleX = 0;
    let angleY = 0;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      ctx.fillStyle = 'rgba(5, 5, 21, 0.28)';
      ctx.fillRect(0, 0, width, height);

      // Center coordinates
      const cx = width / 2;
      const cy = height / 2;

      // Rotation angles with mouse influence
      angleX += 0.004 + mousePos.y * 0.005;
      angleY += 0.006 + mousePos.x * 0.005;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Draw Grid Wave in bottom hemisphere
      const gridSpacing = 45;
      const gridRows = 16;
      const gridCols = 24;
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.07)';
      ctx.lineWidth = 1;

      for (let r = 0; r < gridRows; r++) {
        ctx.beginPath();
        for (let c = 0; c < gridCols; c++) {
          const gx = (c - gridCols / 2) * gridSpacing;
          const gz = r * gridSpacing + 100;
          const gy = 180 + Math.sin(c * 0.4 + frameCount * 0.03 + r * 0.2) * 15;

          const fov = 350;
          const scale = fov / (fov + gz);
          const screenX = cx + gx * scale;
          const screenY = cy + gy * scale;

          if (c === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
        ctx.stroke();
      }

      // Draw and project 3D particle nodes
      const projected: { x: number; y: number; z: number; size: number; color: string }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 3D rotation
        let y1 = p.y * cosX - p.z * sinX;
        let z1 = p.z * cosX + p.y * sinX;
        let x1 = p.x * cosY - z1 * sinY;
        let z2 = z1 * cosY + p.x * sinY;

        // Warp effect in exit phase
        if (phase === 'exit') {
          z2 -= frameCount * 8;
        }

        const fov = 420;
        const scale = fov / (fov + z2 + 300);

        if (scale > 0) {
          const sx = cx + x1 * scale;
          const sy = cy + y1 * scale;
          projected.push({ x: sx, y: sy, z: z2, size: p.size * scale, color: p.color });

          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.6, p.size * scale), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw constellation connections between nearby projected points
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i += 2) {
        for (let j = i + 1; j < projected.length; j += 3) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 65) {
            ctx.strokeStyle = `rgba(0, 242, 255, ${0.18 * (1 - dist / 65)})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
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
  }, [mousePos, phase]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 overflow-hidden bg-[#03020c] text-cyan-100 flex flex-col items-center justify-between select-none transition-all duration-1000 ${
        phase === 'exit' ? 'scale-125 opacity-0 blur-lg filter' : 'opacity-100'
      }`}
    >
      {/* 3D WebGL Matrix Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Futuristic CRT Scanlines & Cyber Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(3,2,12,0.85)_100%)] pointer-events-none z-1" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-1" />

      {/* Top Cyber Telemetry Bar */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-cyan-500/20 bg-[#060417]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,255,0.4)]">
            <Box className="w-4 h-4 text-cyan-300 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-cyan-300 flex items-center gap-2">
              <span>BITTYBOX SYSTEM BOOT</span>
              <span className="px-1.5 py-0.2 bg-fuchsia-950 text-fuchsia-300 text-[10px] border border-fuchsia-500/40 rounded">
                SECURE_URL_VM
              </span>
            </div>
            <div className="text-[10px] font-mono text-cyan-400/60 tracking-wider">
              PROTOCOL: RFC-7946 // ZERO-STORAGE // PURE CLIENT-SIDE
            </div>
          </div>
        </div>

        {/* Live HUD Status Indicators */}
        <div className="hidden md:flex items-center gap-6 text-[11px] font-mono text-cyan-300/80">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>CORE: <strong className="text-cyan-200">ACTIVE</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
            <span>COMPRESSION: <strong className="text-fuchsia-300">{telemetry.compressionRate}%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SANDBOX: <strong className="text-emerald-300">ISOLATED</strong></span>
          </div>
        </div>

        {/* Audio Toggle & Skip Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              initAudio();
              setSoundEnabled(!soundEnabled);
            }}
            className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/40 transition-all"
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-cyan-500" />}
          </button>
          <button
            onClick={handleEnter}
            className="px-3 py-1.5 rounded-lg bg-fuchsia-950/80 border border-fuchsia-500/50 hover:bg-fuchsia-900/60 hover:border-fuchsia-400 text-fuchsia-200 font-mono text-xs tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(189,0,255,0.3)] transition-all group"
          >
            <span>SKIP INTRO</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* Central 3D Quantum Hologram & Interaction Core */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-4xl w-full px-6 text-center my-4">
        {/* Holographic 3D Quantum Capsule (CSS 3D Isometric Cube Container) */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Animated Quantum Energy Rings */}
          <div
            className="absolute w-72 h-72 rounded-full border border-cyan-400/30 animate-[spin_12s_linear_infinite]"
            style={{
              boxShadow: '0 0 50px rgba(0, 242, 255, 0.2), inset 0 0 50px rgba(0, 242, 255, 0.1)',
              transform: `rotateX(${mousePos.y * 20}deg) rotateY(${mousePos.x * 20}deg)`,
            }}
          />
          <div
            className="absolute w-60 h-60 rounded-full border border-dashed border-fuchsia-500/40 animate-[spin_8s_linear_infinite_reverse]"
            style={{
              boxShadow: '0 0 35px rgba(189, 0, 255, 0.25)',
              transform: `rotateX(${-mousePos.y * 25}deg) rotateY(${-mousePos.x * 25}deg)`,
            }}
          />
          <div className="absolute w-44 h-44 rounded-full border border-emerald-400/30 animate-[spin_5s_linear_infinite]" />

          {/* Central Pulsing Holographic 3D Isometric Cube */}
          <div
            className="relative w-36 h-36 flex items-center justify-center transition-transform duration-300"
            style={{
              transform: `perspective(600px) rotateX(${25 - mousePos.y * 30}deg) rotateY(${45 + mousePos.x * 35}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Cube Faces */}
            <div className="absolute inset-0 border-2 border-cyan-400/80 bg-cyan-500/10 backdrop-blur-sm shadow-[0_0_30px_rgba(0,242,255,0.4)] [transform:translateZ(45px)] flex items-center justify-center">
              <Box className="w-12 h-12 text-cyan-300 animate-pulse" />
            </div>
            <div className="absolute inset-0 border-2 border-fuchsia-500/80 bg-fuchsia-500/10 backdrop-blur-sm shadow-[0_0_30px_rgba(189,0,255,0.4)] [transform:rotateY(180deg)_translateZ(45px)]" />
            <div className="absolute inset-0 border-2 border-cyan-400/80 bg-cyan-500/10 backdrop-blur-sm shadow-[0_0_30px_rgba(0,242,255,0.4)] [transform:rotateY(90deg)_translateZ(45px)]" />
            <div className="absolute inset-0 border-2 border-fuchsia-500/80 bg-fuchsia-500/10 backdrop-blur-sm shadow-[0_0_30px_rgba(189,0,255,0.4)] [transform:rotateY(-90deg)_translateZ(45px)]" />
            <div className="absolute inset-0 border-2 border-emerald-400/80 bg-emerald-500/10 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,204,0.4)] [transform:rotateX(90deg)_translateZ(45px)]" />
            <div className="absolute inset-0 border-2 border-emerald-400/80 bg-emerald-500/10 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,204,0.4)] [transform:rotateX(-90deg)_translateZ(45px)]" />

            {/* Floating Energy Core */}
            <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-fuchsia-400 blur-sm animate-ping opacity-75" />
          </div>
        </div>

        {/* Main Decrypted Title & Subheading */}
        <div className="space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-mono text-xs tracking-widest shadow-[0_0_15px_rgba(0,242,255,0.25)]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>QUANTUM CAPSULE ENGINE ACTIVE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-wider font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-fuchsia-400 drop-shadow-[0_0_30px_rgba(0,242,255,0.6)]">
            {scrambleTitle}
          </h1>

          <p className="text-sm sm:text-lg text-cyan-200/80 font-mono max-w-2xl mx-auto leading-relaxed">
            Compress and transmit full HTML, interactive apps, and encrypted vaults living entirely within self-contained URL fragments.
          </p>
        </div>

        {/* Live Diagnostics Terminal Box */}
        <div className="w-full max-w-xl bg-[#08051e]/85 border border-cyan-500/30 rounded-xl p-4 font-mono text-left text-xs text-cyan-300/90 shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(0,242,255,0.05)] backdrop-blur-md mb-6">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3 text-[11px] text-cyan-400/60">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>LIVE TELEMETRY STREAM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ONLINE</span>
            </div>
          </div>

          <div className="space-y-1.5 h-24 overflow-hidden flex flex-col justify-end">
            {terminalLines.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2 text-cyan-300/80 animate-fade-in">
                <span className="text-fuchsia-400 select-none">&gt;</span>
                <span className="truncate">{line}</span>
              </div>
            ))}
          </div>

          {/* Holographic Progress Bar */}
          <div className="mt-3 pt-2 border-t border-cyan-500/20">
            <div className="flex items-center justify-between text-[10px] text-cyan-400/80 mb-1">
              <span>DECOMPRESSION BUFFER</span>
              <span>{bootProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-cyan-950/80 rounded-full overflow-hidden border border-cyan-500/30">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-fuchsia-400 shadow-[0_0_12px_rgba(0,242,255,0.8)] transition-all duration-200"
                style={{ width: `${bootProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Big Interactive "ENTER BITTYBOX" Launch Button */}
        <div className="relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-emerald-400 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse" />

          <button
            id="splash-enter-btn"
            onClick={handleEnter}
            className="relative px-8 sm:px-12 py-4 bg-[#090422] border-2 border-cyan-300 rounded-xl text-cyan-100 font-mono font-bold text-base sm:text-lg tracking-widest flex items-center justify-center gap-4 hover:text-white hover:bg-[#120638] shadow-[0_0_30px_rgba(0,242,255,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Zap className="w-6 h-6 text-cyan-300 fill-cyan-400/50 animate-bounce" />
            <span>ENTER BITTYBOX WORKSPACE</span>
            <Sparkles className="w-5 h-5 text-fuchsia-400 animate-spin" />
          </button>
        </div>
      </main>

      {/* Bottom Cyber Status Footer */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-cyan-500/20 bg-[#060417]/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-cyan-400/60 gap-2">
        <div className="flex items-center gap-3">
          <span>SERVERLESS CAPSULE RUNTIME</span>
          <span>&bull;</span>
          <span>NO DATA LEAVES YOUR BROWSER</span>
        </div>
        <div className="flex items-center gap-4 text-cyan-300/80">
          <span>PRESS <kbd className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 rounded text-[10px] text-cyan-200">SPACE</kbd> OR <kbd className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 rounded text-[10px] text-cyan-200">ENTER</kbd> TO LAUNCH</span>
        </div>
      </footer>
    </div>
  );
};
