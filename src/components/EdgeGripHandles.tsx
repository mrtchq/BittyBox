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

export const GripHorizontalIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
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
    <circle cx="12" cy="9" r="1" />
    <circle cx="5" cy="9" r="1" />
    <circle cx="19" cy="9" r="1" />
    <circle cx="12" cy="15" r="1" />
    <circle cx="5" cy="15" r="1" />
    <circle cx="19" cy="15" r="1" />
  </svg>
);

export const GRIP_ICON_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>';

export const GRIP_HORIZONTAL_ICON_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="1"/><circle cx="5" cy="9" r="1"/><circle cx="19" cy="9" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="5" cy="15" r="1"/><circle cx="19" cy="15" r="1"/></svg>';

export interface EdgeGripHandlesProps {
  onOpenPreview?: () => void;
  onOpenAccount?: () => void;
  isPreviewOpen?: boolean;
  isAccountOpen?: boolean;
  onOpenLeft?: () => void;
  onOpenRight?: () => void;
  isLeftOpen?: boolean;
  isRightOpen?: boolean;
  bottomClassName?: string;
  topClassName?: string;
}

export const EdgeGripHandles: React.FC<EdgeGripHandlesProps> = ({
  onOpenPreview,
  onOpenAccount,
  isPreviewOpen,
  isAccountOpen,
  onOpenLeft,
  onOpenRight,
  isLeftOpen,
  isRightOpen,
  bottomClassName,
  topClassName,
}) => {
  const handleOpenPreview = onOpenPreview || onOpenLeft;
  const handleOpenAccount = onOpenAccount || onOpenRight;
  const previewOpen = isPreviewOpen !== undefined ? isPreviewOpen : Boolean(isLeftOpen);
  const accountOpen = isAccountOpen !== undefined ? isAccountOpen : Boolean(isRightOpen);

  return (
    <>
      {/* =========================================================================
          TOP CENTER GRIP HANDLE (Center Top of Screen right below numbered pagination)
         ========================================================================= */}
      {!previewOpen && handleOpenPreview && (
        <div className={`fixed ${topClassName || 'top-[48px] sm:top-[50px]'} left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none pointer-events-auto`}>
          <button
            id="edge-grip-preview"
            onClick={handleOpenPreview}
            aria-label="Preview"
            className="group relative flex items-center justify-center gap-2 px-4 py-1.5 rounded-b-2xl bg-gradient-to-b from-[#0d041e] via-[#170836] to-[#230d4e] border-x-2 border-b-2 border-fuchsia-400 text-fuchsia-200 shadow-[0_0_30px_rgba(217,70,239,0.5)] backdrop-blur-xl transition-all duration-300 transform hover:translate-y-1 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Ambient Neon Pulse Glow Bar along Top Edge */}
            <div className="absolute top-0 left-2 right-2 h-1 bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 rounded-b shadow-[0_0_12px_#ff00de]" />

            {/* Grip SVG Icon */}
            <div className="relative flex items-center justify-center text-fuchsia-300 group-hover:text-cyan-300 transition-colors">
              <GripHorizontalIcon className="w-4 h-4 text-fuchsia-300 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
            </div>

            {/* Horizontal Micro-Label */}
            <span className="text-[10px] sm:text-[11px] font-cyber font-extrabold tracking-widest text-fuchsia-200 group-hover:text-cyan-200 uppercase">
              PREVIEW
            </span>
          </button>
        </div>
      )}

      {/* =========================================================================
          BOTTOM CENTER GRIP HANDLE (Center Bottom of Screen)
         ========================================================================= */}
      {!accountOpen && handleOpenAccount && (
        <div className={`fixed ${bottomClassName || 'bottom-[56px] sm:bottom-[42px]'} left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none pointer-events-auto`}>
          <button
            id="edge-grip-account"
            onClick={handleOpenAccount}
            aria-label="Account"
            className="group relative flex items-center justify-center gap-2 px-4 py-1.5 rounded-t-2xl bg-gradient-to-t from-[#04101e] via-[#071f38] to-[#0c3154] border-x-2 border-t-2 border-cyan-400 text-cyan-200 shadow-[0_0_30px_rgba(0,242,255,0.5)] backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Ambient Neon Pulse Glow Bar along Bottom Edge */}
            <div className="absolute bottom-0 left-2 right-2 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-purple-400 rounded-t shadow-[0_0_12px_#00f2ff]" />

            {/* Grip SVG Icon */}
            <div className="relative flex items-center justify-center text-cyan-300 group-hover:text-fuchsia-300 transition-colors">
              <GripHorizontalIcon className="w-4 h-4 text-cyan-300 group-hover:text-fuchsia-300 transition-colors drop-shadow-[0_0_8px_rgba(0,242,255,0.8)]" />
            </div>

            {/* Horizontal Micro-Label */}
            <span className="text-[10px] sm:text-[11px] font-cyber font-extrabold tracking-widest text-cyan-200 group-hover:text-fuchsia-200 uppercase">
              ACCOUNT
            </span>
          </button>
        </div>
      )}
    </>
  );
};
