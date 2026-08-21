import React from 'react';
import { Check, Sparkles } from 'lucide-react';

interface HoloGenerateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  isCopied?: boolean;
  byteCount?: number;
  compressedCount?: number;
  label?: string;
  subLabel?: string;
  className?: string;
}

export const HoloGenerateButton: React.FC<HoloGenerateButtonProps> = ({
  onClick,
  isLoading = false,
  isCopied = false,
  label = 'GENERATE BOX',
  className,
}) => {
  return (
    <div className={`button-container select-none ${className || 'my-6'}`}>
      <div className="button-hexagons">
        <div className="hexagon"></div>
        <div className="hexagon"></div>
        <div className="hexagon"></div>
        <div className="hexagon"></div>
        <div className="hexagon"></div>
        <div className="hexagon"></div>
      </div>

      <button
        id="holo-generate-btn"
        className="holo-button"
        onClick={onClick}
        type="button"
        title="Generate & Copy shareable Bitty Box URL"
      >
        <div className="button-text flex items-center justify-center gap-2">
          {isCopied ? (
            <>
              <Check className="w-5 h-5 text-teal-300 animate-bounce" />
              <span>LINK COPIED!</span>
            </>
          ) : isLoading ? (
            <>
              <Sparkles className="w-5 h-5 text-fuchsia-400 animate-spin" />
              <span>GENERATING...</span>
            </>
          ) : (
            <span>{label}</span>
          )}
        </div>
        <div className="holo-glow"></div>
        <div className="button-glitch"></div>
        <div className="corner-accents">
          <div className="corner-accent"></div>
          <div className="corner-accent"></div>
          <div className="corner-accent"></div>
          <div className="corner-accent"></div>
        </div>
        <div className="holo-lines">
          <div className="holo-line"></div>
          <div className="holo-line"></div>
          <div className="holo-line"></div>
          <div className="holo-line"></div>
        </div>
        <div className="scan-line"></div>
        <div className="holo-particles">
          <div className="holo-particle"></div>
          <div className="holo-particle"></div>
          <div className="holo-particle"></div>
          <div className="holo-particle"></div>
          <div className="holo-particle"></div>
          <div className="holo-particle"></div>
        </div>
      </button>

      <div className="sound-wave">
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
        <div className="wave-bar"></div>
      </div>
    </div>
  );
};
