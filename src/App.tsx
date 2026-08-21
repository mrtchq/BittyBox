import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BittyNavbar } from './components/BittyNavbar';
import { HoloBackground } from './components/HoloBackground';
import { BittyEditor } from './components/BittyEditor';
import { BittyRenderer } from './components/BittyRenderer';
import { HistoryModal } from './components/HistoryModal';
import { AboutModal } from './components/AboutModal';
import { QrModal } from './components/QrModal';
import { BittyMetadata, BittyHistoryItem, AppView, TemplatePreset, WorkspaceTheme, BittySession, SyntaxTheme } from './types';
import { 
  compressContent, 
  compressContentSync,
  decompressBittyData,
  buildBittyUrl, 
  parseBittyHash, 
  hashString 
} from './utils/bittyEngine';
import { exportBittyToZip } from './utils/zipExport';
import { TEMPLATE_PRESETS } from './data/templates';
import { createBittyTour } from './components/OnboardingTour';
import { ConfirmCloseSessionModal } from './components/ConfirmCloseSessionModal';
import { AnimatedSplash } from './components/AnimatedSplash';
import { useProStatus } from './hooks/useProStatus';
import { ProPaywallModal } from './components/ProPaywallModal';
import { EdgeGripHandles } from './components/EdgeGripHandles';
import { TemplatesSidePanel } from './components/TemplatesSidePanel';
import { StudioToolsSidePanel } from './components/StudioToolsSidePanel';
import { useEdgeSwipe } from './hooks/useEdgeSwipe';
import { ClickSparkEffect } from './components/ClickSparkEffect';

