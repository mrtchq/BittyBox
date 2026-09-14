import React, { useEffect, useRef } from 'react';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  isCircle: boolean;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  life: number;
  decay: number;
}

const CONFETTI_COLORS = [
  '#00f2ff', // Neon Cyan
  '#d946ef', // Electric Fuchsia
  '#f59e0b', // Cyber Amber
  '#10b981', // Vivid Emerald
  '#a855f7', // Electric Violet
  '#38bdf8', // Sky Blue
  '#f43f5e', // Rose
  '#fbbf24', // Gold
  '#34d399', // Mint
];

export const ConfettiClickFX: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

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

    const spawnConfetti = (originX: number, originY: number) => {
      const count = 16 + Math.floor(Math.random() * 8); // 16 to 24 particles
      const newParticles: ConfettiParticle[] = [];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.0 + Math.random() * 4.5;
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const isCircle = Math.random() < 0.3;
        const size = 4 + Math.random() * 4;

        newParticles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.6, // slight upward impulse
          w: size,
          h: size * (isCircle ? 1 : 1.2 + Math.random() * 0.8),
          color,
          isCircle,
          alpha: 1,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.25,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.12 + Math.random() * 0.12,
          life: 1.0,
          decay: 0.022 + Math.random() * 0.016, // ~45-60 frames
        });
      }

      particlesRef.current.push(...newParticles);

      if (!animFrameIdRef.current) {
        animFrameIdRef.current = requestAnimationFrame(render);
      }
    };

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Physics update
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 + 0.16; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;
        p.life -= p.decay;
        p.alpha = Math.max(0, p.life);

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle with 3D flip effect
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const scaleX = Math.cos(p.wobble);
        ctx.scale(scaleX, 1);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.isCircle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }

        ctx.restore();
      }

      if (particles.length > 0) {
        animFrameIdRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        animFrameIdRef.current = null;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Don't trigger if reduced motion is preferred
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      spawnConfetti(e.clientX, e.clientY);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      particlesRef.current = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[99999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    />
  );
};
