import React, { useState, useEffect, useRef } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Lock, 
  Key,
  Eye,
  EyeOff,
  AlertTriangle, 
  QrCode, 
  Shield, 
  ExternalLink,
  Share2,
  RefreshCw,
  Sparkles,
  Sun,
  Moon,
  Contrast,
  Laptop,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Terminal,
  Trash2,
  Maximize2,
  Minimize2,
  Info,
  XCircle,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { BittyMetadata } from '../types';
import { decompressBittyData } from '../utils/bittyEngine';

interface ConsoleLogItem {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

interface BittyRendererProps {
  hashFragment: string;
  metadata: BittyMetadata;
  activeContent?: string;
  onEdit: (content: string, metadata: Partial<BittyMetadata>) => void;
  onOpenQr: () => void;
  onShare: () => void;
  onCloseSession?: () => void;
}

export type ContrastMode = 'auto' | 'high-contrast-dark' | 'high-contrast-light' | 'standard';

export const BittyRenderer: React.FC<BittyRendererProps> = ({
  hashFragment,
  metadata,
  activeContent,
  onEdit,
  onOpenQr,
  onShare,
  onCloseSession,
}) => {
  const [content, setContent] = useState<string>(activeContent || '');
  const [mimeType, setMimeType] = useState<string>('text/html');
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [needsPassword, setNeedsPassword] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Virtual Console Log Panel state
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogItem[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState<boolean>(false);
  const [isImmersive, setIsImmersive] = useState<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut (ESC) to exit immersive mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImmersive) {
        setIsImmersive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImmersive]);

