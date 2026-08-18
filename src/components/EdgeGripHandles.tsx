import React from 'react';

export const GRIP_ICON_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdyaXAtdmVydGljYWwtaWNvbiBsdWNpZGUtZ3JpcC12ZXJ0aWNhbCI+PGNpcmNsZSBjeD0iOSIgY3k9IjEyIiByPSIxIi8+PGNpcmNsZSBjeD0iOSIgY3k9IjUiIHI9IjEiLz48Y2lyY2xlIGN4PSI5IiBjeT0iMTkiIHI9IjEiLz48Y2lyY2xlIGN4PSIxNSIgY3k9IjEyIiByPSIxIi8+PGNpcmNsZSBjeD0iMTUiIGN5PSI1IiByPSIxIi8+PGNpcmNsZSBjeD0iMTUiIGN5PSIxOSIgcj0iMSIvPjwvc3ZnPg==';

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
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center select-none">
          <button
            id="edge-grip-left"
            onClick={onOpenLeft}
            aria-label="Templates"
            className="group relative flex flex-col items-center justify-center py-3.5 px-1.5 sm:px-2 rounded-r-xl bg-gradient-to-r from-[#0d041e]/95 via-[#170836]/90 to-[#230d4e]/90 border-y border-r border-fuchsia-500/50 hover:border-fuchsia-400 text-fuchsia-200 shadow-[0_0_20px_rgba(217,70,239,0.35)] backdrop-blur-md transition-all duration-300 transform hover:translate-x-1 active:scale-95 cursor-pointer"
          >
            {/* Ambient Neon Pulse Glow Bar */}
            <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-fuchsia-400 to-cyan-400 rounded-r shadow-[0_0_8px_#ff00de]" />

            {/* Grip SVG Icon (Data URL) */}
            <div className="relative w-6 h-6 flex items-center justify-center text-fuchsia-300 group-hover:text-cyan-300 transition-colors">
              <img
                src={GRIP_ICON_DATA_URL}
                alt="Templates Grip"
                className="w-5 h-5 filter invert-[70%] sepia-[80%] saturate-[500%] hue-rotate-[260deg] brightness-[120%] group-hover:filter-none group-hover:brightness-150 transition"
              />
            </div>

            {/* Vertical Micro-Label */}
            <div className="mt-1.5 flex flex-col items-center gap-0.5 text-[9px] font-cyber font-bold tracking-widest text-fuchsia-300/80 group-hover:text-cyan-200">
              <span className="[writing-mode:vertical-lr] rotate-180 uppercase">TEMPLATES</span>
            </div>
          </button>
        </div>
      )}

      {/* =========================================================================
          RIGHT EDGE GRIP HANDLE (Center Far Right of Screen)
         ========================================================================= */}
      {!isRightOpen && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center select-none">
          <button
            id="edge-grip-right"
            onClick={onOpenRight}
            aria-label="Tools"
            className="group relative flex flex-col items-center justify-center py-3.5 px-1.5 sm:px-2 rounded-l-xl bg-gradient-to-l from-[#04101e]/95 via-[#071f38]/90 to-[#0c3154]/90 border-y border-l border-cyan-500/50 hover:border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(0,242,255,0.35)] backdrop-blur-md transition-all duration-300 transform hover:-translate-x-1 active:scale-95 cursor-pointer"
          >
            {/* Ambient Neon Pulse Glow Bar */}
            <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-l shadow-[0_0_8px_#00f2ff]" />

            {/* Grip SVG Icon (Data URL) */}
            <div className="relative w-6 h-6 flex items-center justify-center text-cyan-300 group-hover:text-fuchsia-300 transition-colors">
              <img
                src={GRIP_ICON_DATA_URL}
                alt="Tools Grip"
                className="w-5 h-5 filter invert-[80%] sepia-[90%] saturate-[600%] hue-rotate-[140deg] brightness-[120%] group-hover:filter-none group-hover:brightness-150 transition"
              />
            </div>

            {/* Vertical Micro-Label */}
            <div className="mt-1.5 flex flex-col items-center gap-0.5 text-[9px] font-cyber font-bold tracking-widest text-cyan-300/80 group-hover:text-fuchsia-200">
              <span className="[writing-mode:vertical-lr] rotate-180 uppercase">TOOLS</span>
            </div>
          </button>
        </div>
      )}
    </>
  );
};
