import React from 'react';
import { WorkspaceTheme } from '../types';

interface HoloBackgroundProps {
  theme?: WorkspaceTheme;
  /**
   * Render a clean, flat gradient instead of the animated starfield. Used on
   * the /editor workspace so the backdrop is completely still.
   */
  static?: boolean;
}

/**
 * The fixed, decorative starfield behind the Bitty Box workspace.
 * Theme controls still style the workspace chrome; the home canvas deliberately
 * remains the supplied neutral-black sky so the center card stays dominant.
 */
export const HoloBackground: React.FC<HoloBackgroundProps> = React.memo(({ static: isStatic, theme = 'skillborn' }) => {
  if (theme === 'skillborn') {
    return (
      <div className="ambient fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true" style={{ contain: 'strict' }}>
        <div className="grid" />
        <div className="scan" />
        <div className="vignette" />
      </div>
    );
  }

  return (
    <div
      className={`bitty-starfield fixed inset-0 pointer-events-none z-0 overflow-hidden select-none${isStatic ? ' bitty-starfield--static' : ''}`}
      aria-hidden="true"
      style={{ contain: 'strict' }}
    >
      {!isStatic && (
        <>
          <div id="stars" />
          <div id="stars2" />
          <div id="stars3" />
        </>
      )}
    </div>
  );
});
HoloBackground.displayName = 'HoloBackground';

