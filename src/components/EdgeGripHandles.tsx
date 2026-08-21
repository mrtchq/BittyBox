import React from 'react';

export const GripVerticalIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

export const GRIP_ICON_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>';

interface EdgeGripHandlesProps {
  onOpenLeft: () => void;
  onOpenRight: () => void;
  isLeftOpen?: boolean;
  isRightOpen?: boolean;
}

export const EdgeGripHandles: React.FC<EdgeGripHandlesProps> = ({
  onOpenLeft,
  onOpenRight,
  isLeftOpen = false,
  isRightOpen = false,
}) => {
  return (
    <>
      {/* =========================================================================
          LEFT EDGE GRIP HANDLE (Center Far Left of Screen)
         ========================================================================= */}
      {!isLeftOpen && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center select-none pointer-events-auto">
          <button
            id="edge-grip-left"
            onClick={onOpenLeft}
            aria-label="Templates"
            className="group relative flex flex-col items-center justify-center py-4 px-2 rounded-r-2xl bg-gradient-to-r from-[#0d041e] via-[#170836] to-[#230d4e] border-y-2 border-r-2 border-fuchsia-400 text-fuchsia-200 shadow-[0_0_30px_rgba(217,70,239,0.5)] backdrop-blur-xl transition-all duration-300 transform hover:translate-x-1.5 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Ambient Neon Pulse Glow Bar */}
            <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-fuchsia-400 via-purple-400 to-cyan-400 rounded-r shadow-[0_0_12px_#ff00de]" />

            {/* Grip SVG Icon */}
            <div className="relative w-6 h-6 flex items-center justify-center text-fuchsia-300 group-hover:text-cyan-300 transition-colors">
              <GripVerticalIcon className="w-5 h-5 text-fuchsia-300 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
            </div>

            {/* Vertical Micro-Label */}
            <div className="mt-2 flex flex-col items-center gap-0.5 text-[10px] font-cyber font-extrabold tracking-widest text-fuchsia-200 group-hover:text-cyan-200">
              <span className="[writing-mode:vertical-lr] rotate-180 uppercase">TEMPLATES</span>
            </div>
          </button>
        </div>
      )}

      {/* =========================================================================
          RIGHT EDGE GRIP HANDLE (Center Far Right of Screen)
         ========================================================================= */}
      {!isRightOpen && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center select-none pointer-events-auto">
          <button
            id="edge-grip-right"
            onClick={onOpenRight}
            aria-label="Tools"
            className="group relative flex flex-col items-center justify-center py-4 px-2 rounded-l-2xl bg-gradient-to-l from-[#04101e] via-[#071f38] to-[#0c3154] border-y-2 border-l-2 border-cyan-400 text-cyan-200 shadow-[0_0_30px_rgba(0,242,255,0.5)] backdrop-blur-xl transition-all duration-300 transform hover:-translate-x-1.5 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Ambient Neon Pulse Glow Bar */}
            <div className="absolute right-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-cyan-400 via-teal-400 to-purple-400 rounded-l shadow-[0_0_12px_#00f2ff]" />

            {/* Grip SVG Icon */}
            <div className="relative w-6 h-6 flex items-center justify-center text-cyan-300 group-hover:text-fuchsia-300 transition-colors">
              <GripVerticalIcon className="w-5 h-5 text-cyan-300 group-hover:text-fuchsia-300 transition-colors drop-shadow-[0_0_8px_rgba(0,242,255,0.8)]" />
            </div>

            {/* Vertical Micro-Label */}
            <div className="mt-2 flex flex-col items-center gap-0.5 text-[10px] font-cyber font-extrabold tracking-widest text-cyan-200 group-hover:text-fuchsia-200">
              <span className="[writing-mode:vertical-lr] rotate-180 uppercase">TOOLS</span>
            </div>
          </button>
        </div>
      )}
    </>
  );
};