const DEFAULT_STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <style>
    body {
      background: #0a0a0c;
      color: #e4e4e7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 1.5rem;
      box-sizing: border-box;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 2.5rem;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    h1 {
      color: #38bdf8;
      font-size: 1.8rem;
      margin-top: 0;
      margin-bottom: 0.75rem;
    }
    p {
      color: #a1a1aa;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    button {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #0369a1;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Welcome to My Webpage</h1>
    <p>This is a standalone web page generated entirely from code in the editor.</p>
    <button onclick="alert('Hello from your app!')">Click Me</button>
  </div>
</body>
</html>`;

function getInitialUrlState() {
  if (typeof window === 'undefined') return { hash: '', payload: '', metadata: null, isViewer: false };
  const hash = window.location.hash;
  if (hash && hash.length > 2 && hash !== '#/edit' && hash !== '#edit' && hash !== '#/studio' && hash !== '#/' && hash !== '#') {
    const { payload, metadata } = parseBittyHash(hash);
    return { hash, payload, metadata, isViewer: Boolean(payload) };
  }
  return { hash: '', payload: '', metadata: null, isViewer: false };
}

export default function App() {
  const proStatus = useProStatus();
  const initialUrl = useMemo(() => getInitialUrlState(), []);
  const [currentView, setCurrentView] = useState<AppView>(() => (initialUrl.isViewer ? 'viewer' : 'editor'));
  const [inlinePreviewActive, setInlinePreviewActive] = useState<boolean>(false);
  const [content, setContent] = useState<string>(() => (initialUrl.isViewer ? '' : DEFAULT_STARTER_HTML));
  const [metadata, setMetadata] = useState<BittyMetadata>(() => {
    return {
      title: initialUrl.metadata?.title || 'My Webpage',
      description: initialUrl.metadata?.description || 'A self-contained webpage living entirely in a URL',
      favicon: initialUrl.metadata?.favicon || '📦',
      image: initialUrl.metadata?.image,
      boxId: initialUrl.metadata?.boxId,
      lockConfig: initialUrl.metadata?.lockConfig,
      includeMetadata: true,
    };
  });

  // Multi-session state
  const [sessions, setSessions] = useState<BittySession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('sess-starter');

  // Persistent Workspace Theme state ('synthwave' | 'monochrome' | 'matrix')
  const [workspaceTheme, setWorkspaceTheme] = useState<WorkspaceTheme>(() => {
    try {
      const saved = localStorage.getItem('bitty_workspace_theme');
      if (saved === 'synthwave' || saved === 'monochrome' || saved === 'matrix') {
        return saved;
      }
    } catch {}
    return 'monochrome';
  });

  // Persistent Syntax Theme state for in-editor syntax highlighting
  const [syntaxTheme, setSyntaxTheme] = useState<SyntaxTheme>(() => {
    try {
      const saved = localStorage.getItem('bitty_syntax_theme');
      if (
        saved === 'cyber' ||
        saved === 'matrix' ||
        saved === 'dracula' ||
        saved === 'monokai' ||
        saved === 'nord' ||
        saved === 'amber' ||
        saved === 'monochrome'
      ) {
        return saved as SyntaxTheme;
      }
    } catch {}
    return 'cyber';
  });

  // Sync syntax theme with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bitty_syntax_theme', syntaxTheme);
    } catch {}
  }, [syntaxTheme]);

  const [bittyUrl, setBittyUrl] = useState<string>(() => (initialUrl.hash ? window.location.href : ''));
  const [hashFragment, setHashFragment] = useState<string>(() => initialUrl.payload);
  const [originalBytes, setOriginalBytes] = useState<number>(0);
  const [compressedBytes, setCompressedBytes] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [isLeftTemplatesPanelOpen, setIsLeftTemplatesPanelOpen] = useState<boolean>(false);
  const [isRightToolsPanelOpen, setIsRightToolsPanelOpen] = useState<boolean>(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<BittyHistoryItem[]>([]);

  // Edge Swiping Gesture Hook
  useEdgeSwipe({
    onSwipeFromLeft: () => setIsLeftTemplatesPanelOpen(true),
    onSwipeFromRight: () => setIsRightToolsPanelOpen(true),
    onSwipeLeftToClose: () => setIsLeftTemplatesPanelOpen(false),
    onSwipeRightToClose: () => setIsRightToolsPanelOpen(false),
    isLeftOpen: isLeftTemplatesPanelOpen,
    isRightOpen: isRightToolsPanelOpen,
  });

  // Global Keyboard Shortcuts (Ctrl/Cmd + [ for Templates, Ctrl/Cmd + ] for Tools)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if (isCtrlOrCmd && e.key === '[') {
        e.preventDefault();
        setIsLeftTemplatesPanelOpen(prev => !prev);
      } else if (isCtrlOrCmd && e.key === ']') {
        e.preventDefault();
        setIsRightToolsPanelOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (initialUrl.isViewer) return false;
    return true;
  });

  // Apply workspace theme to document root & sync with localStorage
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', workspaceTheme);
      localStorage.setItem('bitty_workspace_theme', workspaceTheme);
    } catch {}
  }, [workspaceTheme]);

  // Load history & initialize sessions on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('bitty_box_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch {}

    // Check if there is an active hash in the URL for viewer mode
    const hash = window.location.hash;
    const isSpecialRoute = !hash || hash === '#/edit' || hash === '#edit' || hash === '#/studio';

    // Load multi-sessions from localStorage
    let loadedSessions: BittySession[] = [];
    try {
      const raw = localStorage.getItem('bitty_multi_sessions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedSessions = parsed;
        }
      }
    } catch {}

    if (loadedSessions.length > 0) {
      setSessions(loadedSessions);
      if (isSpecialRoute) {
        const activeSess = loadedSessions[0];
        setCurrentSessionId(activeSess.id);
        setContent(activeSess.content);
        setMetadata(activeSess.metadata);
      }
    } else {
      // Check autosaved session draft fallback
      let initialContent = DEFAULT_STARTER_HTML;
      let initialMeta: BittyMetadata = {
        title: 'My Webpage',
        description: 'A self-contained webpage living entirely in a URL',
        favicon: '📦',
        includeMetadata: true,
      };

      if (isSpecialRoute) {
        try {
          const savedDraft = sessionStorage.getItem('bitty_box_autosave');
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (parsed.content) initialContent = parsed.content;
            if (parsed.metadata) initialMeta = { ...initialMeta, ...parsed.metadata };
          }
        } catch {}
      }

      const initialSess: BittySession = {
        id: 'sess-default',
        title: initialMeta.title || 'My Webpage',
        favicon: initialMeta.favicon || '📦',
        content: initialContent,
        metadata: initialMeta,
        savedAt: Date.now(),
      };

      setSessions([initialSess]);
      setCurrentSessionId(initialSess.id);
      setContent(initialContent);
      setMetadata(initialMeta);
      try {
        localStorage.setItem('bitty_multi_sessions', JSON.stringify([initialSess]));
      } catch {}
    }

    if (isSpecialRoute) {
      // Auto-launch guided walkthrough for first-time visitors if no active hash payload
      try {
        const tourSeen = localStorage.getItem('bitty_walkthrough_seen');
        if (!tourSeen) {
          const timer = setTimeout(() => {
            const tour = createBittyTour({
              onComplete: () => {
                try { localStorage.setItem('bitty_walkthrough_seen', 'true'); } catch {}
              },
              onCancel: () => {
                try { localStorage.setItem('bitty_walkthrough_seen', 'true'); } catch {}
              },
            });
            tour.start();
          }, 800);
          return () => clearTimeout(timer);
        }
      } catch {}
    }
  }, []);

  // Sync content updates with active session
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === currentSessionId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          content: newContent,
          savedAt: Date.now(),
        };
        try {
          localStorage.setItem('bitty_multi_sessions', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });
  }, [currentSessionId]);

  // Sync metadata updates with active session
  const handleMetadataChange = useCallback((newMetadata: BittyMetadata) => {
    setMetadata(newMetadata);
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === currentSessionId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          title: newMetadata.title || 'Untitled',
          favicon: newMetadata.favicon || '📦',
          metadata: newMetadata,
          savedAt: Date.now(),
        };
        try {
          localStorage.setItem('bitty_multi_sessions', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });
  }, [currentSessionId]);

  // Switch to another session
  const handleSwitchSession = useCallback((sessionId: string) => {
    const target = sessions.find(s => s.id === sessionId);
    if (target) {
      setCurrentSessionId(target.id);
      setContent(target.content);
      setMetadata(target.metadata);
      try {
        sessionStorage.setItem('bitty_box_autosave', JSON.stringify({
          id: target.id,
          content: target.content,
          metadata: target.metadata,
          savedAt: Date.now(),
        }));
      } catch {}
    }
  }, [sessions]);

  // Close session by ID
  const handleCloseSessionById = useCallback((sessionId: string) => {
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== sessionId);
      try {
        localStorage.setItem('bitty_multi_sessions', JSON.stringify(remaining));
      } catch {}

      if (sessionId === currentSessionId) {
        if (remaining.length > 0) {
          const nextSession = remaining[0];
          setCurrentSessionId(nextSession.id);
          setContent(nextSession.content);
          setMetadata(nextSession.metadata);
          try {
            sessionStorage.setItem('bitty_box_autosave', JSON.stringify({
              id: nextSession.id,
              content: nextSession.content,
              metadata: nextSession.metadata,
              savedAt: Date.now(),
            }));
          } catch {}
        } else {
          // If no sessions remain, reset completely to a single fresh clean starter
          const freshId = 'sess-' + Date.now();
          const freshSession: BittySession = {
            id: freshId,
            title: 'My Webpage',
            favicon: '📦',
            content: DEFAULT_STARTER_HTML,
            metadata: {
              title: 'My Webpage',
              description: 'A self-contained webpage living entirely in a URL',
              favicon: '📦',
              includeMetadata: true,
            },
            savedAt: Date.now(),
          };
          setCurrentSessionId(freshId);
          setContent(freshSession.content);
          setMetadata(freshSession.metadata);
          try {
            sessionStorage.removeItem('bitty_box_autosave');
            localStorage.setItem('bitty_multi_sessions', JSON.stringify([freshSession]));
          } catch {}
          return [freshSession];
        }
      }
      return remaining;
    });
  }, [currentSessionId]);

  // Guided Walkthrough trigger handler
  const handleStartTour = useCallback(() => {
    if (currentView !== 'editor') {
      setCurrentView('editor');
    }
    setTimeout(() => {
      const tour = createBittyTour({
        onComplete: () => {
          try { localStorage.setItem('bitty_walkthrough_seen', 'true'); } catch {}
        },
        onCancel: () => {
          try { localStorage.setItem('bitty_walkthrough_seen', 'true'); } catch {}
        },
      });
      tour.start();
    }, 150);
  }, [currentView]);

  // Save history to localStorage whenever it changes
  const saveToHistory = useCallback((item: BittyHistoryItem) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.id !== item.id);
      const updated = [item, ...filtered].slice(0, 50);
      try {
        localStorage.setItem('bitty_box_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(h => h.id !== id);
      try {
        localStorage.setItem('bitty_box_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('bitty_box_history');
    } catch {}
  };

  // Re-calculate compression on content or metadata changes (ONLY when in Studio Editor)
  const updateCompression = useCallback(async () => {
    if (currentView === 'viewer') return;
    if (!content.trim()) {
      setOriginalBytes(0);
      setCompressedBytes(0);
      setBittyUrl('');
      setHashFragment('');
      return;
    }

    const { compressedUrl, originalBytes: orig, compressedBytes: comp } = await compressContent(content, {
      password: metadata.password,
    });

    setOriginalBytes(orig);
    setCompressedBytes(comp);

    const fullUrl = buildBittyUrl(compressedUrl, metadata);
    setBittyUrl(fullUrl);
    setHashFragment(compressedUrl);
  }, [content, metadata, currentView]);

  useEffect(() => {
    if (currentView === 'viewer') return;
    const timer = setTimeout(() => {
      updateCompression();
    }, 200);
    return () => clearTimeout(timer);
  }, [content, metadata, currentView, updateCompression]);

  // Read URL on mount or hashchange
  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash;

      if (hash && hash.length > 2 && hash !== '#/edit' && hash !== '#edit' && hash !== '#/studio') {
        // We have a data URL to view!
        const { payload, metadata: parsedMeta } = parseBittyHash(hash);

        if (payload) {
          setShowSplash(false);
          setHashFragment(payload);
          if (parsedMeta) {
            setMetadata(prev => ({
              ...prev,
              title: parsedMeta.title || prev.title,
              description: parsedMeta.description || prev.description,
              favicon: parsedMeta.favicon || prev.favicon,
              image: parsedMeta.image || prev.image,
              boxId: parsedMeta.boxId || prev.boxId,
              lockConfig: parsedMeta.lockConfig || prev.lockConfig,
            }));
          }
          decompressBittyData(payload).then(res => {
            if (!res.error && !res.needsPassword && res.content) {
              setContent(res.content);
            }
          });
          setCurrentView('viewer');
        }
      } else if (hash === '#/edit' || hash === '#edit') {
        setCurrentView('editor');
      }
    };

    handleUrlChange();
    window.addEventListener('hashchange', handleUrlChange);
    return () => window.removeEventListener('hashchange', handleUrlChange);
  }, []);

  // Generate & Copy action (opens generated URL in a new tab like OPEN TAB)
  const handleGenerate = async () => {
    // 1. Determine target URL synchronously so window.open executes within the user click gesture
    let targetUrl = bittyUrl;
    if (!metadata.password) {
      try {
        const syncRes = compressContentSync(content, { mimeType: 'text/html' });
        if (syncRes) {
          targetUrl = buildBittyUrl(syncRes.compressedUrl, metadata);
        }
      } catch {}
    }

    // 2. Open new tab synchronously in direct user gesture context
    let newTab: Window | null = null;
    if (targetUrl) {
      newTab = window.open(targetUrl, '_blank');
    } else {
      newTab = window.open('', '_blank');
    }

    // 3. Complete async compression, state update, address bar update, history record & clipboard
    const { compressedUrl, originalBytes: orig, compressedBytes: comp } = await compressContent(content, {
      password: metadata.password,
    });

    let updatedMetadata = { ...metadata };
    if (metadata.lockConfig?.openLimit?.enabled && !metadata.boxId) {
      try {
        const res = await fetch('/api/boxes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: metadata.title || 'Bitty Box',
            bittyUrl: compressedUrl,
            lockConfig: metadata.lockConfig,
          }),
        });
        const data = await res.json();
        if (data.boxId) {
          updatedMetadata.boxId = data.boxId;
          setMetadata(updatedMetadata);
        }
      } catch {}
    }

    const fullUrl = buildBittyUrl(compressedUrl, updatedMetadata);
    setBittyUrl(fullUrl);
    setHashFragment(compressedUrl);

    // Save to browser address bar without reload
    window.history.replaceState(null, '', fullUrl);

    // If newTab was opened without targetUrl or URL updated, redirect it to fullUrl
    if (newTab && (!targetUrl || targetUrl !== fullUrl)) {
      try {
        newTab.location.href = fullUrl;
      } catch {}
    }

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(fullUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {}

    // Record to Vault history
    const id = await hashString(fullUrl);
    saveToHistory({
      id,
      url: fullUrl,
      title: metadata.title || 'Untitled Bitty Box',
      description: metadata.description,
      favicon: metadata.favicon,
      image: metadata.image,
      byteSize: orig,
      compressedSize: comp,
      createdAt: Date.now(),
      encrypted: !!metadata.password,
    });
  };

  // Switch to preset template and create a new session
  const handleSelectTemplate = (tpl: TemplatePreset) => {
    const tplSessionId = 'tpl-' + tpl.id + '-' + Date.now();
    const tplMeta: BittyMetadata = {
      title: tpl.title,
      description: tpl.docDescription || tpl.description,
      favicon: tpl.favicon || '🚀',
      includeMetadata: true,
      password: '',
    };
    const tplSession: BittySession = {
      id: tplSessionId,
      title: tpl.title,
      favicon: tpl.favicon || '🚀',
      content: tpl.content,
      metadata: tplMeta,
      savedAt: Date.now(),
    };

    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== tplSessionId);
      const updated = [tplSession, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('bitty_multi_sessions', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setCurrentSessionId(tplSessionId);
    setContent(tpl.content);
    setMetadata(tplMeta);
    window.history.replaceState(null, '', '/#/edit');
    setCurrentView('editor');
  };

  // Launch in new tab
  const handlePreviewInTab = () => {
    let targetUrl = bittyUrl;
    if (!metadata.password) {
      try {
        const syncRes = compressContentSync(content, { mimeType: 'text/html' });
        if (syncRes) {
          targetUrl = buildBittyUrl(syncRes.compressedUrl, metadata);
        }
      } catch {}
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank');
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  // System Share trigger
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: metadata.title || 'Bitty Box',
          text: metadata.description || 'Check out this Bitty Box micro-webpage!',
          url: bittyUrl || window.location.href,
        });
      } catch {}
    } else {
      handleGenerate();
    }
  };

  // Close Opened Session Request Handler (shows warning modal)
  const handleRequestCloseSession = () => {
    setIsCloseSessionModalOpen(true);
  };

  // Confirmed Session Close Handler (removes current session from sessions and switches or resets)
  const handleConfirmCloseSession = () => {
    handleCloseSessionById(currentSessionId);
    setIsCloseSessionModalOpen(false);
  };

  // New Bitty Box / Open New Session
  const handleNewBox = () => {
    const newId = 'sess-' + Date.now();
    const newSession: BittySession = {
      id: newId,
      title: 'My Webpage',
      favicon: '📦',
      content: DEFAULT_STARTER_HTML,
      metadata: {
        title: 'My Webpage',
        description: 'A self-contained webpage living entirely in a URL',
        favicon: '📦',
        includeMetadata: true,
      },
      savedAt: Date.now(),
    };

    setSessions(prev => {
      const updated = [newSession, ...prev].slice(0, 10);
      try {
        localStorage.setItem('bitty_multi_sessions', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setCurrentSessionId(newId);
    setContent(newSession.content);
    setMetadata(newSession.metadata);
    window.history.replaceState(null, '', '/#/edit');
    setCurrentView('editor');
  };

  // Toggle the in-page live preview (Viewer nav button) without leaving the editor
  const onToggleInlinePreview = useCallback(() => {
    setInlinePreviewActive(prev => !prev);
  }, []);
  const onExitInlinePreview = useCallback(() => {
    setInlinePreviewActive(false);
  }, []);

  // Switch from viewer back to studio editor with content
  const handleEditFromViewer = (newContent: string, newMeta: Partial<BittyMetadata>) => {
    if (newContent) setContent(newContent);
    if (newMeta.title) {
      setMetadata(prev => ({ ...prev, ...newMeta }));
    }
    window.history.replaceState(null, '', '/#/edit');
    setCurrentView('editor');
  };

  if (showSplash) {
    return <AnimatedSplash onComplete={() => setShowSplash(false)} />;
  }

  // If in viewer mode (generated site / capsule URL), render only the pure preview iframe with zero Bittybox UI
  if (currentView === 'viewer') {
    return (
      <BittyRenderer
        hashFragment={hashFragment}
        activeContent={hashFragment ? undefined : content}
        metadata={metadata}
        onEdit={handleEditFromViewer}
        onOpenQr={() => setIsQrOpen(true)}
        onShare={handleShare}
        onCloseSession={handleRequestCloseSession}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050515] text-cyan-100 relative overflow-x-hidden font-sans">
      {/* Background Animated Hologram FX */}
      <HoloBackground theme={workspaceTheme} />
      {/* Global Interactive Quantum Click Spark FX */}
      <ClickSparkEffect theme={workspaceTheme} />

      {/* Edge Grip Handles on Center Far Left & Center Far Right */}
      <EdgeGripHandles
        onOpenLeft={() => setIsLeftTemplatesPanelOpen(true)}
        onOpenRight={() => setIsRightToolsPanelOpen(true)}
        isLeftOpen={isLeftTemplatesPanelOpen}
        isRightOpen={isRightToolsPanelOpen}
      />

      {/* Top Cyber Navigation Bar */}
      <BittyNavbar
        currentView={currentView}
        onViewChange={setCurrentView}
        onViewerClick={onToggleInlinePreview}
        onOpenQr={() => setIsQrOpen(true)}
        onShare={handleShare}
        onNewBox={handleNewBox}
        onCloseSession={handleRequestCloseSession}
        onPreviewInTab={handlePreviewInTab}
        onExportZip={() => exportBittyToZip(content, metadata, bittyUrl)}
        onOpenTemplates={() => setIsLeftTemplatesPanelOpen(true)}
        onOpenTools={() => setIsRightToolsPanelOpen(true)}
        onStartTour={handleStartTour}
        onReplaySplash={() => setShowSplash(true)}
        isEncrypted={!!metadata.password}
        hasContent={content.trim().length > 0}
        theme={workspaceTheme}
        onThemeChange={setWorkspaceTheme}
        mode={proStatus.mode}
        onModeChange={proStatus.setMode}
        isPro={proStatus.isPro}
        isLifetimePro={proStatus.isLifetimePro}
        isTrialActive={proStatus.isTrialActive}
        trialTimeRemaining={proStatus.trialTimeRemaining}
        onOpenPaywall={proStatus.openPaywall}
      />

      {/* Main Content Body */}
      <main className="flex-1 relative z-10">
        {currentView === 'editor' && (
          <BittyEditor
            content={content}
            onChangeContent={handleContentChange}
            metadata={metadata}
            onChangeMetadata={handleMetadataChange}
            onGenerate={handleGenerate}
            bittyUrl={bittyUrl}
            originalBytes={originalBytes}
            compressedBytes={compressedBytes}
            isCopied={isCopied}
            onSelectTemplate={handleSelectTemplate}
            onCloseSession={handleRequestCloseSession}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSwitchSession={handleSwitchSession}
            onCloseSessionById={handleCloseSessionById}
            onNewSession={handleNewBox}
            onOpenTemplatesPanel={() => setIsLeftTemplatesPanelOpen(true)}
            onOpenToolsPanel={() => setIsRightToolsPanelOpen(true)}
            inlinePreviewActive={inlinePreviewActive}
            onToggleInlinePreview={() => setInlinePreviewActive(prev => !prev)}
            onExitInlinePreview={() => setInlinePreviewActive(false)}
            mode={proStatus.mode}
            isPro={proStatus.isPro}
            isLifetimePro={proStatus.isLifetimePro}
            isTrialActive={proStatus.isTrialActive}
            onOpenPaywall={proStatus.openPaywall}
            syntaxTheme={syntaxTheme}
            onSyntaxThemeChange={setSyntaxTheme}
          />
        )}

        {currentView === 'viewer' && (
          <BittyRenderer
            hashFragment={hashFragment}
            activeContent={hashFragment ? undefined : content}
            metadata={metadata}
            onEdit={handleEditFromViewer}
            onOpenQr={() => setIsQrOpen(true)}
            onShare={handleShare}
            onCloseSession={handleRequestCloseSession}
          />
        )}

        {currentView === 'history' && (
          <HistoryModal
            history={history}
            onSelect={item => {
              window.location.href = item.url;
              const { payload, metadata: parsedMeta } = parseBittyHash(item.url);
              if (payload) setHashFragment(payload);
              if (parsedMeta.title) {
                setMetadata(prev => ({ ...prev, ...parsedMeta }));
              }
              setCurrentView('viewer');
            }}
            onDelete={deleteHistoryItem}
            onClearAll={clearAllHistory}
            onClose={() => setCurrentView('editor')}
          />
        )}

        {currentView === 'about' && (
          <AboutModal
            onOpenEditor={() => setCurrentView('editor')}
            onStartTour={handleStartTour}
            onReplaySplash={() => setShowSplash(true)}
          />
        )}
      </main>

      {/* Full-Screen Templates Side Panel (Sliding from Left) */}
      <TemplatesSidePanel
        isOpen={isLeftTemplatesPanelOpen}
        onClose={() => setIsLeftTemplatesPanelOpen(false)}
        onSelectTemplate={tpl => {
          handleSelectTemplate(tpl);
        }}
        currentContentLength={content.trim().length}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSwitchSession={handleSwitchSession}
        onNewSession={handleNewBox}
        mode={proStatus.mode}
        isPro={proStatus.isPro}
        onOpenPaywall={proStatus.openPaywall}
      />

      {/* Full-Screen Studio Tools Side Panel (Sliding from Right) */}
      <StudioToolsSidePanel
        isOpen={isRightToolsPanelOpen}
        onClose={() => setIsRightToolsPanelOpen(false)}
        onGenerate={handleGenerate}
        bittyUrl={bittyUrl}
        originalBytes={originalBytes}
        compressedBytes={compressedBytes}
        isCopied={isCopied}
        onOpenQr={() => setIsQrOpen(true)}
        onShare={handleShare}
        onPreviewInTab={handlePreviewInTab}
        onExportZip={() => exportBittyToZip(content, metadata, bittyUrl)}
        onNewBox={handleNewBox}
        onCloseSession={handleRequestCloseSession}
        onStartTour={handleStartTour}
        onReplaySplash={() => setShowSplash(true)}
        metadata={metadata}
        theme={workspaceTheme}
        onThemeChange={setWorkspaceTheme}
        syntaxTheme={syntaxTheme}
        onSyntaxThemeChange={setSyntaxTheme}
        mode={proStatus.mode}
        onModeChange={proStatus.setMode}
        isPro={proStatus.isPro}
        isLifetimePro={proStatus.isLifetimePro}
        isTrialActive={proStatus.isTrialActive}
        trialTimeRemaining={proStatus.trialTimeRemaining}
        onOpenPaywall={proStatus.openPaywall}
        onOpenHistory={() => setCurrentView('history')}
        onOpenSpecs={() => setCurrentView('about')}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSwitchSession={handleSwitchSession}
        onCloseSessionById={handleCloseSessionById}
      />

      {/* QR Transmitter Modal */}
      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={bittyUrl || window.location.href}
        title={metadata.title || 'Bitty Box'}
      />

      {/* Confirmation Warning Modal for Closing Opened Sessions */}
      <ConfirmCloseSessionModal
        isOpen={isCloseSessionModalOpen}
        onClose={() => setIsCloseSessionModalOpen(false)}
        onConfirmClose={handleConfirmCloseSession}
        sessionTitle={metadata.title || 'Untitled Bitty Box'}
        metadata={metadata}
        contentLength={content.length}
        isEncrypted={!!metadata.password}
        sessionType={currentView === 'viewer' ? 'viewer' : 'editor'}
      />

      {/* BittyBox PRO Paywall & License Modal */}
      <ProPaywallModal
        isOpen={proStatus.isPaywallOpen}
        onClose={proStatus.closePaywall}
        isPro={proStatus.isPro}
        isLifetimePro={proStatus.isLifetimePro}
        isTrialActive={proStatus.isTrialActive}
        trialTimeRemaining={proStatus.trialTimeRemaining}
        paywallFeature={proStatus.paywallFeature}
        onUnlockLifetime={proStatus.unlockLifetimePro}
        onResetTrial={proStatus.resetTrial}
        onExpireTrialForDemo={proStatus.expireTrialForDemo}
        onSwitchToPro={() => proStatus.setMode('pro')}
      />
    </div>
  );
}
