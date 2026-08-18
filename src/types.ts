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
  /**
   * Client-side lock configuration surfaced on the recipient lock screen.
   * The server remains authoritative; this only drives the live countdown UI.
   */
  lockConfig?: {
    timeWindow?: TimeWindowConfig;
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
