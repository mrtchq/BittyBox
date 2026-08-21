import type { TimeWindowConfig } from './utils/timeWindow';

export interface BittyMetadata {
  title: string;
  description?: string;
  favicon?: string;
  image?: string;
  password?: string;
  includeMetadata?: boolean;
  author?: string;
  canonicalUrl?: string;
  language?: string;
  boxId?: string;
  /**
   * Client-side & server-backed lock configuration surfaced on the recipient lock screen.
   */
  lockConfig?: {
    timeWindow?: TimeWindowConfig;
    openLimit?: {
      enabled?: boolean;
      maxOpens?: number;
      opensUsed?: number;
      showRemainingCount?: boolean;
    };
  };
}

export interface BittyHistoryItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  image?: string;
  type?: string;
  byteSize: number;
  compressedSize: number;
  createdAt: number;
  encrypted?: boolean;
}

export type EditorMode = 'code' | 'rich';
export type AppView = 'editor' | 'viewer' | 'history' | 'about';
export type WorkspaceTheme = 'synthwave' | 'monochrome' | 'matrix';
export type WorkspaceMode = 'simple' | 'pro';

export type SyntaxTheme =
  | 'cyber'
  | 'matrix'
  | 'dracula'
  | 'monokai'
  | 'nord'
  | 'amber'
  | 'monochrome';

export interface SyntaxThemeInfo {
  id: SyntaxTheme;
  name: string;
  desc: string;
  cssClass: string;
  badgeBg: string;
  accentColor: string;
}

export const SYNTAX_THEMES: SyntaxThemeInfo[] = [
  {
    id: 'cyber',
    name: 'Cyber Neon',
    desc: 'Vibrant neon cyan, retro fuchsia, electric teal & gold',
    cssClass: 'prism-cyber-theme',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    accentColor: '#00f2ff',
  },
  {
    id: 'matrix',
    name: 'Matrix Phosphor',
    desc: 'Phosphor green CRT glow, emerald syntax tokens & dark carbon base',
    cssClass: 'prism-matrix-theme',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    accentColor: '#00ff66',
  },
  {
    id: 'dracula',
    name: 'Dracula Vampire',
    desc: 'Refined gothic palette with vivid pastel pink, purple & mint',
    cssClass: 'prism-dracula-theme',
    badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40',
    accentColor: '#ff79c6',
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    desc: 'Classic high-contrast palette with punchy yellow, magenta & cyan',
    cssClass: 'prism-monokai-theme',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    accentColor: '#ffd866',
  },
  {
    id: 'nord',
    name: 'Nord Arctic',
    desc: 'Subtle icy blues, arctic frost cyans & clean polar highlights',
    cssClass: 'prism-nord-theme',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    accentColor: '#88c0d0',
  },
  {
    id: 'amber',
    name: 'Amber CRT',
    desc: 'Vintage 1980s amber monochrome phosphor terminal luminescence',
    cssClass: 'prism-amber-theme',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    accentColor: '#ffb000',
  },
  {
    id: 'monochrome',
    name: 'Obsidian Paper',
    desc: 'Ultra-clean high contrast slate & platinum grayscale',
    cssClass: 'prism-monochrome-theme',
    badgeBg: 'bg-zinc-500/20 text-zinc-200 border-zinc-400/40',
    accentColor: '#f4f4f5',
  },
];

export interface BittySession {
  id: string;
  title: string;
  favicon?: string;
  content: string;
  metadata: BittyMetadata;
  savedAt: number;
}

export interface TemplatePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  title: string;
  docDescription?: string;
  favicon?: string;
  content: string;
  type: 'html' | 'recipe' | 'canvas' | 'contact' | 'bookmarklet' | 'docs' | 'dashboard' | 'portfolio' | 'terminal';
  tags?: string[];
}
