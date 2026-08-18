import React, { useEffect, useRef } from 'react';
import { WorkspaceTheme } from '../types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

interface ClickSparkEffectProps {
  theme?: WorkspaceTheme;
}

export const ClickSparkEffect: React.FC<ClickSparkEffectProps> = ({ theme = 'synthwave' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const getColors = () => {
    switch (theme) {
      case 'matrix':
        return ['#00ff66', '#34d399', '#10b981', '#a7f3d0', '#ffffff'];
      case 'monochrome':
        return ['#ffffff', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b'];
      case 'synthwave':
      default:
        return ['#00f2ff', '#ff00de', '#8b5cf6', '#00f5d4', '#ffffff', '#f43f5e'];
    }
  };

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

    const spawnSpark = (e: MouseEvent | Touch) => {
      const colors = getColors();
      const x = e.clientX;
      const y = e.clientY;

      // Add a shockwave ring
      ripplesRef.current.push({
        x,
        y,
        radius: 4,
        maxRadius: Math.random() * 25 + 35,
        color: colors[0],
        alpha: 0.8,
      });

      // Add radiant particles
      const count = Math.floor(Math.random() * 10) + 12;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 4 + 2;
        const maxLife = Math.random() * 20 + 25;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 2.5 + 1.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 0,
          maxLife,
        });
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      spawnSpark(e);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        spawnSpark(e.touches[0]);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render & update shockwave ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += (r.maxRadius - r.radius) * 0.12;
        r.alpha -= 0.035;

        if (r.alpha <= 0) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = Math.max(0, r.alpha);
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
      }

      // Render & update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life >= p.maxLife || p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handleTouchStart);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};
