import React, { useEffect, useRef } from 'react';
import { WorkspaceTheme } from '../types';

interface HoloBackgroundProps {
  theme?: WorkspaceTheme;
}

interface ParticleNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
}

export const HoloBackground: React.FC<HoloBackgroundProps> = ({ theme = 'synthwave' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  // Interactive Quantum Particle Constellation & Matrix Rain Canvas Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const handleTouchEnd = () => {
      mouseRef.current = { x: null, y: null };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // -------------------------------------------------------------
    // MATRIX THEME: High-density phosphor digital stream
    // -------------------------------------------------------------
    if (theme === 'matrix') {
      const katakana = '0123456789ABCDEF01BITTYBOXQUANTUMHASH';
      const fontSize = 14;
      const columns = Math.floor(width / fontSize);
      const drops: number[] = new Array(columns).fill(1);

      const drawMatrix = () => {
        ctx.fillStyle = 'rgba(1, 8, 3, 0.08)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#00ff66';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text = katakana.charAt(Math.floor(Math.random() * katakana.length));
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          // If mouse is close, perturb stream
          const mx = mouseRef.current.x;
          const my = mouseRef.current.y;
          const isNearMouse = mx !== null && my !== null && Math.hypot(x - mx, y - my) < 80;

          if (isNearMouse || Math.random() > 0.96) {
            ctx.fillStyle = '#ffffff';
          } else {
            ctx.fillStyle = '#00ff66';
          }

          ctx.fillText(text, x, y);

          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }

        animationFrameId = requestAnimationFrame(drawMatrix);
      };

      drawMatrix();

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        cancelAnimationFrame(animationFrameId);
      };
    }

    // -------------------------------------------------------------
    // SYNTHWAVE & MONOCHROME THEMES: Interactive Quantum Constellation Mesh
    // -------------------------------------------------------------
    const isSynthwave = theme === 'synthwave';
    const particleCount = Math.min(Math.floor((width * height) / 18000), 75);
    const connectionDistance = 140;
    const mouseRadius = 160;

    const colors = isSynthwave
      ? ['#00f2ff', '#ff00de', '#8b5cf6', '#00f5d4']
      : ['#ffffff', '#cbd5e1', '#94a3b8'];

    const particles: ParticleNode[] = [];
    for (let i = 0; i < particleCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        color,
        glowColor: color,
      });
    }

    const drawConstellation = () => {
      ctx.clearRect(0, 0, width, height);

      // Update & Draw Nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce walls
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Interactive mouse gravity attraction
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        if (mx !== null && my !== null) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < mouseRadius && dist > 1) {
            const force = (1 - dist / mouseRadius) * 0.4;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;

            // Draw connection ray to cursor
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mx, my);
            ctx.strokeStyle = isSynthwave
              ? `rgba(0, 242, 255, ${0.4 * (1 - dist / mouseRadius)})`
              : `rgba(255, 255, 255, ${0.35 * (1 - dist / mouseRadius)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = isSynthwave ? 8 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby nodes with filaments
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < connectionDistance) {
            const alpha = 1 - dist / connectionDistance;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = isSynthwave
              ? `rgba(189, 0, 255, ${alpha * 0.22})`
              : `rgba(255, 255, 255, ${alpha * 0.12})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(drawConstellation);
    };

    drawConstellation();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  if (theme === 'matrix') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#010803]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,102,0.08)_0%,_rgba(1,8,3,0.85)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-25" />
      </div>
    );
  }

  if (theme === 'monochrome') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#08080a]">
        {/* Interactive Constellation Mesh */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
        {/* Subtle geometric dot grid for minimalist monochrome */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,rgba(255,255,255,0.03),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#08080a]/50 to-[#08080a]" />
      </div>
    );
  }

  // Default: Neon Synthwave
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#050515]">
      {/* Dynamic Purple/Teal Nebula */}
      <div className="nebula" />

      {/* 3D Moving Perspective Grid */}
      <div className="grid-plane" />

      {/* 3-Layer Parallax Starfield */}
      <div className="stars-container">
        <div className="star-layer" />
        <div className="star-layer" />
        <div className="star-layer" />
      </div>

      {/* Interactive Quantum Constellation Mesh */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-65" />

      {/* Ambient Cyber Light Cone & Vignette */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_0%] from-teal-500/10 via-transparent to-black/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(121,40,202,0.15)_0%,_rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
};
