import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Code2, 
  Eye, 
  Sparkles, 
  Shield, 
  UploadCloud, 
  Sliders, 
  FileText, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Image as ImageIcon, 
  Smile, 
  Zap, 
  Activity,
  FolderArchive,
  Download,
  User,
  Globe,
  Link as LinkIcon,
  Lock,
  Clock,
  CheckCircle2,
  HardDrive,
  BarChart3,
  Layers,
  FileCode2,
  Wand2,
  Keyboard,
  Share2,
  Hash,
  Binary,
  Columns,
  Search,
  RefreshCw,
  ExternalLink,
  Monitor,
  Smartphone,
  Undo2,
  Redo2,
  LogOut,
  Plus,
  X
} from 'lucide-react';
import { BittyMetadata, TemplatePreset, BittySession } from '../types';
import { TEMPLATE_PRESETS } from '../data/templates';
import { motion, AnimatePresence } from 'motion/react';
import { HoloGenerateButton } from './HoloGenerateButton';
import { CodeEditor } from './CodeEditor';
import { exportBittyToZip } from '../utils/zipExport';
import { formatCode } from '../utils/codeFormatter';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { TemplateGalleryModal } from './TemplateGalleryModal';
import { SeoAnalyzerModal } from './SeoAnalyzerModal';
import { useUndoRedo } from '../hooks/useUndoRedo';

interface BittyEditorProps {
  content: string;
  onChangeContent: (content: string) => void;
  metadata: BittyMetadata;
  onChangeMetadata: (metadata: BittyMetadata) => void;
  onGenerate: () => void;
  bittyUrl: string;
  originalBytes: number;
  compressedBytes: number;
  isCopied: boolean;
  onSelectTemplate: (tpl: TemplatePreset) => void;
  onCloseSession?: () => void;
  sessions?: BittySession[];
  currentSessionId?: string;
  onSwitchSession?: (sessionId: string) => void;
  onCloseSessionById?: (sessionId: string) => void;
  onNewSession?: () => void;
}

const bentoContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const bentoCardVariants = {
  hidden: { 
    opacity: 0, 
    y: 18, 
    scale: 0.985,
    filter: 'blur(3px)'
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const BittyEditor: React.FC<BittyEditorProps> = ({
  content,
  onChangeContent,
  metadata,
  onChangeMetadata,
  onGenerate,
  bittyUrl,
  originalBytes,
  compressedBytes,
  isCopied,
  onSelectTemplate,
  onCloseSession,
  sessions = [],
  currentSessionId = 'sess-default',
  onSwitchSession,
  onCloseSessionById,
  onNewSession,
}) => {
  const [showMetadata, setShowMetadata] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editorViewMode, setEditorViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipExportSuccess, setZipExportSuccess] = useState(false);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveToast, setAutoSaveToast] = useState(false);
  const [manualSaveToast, setManualSaveToast] = useState(false);
  
  // Format code state
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatSuccess, setFormatSuccess] = useState(false);

  // Dedicated Stats Copy URL button state
  const [statsUrlCopied, setStatsUrlCopied] = useState(false);
  
  // Template Gallery Modal state
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // SEO Analyzer Modal state
  const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // =========================================================================
  // UNDO & REDO HISTORY ENGINE (useUndoRedo Hook)
  // =========================================================================
  const {
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    undo,
    redo,
    recordChange,
    resetHistory,
  } = useUndoRedo(content, onChangeContent, { maxDepth: 100, debounceMs: 400 });

  const handleCodeChange = (newVal: string) => {
    onChangeContent(newVal);
    recordChange(newVal, false);
  };

  const handleImmediateCodeChange = (newVal: string) => {
    onChangeContent(newVal);
    recordChange(newVal, true);
  };

  // =========================================================================
  // MANUAL & AUTO SAVE FUNCTIONALITY (sessionStorage)
  // =========================================================================
  const performSaveDraft = (isManual: boolean = false) => {
    try {
      setIsSaving(true);
      const draft = {
        id: currentSessionId,
        content,
        metadata,
        savedAt: Date.now(),
      };
      sessionStorage.setItem('bitty_box_autosave', JSON.stringify(draft));

      const date = new Date();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastAutoSavedTime(timeStr);
      
      if (isManual) {
        setManualSaveToast(true);
        setTimeout(() => setManualSaveToast(false), 2500);
      } else {
        setAutoSaveToast(true);
        setTimeout(() => setAutoSaveToast(false), 2200);
      }
      setTimeout(() => setIsSaving(false), 400);
    } catch (err) {
      setIsSaving(false);
    }
  };

  // Periodic Auto-save every 3 seconds
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      performSaveDraft(false);
    }, 3000);

    return () => clearTimeout(saveTimer);
  }, [content, metadata, currentSessionId]);

  // =========================================================================
  // GLOBAL KEYBOARD SHORTCUTS: Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+Enter (Generate), Ctrl+S (Save)
  // =========================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl/Cmd + Z (without shift)
      if (isCtrlOrCmd && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        const activeTag = (document.activeElement?.tagName || '').toUpperCase();
        if (activeTag === 'INPUT') return;
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Y OR Ctrl/Cmd + Shift + Z
      if ((isCtrlOrCmd && (e.key === 'y' || e.key === 'Y')) || (isCtrlOrCmd && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
        const activeTag = (document.activeElement?.tagName || '').toUpperCase();
        if (activeTag === 'INPUT') return;
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd + S -> Save draft to sessionStorage
      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        performSaveDraft(true);
        return;
      }

      // Ctrl/Cmd + Enter -> Trigger Generate
      if (isCtrlOrCmd && e.key === 'Enter') {
        e.preventDefault();
        onGenerate();
        return;
      }

      // Shift + Alt + F or Ctrl + Shift + I -> Format code
      if ((e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F')) || (isCtrlOrCmd && e.shiftKey && (e.key === 'f' || e.key === 'F'))) {
        e.preventDefault();
        handleFormatCode();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, metadata, onGenerate, undo, redo]);

  // =========================================================================
  // CODE COMPLEXITY METRICS
  // =========================================================================
  const complexityMetrics = useMemo(() => {
    const lineCount = content ? content.split('\n').length : 0;
    const charCount = content.length;
    const nonWhitespaceChars = content.replace(/\s/g, '').length;
    const wordCount = (content.match(/\S+/g) || []).length;
    const htmlTagMatches = content.match(/<([a-z0-9\-]+)[^>]*>/gi) || [];
    const htmlTagsCount = htmlTagMatches.length;
    const scriptBlocks = (content.match(/<script[\s\S]*?<\/script>/gi) || []).length;
    const styleBlocks = (content.match(/<style[\s\S]*?<\/style>/gi) || []).length;

    // Calculate complexity grade
    let complexityLevel = 'MINIMAL';
    let complexityColor = 'text-teal-300';
    let complexityBg = 'bg-teal-950/60 border-teal-500/30';
    let complexityScore = 10;

    if (lineCount > 150 || charCount > 4000 || (scriptBlocks > 0 && htmlTagsCount > 30)) {
      complexityLevel = 'HEAVY';
      complexityColor = 'text-rose-300';
      complexityBg = 'bg-rose-950/60 border-rose-500/30';
      complexityScore = 90;
    } else if (lineCount > 60 || charCount > 1500 || htmlTagsCount > 15) {
      complexityLevel = 'MODERATE';
      complexityColor = 'text-amber-300';
      complexityBg = 'bg-amber-950/60 border-amber-500/30';
      complexityScore = 60;
    } else if (lineCount > 20 || charCount > 400 || htmlTagsCount > 5) {
      complexityLevel = 'BALANCED';
      complexityColor = 'text-cyan-300';
      complexityBg = 'bg-cyan-950/60 border-cyan-500/30';
      complexityScore = 35;
    }

    return {
      lineCount,
      charCount,
      nonWhitespaceChars,
      wordCount,
      htmlTagsCount,
      scriptBlocks,
      styleBlocks,
      complexityLevel,
      complexityColor,
      complexityBg,
      complexityScore,
    };
  }, [content]);

  // =========================================================================
  // CODE FORMATTING HANDLER (Prettier Standalone)
  // =========================================================================
  const handleFormatCode = async () => {
    if (!content.trim() || isFormatting) return;
    try {
      setIsFormatting(true);
      const formatted = await formatCode(content);
      onChangeContent(formatted);
      recordChange(formatted, true);
      setIsFormatting(false);
      setFormatSuccess(true);
      setTimeout(() => setFormatSuccess(false), 2000);
    } catch (err) {
      console.error('Format Error:', err);
      setIsFormatting(false);
    }
  };

  // =========================================================================
  // DEDICATED COPY URL IN STATS SECTION
  // =========================================================================
  const handleCopyFullUrl = async () => {
    const targetUrl = bittyUrl || window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = targetUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setStatsUrlCopied(true);
      setTimeout(() => setStatsUrlCopied(false), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Compute live preview HTML
  let previewHtml = '';
  if (!content.trim()) {
    previewHtml = `<!DOCTYPE html><html><body style="margin:0;display:flex;height:100vh;align-items:center;justify-content:center;background:#050515;color:#00f2ff;font-family:sans-serif;"><p style="font-size:12px;opacity:0.6;font-family:monospace;">[ Holographic Stream Initialized &bull; Waiting for input ]</p></body></html>`;
  } else if (!content.includes('<html') && !content.includes('<!DOCTYPE')) {
    previewHtml = `<!DOCTYPE html><html lang="${metadata.language || 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${metadata.title || 'Bitty Box'}</title><style>body{margin:0 auto;padding:1.5rem;max-width:40em;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6;color:#e0f2fe;background:#050515;}</style></head><body>${content}</body></html>`;
  } else {
    previewHtml = content;
  }

  // Handle Export to ZIP
  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      await exportBittyToZip(content, metadata, bittyUrl);
      setIsExportingZip(false);
      setZipExportSuccess(true);
      setTimeout(() => setZipExportSuccess(false), 3000);
    } catch (err) {
      console.error('ZIP Export Error:', err);
      setIsExportingZip(false);
    }
  };

  // Handle file drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    if (
      file.type.startsWith('text/') || 
      file.name.endsWith('.html') || 
      file.name.endsWith('.js') || 
      file.name.endsWith('.json') || 
      file.name.endsWith('.css') || 
      file.name.endsWith('.md')
    ) {
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChangeContent(reader.result);
          recordChange(reader.result, true);
          onChangeMetadata({
            ...metadata,
            title: file.name.replace(/\.[^/.]+$/, ''),
          });
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChangeContent(reader.result);
          recordChange(reader.result, true);
          onChangeMetadata({
            ...metadata,
            title: file.name,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick insertion helpers for syntax editor
  const insertSnippet = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('bitty-code-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    onChangeContent(newContent);
    recordChange(newContent, true);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  const compressionRatio = originalBytes > 0 && compressedBytes > 0
    ? Math.max(0, Math.round((1 - compressedBytes / originalBytes) * 100))
    : 0;

  // URL Limit calculations
  const STANDARD_URL_LIMIT = 2048;
  const EXTENDED_URL_LIMIT = 8192;
  const currentUrlLength = bittyUrl ? bittyUrl.length : (compressedBytes + 60);
  const capacityPercent = Math.min(100, Math.round((currentUrlLength / STANDARD_URL_LIMIT) * 100));
  const isExtended = currentUrlLength > STANDARD_URL_LIMIT;
  const isNearLimit = currentUrlLength > STANDARD_URL_LIMIT * 0.8 && !isExtended;
  const isOversized = currentUrlLength > EXTENDED_URL_LIMIT;

  return (
    <div 
      className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 relative"
      onDragOver={e => { e.preventDefault(); setIsDraggingFile(true); }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-cyan-400 m-4 rounded-3xl animate-in fade-in duration-150">
          <UploadCloud className="w-16 h-16 text-cyan-300 animate-bounce mb-4" />
          <h3 className="font-cyber text-xl font-bold text-cyan-200">DROP FILE TO ENCAPSULATE INTO BITTY BOX</h3>
          <p className="text-xs font-mono text-purple-200 mt-2">Any file will be compressed directly into a shareable URL fragment.</p>
        </div>
      )}

      {/* Auto Save Notification Toast */}
      {autoSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-950/90 border border-cyan-400/60 backdrop-blur-md text-cyan-200 px-4 py-2.5 rounded-lg shadow-[0_0_20px_rgba(0,242,255,0.4)] flex items-center gap-2 font-mono text-xs animate-in slide-in-from-bottom-4 fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-bold">CHANGES SAVED</span>
          <span className="text-cyan-300/70 text-[10px]">({lastAutoSavedTime})</span>
        </div>
      )}

      {/* Manual Save Notification Toast */}
      {manualSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-950/90 border border-teal-400/60 backdrop-blur-md text-teal-200 px-4 py-2.5 rounded-lg shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center gap-2 font-mono text-xs animate-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>DRAFT MANUALLY SAVED TO SESSION STORAGE (Ctrl+S)</span>
        </div>
      )}

      {/* Multi-Session Tabs Breadcrumb Bar */}
      <div className="mb-4 bg-[#080214]/90 border border-cyan-500/30 rounded-xl p-2 px-3 flex flex-wrap items-center justify-between gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          <span className="text-[10px] font-cyber text-cyan-400/80 mr-1 flex items-center gap-1 flex-shrink-0 tracking-wider">
            <Layers className="w-3 h-3 text-cyan-400" />
            SESSIONS //
          </span>

          {sessions.map((tab) => {
            const isActive = tab.id === currentSessionId;
            return (
              <div
                key={tab.id}
                onClick={() => onSwitchSession && onSwitchSession(tab.id)}
                className={`group flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/90 border border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(0,242,255,0.3)]'
                    : 'bg-black/50 border border-cyan-500/20 text-purple-300/70 hover:text-cyan-200 hover:bg-cyan-950/40'
                }`}
                title={`Switch to session: ${tab.title || 'Untitled'}`}
              >
                <span>{tab.favicon || '📦'}</span>
                <span className="max-w-[120px] sm:max-w-[160px] truncate">{tab.title || 'Untitled'}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse ml-0.5" />
                )}
                {onCloseSessionById && (
                  <button
                    type="button"
                    id={`close-session-tab-${tab.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseSessionById(tab.id);
                    }}
                    className="p-0.5 rounded hover:bg-rose-950/80 hover:text-rose-300 text-purple-400/50 hover:border hover:border-rose-500/40 transition cursor-pointer flex items-center justify-center ml-1"
                    title={`Close session "${tab.title || 'Untitled'}"`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {onNewSession && (
            <button
              type="button"
              id="editor-new-session-tab-btn"
              onClick={onNewSession}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:text-cyan-200 hover:border-cyan-400/50 hover:bg-cyan-950/30 transition flex-shrink-0 cursor-pointer"
              title="Open a new micro-app session tab"
            >
              <Plus className="w-3 h-3 text-cyan-400" />
              <span>NEW BOX</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto text-[10px] font-mono text-purple-300/60">
          <span>{sessions.length} OPEN {sessions.length === 1 ? 'BOX' : 'BOXES'}</span>
        </div>
      </div>

      <input 
        ref={fileInputRef} 
        type="file" 
        className="hidden" 
        onChange={handleFileInput} 
      />

      {/* =========================================================================
          BENTO GRID CONTAINER
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* -----------------------------------------------------------------------
            BENTO CELL 1: LOGO & TRANSMISSION IDENTIFIER (Span 8)
           ----------------------------------------------------------------------- */}
        <div className="bento-card md:col-span-8 p-6 flex flex-col justify-between overflow-hidden">
          {/* Corner Accents */}
          <div className="bento-corner-accent top-l" />
          <div className="bento-corner-accent top-r" />
          <div className="bento-corner-accent bot-l" />
          <div className="bento-corner-accent bot-r" />

          {/* Top Bar inside cell */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="bento-card-header !mb-0">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              SYSTEM PROTOCOL // TRANSMISSION IDENTIFIER
            </div>
            
            {/* Auto-Save Status Badge & Shortcut Indicators */}
            <div className="flex items-center gap-2 sm:gap-3">
              {lastAutoSavedTime && (
                <div 
                  onClick={() => performSaveDraft(true)}
                  title="Click or press Ctrl+S to manually save draft"
                  className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 hover:bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-500/20 cursor-pointer transition"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-400 animate-ping' : 'bg-teal-400'}`} />
                  <span className="hidden sm:inline">DRAFT:</span>
                  <span>{lastAutoSavedTime}</span>
                </div>
              )}
              <div className="text-[10px] font-mono text-cyan-400/60 hidden md:flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-cyan-500/15">
                <Keyboard className="w-3 h-3 text-cyan-400/70" />
                <span>Ctrl+Enter: Gen | Ctrl+S: Save</span>
              </div>
            </div>
          </div>

          {/* Big Bento Logo & Title Input */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-2">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-fuchsia-500/20 border border-cyan-400/40 flex items-center justify-center text-xl flex-shrink-0 shadow-[0_0_15px_rgba(0,242,255,0.2)]">
                  {metadata.favicon || '📦'}
                </div>
                <input
                  id="doc-title-input"
                  type="text"
                  value={metadata.title}
                  onChange={e => onChangeMetadata({ ...metadata, title: e.target.value })}
                  placeholder="Untitled Bitty Box"
                  className="w-full bg-transparent font-cyber text-2xl sm:text-3xl font-extrabold text-cyan-200 placeholder:text-purple-400/40 focus:outline-none border-b border-transparent focus:border-cyan-400 transition pb-0.5"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-purple-300/70 pl-1">
                <span>PATH SLUG:</span>
                <span className="text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  /{metadata.title ? metadata.title.toLowerCase().replace(/\s+/g, '-') : 'untitled'}/
                </span>
                {metadata.language && (
                  <span className="text-[10px] text-teal-300 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-500/30 uppercase">
                    LANG: {metadata.language}
                  </span>
                )}
                {metadata.author && (
                  <span className="text-[10px] text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">
                    BY: {metadata.author}
                  </span>
                )}
                {metadata.password && (
                  <span className="flex items-center gap-1 text-[10px] text-fuchsia-400 bg-fuchsia-950/80 px-2 py-0.5 rounded border border-fuchsia-500/40">
                    <Shield className="w-3 h-3" />
                    AES LOCKED
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Toolbar Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-cyan-500/15">
            <button
              id="bitty-presets-btn"
              onClick={() => setIsGalleryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-950/70 to-purple-950/70 border border-fuchsia-500/40 text-fuchsia-200 hover:bg-fuchsia-900/50 hover:text-white text-xs font-cyber transition shadow-sm"
              title="Browse and load ready-to-use micro-web templates"
            >
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>TEMPLATE GALLERY</span>
            </button>

            <button
              id="bitty-seo-btn"
              onClick={() => setIsSeoModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-900/50 hover:text-white text-xs font-mono transition shadow-sm"
              title="Open SEO & Discoverability Analyzer Modal"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>SEO ANALYZER</span>
            </button>

            {/* Split-View Layout Mode Toggle */}
            <div className="flex items-center bg-black/60 p-1 rounded-lg border border-cyan-500/30">
              <button
                type="button"
                onClick={() => setEditorViewMode('split')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition ${
                  editorViewMode === 'split'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                    : 'text-purple-300/70 hover:text-cyan-200'
                }`}
                title="Split View: Side-by-Side Code Editor & Live Preview"
              >
                <Columns className="w-3 h-3 text-cyan-400" />
                <span>SPLIT VIEW</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorViewMode('code')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition ${
                  editorViewMode === 'code'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                    : 'text-purple-300/70 hover:text-cyan-200'
                }`}
                title="Code Editor Full Width"
              >
                <Code2 className="w-3 h-3 text-cyan-400" />
                <span>CODE</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorViewMode('preview')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition ${
                  editorViewMode === 'preview'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                    : 'text-purple-300/70 hover:text-cyan-200'
                }`}
                title="Live Preview Stream Full Width"
              >
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>PREVIEW</span>
              </button>
            </div>

            <button
              id="bitty-import-btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 text-xs font-mono transition"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>IMPORT FILE</span>
            </button>

            <button
              id="bitty-export-zip-btn"
              onClick={handleExportZip}
              disabled={isExportingZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/50 border border-purple-500/40 text-purple-200 hover:bg-purple-900/50 hover:text-white text-xs font-mono transition shadow-[0_0_10px_rgba(189,0,255,0.2)]"
              title="Download standalone index.html & README as ZIP package"
            >
              {zipExportSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
                  <span className="text-teal-300">ZIP DOWNLOADED</span>
                </>
              ) : (
                <>
                  <FolderArchive className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>{isExportingZip ? 'PACKAGING ZIP...' : 'EXPORT TO ZIP'}</span>
                </>
              )}
            </button>

            <button
              id="bitty-meta-btn"
              onClick={() => setShowMetadata(!showMetadata)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-200 hover:bg-purple-900/30 text-xs font-mono transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>PARAMS & META TAGS</span>
              {showMetadata ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Close Session Trigger */}
            {onCloseSession && (
              <button
                id="bitty-close-session-btn"
                onClick={onCloseSession}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-rose-950/80 hover:text-white hover:border-rose-400 text-xs font-cyber transition shadow-sm cursor-pointer"
                title="Close active editing session (with confirmation warning)"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-400" />
                <span>CLOSE SESSION</span>
              </button>
            )}

            <div className="ml-auto text-[11px] font-mono text-cyan-400/60 hidden lg:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>ZERO-SERVER CLIENT VM</span>
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO CELL 2: SYSTEM TELEMETRY & STATS (Span 4) with DEDICATED COPY URL BUTTON
           ----------------------------------------------------------------------- */}
        <div className="bento-card md:col-span-4 p-5 flex flex-col justify-between">
          <div className="bento-corner-accent top-l" />
          <div className="bento-corner-accent top-r" />
          <div className="bento-corner-accent bot-l" />
          <div className="bento-corner-accent bot-r" />

          <div>
            <div className="flex items-center justify-between pb-1">
              <div className="bento-card-header !mb-0">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Telemetry &amp; Transmission Stats
              </div>
            </div>

            <div className="space-y-2 mt-3">
              <div className="bento-stat-row">
                <span className="text-purple-200/70">Compression</span>
                <span className="bento-stat-val">
                  {compressionRatio > 0 ? `${compressionRatio}%` : '0%'}
                </span>
              </div>

              <div className="bento-stat-row">
                <span className="text-purple-200/70">Bitty Mode</span>
                <span className="bento-stat-val">
                  {metadata.password ? 'AES-GCM-256' : 'QUANTUM GZIP'}
                </span>
              </div>

              <div className="bento-stat-row">
                <span className="text-purple-200/70">Raw Payload</span>
                <span className="bento-stat-val">{originalBytes} BYTES</span>
              </div>

              <div className="bento-stat-row !border-b-0">
                <span className="text-purple-200/70">Packed Link Size</span>
                <span className="bento-stat-val text-fuchsia-300">
                  {compressedBytes} BYTES
                </span>
              </div>
            </div>

            {/* DEDICATED COPY URL BUTTON IN STATS SECTION */}
            <div className="mt-3 pt-2">
              <button
                id="stats-copy-url-btn"
                onClick={handleCopyFullUrl}
                className={`w-full py-2 px-3 rounded-lg border font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                  statsUrlCopied
                    ? 'bg-teal-950/80 border-teal-400 text-teal-200 shadow-[0_0_15px_rgba(20,184,166,0.5)]'
                    : 'bg-gradient-to-r from-cyan-950/80 via-purple-950/80 to-fuchsia-950/80 border-cyan-500/40 text-cyan-200 hover:text-white hover:border-cyan-300 hover:shadow-[0_0_12px_rgba(0,242,255,0.3)]'
                }`}
                title="Copy the full generated Bitty URL directly to your clipboard"
              >
                {statsUrlCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-300 animate-bounce" />
                    <span>FULL BITTY URL COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>COPY GENERATED URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* VISUAL PROGRESS BAR: URL CAPACITY & BROWSER LENGTH LIMITS */}
          <div className="mt-3 pt-2.5 border-t border-cyan-500/15">
            <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                <span>URL FRAGMENT CAPACITY:</span>
              </div>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                isOversized 
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40' 
                  : isExtended 
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40' 
                    : isNearLimit 
                      ? 'bg-yellow-950 text-yellow-300 border border-yellow-500/40' 
                      : 'bg-teal-950 text-teal-300 border border-teal-500/40'
              }`}>
                {isOversized ? 'CRITICAL (>8KB)' : isExtended ? 'EXTENDED (2-8KB)' : isNearLimit ? 'WARN (>80%)' : 'OPTIMAL (<2KB)'}
              </span>
            </div>

            {/* Visual Capacity Gauge */}
            <div className="relative w-full h-2.5 bg-black/80 rounded-full overflow-hidden border border-cyan-500/30 p-[1px] shadow-inner">
              <div className="absolute top-0 bottom-0 left-[25%] w-[1px] bg-cyan-400/40 z-10" title="2,048B Universal Standard" />
              <div className="absolute top-0 bottom-0 left-[100%] w-[1px] bg-amber-400/40 z-10" title="8,192B Max Browser Threshold" />

              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isOversized
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                    : isExtended
                      ? 'bg-gradient-to-r from-cyan-400 via-amber-400 to-fuchsia-500 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                      : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-300 shadow-[0_0_8px_rgba(0,242,255,0.6)]'
                }`}
                style={{ 
                  width: `${Math.min(100, Math.max(3, isExtended ? (currentUrlLength / EXTENDED_URL_LIMIT) * 100 : capacityPercent))}%` 
                }}
              />
            </div>

            {/* Numeric Capacity Metrics */}
            <div className="flex items-center justify-between text-[10px] font-mono text-purple-300/70 mt-1">
              <span>{currentUrlLength} / {isExtended ? `${EXTENDED_URL_LIMIT}B (Ext)` : `${STANDARD_URL_LIMIT}B (Std)`}</span>
              <span>{isExtended ? `${Math.round((currentUrlLength / EXTENDED_URL_LIMIT) * 100)}% Max` : `${capacityPercent}% Capacity`}</span>
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO CELL 2B: CODE COMPLEXITY DASHBOARD TILE (Span 12)
           ----------------------------------------------------------------------- */}
        <div className="bento-card md:col-span-12 p-5 overflow-hidden">
          <div className="bento-corner-accent top-l" />
          <div className="bento-corner-accent top-r" />
          <div className="bento-corner-accent bot-l" />
          <div className="bento-corner-accent bot-r" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="bento-card-header !mb-0">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                Code Complexity &amp; Structural Metrics Dashboard
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-purple-300/70">COMPLEXITY PROFILE:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${complexityMetrics.complexityBg} ${complexityMetrics.complexityColor}`}>
                {complexityMetrics.complexityLevel} ({complexityMetrics.complexityScore}/100)
              </span>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Line Count */}
            <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/25 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1">
                <span className="flex items-center gap-1">
                  <FileCode2 className="w-3 h-3 text-cyan-400" />
                  LINES
                </span>
                <span className="text-[9px] text-purple-400">Total</span>
              </div>
              <div className="font-cyber text-xl font-bold text-cyan-200">
                {complexityMetrics.lineCount.toLocaleString()}
              </div>
              <div className="text-[9px] font-mono text-purple-300/60 mt-1 truncate">
                {complexityMetrics.lineCount > 100 ? 'Dense layout' : 'Compact script'}
              </div>
            </div>

            {/* Total Characters */}
            <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/25 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1">
                <span className="flex items-center gap-1">
                  <Binary className="w-3 h-3 text-cyan-400" />
                  CHARACTERS
                </span>
                <span className="text-[9px] text-purple-400">Raw</span>
              </div>
              <div className="font-cyber text-xl font-bold text-teal-300">
                {complexityMetrics.charCount.toLocaleString()}
              </div>
              <div className="text-[9px] font-mono text-purple-300/60 mt-1 truncate">
                {complexityMetrics.nonWhitespaceChars.toLocaleString()} non-space
              </div>
            </div>

            {/* Word Count */}
            <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/25 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-cyan-400" />
                  WORDS
                </span>
                <span className="text-[9px] text-purple-400">Tokens</span>
              </div>
              <div className="font-cyber text-xl font-bold text-fuchsia-300">
                {complexityMetrics.wordCount.toLocaleString()}
              </div>
              <div className="text-[9px] font-mono text-purple-300/60 mt-1 truncate">
                Lexical tokens
              </div>
            </div>

            {/* HTML Tags Count */}
            <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/25 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" />
                  DOM TAGS
                </span>
                <span className="text-[9px] text-purple-400">Elements</span>
              </div>
              <div className="font-cyber text-xl font-bold text-amber-300">
                {complexityMetrics.htmlTagsCount.toLocaleString()}
              </div>
              <div className="text-[9px] font-mono text-purple-300/60 mt-1 truncate">
                HTML nodes
              </div>
            </div>

            {/* Style & Script Blocks */}
            <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/25 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1">
                <span className="flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-cyan-400" />
                  EMBEDDED
                </span>
                <span className="text-[9px] text-purple-400">CSS/JS</span>
              </div>
              <div className="font-cyber text-xl font-bold text-purple-300">
                {complexityMetrics.styleBlocks + complexityMetrics.scriptBlocks}
              </div>
              <div className="text-[9px] font-mono text-purple-300/60 mt-1 truncate">
                {complexityMetrics.styleBlocks} CSS / {complexityMetrics.scriptBlocks} JS
              </div>
            </div>

            {/* Compression Density */}
            <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/25 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  DENSITY
                </span>
                <span className="text-[9px] text-purple-400">Ratio</span>
              </div>
              <div className="font-cyber text-xl font-bold text-cyan-300">
                {originalBytes > 0 ? (compressedBytes / originalBytes).toFixed(2) : '0.00'}x
              </div>
              <div className="text-[9px] font-mono text-purple-300/60 mt-1 truncate">
                Bytes per packed char
              </div>
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            BENTO CELL: PRESETS LABORATORY (Optional expansion, Span 12)
           ----------------------------------------------------------------------- */}
        {showTemplates && (
          <div className="bento-card-purple md:col-span-12 p-5 animate-in slide-in-from-top-2 duration-150">
            <div className="bento-corner-accent top-l bento-corner-accent-purple" />
            <div className="bento-corner-accent top-r bento-corner-accent-purple" />
            <div className="bento-corner-accent bot-l bento-corner-accent-purple" />
            <div className="bento-corner-accent bot-r bento-corner-accent-purple" />

            <div className="bento-card-header-purple mb-3">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              Quantum Presets Laboratory // Instant Transmissions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TEMPLATE_PRESETS.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    onSelectTemplate(tpl);
                    setShowTemplates(false);
                  }}
                  className="p-3 rounded-lg bg-black/40 hover:bg-purple-950/60 border border-fuchsia-500/30 hover:border-cyan-400/60 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{tpl.favicon}</span>
                    <h5 className="font-cyber text-xs font-bold text-cyan-200 group-hover:text-cyan-300 truncate">
                      {tpl.name}
                    </h5>
                  </div>
                  <p className="text-[11px] text-purple-200/70 font-mono line-clamp-2">
                    {tpl.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            BENTO CELL: METADATA, CIPHER & META TAGS (Span 12)
           ----------------------------------------------------------------------- */}
        {showMetadata && (
          <div className="bento-card md:col-span-12 p-5 animate-in slide-in-from-top-2 duration-150">
            <div className="bento-corner-accent top-l" />
            <div className="bento-corner-accent top-r" />
            <div className="bento-corner-accent bot-l" />
            <div className="bento-corner-accent bot-r" />

            <div className="bento-card-header mb-3">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Document Metadata, Meta Tags &amp; Cryptography Configuration
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Description */}
              <div>
                <label className="block text-[11px] font-mono text-cyan-300 mb-1 flex items-center gap-1.5 uppercase">
                  <FileText className="w-3 h-3 text-cyan-400" />
                  Description (meta description)
                </label>
                <input
                  type="text"
                  value={metadata.description || ''}
                  onChange={e => onChangeMetadata({ ...metadata, description: e.target.value })}
                  placeholder="Meta summary for link embeds..."
                  className="w-full bg-[#080212] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder:text-purple-400/40 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-[11px] font-mono text-cyan-300 mb-1 flex items-center gap-1.5 uppercase">
                  <User className="w-3 h-3 text-cyan-400" />
                  Author (meta author)
                </label>
                <input
                  type="text"
                  value={metadata.author || ''}
                  onChange={e => onChangeMetadata({ ...metadata, author: e.target.value })}
                  placeholder="e.g. Agent Alice / Jane Doe"
                  className="w-full bg-[#080212] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder:text-purple-400/40 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-[11px] font-mono text-cyan-300 mb-1 flex items-center gap-1.5 uppercase">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  Language (html lang)
                </label>
                <input
                  type="text"
                  value={metadata.language || ''}
                  onChange={e => onChangeMetadata({ ...metadata, language: e.target.value })}
                  placeholder="en, es, fr, ja, de..."
                  className="w-full bg-[#080212] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder:text-purple-400/40 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Canonical URL */}
              <div>
                <label className="block text-[11px] font-mono text-cyan-300 mb-1 flex items-center gap-1.5 uppercase">
                  <LinkIcon className="w-3 h-3 text-cyan-400" />
                  Canonical URL (rel canonical)
                </label>
                <input
                  type="url"
                  value={metadata.canonicalUrl || ''}
                  onChange={e => onChangeMetadata({ ...metadata, canonicalUrl: e.target.value })}
                  placeholder="https://example.com/page"
                  className="w-full bg-[#080212] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder:text-purple-400/40 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Favicon Emoji */}
              <div>
                <label className="block text-[11px] font-mono text-cyan-300 mb-1 flex items-center gap-1.5 uppercase">
                  <Smile className="w-3 h-3 text-cyan-400" />
                  Favicon / Emoji
                </label>
                <input
                  type="text"
                  value={metadata.favicon || ''}
                  onChange={e => onChangeMetadata({ ...metadata, favicon: e.target.value })}
                  placeholder="Emoji (e.g. 🚀, 🕹️, 🍜)..."
                  className="w-full bg-[#080212] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder:text-purple-400/40 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Social Preview Image URL */}
              <div>
                <label className="block text-[11px] font-mono text-cyan-300 mb-1 flex items-center justify-between uppercase">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3 text-cyan-400" />
                    Social Preview Image URL
                  </span>
                  {metadata.image && (
                    <span className="text-[9px] text-teal-300 font-bold bg-teal-950/80 px-1 rounded border border-teal-500/30">
                      OG:IMAGE READY
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="meta-social-image-input"
                    type="url"
                    value={metadata.image || ''}
                    onChange={e => onChangeMetadata({ ...metadata, image: e.target.value })}
                    placeholder="https://images.unsplash.com/... (1200x630px recommended)"
                    className="w-full bg-[#080212] border border-cyan-500/30 rounded-lg pl-3 pr-8 py-2 text-xs text-cyan-100 placeholder:text-purple-400/40 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  {metadata.image && (
                    <button
                      type="button"
                      onClick={() => onChangeMetadata({ ...metadata, image: '' })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-rose-300 text-xs font-mono p-1"
                      title="Clear image URL"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-[10px] font-mono text-purple-300/60 mt-1">
                  Thumbnail displayed when shared on X, Discord, Slack, LinkedIn, and iMessage.
                </p>
                {metadata.image && (
                  <div className="mt-2 relative rounded-md border border-cyan-500/30 overflow-hidden bg-black/60 max-h-20 flex items-center justify-center">
                    <img 
                      src={metadata.image} 
                      alt="Social thumbnail preview" 
                      className="w-full h-16 object-cover opacity-80 hover:opacity-100 transition"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Client-Side Cryptographic Password Strength Meter & Generator */}
            <PasswordStrengthMeter
              password={metadata.password}
              onChangePassword={pwd => onChangeMetadata({ ...metadata, password: pwd })}
            />
          </div>
        )}

        {/* -----------------------------------------------------------------------
            BENTO CELL 3: PAYLOAD INPUT // SYNTAX-HIGHLIGHTED CODE MATRIX (Span 6 or 12)
           ----------------------------------------------------------------------- */}
        {editorViewMode !== 'preview' && (
          <div className={`bento-card ${editorViewMode === 'split' ? 'md:col-span-6 lg:col-span-6' : 'md:col-span-12'} p-5 flex flex-col min-h-[500px]`}>
            <div className="bento-corner-accent top-l" />
            <div className="bento-corner-accent top-r" />
            <div className="bento-corner-accent bot-l" />
            <div className="bento-corner-accent bot-r" />

            {/* Cell Header, Format Code Button & Format Snippets */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-cyan-500/15">
              <div className="flex items-center gap-2">
                <div className="bento-card-header !mb-0">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  Payload Editor
                </div>
                <span className="text-[10px] font-mono text-cyan-400/50 hidden sm:inline">
                  [PRISM SYNTAX ACTIVE]
                </span>
              </div>

              {/* Quick Actions: UNDO/REDO, FORMAT CODE BUTTON & HTML/CSS/JS Tag Injectors */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                {/* UNDO & REDO BUTTON GROUP */}
                <div className="flex items-center bg-black/60 p-0.5 rounded border border-cyan-500/30">
                  <button
                    id="editor-undo-btn"
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition ${
                      canUndo
                        ? 'text-cyan-300 hover:text-white hover:bg-cyan-950/80 active:scale-95 cursor-pointer shadow-sm'
                        : 'text-purple-300/30 cursor-not-allowed opacity-40'
                    }`}
                    title="Undo last change (Ctrl+Z / Cmd+Z)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-bold">UNDO</span>
                    {canUndo && undoCount > 0 && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold ml-0.5">
                        {undoCount}
                      </span>
                    )}
                  </button>

                  <div className="h-3.5 w-[1px] bg-cyan-500/20 mx-0.5" />

                  <button
                    id="editor-redo-btn"
                    type="button"
                    onClick={redo}
                    disabled={!canRedo}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition ${
                      canRedo
                        ? 'text-cyan-300 hover:text-white hover:bg-cyan-950/80 active:scale-95 cursor-pointer shadow-sm'
                        : 'text-purple-300/30 cursor-not-allowed opacity-40'
                    }`}
                    title="Redo next change (Ctrl+Y / Cmd+Shift+Z)"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-bold">REDO</span>
                    {canRedo && redoCount > 0 && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950/80 border border-purple-500/40 text-fuchsia-300 font-bold ml-0.5">
                        {redoCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-cyan-500/20 mx-1 hidden sm:block" />

                {/* PRETTIER FORMAT CODE BUTTON */}
                <button
                  id="format-code-btn"
                  onClick={handleFormatCode}
                  disabled={isFormatting || !content.trim()}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-cyber transition shadow-sm ${
                    formatSuccess
                      ? 'bg-teal-950/80 border border-teal-400 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.4)]'
                      : 'bg-gradient-to-r from-purple-950/80 to-cyan-950/80 hover:from-purple-900/90 hover:to-cyan-900/90 border border-cyan-500/40 text-cyan-200 hover:text-white'
                  }`}
                  title="Format HTML & CSS cleanly using Prettier (Shift+Alt+F)"
                >
                  {formatSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
                      <span>FORMATTED!</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className={`w-3.5 h-3.5 text-cyan-300 ${isFormatting ? 'animate-spin' : ''}`} />
                      <span>{isFormatting ? 'FORMATTING...' : 'FORMAT CODE'}</span>
                    </>
                  )}
                </button>

                <div className="h-4 w-[1px] bg-cyan-500/20 mx-1 hidden sm:block" />

                <button
                  onClick={() => insertSnippet('<h1>', '</h1>')}
                  className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-cyan-300 font-bold transition"
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  onClick={() => insertSnippet('<strong>', '</strong>')}
                  className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-cyan-300 font-bold transition"
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={() => insertSnippet('<code>', '</code>')}
                  className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-cyan-300 transition"
                  title="Code"
                >
                  &lt;/&gt;
                </button>
                <button
                  onClick={() => insertSnippet('<style>\n  body { background: #050515; color: #00f2ff; }\n</style>\n')}
                  className="px-2 py-0.5 rounded bg-fuchsia-950/60 hover:bg-fuchsia-900/80 border border-fuchsia-500/30 text-fuchsia-300 transition"
                  title="Inject CSS Style"
                >
                  CSS
                </button>
                <button
                  onClick={() => insertSnippet('<script>\n  console.log("Bitty Box loaded!");\n</script>\n')}
                  className="px-2 py-0.5 rounded bg-teal-950/60 hover:bg-teal-900/80 border border-teal-500/30 text-teal-300 transition"
                  title="Inject JS Script"
                >
                  JS
                </button>
              </div>
            </div>

            {/* Integrated Lightweight Syntax Highlighting Code Editor */}
            <div className="flex-1 w-full min-h-[380px] flex flex-col">
              <CodeEditor
                value={content}
                onChange={handleCodeChange}
                onUndo={undo}
                onRedo={redo}
                placeholder="Type or paste any HTML, text, CSS, JS, or Markdown here... Everything will be compressed and encoded directly into a zero-server URL!"
                className="flex-1"
              />
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            BENTO CELL 4: LIVE PREVIEW // HOLOGRAPHIC STREAM (Span 6 or 12)
           ----------------------------------------------------------------------- */}
        {editorViewMode !== 'code' && (
          <div className={`bento-card live-preview-container ${editorViewMode === 'split' ? 'md:col-span-6 lg:col-span-6' : 'md:col-span-12'} p-5 flex flex-col min-h-[500px]`}>
            <div className="bento-corner-accent top-l" />
            <div className="bento-corner-accent top-r" />
            <div className="bento-corner-accent bot-l" />
            <div className="bento-corner-accent bot-r" />

            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-cyan-500/15">
              <div className="flex items-center gap-2">
                <div className="bento-card-header !mb-0">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Live Preview Stream
                </div>
                <div className="text-[10px] font-mono text-teal-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  REAL-TIME SYNC
                </div>
              </div>

              {/* Device Simulator and Refresh Toolbar */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <div className="flex items-center bg-black/70 p-0.5 rounded border border-cyan-500/30">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition ${
                      previewDevice === 'desktop' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' : 'text-purple-300/60 hover:text-cyan-200'
                    }`}
                    title="Desktop Preview (Full Width)"
                  >
                    <Monitor className="w-3 h-3" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition ${
                      previewDevice === 'mobile' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' : 'text-purple-300/60 hover:text-cyan-200'
                    }`}
                    title="Mobile Preview (375px)"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewKey(k => k + 1)}
                  className="p-1.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition"
                  title="Refresh Live Preview Frame"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Viewport Frame with device simulation */}
            <div className="flex-1 w-full rounded overflow-hidden border border-cyan-500/30 bg-[#050515] relative shadow-inner min-h-[380px] flex items-center justify-center p-1">
              <div 
                className={`h-full transition-all duration-300 relative ${
                  previewDevice === 'mobile' 
                    ? 'w-[375px] max-w-full rounded-2xl border-2 border-cyan-500/40 shadow-[0_0_20px_rgba(0,242,255,0.2)] overflow-hidden' 
                    : 'w-full'
                }`}
              >
                <iframe
                  key={previewKey}
                  srcDoc={previewHtml}
                  title="Bitty Box Live Preview Stream"
                  className="w-full h-full border-0 absolute inset-0 bg-[#050515]"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-downloads"
                />
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            BENTO CELL 5: FOOTER GENERATOR ACTION (Span 12)
           ----------------------------------------------------------------------- */}
        <div className="bento-card md:col-span-12 p-8 flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="bento-corner-accent top-l" />
          <div className="bento-corner-accent top-r" />
          <div className="bento-corner-accent bot-l" />
          <div className="bento-corner-accent bot-r" />

          {/* Holographic Generate Button */}
          <HoloGenerateButton
            onClick={onGenerate}
            isCopied={isCopied}
            byteCount={originalBytes}
            compressedCount={compressedBytes}
            label="GENERATE BITTY"
            subLabel={`${compressedBytes} B`}
          />

          {/* Quick Action: SEO Score Modal */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsSeoModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 text-xs font-mono transition shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>CHECK SEO SCORE</span>
            </button>
          </div>

          {/* Shareable Link Display */}
          {bittyUrl && (
            <div className="mt-4 w-full max-w-3xl bg-[#000000]/60 border border-cyan-500/40 rounded p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in duration-200 relative">
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[10px] font-mono text-cyan-400 mb-0.5 uppercase tracking-widest flex items-center gap-2">
                  <span>TRANSMISSION LINK // ENCAPSULATED URL:</span>
                  <span className="text-purple-300 text-[9px] font-normal">({currentUrlLength} chars)</span>
                </div>
                <div className="text-xs font-mono text-cyan-200 truncate select-all">
                  {bittyUrl}
                </div>
              </div>

              {/* Transmission banner URL is selectable directly */}
            </div>
          )}
        </div>

      </div>

      {/* Interactive Template Gallery Modal */}
      <TemplateGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelectTemplate={onSelectTemplate}
        currentContentLength={content.trim().length}
      />

      {/* Interactive SEO Analyzer Modal */}
      <SeoAnalyzerModal
        isOpen={isSeoModalOpen}
        onClose={() => setIsSeoModalOpen(false)}
        metadata={metadata}
        onChangeMetadata={onChangeMetadata}
        bittyUrl={bittyUrl}
      />
    </div>
  );
};
