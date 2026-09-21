import React from 'react';
import { WorkspaceTheme } from '../types';

interface HoloBackgroundProps {
  theme?: WorkspaceTheme;
  /**
   * Freeze the starfield: the identical dot field, rendered without the
   * animStar drift. Used on the /editor workspace so the backdrop never moves.
   */
  static?: boolean;
}

/**
 * The fixed, decorative starfield behind the Bitty Box workspace.
 * Theme controls still style the workspace chrome; the home canvas deliberately
 * remains the supplied neutral-black sky so the center card stays dominant.
 */
export const HoloBackground: React.FC<HoloBackgroundProps> = React.memo(({ static: isStatic }) => (
  <div
    className={`bitty-starfield fixed inset-0 pointer-events-none z-0 overflow-hidden select-none${isStatic ? ' bitty-starfield--static' : ''}`}
    aria-hidden="true"
    style={{ contain: 'strict' }}
  >
    <div id="stars" />
    <div id="stars2" />
    <div id="stars3" />
  </div>
));
HoloBackground.displayName = 'HoloBackground';

