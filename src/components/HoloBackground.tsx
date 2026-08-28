import React from 'react';
import { WorkspaceTheme } from '../types';

interface HoloBackgroundProps {
  theme?: WorkspaceTheme;
}

export const HoloBackground: React.FC<HoloBackgroundProps> = ({ theme = 'synthwave' }) => {
  const getThemeBackground = () => {
    switch (theme) {
      case 'matrix':
        return 'radial-gradient(ellipse at bottom, #092011 0%, #020804 100%)';
      case 'monochrome':
        return 'radial-gradient(ellipse at bottom, #161c24 0%, #08080a 100%)';
      case 'synthwave':
      default:
        return 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)';
    }
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{ background: getThemeBackground() }}
      aria-hidden="true"
    >
      <div id="stars" />
      <div id="stars2" />
      <div id="stars3" />
    </div>
  );
};