  // Listen to postMessage from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.source === 'bitty-iframe-console') {
        const newLog: ConsoleLogItem = {
          id: Math.random().toString(36).substring(2, 9),
          type: e.data.type || 'log',
          message: typeof e.data.message === 'string' ? e.data.message : JSON.stringify(e.data.message),
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setConsoleLogs(prev => [...prev.slice(-100), newLog]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Clear console logs on content reload
  useEffect(() => {
    setConsoleLogs([]);
  }, [hashFragment, activeContent]);

  // Auto-scroll console logs
  useEffect(() => {
    if (isConsoleOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs, isConsoleOpen]);

  // =========================================================================
  // SYSTEM THEME DETECTION & USER HIGH-CONTRAST SETTING
  // =========================================================================
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('dark');
  const [contrastSetting, setContrastSetting] = useState<ContrastMode>(() => {
    try {
      const saved = localStorage.getItem('bitty_renderer_contrast_mode');
      if (saved === 'auto' || saved === 'high-contrast-dark' || saved === 'high-contrast-light' || saved === 'standard') {
        return saved as ContrastMode;
      }
    } catch {}
    return 'auto'; // Default: auto-detect system theme & force high-contrast
  });

  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Detect and track system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Save setting to localStorage
  const handleSelectContrastMode = (mode: ContrastMode) => {
    setContrastSetting(mode);
    try {
      localStorage.setItem('bitty_renderer_contrast_mode', mode);
    } catch {}
    setShowThemeMenu(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showThemeMenu]);

  // Compute effective contrast theme
  const effectiveTheme: 'high-contrast-dark' | 'high-contrast-light' | 'standard' = 
    contrastSetting === 'auto'
      ? (systemTheme === 'light' ? 'high-contrast-light' : 'high-contrast-dark')
      : contrastSetting;

  const loadData = async (passcode?: string) => {
    if (!hashFragment || !hashFragment.trim()) {
      if (activeContent) {
        setContent(activeContent);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await decompressBittyData(hashFragment, passcode);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      if (result.needsPassword) {
        setNeedsPassword(true);
        setIsEncrypted(true);
      }
      return;
    }

    if (result.needsPassword) {
      setIsEncrypted(true);
      setNeedsPassword(true);
      return;
    }

    setIsEncrypted(result.isEncrypted);
    setNeedsPassword(false);
    setMimeType(result.mimeType || 'text/html');
    setContent(result.content);
  };

  useEffect(() => {
    loadData();
  }, [hashFragment, activeContent]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    loadData(passwordInput.trim());
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // =========================================================================
  // HIGH CONTRAST STYLESHEET INJECTION
  // =========================================================================
  const highContrastDarkCss = `
  <style id="bitty-contrast-override">
    :root {
      color-scheme: dark !important;
    }
    html, body {
      background-color: #000000 !important;
      color: #ffffff !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      line-height: 1.6 !important;
      letter-spacing: 0.01em !important;
    }
    p, span, li, dt, dd, blockquote, th, td, label {
      color: #f8fafc !important;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #00f2ff !important;
      font-weight: 800 !important;
      letter-spacing: -0.02em !important;
    }
    a, a * {
      color: #38bdf8 !important;
      text-decoration: underline !important;
      text-underline-offset: 3px !important;
      font-weight: 700 !important;
    }
    button, input, textarea, select {
      background-color: #080518 !important;
      color: #ffffff !important;
      border: 2px solid #00f2ff !important;
      border-radius: 6px !important;
      padding: 6px 12px !important;
      font-weight: 600 !important;
    }
    div, section, article, nav, header, footer, card {
      border-color: #334155 !important;
    }
    code, pre {
      background-color: #0d0822 !important;
      color: #00ffaa !important;
      border: 1px solid #00f2ff !important;
      font-weight: 600 !important;
    }
  </style>`;

  const highContrastLightCss = `
  <style id="bitty-contrast-override">
    :root {
      color-scheme: light !important;
    }
    html, body {
      background-color: #ffffff !important;
      color: #000000 !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      line-height: 1.6 !important;
      letter-spacing: 0.01em !important;
    }
    p, span, li, dt, dd, blockquote, th, td, label {
      color: #09090b !important;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #000000 !important;
      font-weight: 800 !important;
      letter-spacing: -0.02em !important;
    }
    a, a * {
      color: #0033cc !important;
      text-decoration: underline !important;
      text-underline-offset: 3px !important;
      font-weight: 700 !important;
    }
    button, input, textarea, select {
      background-color: #f4f4f5 !important;
      color: #000000 !important;
      border: 2px solid #000000 !important;
      border-radius: 6px !important;
      padding: 6px 12px !important;
      font-weight: 600 !important;
    }
    div, section, article, nav, header, footer, card {
      border-color: #94a3b8 !important;
    }
    code, pre {
      background-color: #f1f5f9 !important;
      color: #005533 !important;
      border: 1px solid #000000 !important;
      font-weight: 600 !important;
    }
  </style>`;

  // Virtual console interceptor script to catch embedded console logs
  const consoleScript = `<script>
    (function() {
      const origLog = console.log;
      const origWarn = console.warn;
      const origError = console.error;
      const origInfo = console.info;

      function stringifyArg(arg) {
        try {
          if (typeof arg === 'object') return JSON.stringify(arg);
          return String(arg);
        } catch(e) {
          return String(arg);
        }
      }

      function sendToParent(type, args) {
        try {
          const message = Array.from(args).map(stringifyArg).join(' ');
          window.parent.postMessage({
            source: 'bitty-iframe-console',
            type: type,
            message: message
          }, '*');
        } catch(e) {}
      }

      console.log = function(...args) {
        origLog.apply(console, args);
        sendToParent('log', args);
      };
      console.info = function(...args) {
        origInfo.apply(console, args);
        sendToParent('info', args);
      };
      console.warn = function(...args) {
        origWarn.apply(console, args);
        sendToParent('warn', args);
      };
      console.error = function(...args) {
        origError.apply(console, args);
        sendToParent('error', args);
      };

      window.addEventListener('error', function(e) {
        sendToParent('error', [e.message + ' at line ' + e.lineno + ':' + e.colno]);
      });
      window.addEventListener('unhandledrejection', function(e) {
        sendToParent('error', ['Unhandled Promise Rejection: ' + (e.reason ? (e.reason.message || e.reason) : '')]);
      });
    })();
  </script>`;

  // Compute final HTML for the iframe srcDoc
  let finalHtml = '';
  if (!needsPassword && content) {
    const contrastCssToInject = 
      effectiveTheme === 'high-contrast-dark' 
        ? highContrastDarkCss 
        : effectiveTheme === 'high-contrast-light' 
          ? highContrastLightCss 
          : '';

    const injectionPayload = `${consoleScript}${contrastCssToInject}`;

    if (mimeType === 'text/plain' && !content.includes('<html')) {
      const baseBg = effectiveTheme === 'high-contrast-light' ? '#ffffff' : '#050515';
      const baseColor = effectiveTheme === 'high-contrast-light' ? '#000000' : '#00f2ff';
      finalHtml = `<!DOCTYPE html><html lang="${metadata.language || 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${injectionPayload}<style>body{font-family:monospace;background:${baseBg};color:${baseColor};padding:2rem;line-height:1.6;white-space:pre-wrap;margin:0;}</style></head><body>${content}</body></html>`;
    } else if (!content.includes('<html') && !content.includes('<!DOCTYPE')) {
      const baseBg = effectiveTheme === 'high-contrast-light' ? '#ffffff' : '#050515';
      const baseColor = effectiveTheme === 'high-contrast-light' ? '#000000' : '#e0f2fe';
      finalHtml = `<!DOCTYPE html><html lang="${metadata.language || 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${injectionPayload}<style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:2rem;line-height:1.6;background:${baseBg};color:${baseColor};margin:0;}</style></head><body>${content}</body></html>`;
    } else {
      if (content.includes('</head>')) {
        finalHtml = content.replace('</head>', `${injectionPayload}</head>`);
      } else if (content.includes('<body')) {
        finalHtml = content.replace('<body', `${injectionPayload}<body`);
      } else {
        finalHtml = `${injectionPayload}${content}`;
      }
    }
  }

  return (
    <div className={`w-full flex flex-col bg-[#050515] relative z-10 ${
      isImmersive
        ? 'fixed inset-0 z-50 h-screen w-screen overflow-hidden'
        : 'h-[calc(100vh-4.5rem)]'
    }`}>
      {/* Floating Exit Banner in Immersive Fullscreen Mode */}
      {isImmersive && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-black/85 border border-amber-400/70 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-in fade-in duration-200">
          <span className="text-[11px] font-mono text-amber-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            FULL-SCREEN IMMERSIVE
          </span>
          <button
            onClick={() => setIsImmersive(false)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-cyber text-xs font-bold hover:brightness-110 transition cursor-pointer"
            title="Exit full-screen mode (or press Esc)"
          >
            <Minimize2 className="w-3 h-3 text-black" />
            <span>EXIT (ESC)</span>
          </button>
        </div>
      )}

      {/* Control Banner */}
      {!isImmersive && (
        <div className="h-14 bg-[#0a0a1e]/90 border-b border-cyan-500/25 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 z-20 flex-shrink-0">
        <div className="flex items-center gap-3 truncate">
          <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-base flex-shrink-0 shadow-[0_0_10px_rgba(0,242,255,0.3)]">
            {metadata.favicon || '📦'}
          </div>
          <div className="truncate">
            <span className="font-cyber text-sm text-cyan-300 font-bold truncate block">
              {metadata.title || 'BITTY BOX TRANSMISSION'}
            </span>
            {metadata.description && (
              <span className="text-[11px] font-mono text-purple-300/70 truncate block hidden sm:block">
                {metadata.description}
              </span>
            )}
          </div>
          {isEncrypted && (
            <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border flex-shrink-0 ${
              needsPassword
                ? 'text-fuchsia-300 bg-fuchsia-950/80 border-fuchsia-500/50 shadow-[0_0_10px_rgba(255,0,222,0.3)]'
                : 'text-teal-300 bg-teal-950/80 border-teal-500/50'
            }`}>
              {needsPassword ? (
                <>
                  <Lock className="w-3 h-3 text-fuchsia-400" />
                  <span>LOCKED (AES-256)</span>
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 text-teal-400" />
                  <span>DECRYPTED</span>
                </>
              )}
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          
          {/* USER SETTING: SYSTEM THEME DETECTION & HIGH-CONTRAST MODE DROPDOWN */}
          <div className="relative" ref={menuRef}>
            <button
              id="contrast-theme-menu-btn"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition shadow-sm ${
                effectiveTheme !== 'standard'
                  ? 'bg-cyan-950/90 border-cyan-400/60 text-cyan-200 shadow-[0_0_12px_rgba(0,242,255,0.25)]'
                  : 'bg-black/60 border-cyan-500/30 text-purple-300 hover:text-white'
              }`}
              title="System Theme Detection & High-Contrast Mode Settings"
            >
              {effectiveTheme === 'high-contrast-light' ? (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              ) : effectiveTheme === 'high-contrast-dark' ? (
                <Moon className="w-3.5 h-3.5 text-cyan-300" />
              ) : (
                <Contrast className="w-3.5 h-3.5 text-purple-300" />
              )}
              
              <span className="hidden md:inline font-bold">
                {contrastSetting === 'auto' 
                  ? `AUTO (${systemTheme.toUpperCase()})` 
                  : contrastSetting === 'high-contrast-dark'
                    ? 'DARK CONTRAST'
                    : contrastSetting === 'high-contrast-light'
                      ? 'LIGHT CONTRAST'
                      : 'STANDARD'}
              </span>

              <ChevronDown className="w-3 h-3 text-cyan-400/70" />
            </button>

            {/* Dropdown Menu */}
            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-64 p-2 bg-[#090316] border border-cyan-400/50 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 border-b border-cyan-500/20 mb-1">
                  <div className="text-[10px] font-cyber font-bold text-cyan-300 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                    ACCESSIBILITY &amp; CONTRAST
                  </div>
                  <div className="text-[9px] font-mono text-purple-300/70 mt-0.5">
                    System Theme: <span className="text-teal-300 font-bold uppercase">{systemTheme}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  {/* Auto Option */}
                  <button
                    onClick={() => handleSelectContrastMode('auto')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition ${
                      contrastSetting === 'auto'
                        ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-400/40 font-bold'
                        : 'text-purple-200/80 hover:bg-cyan-950/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                      <div>
                        <div className="leading-tight">Auto System Theme</div>
                        <div className="text-[9px] text-purple-300/60 font-normal">
                          Auto-adapts to OS ({systemTheme})
                        </div>
                      </div>
                    </div>
                    {contrastSetting === 'auto' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>

                  {/* Force High-Contrast Dark */}
                  <button
                    onClick={() => handleSelectContrastMode('high-contrast-dark')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition ${
                      contrastSetting === 'high-contrast-dark'
                        ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-400/40 font-bold'
                        : 'text-purple-200/80 hover:bg-cyan-950/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Moon className="w-3.5 h-3.5 text-cyan-300" />
                      <div>
                        <div className="leading-tight">High-Contrast Dark</div>
                        <div className="text-[9px] text-purple-300/60 font-normal">
                          Pitch black #000 + neon text
                        </div>
                      </div>
                    </div>
                    {contrastSetting === 'high-contrast-dark' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>

                  {/* Force High-Contrast Light */}
                  <button
                    onClick={() => handleSelectContrastMode('high-contrast-light')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition ${
                      contrastSetting === 'high-contrast-light'
                        ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-400/40 font-bold'
                        : 'text-purple-200/80 hover:bg-cyan-950/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-amber-300" />
                      <div>
                        <div className="leading-tight">High-Contrast Light</div>
                        <div className="text-[9px] text-purple-300/60 font-normal">
                          Pure white #FFF + black text
                        </div>
                      </div>
                    </div>
                    {contrastSetting === 'high-contrast-light' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>

                  {/* Standard / Unmodified */}
                  <button
                    onClick={() => handleSelectContrastMode('standard')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition ${
                      contrastSetting === 'standard'
                        ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-400/40 font-bold'
                        : 'text-purple-200/80 hover:bg-cyan-950/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Contrast className="w-3.5 h-3.5 text-purple-400" />
                      <div>
                        <div className="leading-tight">Standard Author Style</div>
                        <div className="text-[9px] text-purple-300/60 font-normal">
                          Unmodified original styles
                        </div>
                      </div>
                    </div>
                    {contrastSetting === 'standard' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsConsoleOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition relative ${
              isConsoleOpen
                ? 'bg-cyan-950 text-cyan-200 border-cyan-400 font-bold shadow-[0_0_10px_rgba(0,242,255,0.3)]'
                : 'bg-black/60 border-cyan-500/30 text-purple-300/80 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
            title="Toggle Virtual Console Log Output"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">CONSOLE</span>
            {consoleLogs.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40">
                {consoleLogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsImmersive(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition ${
              isImmersive
                ? 'bg-amber-950 text-amber-200 border-amber-400 font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                : 'bg-black/60 border-cyan-500/30 text-purple-300/80 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
            title={isImmersive ? "Exit Full-Screen Immersive Mode (Esc)" : "Enter Full-Screen Immersive Mode"}
          >
            {isImmersive ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline">{isImmersive ? 'EXIT FULL' : 'FULL SCREEN'}</span>
          </button>

          <button
            onClick={() => onEdit(content, metadata)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-900/80 transition text-xs font-cyber shadow-[0_0_10px_rgba(0,242,255,0.2)]"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>EDIT SOURCE</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-200 hover:bg-purple-900/80 transition text-xs font-mono"
            title="Copy Encapsulated Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'COPIED' : 'COPY'}</span>
          </button>

          <button
            onClick={onOpenQr}
            className="p-2 rounded-lg bg-teal-950/80 border border-teal-500/40 text-teal-300 hover:bg-teal-900/80 transition"
            title="Show QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="p-2 rounded-lg bg-black/50 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950 transition hidden sm:block"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Close Session Button with Warning Box Trigger */}
          {onCloseSession && (
            <button
              id="viewer-close-session-btn"
              onClick={onCloseSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-950/80 to-rose-950/80 border border-amber-500/50 text-amber-300 hover:text-white hover:border-rose-400 hover:bg-rose-900/80 transition text-xs font-cyber shadow-sm cursor-pointer"
              title="Close active viewer session (shows confirmation warning)"
            >
              <LogOut className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">CLOSE</span>
            </button>
          )}
        </div>
      </div>
      )}

      {/* Main View Area */}
      <div className={`flex-1 w-full h-full relative overflow-hidden flex items-center justify-center transition-colors ${
        effectiveTheme === 'high-contrast-light' ? 'bg-white' : 'bg-[#050515]'
      }`}>
        {isLoading ? (
          /* Loading Hologram Spinner */
          <div className="text-center p-8 flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
            <h4 className="font-cyber text-sm text-cyan-300 tracking-wider">INFLATING BITTY BOX TRANSMISSION...</h4>
            <p className="text-xs font-mono text-purple-300/70 mt-2">Decompressing URL hash data stream in browser VM</p>
          </div>
        ) : needsPassword ? (
          /* Encrypted Passcode Prompt */
          <div className="w-full max-w-md p-6 bento-card-purple shadow-[0_0_50px_rgba(255,0,222,0.3)] mx-4 relative animate-in zoom-in-95 duration-200">
            <div className="bento-corner-accent top-l bento-corner-accent-purple" />
            <div className="bento-corner-accent top-r bento-corner-accent-purple" />
            <div className="bento-corner-accent bot-l bento-corner-accent-purple" />
            <div className="bento-corner-accent bot-r bento-corner-accent-purple" />

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-950 border border-fuchsia-500/50 mx-auto flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,0,222,0.4)]">
                <Lock className="w-6 h-6 text-fuchsia-400 animate-pulse" />
              </div>
              <h3 className="font-cyber text-lg font-bold text-white tracking-wide">
                ENCRYPTED BITTY BOX
              </h3>
              <p className="text-xs text-purple-200/80 font-mono mt-1">
                This payload is locked with AES-256-GCM cipher. Enter the security passcode to decrypt.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-fuchsia-300 mb-1.5 uppercase tracking-wider">
                  SECURITY PASSCODE
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter secret passcode..."
                    autoFocus
                    className="w-full bg-[#090314] border border-fuchsia-500/40 rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder:text-purple-400/40 focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-fuchsia-300 transition"
                    title={showPassword ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !passwordInput.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 disabled:opacity-50 text-white font-cyber text-xs tracking-wider shadow-[0_0_20px_rgba(255,0,222,0.4)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>DECRYPTING PAYLOAD...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>UNLOCK TRANSMISSION</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : error ? (
          /* Error Display */
          <div className="text-center max-w-md p-6 bento-card border-rose-500/40 mx-4 relative">
            <div className="bento-corner-accent top-l" />
            <div className="bento-corner-accent top-r" />
            <div className="bento-corner-accent bot-l" />
            <div className="bento-corner-accent bot-r" />

            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="font-cyber text-base text-rose-200 mb-1">TRANSMISSION DECODE ERROR</h3>
            <p className="text-xs text-purple-200/70 font-mono mb-4">{error}</p>
            <button
              onClick={() => onEdit(content || '', metadata)}
              className="px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-cyber hover:bg-cyan-900 transition"
            >
              OPEN STUDIO TO REBUILD
            </button>
          </div>
        ) : (
          /* Rendered Webpage Iframe with srcDoc */
          <div className="w-full h-full relative">
            {/* Virtual Console Log Drawer */}
            {isConsoleOpen && (
              <div className={`absolute bottom-0 left-0 right-0 z-30 bg-[#06030e]/95 border-t border-cyan-500/40 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.8)] flex flex-col transition-all duration-200 ${
                isConsoleExpanded ? 'h-[70vh]' : 'h-64'
              }`}>
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/20 bg-black/60 font-mono text-xs text-cyan-300">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold tracking-wider">EMBEDDED VIRTUAL CONSOLE LOGS</span>
                    <span className="text-[10px] text-purple-300/60 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      {consoleLogs.length} events
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConsoleLogs([])}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-black/40 hover:bg-rose-950/60 text-purple-300/80 hover:text-rose-300 border border-purple-500/20 text-[11px] transition"
                      title="Clear console output"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConsoleExpanded(prev => !prev)}
                      className="p-1 rounded bg-black/40 hover:bg-cyan-950/60 text-purple-300/80 hover:text-cyan-200 border border-cyan-500/20 text-[11px] transition"
                      title={isConsoleExpanded ? 'Minimize drawer' : 'Maximize drawer'}
                    >
                      {isConsoleExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConsoleOpen(false)}
                      className="p-1 rounded bg-black/40 hover:bg-rose-950/60 text-purple-300/80 hover:text-rose-300 border border-purple-500/20 text-[11px] transition"
                      title="Close console"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Log Stream Output */}
                <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1 select-text bg-[#030108]">
                  {consoleLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-purple-400/50 py-8">
                      <Terminal className="w-8 h-8 mb-2 opacity-40 text-cyan-400" />
                      <p>No console messages captured yet.</p>
                      <p className="text-[10px] text-purple-400/40 mt-1">
                        Execute JavaScript with <code>console.log()</code>, <code>console.warn()</code>, or <code>console.error()</code> inside your Bitty Box to inspect real-time output.
                      </p>
                    </div>
                  ) : (
                    consoleLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`flex items-start gap-2.5 px-2.5 py-1.5 rounded border transition ${
                          log.type === 'error'
                            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                            : log.type === 'warn'
                              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                              : log.type === 'info'
                                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                                : 'bg-black/40 border-cyan-500/15 text-emerald-200'
                        }`}
                      >
                        <span className="text-[10px] text-purple-400/60 select-none flex-shrink-0 pt-0.5">
                          {log.timestamp}
                        </span>
                        <span className="flex-shrink-0 pt-0.5">
                          {log.type === 'error' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                          {log.type === 'warn' && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                          {log.type === 'info' && <Info className="w-3.5 h-3.5 text-cyan-400" />}
                          {log.type === 'log' && <span className="text-emerald-400 font-bold">›</span>}
                        </span>
                        <pre className="flex-1 whitespace-pre-wrap break-all text-xs font-mono">
                          {log.message}
                        </pre>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}

            <iframe
              key={finalHtml.length + '-' + (metadata.title || '') + '-' + effectiveTheme}
              srcDoc={finalHtml}
              title={metadata.title || 'Bitty Box Viewer'}
              className="w-full h-full border-0 bg-transparent"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-downloads"
            />
          </div>
        )}
      </div>
    </div>
  );
};
