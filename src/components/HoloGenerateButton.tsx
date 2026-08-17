import React from 'react';
import { Zap, Sparkles, Check, Copy } from 'lucide-react';

interface HoloGenerateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  isCopied?: boolean;
  byteCount?: number;
  compressedCount?: number;
  label?: string;
  subLabel?: string;
}

export const HoloGenerateButton: React.FC<HoloGenerateButtonProps> = ({
  onClick,
  isLoading = false,
  isCopied = false,
  byteCount = 0,
  compressedCount = 0,
  label = 'GENERATE',
  subLabel,
}) => {
  const compressionRatio = byteCount > 0 && compressedCount > 0 
    ? Math.round((1 - compressedCount / byteCount) * 100) 
    : 0;

  return (
    <div className="button-container group select-none my-3">
      {/* Background Animated Hexagons */}
      <div className="button-hexagons opacity-60 group-hover:opacity-100 transition-opacity">
        <div className="hexagon" />
        <div className="hexagon" />
        <div className="hexagon" />
        <div className="hexagon" />
        <div className="hexagon" />
        <div className="hexagon" />
      </div>

      {/* Futuristic Digital Glyphs */}
      <div className="digital-glyphs hidden sm:block">
        <div className="digital-glyph">0x89F2 BITTY PROTOCOL</div>
        <div className="digital-glyph">
          {compressedCount > 0 ? `PAYLOAD: ${compressedCount} BYTES (${compressionRatio}% COMPRESSED)` : 'SYS.QUANTUM.INIT()'}
        </div>
        <div className="digital-glyph">
          01011010 01000001 01010000 01010101 01010011 01001011
        </div>
        <div className="digital-glyph">HOLO-URL READY</div>
      </div>

      {/* Main Holographic Interactive Button */}
      <button
        id="holo-generate-btn"
        onClick={onClick}
        className="holo-button !w-auto !min-w-[280px] sm:!min-w-[320px] !h-[76px] px-8"
        title="Generate & Copy shareable Bitty Box URL"
      >
        <div className="button-text text-sm sm:text-base font-cyber tracking-widest flex items-center justify-center gap-3">
          {isCopied ? (
            <>
              <Check className="w-5 h-5 text-teal-300 animate-bounce" />
              <span className="text-teal-200">LINK COPIED TO CLIPBOARD</span>
            </>
          ) : isLoading ? (
            <>
              <Sparkles className="w-5 h-5 text-fuchsia-400 animate-spin" />
              <span className="text-cyan-200">COMPRESSING MATRIX...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 text-cyan-300 fill-cyan-400/40 animate-pulse" />
              <span>{label}</span>
              {subLabel && (
                <span className="text-xs text-fuchsia-300 font-mono tracking-normal bg-fuchsia-950/70 border border-fuchsia-500/40 px-2 py-0.5 rounded">
                  {subLabel}
                </span>
              )}
            </>
          )}
        </div>

        {/* Glow & Glitch FX */}
        <div className="holo-glow" />
        <div className="button-glitch" />
        <div className="button-border" />

        {/* 4 Corner Geometric Accents */}
        <div className="corner-accents">
          <div className="corner-accent" />
          <div className="corner-accent" />
          <div className="corner-accent" />
          <div className="corner-accent" />
        </div>

        {/* Holographic Laser Lines */}
        <div className="holo-lines">
          <div className="holo-line" />
          <div className="holo-line" />
          <div className="holo-line" />
          <div className="holo-line" />
        </div>

        {/* Running Cyber Scanline */}
        <div className="scan-line" />

        {/* Floating Hologram Particle Array */}
        <div className="holo-particles">
          <div className="holo-particle" />
          <div className="holo-particle" />
          <div className="holo-particle" />
          <div className="holo-particle" />
          <div className="holo-particle" />
          <div className="holo-particle" />
        </div>
      </button>

      {/* Cyber Sound Wave Equalizer */}
      <div className="sound-wave">
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
      </div>
    </div>
  );
};
