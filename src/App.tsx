import React, { useState, useEffect, useCallback } from 'react';
import { BittyNavbar } from './components/BittyNavbar';
import { HoloBackground } from './components/HoloBackground';
import { BittyEditor } from './components/BittyEditor';
import { BittyRenderer } from './components/BittyRenderer';
import { HistoryModal } from './components/HistoryModal';
import { AboutModal } from './components/AboutModal';
import { QrModal } from './components/QrModal';
import { BittyMetadata, BittyHistoryItem, AppView, TemplatePreset, WorkspaceTheme, BittySession } from './types';
import { 
  compressContent, 
  buildBittyUrl, 
  parseBittyHash, 
  hashString 
} from './utils/bittyEngine';
import { exportBittyToZip } from './utils/zipExport';
import { TEMPLATE_PRESETS } from './data/templates';
import { TemplateGalleryModal } from './components/TemplateGalleryModal';
import { createBittyTour } from './components/OnboardingTour';
import { ConfirmCloseSessionModal } from './components/ConfirmCloseSessionModal';

const DEFAULT_STARTER_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Bitty Box</title>
  <style>
    body {
      background: #050515;
      color: #00ddff;
      font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
      padding: 3rem 2rem;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }
    .card {
      border: 1px solid #00f2ff;
      box-shadow: 0 0 25px rgba(0, 242, 255, 0.25);
      background: rgba(10, 10, 30, 0.85);
      border-radius: 12px;
      padding: 2rem;
      backdrop-filter: blur(10px);
    }
    h1 {
      color: #00f2ff;
      text-shadow: 0 0 12px rgba(0, 242, 255, 0.5);
      font-size: 1.8rem;
      margin-top: 0;
    }
    .tag {
      display: inline-block;
      background: rgba(0, 242, 255, 0.15);
      color: #00f2ff;
      border: 1px solid #00f2ff;
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-family: monospace;
      margin-bottom: 1rem;
    }
    a { color: #bd00ff; text-decoration: none; font-weight: bold; }
    a:hover { text-decoration: underline; color: #00f2ff; }
  </style>
</head>
<body>
  <div class="card">
    <div class="tag">BITTY BOX // ZERO-SERVER PAYLOAD</div>
    <h1>Hello from Bitty Box!</h1>
    <p>This entire webpage is compressed and stored inside the URL you are viewing right now.</p>
    <p>There are no databases, no servers hosting this content, and no tracking cookies. Everything lives purely in the hash fragment!</p>
    <p><a href="#/edit" target="_top">&larr; Open Bitty Box Studio to build yours</a></p>
  </div>
</body>
</html>`;

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('editor');
  const [content, setContent] = useState<string>(DEFAULT_STARTER_HTML);
  const [metadata, setMetadata] = useState<BittyMetadata>({
    title: 'Hello Bitty Box',
    description: 'A compressed micro-webpage living entirely in a URL',
    favicon: '📦',
    includeMetadata: true,
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

  const [bittyUrl, setBittyUrl] = useState<string>('');
  const [hashFragment, setHashFragment] = useState<string>('');
  const [originalBytes, setOriginalBytes] = useState<number>(0);
  const [compressedBytes, setCompressedBytes] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [isNavGalleryOpen, setIsNavGalleryOpen] = useState<boolean>(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<BittyHistoryItem[]>([]);

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
        title: 'Hello Bitty Box',
        description: 'A compressed micro-webpage living entirely in a URL',
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
        title: initialMeta.title || 'Hello Bitty Box',
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
            title: 'Hello Bitty Box',
            favicon: '📦',
            content: DEFAULT_STARTER_HTML,
            metadata: {
              title: 'Hello Bitty Box',
              description: 'A compressed micro-webpage living entirely in a URL',
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

  // Re-calculate compression on content or metadata changes
  const updateCompression = useCallback(async () => {
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
  }, [content, metadata]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateCompression();
    }, 200);
    return () => clearTimeout(timer);
  }, [content, metadata, updateCompression]);

  // Read URL on mount or hashchange
  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash;

      if (hash && hash.length > 2 && hash !== '#/edit' && hash !== '#edit' && hash !== '#/studio') {
        // We have a data URL to view!
        const { payload, metadata: parsedMeta } = parseBittyHash(hash);

        if (payload) {
          setHashFragment(payload);
          if (parsedMeta.title || parsedMeta.description || parsedMeta.favicon) {
            setMetadata(prev => ({
              ...prev,
              title: parsedMeta.title || prev.title,
              description: parsedMeta.description || prev.description,
              favicon: parsedMeta.favicon || prev.favicon,
              image: parsedMeta.image || prev.image,
            }));
          }
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

  // Generate & Copy action
  const handleGenerate = async () => {
    const { compressedUrl, originalBytes: orig, compressedBytes: comp } = await compressContent(content, {
      password: metadata.password,
    });

    const fullUrl = buildBittyUrl(compressedUrl, metadata);
    setBittyUrl(fullUrl);
    setHashFragment(compressedUrl);

    // Save to browser address bar without reload
    window.history.replaceState(null, '', fullUrl);

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
    if (bittyUrl) {
      window.open(bittyUrl, '_blank');
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
      title: 'New Bitty Box',
      favicon: '📦',
      content: DEFAULT_STARTER_HTML,
      metadata: {
        title: 'New Bitty Box',
        description: 'A compressed micro-webpage living entirely in a URL',
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

  // Switch from viewer back to studio editor with content
  const handleEditFromViewer = (newContent: string, newMeta: Partial<BittyMetadata>) => {
    if (newContent) setContent(newContent);
    if (newMeta.title) {
      setMetadata(prev => ({ ...prev, ...newMeta }));
    }
    window.history.replaceState(null, '', '/#/edit');
    setCurrentView('editor');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050515] text-cyan-100 relative overflow-x-hidden font-sans">
      {/* Background Animated Hologram FX */}
      <HoloBackground theme={workspaceTheme} />

      {/* Top Cyber Navigation Bar */}
      <BittyNavbar
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenQr={() => setIsQrOpen(true)}
        onShare={handleShare}
        onNewBox={handleNewBox}
        onCloseSession={handleRequestCloseSession}
        onPreviewInTab={handlePreviewInTab}
        onExportZip={() => exportBittyToZip(content, metadata, bittyUrl)}
        onOpenTemplates={() => setIsNavGalleryOpen(true)}
        onStartTour={handleStartTour}
        isEncrypted={!!metadata.password}
        hasContent={content.trim().length > 0}
        theme={workspaceTheme}
        onThemeChange={setWorkspaceTheme}
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
          />
        )}

        {currentView === 'viewer' && (
          <BittyRenderer
            hashFragment={hashFragment}
            activeContent={content}
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
          />
        )}
      </main>

      {/* QR Transmitter Modal */}
      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={bittyUrl || window.location.href}
        title={metadata.title || 'Bitty Box'}
      />

      {/* Template Gallery Modal triggered from Navigation Bar */}
      <TemplateGalleryModal
        isOpen={isNavGalleryOpen}
        onClose={() => setIsNavGalleryOpen(false)}
        onSelectTemplate={tpl => {
          handleSelectTemplate(tpl);
        }}
        currentContentLength={content.trim().length}
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
    </div>
  );
}
