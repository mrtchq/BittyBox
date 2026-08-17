import React, { useEffect, useRef } from 'react';
import { WorkspaceTheme } from '../types';

interface HoloBackgroundProps {
  theme?: WorkspaceTheme;
}

export const HoloBackground: React.FC<HoloBackgroundProps> = ({ theme = 'synthwave' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Matrix Digital Rain Canvas Effect
  useEffect(() => {
    if (theme !== 'matrix') return;

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

    const katakana = '0123456789ABCDEF01BITTYBOXQUANTUMHASH';
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(1, 8, 3, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#00ff66';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = katakana.charAt(Math.floor(Math.random() * katakana.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Head of stream is brighter white-green
        if (Math.random() > 0.95) {
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

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  if (theme === 'matrix') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#010803]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,102,0.08)_0%,_rgba(1,8,3,0.85)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-25" />
      </div>
    );
  }

  if (theme === 'monochrome') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#08080a]">
        {/* Subtle geometric dot grid for minimalist monochrome */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,rgba(255,255,255,0.03),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#08080a]/50 to-[#08080a]" />
      </div>
    );
  }

  // Default: Neon Synthwave
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
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

      {/* Ambient Cyber Light Cone & Vignette */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_0%] from-teal-500/10 via-transparent to-black/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(121,40,202,0.15)_0%,_rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
};
