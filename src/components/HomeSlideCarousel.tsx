import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Radio,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  Lock,
  Unlock,
  Code,
  ExternalLink,
  CheckCircle2,
  Clock,
  Timer,
  Gauge,
  Flame,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Coins,
  RotateCcw,
  AlertTriangle,
  Link2,
  FilePlus2,
  Trash2,
  GripVertical
} from 'lucide-react';
import { CyberScrambleText } from './CyberScrambleText';
import { QrModal } from './QrModal';
import { LegalModal, LegalTab } from './LegalModal';
import { TemplatePreset } from '../types';
import { exportBittyToZip } from '../utils/zipExport';

import { HoloGenerateButton } from './HoloGenerateButton';
import { HoloToggle } from './HoloToggle';
import { homeSlides } from '../content/homeSlides';
import { buildBittyUrl, compressContent, compressContentSync, getRenderedHtml, hashString } from '../utils/bittyEngine';
import { useAccount } from '../hooks/useAccount';
import { buildTimeWindow, formatHybridSummary, formatLocalDateTime, type TimeLockMode } from '../utils/timeWindow';
import { DurationTimeControl, DateRangeControl } from './TimeLockControls';
import { BittyMetadata, BittyHistoryItem, BittyChainDraft, BittyChainDraftPage } from '../types';
import {
  calculateTotalChainCreditCost,
  getBoxBlockBreakdown,
  calculateBoxCreditCost,
  type BoxCreditBreakdown,
} from '../utils/bittyChain';

export interface HomeSlideCarouselProps {
  content?: string;
  onChangeContent?: (content: string) => void;
  metadata?: BittyMetadata;
  onChangeMetadata?: (metadata: BittyMetadata) => void;
  bittyUrl?: string;
  onReplaySplash?: () => void;
  onOpenTools?: () => void;
  onOpenTemplates?: () => void;
  onOpenPreview?: () => void;
  isPreviewOpen?: boolean;
  isToolsOpen?: boolean;
  isTemplatesOpen?: boolean;
  onComplete?: () => void;
  isPro?: boolean;
  onOpenPaywall?: (featureName?: string) => void;
  chainEnabled?: boolean;
  chainIndex?: number;
  chainTotal?: number;
  chainMax?: number;
  chainDraft?: BittyChainDraft | null;
  isLastChainBox?: boolean;
  onToggleChain?: (enabled: boolean) => void;
  onOpenChainNext?: () => void;
  onCreateNextChainPage?: (mode: 'clone' | 'scratch') => void;
  onGoToLastChainBox?: () => void;
  onGoToChainPage?: (index: number) => void;
  onDeleteLastChainBox?: () => void;
  onDeleteChainPage?: (index: number) => void;
  onReorderChainPages?: (fromIndex: number, toIndex: number) => void;
  onGenerateChain?: (content: string, metadata: BittyMetadata) => Promise<{ entryUrl: string; urls: string[]; creditCost?: number; boxCreditBreakdowns?: BoxCreditBreakdown[] }>;
  onSlideChange?: (currentSlide: number, isLastSlide: boolean) => void;
}

interface CarouselSlide {
  id: string;
  tag: string;
  category: string;
  title: string;
  highlight: string;
  description: string;
  accentColor: 'cyan' | 'fuchsia' | 'emerald' | 'amber';
  bullets: string[];
  cta: string;
  icon: React.ReactNode;
}

const DEFAULT_STARTER_CODE = '';

export const HomeSlideCarousel: React.FC<HomeSlideCarouselProps> = ({
  content,
  onChangeContent,
  metadata,
  onChangeMetadata,
  bittyUrl,
  onReplaySplash,
  onOpenTools,
  onOpenTemplates,
  onOpenPreview,
  isPreviewOpen,
  isToolsOpen,
  isTemplatesOpen,
  onComplete,
  isPro = false,
  onOpenPaywall,
  chainEnabled = false,
  chainIndex = 0,
  chainTotal = 1,
  chainMax = 5,
  chainDraft = null,
  isLastChainBox = true,
  onToggleChain,
  onOpenChainNext,
  onCreateNextChainPage,
  onGoToLastChainBox,
  onGoToChainPage,
  onDeleteLastChainBox,
  onDeleteChainPage,
  onReorderChainPages,
  onGenerateChain,
  onSlideChange,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<number>(1);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [draggedChainIndex, setDraggedChainIndex] = useState<number | null>(null);
  const [dragOverChainIndex, setDragOverChainIndex] = useState<number | null>(null);

  const handleChainDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedChainIndex(index);
  };

  const handleChainDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverChainIndex !== index) {
      setDragOverChainIndex(index);
    }
  };

  const handleChainDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : draggedChainIndex;
    if (sourceIndex !== null && !isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      onReorderChainPages?.(sourceIndex, targetIndex);
    }
    setDraggedChainIndex(null);
    setDragOverChainIndex(null);
  };

  const handleChainDragEnd = () => {
    setDraggedChainIndex(null);
    setDragOverChainIndex(null);
  };

  // Configuration state across the 5 slides (synced with parent props)
  const [boxContent, setBoxContent] = useState<string>(content !== undefined ? content : DEFAULT_STARTER_CODE);
  const [boxTitle, setBoxTitle] = useState<string>(metadata?.title || 'My Box');
  const [boxDescription, setBoxDescription] = useState<string>(metadata?.description || '');
  const [passwordEnabled, setPasswordEnabled] = useState<boolean>(false);
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('terms');

  const [slide1ViewMode, setSlide1ViewMode] = useState<'text' | 'split'>('text');

  const [timeLockEnabled, setTimeLockEnabled] = useState<boolean>(false);
  const [timeLockMode, setTimeLockMode] = useState<TimeLockMode>('expiry');
  const [timeExpiryHours, setTimeExpiryHours] = useState<number>(24);
  const [timeDelayHours, setTimeDelayHours] = useState<number>(24);
  const [timeOpenAt, setTimeOpenAt] = useState<string>(formatLocalDateTime(new Date(Date.now() + 24 * 3600 * 1000)));
  const [timeLockAt, setTimeLockAt] = useState<string>(formatLocalDateTime(new Date(Date.now() + 48 * 3600 * 1000)));
  const [hybridRevealMode, setHybridRevealMode] = useState<'delay' | 'date'>('delay');
  const [hybridSelfDestructHours, setHybridSelfDestructHours] = useState<number>(24);
  const [showTimeCountdown, setShowTimeCountdown] = useState<boolean>(true);

  const [accessLimitEnabled, setAccessLimitEnabled] = useState<boolean>(false);
  const [accessLimitMaxOpens, setAccessLimitMaxOpens] = useState<number>(1);
  const [isCustomAccessLimit, setIsCustomAccessLimit] = useState<boolean>(false);
  const [customAccessLimitInput, setCustomAccessLimitInput] = useState<string>('25');
  const [showRemainingAccessCount, setShowRemainingAccessCount] = useState<boolean>(true);
  const lastSyncedMetadataRef = useRef<BittyMetadata | null>(null);
  const lastChainIndexRef = useRef<number | undefined>(chainIndex);

  // Synchronize incoming prop changes from parent when switching boxes / sessions
  useEffect(() => {
    if (content !== undefined && content !== boxContent) {
      setBoxContent(content);
    }
  }, [content]);

  useEffect(() => {
    if (metadata && metadata === lastSyncedMetadataRef.current && chainIndex === lastChainIndexRef.current) {
      return;
    }
    lastChainIndexRef.current = chainIndex;

    if (metadata) {
      lastSyncedMetadataRef.current = metadata;
      if (metadata.title !== undefined) {
        setBoxTitle(metadata.title);
      }
      if (metadata.description !== undefined) {
        setBoxDescription(metadata.description);
      }

      if (metadata.password !== undefined && metadata.password.length > 0) {
        setPasswordEnabled(true);
        setPasswordValue(metadata.password);
      } else {
        setPasswordEnabled(false);
        setPasswordValue('');
      }

      if (metadata.lockConfig?.timeWindow?.enabled) {
        setTimeLockEnabled(true);
        const tw = metadata.lockConfig.timeWindow;
        if (tw.mode) setTimeLockMode(tw.mode);
        if (tw.expiryHours !== undefined) setTimeExpiryHours(tw.expiryHours);
        if (tw.delayHours !== undefined) setTimeDelayHours(tw.delayHours);
        if (tw.openAt !== undefined) setTimeOpenAt(tw.openAt);
        if (tw.lockAt !== undefined) setTimeLockAt(tw.lockAt);
        if (tw.hybridRevealMode !== undefined) setHybridRevealMode(tw.hybridRevealMode);
        if (tw.hybridSelfDestructHours !== undefined) setHybridSelfDestructHours(tw.hybridSelfDestructHours);
        if (tw.showCountdown !== undefined) setShowTimeCountdown(tw.showCountdown);
      } else {
        setTimeLockEnabled(false);
      }

      if (metadata.lockConfig?.openLimit?.enabled) {
        setAccessLimitEnabled(true);
        const ol = metadata.lockConfig.openLimit;
        if (ol.maxOpens) {
          setAccessLimitMaxOpens(ol.maxOpens);
          if (![1, 3, 5, 10].includes(ol.maxOpens)) {
            setIsCustomAccessLimit(true);
            setCustomAccessLimitInput(String(ol.maxOpens));
          } else {
            setIsCustomAccessLimit(false);
          }
        }
        if (ol.showRemainingCount !== undefined) {
          setShowRemainingAccessCount(ol.showRemainingCount);
        }
      } else {
        setAccessLimitEnabled(false);
        setAccessLimitMaxOpens(1);
        setIsCustomAccessLimit(false);
      }
    }
  }, [metadata, chainIndex]);

  const syncMetadata = useCallback((overrides?: {
    title?: string;
    description?: string;
    passwordEnabled?: boolean;
    passwordValue?: string;
    timeLockEnabled?: boolean;
    timeLockMode?: TimeLockMode;
    timeExpiryHours?: number;
    timeDelayHours?: number;
    timeOpenAt?: string;
    timeLockAt?: string;
    hybridRevealMode?: 'delay' | 'date';
    hybridSelfDestructHours?: number;
    showTimeCountdown?: boolean;
    accessLimitEnabled?: boolean;
    accessLimitMaxOpens?: number;
    showRemainingAccessCount?: boolean;
  }) => {
    const tTitle = overrides?.title !== undefined ? overrides.title : boxTitle;
    const tDesc = overrides?.description !== undefined ? overrides.description : boxDescription;
    const tPassEnabled = overrides?.passwordEnabled !== undefined ? overrides.passwordEnabled : passwordEnabled;
    const tPassVal = overrides?.passwordValue !== undefined ? overrides.passwordValue : passwordValue;
    const tTwEnabled = overrides?.timeLockEnabled !== undefined ? overrides.timeLockEnabled : timeLockEnabled;
    const tTwMode = overrides?.timeLockMode !== undefined ? overrides.timeLockMode : timeLockMode;
    const tExpHrs = overrides?.timeExpiryHours !== undefined ? overrides.timeExpiryHours : timeExpiryHours;
    const tDelayHrs = overrides?.timeDelayHours !== undefined ? overrides.timeDelayHours : timeDelayHours;
    const tOpenAt = overrides?.timeOpenAt !== undefined ? overrides.timeOpenAt : timeOpenAt;
    const tLockAt = overrides?.timeLockAt !== undefined ? overrides.timeLockAt : timeLockAt;
    const tHybRev = overrides?.hybridRevealMode !== undefined ? overrides.hybridRevealMode : hybridRevealMode;
    const tHybDestruct = overrides?.hybridSelfDestructHours !== undefined ? overrides.hybridSelfDestructHours : hybridSelfDestructHours;
    const tShowCd = overrides?.showTimeCountdown !== undefined ? overrides.showTimeCountdown : showTimeCountdown;
    const tOlEnabled = overrides?.accessLimitEnabled !== undefined ? overrides.accessLimitEnabled : accessLimitEnabled;
    const tOlMax = overrides?.accessLimitMaxOpens !== undefined ? overrides.accessLimitMaxOpens : accessLimitMaxOpens;
    const tOlSrc = overrides?.showRemainingAccessCount !== undefined ? overrides.showRemainingAccessCount : showRemainingAccessCount;

    const pass = tPassEnabled && tPassVal.trim().length >= 8 ? tPassVal.trim() : (tPassEnabled ? tPassVal : undefined);

    const updatedMetadata: BittyMetadata = {
      ...(metadata || { title: tTitle, description: tDesc, favicon: '📦', includeMetadata: true }),
      title: tTitle,
      description: tDesc,
      password: pass,
      lockConfig: {
        ...(tTwEnabled ? {
          timeWindow: buildTimeWindow({
            enabled: true,
            mode: tTwMode,
            expiryHours: tExpHrs,
            delayHours: tDelayHrs,
            openAt: tOpenAt,
            lockAt: tLockAt,
            hybridRevealMode: tHybRev,
            hybridSelfDestructHours: tHybDestruct,
            showCountdown: tShowCd,
          })!,
        } : {}),
        ...(tOlEnabled ? {
          openLimit: {
            enabled: true,
            maxOpens: tOlMax,
            opensUsed: 0,
            showRemainingCount: tOlSrc,
          },
        } : {}),
      },
    };

    lastSyncedMetadataRef.current = updatedMetadata;
    onChangeMetadata?.(updatedMetadata);
  }, [
    metadata,
    boxTitle,
    boxDescription,
    passwordEnabled,
    passwordValue,
    timeLockEnabled,
    timeLockMode,
    timeExpiryHours,
    timeDelayHours,
    timeOpenAt,
    timeLockAt,
    hybridRevealMode,
    hybridSelfDestructHours,
    showTimeCountdown,
    accessLimitEnabled,
    accessLimitMaxOpens,
    showRemainingAccessCount,
    onChangeMetadata,
  ]);

  const handleContentUpdate = useCallback((newContent: string) => {
    setBoxContent(newContent);
    onChangeContent?.(newContent);
  }, [onChangeContent]);

  const handleTitleUpdate = useCallback((newTitle: string) => {
    setBoxTitle(newTitle);
    syncMetadata({ title: newTitle });
  }, [syncMetadata]);

  const handleDescriptionUpdate = useCallback((newDescription: string) => {
    setBoxDescription(newDescription);
    syncMetadata({ description: newDescription });
  }, [syncMetadata]);

  const handleTogglePassword = useCallback((enabled: boolean) => {
    setPasswordEnabled(enabled);
    syncMetadata({ passwordEnabled: enabled });
  }, [syncMetadata]);

  const handlePasswordChange = useCallback((val: string) => {
    setPasswordValue(val);
    syncMetadata({ passwordValue: val, passwordEnabled: true });
  }, [syncMetadata]);

  const handleToggleTimeLock = useCallback((enabled: boolean) => {
    setTimeLockEnabled(enabled);
    syncMetadata({ timeLockEnabled: enabled });
  }, [syncMetadata]);

  const handleTimeLockModeChange = useCallback((mode: TimeLockMode) => {
    setTimeLockMode(mode);
    syncMetadata({ timeLockMode: mode, timeLockEnabled: true });
  }, [syncMetadata]);

  const handleTimeExpiryHoursChange = useCallback((hrs: number) => {
    setTimeExpiryHours(hrs);
    syncMetadata({ timeExpiryHours: hrs, timeLockEnabled: true });
  }, [syncMetadata]);

  const handleTimeDelayHoursChange = useCallback((hrs: number) => {
    setTimeDelayHours(hrs);
    syncMetadata({ timeDelayHours: hrs, timeLockEnabled: true });
  }, [syncMetadata]);

  const handleTimeOpenAtChange = useCallback((val: string) => {
    setTimeOpenAt(val);
    syncMetadata({ timeOpenAt: val, timeLockEnabled: true });
  }, [syncMetadata]);

  const handleTimeLockAtChange = useCallback((val: string) => {
    setTimeLockAt(val);
    syncMetadata({ timeLockAt: val, timeLockEnabled: true });
  }, [syncMetadata]);

  const handleHybridRevealModeChange = useCallback((val: 'delay' | 'date') => {
    setHybridRevealMode(val);
    syncMetadata({ hybridRevealMode: val, timeLockEnabled: true });
  }, [syncMetadata]);

  const handleHybridSelfDestructHoursChange = useCallback((hrs: number) => {
    setHybridSelfDestructHours(hrs);
    syncMetadata({ hybridSelfDestructHours: hrs, timeLockEnabled: true });
  }, [syncMetadata]);

  const handleToggleAccessLimit = useCallback((enabled: boolean) => {
    setAccessLimitEnabled(enabled);
    syncMetadata({ accessLimitEnabled: enabled });
  }, [syncMetadata]);

  const handleAccessLimitMaxOpensChange = useCallback((max: number) => {
    setAccessLimitMaxOpens(max);
    syncMetadata({ accessLimitMaxOpens: max, accessLimitEnabled: true });
  }, [syncMetadata]);

  const [generatedUrl, setGeneratedUrl] = useState<string>(bittyUrl || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrModalUrl, setQrModalUrl] = useState<string>('');
  // Mobile-only accordions for the terminal slide (collapsed on <sm, always expanded on sm+)
  const [costDetailsOpen, setCostDetailsOpen] = useState<boolean>(false);
  const [chainDetailsOpen, setChainDetailsOpen] = useState<boolean>(false);
  const account = useAccount();
  const { user, isAuthenticated } = account;

  const trimmedPasscode = passwordValue.trim();
  const isPasscodeActive = Boolean(passwordEnabled && trimmedPasscode.length >= 8);
  const isPasscodeTooShort = Boolean(passwordEnabled && trimmedPasscode.length > 0 && trimmedPasscode.length < 8);
  const isTimeLockActive = Boolean(timeLockEnabled);
  const isAccessLimitActive = Boolean(accessLimitEnabled);

  const timeLockSummary = useMemo(() => {
    if (!timeLockEnabled) return 'Disabled';
    if (timeLockMode === 'expiry') return `Expires after ${timeExpiryHours === 168 ? '7 Days' : `${timeExpiryHours}h`}`;
    if (timeLockMode === 'delay') return `Unlocks in ${timeDelayHours === 168 ? '7 Days' : `${timeDelayHours}h`}`;
    if (timeLockMode === 'hybrid') return formatHybridSummary({ hybridRevealMode, delayHours: timeDelayHours, openAt: timeOpenAt, hybridSelfDestructHours });
    return `Opens ${timeOpenAt ? new Date(timeOpenAt).toLocaleString() : '—'} · Locks ${timeLockAt ? new Date(timeLockAt).toLocaleString() : '—'}`;
  }, [timeLockEnabled, timeLockMode, timeExpiryHours, timeDelayHours, timeOpenAt, timeLockAt, hybridRevealMode, hybridSelfDestructHours]);

  const currentBoxMetadata = useMemo<BittyMetadata>(() => {
    return {
      title: boxTitle || 'My Box',
      description: boxDescription.trim() || '',
      favicon: '📦',
      includeMetadata: true,
      password: isPasscodeActive ? passwordValue.trim() : undefined,
      lockConfig: {
        ...(timeLockEnabled ? {
          timeWindow: buildTimeWindow({
            enabled: timeLockEnabled,
            mode: timeLockMode,
            expiryHours: timeExpiryHours,
            delayHours: timeDelayHours,
            openAt: timeOpenAt,
            lockAt: timeLockAt,
            hybridRevealMode,
            hybridSelfDestructHours,
            showCountdown: showTimeCountdown,
          })!
        } : {}),
        ...(accessLimitEnabled ? {
          openLimit: {
            enabled: true,
            maxOpens: accessLimitMaxOpens,
            opensUsed: 0,
            showRemainingCount: showRemainingAccessCount,
          }
        } : {}),
      },
    };
  }, [
    boxTitle,
    boxDescription,
    isPasscodeActive,
    passwordValue,
    timeLockEnabled,
    timeLockMode,
    timeExpiryHours,
    timeDelayHours,
    timeOpenAt,
    timeLockAt,
    hybridRevealMode,
    hybridSelfDestructHours,
    showTimeCountdown,
    accessLimitEnabled,
    accessLimitMaxOpens,
    showRemainingAccessCount,
  ]);

  const effectiveChainPages = useMemo<BittyChainDraftPage[]>(() => {
    if (!chainEnabled || !chainDraft?.pages || chainDraft.pages.length === 0) {
      return [
        {
          id: 'page_current',
          content: boxContent,
          metadata: currentBoxMetadata,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
    }
    return chainDraft.pages.map((p, idx) => {
      if (idx === chainIndex) {
        return {
          ...p,
          content: boxContent,
          metadata: currentBoxMetadata,
        };
      }
      return p;
    });
  }, [chainEnabled, chainDraft, chainIndex, boxContent, currentBoxMetadata]);

  const singleBoxBreakdown = useMemo(() => {
    return getBoxBlockBreakdown(currentBoxMetadata, chainIndex, false);
  }, [currentBoxMetadata, chainIndex]);

  const chainCreditCalculation = useMemo(() => {
    if (!chainEnabled || effectiveChainPages.length === 0) {
      return {
        totalCost: singleBoxBreakdown.totalCost,
        boxBreakdowns: [singleBoxBreakdown],
      };
    }
    return calculateTotalChainCreditCost(effectiveChainPages);
  }, [chainEnabled, effectiveChainPages, singleBoxBreakdown]);

  const calculatedCreditCost = useMemo(() => {
    if (chainEnabled) {
      return chainCreditCalculation.totalCost;
    }
    return singleBoxBreakdown.totalCost;
  }, [chainEnabled, chainCreditCalculation.totalCost, singleBoxBreakdown.totalCost]);

  const isUserPro = Boolean(isPro || user?.tier === 'pro');
  const userCredits = user?.credits ?? 0;
  const hasSufficientCredits = isUserPro || (isAuthenticated && userCredits >= calculatedCreditCost);
  const requiresCredits = calculatedCreditCost > 0 && !hasSufficientCredits;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesized Web Audio Sound FX
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, gainValue = 0.05) => {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, [soundEnabled, initAudio]);

  const playSlideSound = useCallback((idx: number) => {
    if (!soundEnabled) return;
    const baseFreqs = [440, 523.25, 659.25, 783.99];
    const freq = baseFreqs[idx % baseFreqs.length] || 520;
    playTone(freq, 'sine', 0.18, 0.06);
  }, [soundEnabled, playTone]);

  const playWarpSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Sub-bass drop
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(240, now);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + 1.2);
      subGain.gain.setValueAtTime(0.25, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 1.2);
    } catch {}
  }, [soundEnabled, initAudio]);

  // 5 Slides Definition (Content -> Password -> Time -> Access Limits -> Review & Generate)
  const slideChrome: Array<Omit<CarouselSlide, 'id' | 'title' | 'highlight' | 'description' | 'bullets' | 'cta'>> = [
    {
      category: 'YOUR CONTENT',
      tag: '01 // ADD YOUR CONTENT',
      accentColor: 'cyan',
      icon: <Code className="w-6 h-6 text-cyan-300" />,
    },
    {
      category: 'PASSCODE LOCK',
      tag: '02 // PASSCODE LOCK',
      accentColor: 'fuchsia',
      icon: <Key className="w-6 h-6 text-fuchsia-300" />,
    },
    {
      category: 'TIMED LOCK',
      tag: '03 // TIME-BASED LOCK',
      accentColor: 'amber',
      icon: <Clock className="w-6 h-6 text-amber-300" />,
    },
    {
      category: 'VIEW LIMITS',
      tag: '04 // VIEW LIMITS',
      accentColor: 'emerald',
      icon: <Gauge className="w-6 h-6 text-emerald-300" />,
    },
    {
      category: 'REVIEW & COST',
      tag: '05 // REVIEW & GENERATE',
      accentColor: 'cyan',
      icon: <Coins className="w-6 h-6 text-amber-300" />,
    },
  ];

  const slides: CarouselSlide[] = homeSlides.map((slide, index) => ({
    id: slide.id,
    category: slideChrome[index]?.category ?? slide.kicker,
    tag: slideChrome[index]?.tag ?? slide.kicker,
    title: slide.kicker,
    highlight: slide.headline,
    description: slide.body,
    bullets: slide.bullets,
    cta: slide.cta,
    accentColor: slideChrome[index]?.accentColor ?? 'cyan',
    icon: slideChrome[index]?.icon ?? <Code className="w-6 h-6 text-cyan-300" />,
  }));
  const terminalSlideIndex = Math.min(4, slides.length - 1);
  const visibleSlides = slides.slice(0, terminalSlideIndex + 1);
  const isTerminalSlide = currentSlide >= terminalSlideIndex;

  useEffect(() => {
    onSlideChange?.(currentSlide, isTerminalSlide);
  }, [currentSlide, isTerminalSlide, onSlideChange]);

  // Slide navigation handlers
  const goToSlide = useCallback((newIndex: number, newDirection?: number) => {
    const clampedIndex = Math.min(Math.max(newIndex, 0), terminalSlideIndex);
    const dir = newDirection !== undefined ? newDirection : clampedIndex > currentSlide ? 1 : -1;
    setDirection(dir);
    setCurrentSlide(clampedIndex);
    playSlideSound(clampedIndex);
  }, [currentSlide, playSlideSound, terminalSlideIndex]);

  const nextSlide = useCallback(() => {
    if (currentSlide < terminalSlideIndex) {
      goToSlide(currentSlide + 1, 1);
    }
  }, [currentSlide, terminalSlideIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1, -1);
    }
  }, [currentSlide, goToSlide]);

  // Rendered preview HTML for the final preview window
  const slidePreviewHtml = useMemo(() => {
    const source = boxContent.trim() || DEFAULT_STARTER_CODE;
    return getRenderedHtml(source, {
      title: boxTitle || 'Bitty Box',
      description: boxDescription.trim() || '',
      language: 'en',
    });
  }, [boxContent, boxTitle, boxDescription]);

  // Pre-generate / sync URL continuously so it is immediately available on click
  const [readyUrl, setReadyUrl] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;
    const generatePreviewUrl = async () => {
      try {
        const source = boxContent.trim() || DEFAULT_STARTER_CODE;
        const html = getRenderedHtml(source, {
          title: boxTitle || 'Bitty Box',
          description: boxDescription.trim() || '',
          language: 'en',
        });

        const pass = passwordEnabled && passwordValue.trim().length >= 8 ? passwordValue.trim() : undefined;

        let compressedFragment = '';
        if (!pass) {
          const syncRes = compressContentSync(html, { mimeType: 'text/html', isRawHtml: true });
          if (syncRes) {
            compressedFragment = syncRes.compressedUrl;
          }
        }
        if (!compressedFragment) {
          const encoded = await compressContent(html, {
            password: pass,
            mimeType: 'text/html',
            isRawHtml: true,
          });
          if (encoded) {
            compressedFragment = encoded.compressedUrl;
          }
        }

        if (isCancelled || !compressedFragment) return;

        const meta: BittyMetadata = {
          title: boxTitle || 'Bitty Box',
          description: boxDescription.trim() || '',
          favicon: '📦',
          includeMetadata: true,
        };

        if (timeLockEnabled) {
          meta.lockConfig = {
            timeWindow: buildTimeWindow({
              enabled: timeLockEnabled,
              mode: timeLockMode,
              expiryHours: timeExpiryHours,
              delayHours: timeDelayHours,
              openAt: timeOpenAt,
              lockAt: timeLockAt,
              hybridRevealMode,
              hybridSelfDestructHours,
              showCountdown: showTimeCountdown,
            })!,
          };
        }

        if (accessLimitEnabled) {
          meta.lockConfig = {
            ...(meta.lockConfig || {}),
            openLimit: {
              enabled: true,
              maxOpens: accessLimitMaxOpens,
              opensUsed: 0,
              showRemainingCount: showRemainingAccessCount,
            },
          };
        }

        const fullUrl = buildBittyUrl(compressedFragment, meta);
        if (!isCancelled) {
          setReadyUrl(fullUrl);
        }
      } catch {}
    };

    generatePreviewUrl();
    return () => {
      isCancelled = true;
    };
  }, [boxContent, boxTitle, boxDescription, passwordEnabled, passwordValue, timeLockEnabled, timeLockMode, timeExpiryHours, timeDelayHours, timeOpenAt, timeLockAt, hybridRevealMode, hybridSelfDestructHours, showTimeCountdown, accessLimitEnabled, accessLimitMaxOpens, showRemainingAccessCount]);

  // Start Over / Reset All State
  const handleStartOver = useCallback(() => {
    handleContentUpdate(DEFAULT_STARTER_CODE);
    handleTitleUpdate('My Box');
    handleDescriptionUpdate('');
    setSlide1ViewMode('text');
    setPasswordEnabled(false);
    setPasswordValue('');
    setShowPassword(false);
    setTimeLockEnabled(false);
    setTimeLockMode('expiry');
    setTimeExpiryHours(6);
    setTimeDelayHours(24);
    setTimeOpenAt(formatLocalDateTime(new Date(Date.now() + 24 * 3600 * 1000)));
    setTimeLockAt(formatLocalDateTime(new Date(Date.now() + 48 * 3600 * 1000)));
    setHybridRevealMode('delay');
    setHybridSelfDestructHours(24);
    setShowTimeCountdown(true);
    setAccessLimitEnabled(false);
    setAccessLimitMaxOpens(1);
    setShowRemainingAccessCount(true);
    setReadyUrl('');
    setGeneratedUrl('');
    setIsCopied(false);
    setCurrentSlide(0);
  }, [handleContentUpdate, handleTitleUpdate, handleDescriptionUpdate]);

  // Generate Bitty Box with all active lock configurations
  const handleGenerateFinal = useCallback(async () => {
    if (chainEnabled && !isLastChainBox) {
      onGoToLastChainBox?.();
      return;
    }

    if (calculatedCreditCost > 0) {
      const userIsPro = Boolean(isPro || account.user?.tier === 'pro');
      const curCredits = account.user?.credits ?? 0;
      const canProceed = userIsPro || (account.isAuthenticated && curCredits >= calculatedCreditCost);
      if (!canProceed) {
        onOpenPaywall?.(chainEnabled ? `Chained Box Locks (${calculatedCreditCost} CR)` : `Time & View Limit Locks (${calculatedCreditCost} CR)`);
        return;
      }
    }

    if (chainEnabled && onGenerateChain) {
      let popupWin: Window | null = null;
      try {
        popupWin = window.open('about:blank', '_blank');
      } catch {}

      const chainResult = await onGenerateChain(boxContent, {
        title: boxTitle || 'Bitty Box',
        description: boxDescription.trim() || '',
        favicon: '📦',
        includeMetadata: true,
        password: passwordEnabled && passwordValue.trim().length >= 8 ? passwordValue.trim() : undefined,
        lockConfig: {
          ...(timeLockEnabled ? { timeWindow: buildTimeWindow({
            enabled: timeLockEnabled,
            mode: timeLockMode,
            expiryHours: timeExpiryHours,
            delayHours: timeDelayHours,
            openAt: timeOpenAt,
            lockAt: timeLockAt,
            hybridRevealMode,
            hybridSelfDestructHours,
            showCountdown: showTimeCountdown,
          })! } : {}),
          ...(accessLimitEnabled ? { openLimit: {
            enabled: true,
            maxOpens: accessLimitMaxOpens,
            opensUsed: 0,
            showRemainingCount: showRemainingAccessCount,
          } } : {}),
        },
      });
      if (chainResult.entryUrl) {
        setGeneratedUrl(chainResult.entryUrl);
        if (popupWin && !popupWin.closed) {
          popupWin.location.href = chainResult.entryUrl;
        } else {
          try {
            window.open(chainResult.entryUrl, '_blank');
          } catch {}
        }
        try {
          await navigator.clipboard?.writeText(chainResult.entryUrl);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 3500);
        } catch {}
      } else if (popupWin && !popupWin.closed) {
        popupWin.close();
      }
      return;
    }

    const source = (boxContent && boxContent.trim()) ? boxContent : (content && content.trim() ? content : DEFAULT_STARTER_CODE);
    const html = getRenderedHtml(source, {
      title: boxTitle || 'Bitty Box',
      description: boxDescription.trim() || '',
      language: 'en',
    });

    const pass = passwordEnabled && passwordValue.trim().length >= 8 ? passwordValue.trim() : undefined;
    if (passwordEnabled && passwordValue.trim().length < 8) {
      setCurrentSlide(1);
      return;
    }
    const uniqueBoxId = `bbx_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    let compressedFragment = '';
    if (!pass) {
      try {
        const syncRes = compressContentSync(html, { mimeType: 'text/html', isRawHtml: true });
        if (syncRes) {
          compressedFragment = syncRes.compressedUrl;
        }
      } catch {}
    }

    if (!compressedFragment) {
      try {
        const encoded = await compressContent(html, {
          password: pass,
          mimeType: 'text/html',
          isRawHtml: true,
        });
        if (encoded) {
          compressedFragment = encoded.compressedUrl;
        }
      } catch (err) {
        console.error('Compression failed:', err);
      }
    }

    if (!compressedFragment) return;

    const meta: BittyMetadata = {
      title: boxTitle || 'Bitty Box',
      description: boxDescription.trim() || '',
      favicon: '📦',
      includeMetadata: true,
      boxId: (accessLimitEnabled || timeLockEnabled) ? uniqueBoxId : undefined,
    };

    if (timeLockEnabled) {
      meta.lockConfig = {
        timeWindow: buildTimeWindow({
          enabled: timeLockEnabled,
          mode: timeLockMode,
          expiryHours: timeExpiryHours,
          delayHours: timeDelayHours,
          openAt: timeOpenAt,
          lockAt: timeLockAt,
          hybridRevealMode,
          hybridSelfDestructHours,
          showCountdown: showTimeCountdown,
        })!,
      };
    }

    if (accessLimitEnabled) {
      meta.lockConfig = {
        ...(meta.lockConfig || {}),
        openLimit: {
          enabled: true,
          maxOpens: accessLimitMaxOpens,
          opensUsed: 0,
          showRemainingCount: showRemainingAccessCount,
        },
      };
    }

    const longUrl = buildBittyUrl(compressedFragment, meta);
    if (!longUrl) return;

    setGeneratedUrl(longUrl);
    onChangeContent?.(source);
    onChangeMetadata?.(meta);

    // 2. Open new tab directly with the target URL in direct user gesture context
    let tabOpened = false;
    try {
      const openedWin = window.open(longUrl, '_blank');
      if (openedWin && !openedWin.closed) {
        tabOpened = true;
      }
    } catch {}

    if (!tabOpened) {
      try {
        const link = document.createElement('a');
        link.href = longUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        tabOpened = true;
      } catch {}
    }

    // 3. Copy to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(longUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = longUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3500);
    } catch {}

    // 4. Background registration if access limit is configured
    if (accessLimitEnabled && longUrl) {
      try {
        await fetch('/api/boxes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: uniqueBoxId,
            boxId: uniqueBoxId,
            title: boxTitle || 'Bitty Box',
            bittyUrl: compressedFragment || longUrl,
            lockConfig: {
              openLimit: {
                enabled: true,
                maxOpens: accessLimitMaxOpens,
                opensUsed: 0,
                showRemainingCount: showRemainingAccessCount,
              },
              timeWindow: timeLockEnabled
                ? buildTimeWindow({
                    enabled: timeLockEnabled,
                    mode: timeLockMode,
                    expiryHours: timeExpiryHours,
                    delayHours: timeDelayHours,
                    openAt: timeOpenAt,
                    lockAt: timeLockAt,
                    hybridRevealMode,
                    hybridSelfDestructHours,
                    showCountdown: showTimeCountdown,
                  })
                : null,
            },
          }),
        });
      } catch {
        // Fallback gracefully
      }
    }

    // 5. Record to local Quantum Vault history
    try {
      const hashId = await hashString(longUrl);
      const historyItem: BittyHistoryItem = {
        id: hashId,
        url: longUrl,
        title: boxTitle || 'Untitled Bitty Box',
        description: boxDescription.trim() || '',
        favicon: '📦',
        byteSize: boxContent.length,
        compressedSize: compressedFragment.length || longUrl.length,
        createdAt: Date.now(),
        encrypted: Boolean(passwordEnabled && passwordValue),
      };
      const existingHistory = JSON.parse(localStorage.getItem('bitty_box_history') || '[]');
      const updatedHistory = [historyItem, ...existingHistory.filter((h: any) => h.id !== hashId)].slice(0, 50);
      localStorage.setItem('bitty_box_history', JSON.stringify(updatedHistory));
    } catch {}

    // 6. Automatically track and deduct credits in user's account log if signed in
    if (account.isAuthenticated || account.user) {
      try {
        await account.recordCreatedBox({
          title: boxTitle || 'Untitled Bitty Box',
          url: longUrl,
          format: 'html',
          byteSize: boxContent.length,
          compressedSize: compressedFragment.length || longUrl.length,
          encrypted: Boolean(passwordEnabled && passwordValue),
          cost: calculatedCreditCost,
          locks: {
            password: Boolean(passwordEnabled && passwordValue),
            timeWindow: Boolean(timeLockEnabled),
            accessLimit: Boolean(accessLimitEnabled),
          },
        });
      } catch (err) {
        console.error('[AnimatedSplash] Failed to record created box to user account:', err);
      }
    }
  }, [chainEnabled, isLastChainBox, onGoToLastChainBox, onGenerateChain, boxContent, boxTitle, boxDescription, passwordEnabled, passwordValue, timeLockEnabled, timeLockMode, timeExpiryHours, timeDelayHours, timeOpenAt, timeLockAt, hybridRevealMode, hybridSelfDestructHours, showTimeCountdown, accessLimitEnabled, accessLimitMaxOpens, showRemainingAccessCount, calculatedCreditCost, isPro, onOpenPaywall, account, readyUrl]);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay) return;
    autoPlayTimerRef.current = setInterval(() => {
      nextSlide();
    }, 6500);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlay, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch gestures

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    setTouchStartX(null);
  };



  // Framer Motion Slide Variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 120 : -120,
      opacity: 0,
      scale: 0.94,
      rotateY: dir > 0 ? 10 : -10,
      filter: 'blur(6px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring', stiffness: 340, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
        rotateY: { duration: 0.35 },
        filter: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -120 : 120,
      opacity: 0,
      scale: 0.94,
      rotateY: dir > 0 ? -10 : 10,
      filter: 'blur(6px)',
      transition: {
        x: { type: 'spring', stiffness: 340, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
        rotateY: { duration: 0.25 },
        filter: { duration: 0.2 },
      },
    }),
  };

  const activeSlideData = slides[currentSlide];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 overflow-hidden bg-[#03020e] text-cyan-100 flex flex-col justify-between select-none h-[100dvh] opacity-100"
    >
      {/* Parallax Starfield Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div id="stars" />
        <div id="stars2" />
        <div id="stars3" />
      </div>

      {/* Top HUD Header Navigation Bar */}
      <header className="relative z-20 w-full px-4 sm:px-6 py-1.5 sm:py-2 h-[52px] sm:h-[56px] flex items-center justify-between border-b border-cyan-500/20 bg-[#060419]/75 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_15px_rgba(0,242,255,0.4)] overflow-hidden p-1">
            <img
              src="/bittybox-logo.png"
              alt="Bitty Box Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_6px_rgba(0,242,255,0.6)]"
            />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-cyan-300 flex items-center gap-2">
              <span>BITTY BOX</span>
            </div>
            <div className="hidden sm:block text-[9px] font-mono text-cyan-400/60 tracking-wider">
              BUILT FOR AI AGENTS &bull; HUMANS WELCOME TOO
            </div>
          </div>
        </div>

        {/* Live Slide Step Indicator (01 / 05) */}
        <div className="flex items-center gap-1.5 font-mono text-xs text-cyan-300/80 bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
          <span className="text-cyan-200 font-bold">0{currentSlide + 1}</span>
          <span className="text-cyan-500">/</span>
          <span className="text-cyan-400/60">0{terminalSlideIndex + 1}</span>
        </div>

        {/* Controls: Audio Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => {
              initAudio();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-1.5 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                : 'bg-black/40 border-cyan-500/20 text-cyan-600 hover:text-cyan-400'
            }`}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
            aria-label="Toggle audio effects"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Interactive Carousel Area */}
      <main className="relative z-10 flex-1 w-full px-3 sm:px-6 max-w-5xl lg:max-w-6xl mx-auto min-h-0 overflow-y-auto overscroll-contain">


        <div className="w-full min-h-full flex flex-col items-center justify-center [perspective:1200px] py-3 sm:py-4">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_e, { offset, velocity }) => {
                const swipe = offset.x;
                if (swipe < -50 || velocity.x < -200) {
                  nextSlide();
                } else if (swipe > 50 || velocity.x > 200) {
                  prevSlide();
                }
              }}
              className="w-full max-w-4xl lg:max-w-5xl bg-[#090620]/85 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 md:p-6 shadow-[0_0_40px_rgba(0,0,0,0.85),inset_0_0_20px_rgba(0,242,255,0.08)] backdrop-blur-2xl relative cursor-grab active:cursor-grabbing scrollbar-thin scrollbar-thumb-cyan-500/40 scrollbar-track-transparent"
            >
              {/* Corner Accents */}
              <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none" />

              {/* Glowing Radial Accent */}
              <div
                className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none ${
                  activeSlideData.accentColor === 'fuchsia'
                    ? 'bg-fuchsia-500'
                    : activeSlideData.accentColor === 'emerald'
                    ? 'bg-emerald-500'
                    : activeSlideData.accentColor === 'amber'
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
              />

              {/* Two-Column Responsive Grid Layout on Desktop */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-stretch w-full">
                {/* ─────────────────────────────────────────────────────────────
                    LEFT COLUMN (md:col-span-6): Interactive Tool Panel
                    ───────────────────────────────────────────────────────────── */}
                <div
                  className="md:col-span-6 flex flex-col justify-center min-h-0"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                >
                  {/* =========================================================
                      SLIDE 1 (Index 0): TEXT INPUT / COMPOSER FIELD (TEXT / SPLIT)
                      ========================================================= */}
                  {currentSlide === 0 && (
                    <div className="w-full bg-[#050314]/90 border border-cyan-500/40 rounded-xl p-3 sm:p-3.5 shadow-[0_0_25px_rgba(0,242,255,0.15)] font-mono flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      {/* Top Bar: Mode Tabs (TEXT / SPLIT) and Bytes Counter */}
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2 gap-2">
                        <div className="flex items-center gap-1 bg-black/60 border border-cyan-500/30 rounded-lg p-0.5 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => setSlide1ViewMode('text')}
                            className={`px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
                              slide1ViewMode === 'text'
                                ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/60 shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                                : 'text-cyan-400/60 hover:text-cyan-200'
                            }`}
                            title="Code / Text Editor only"
                          >
                            TEXT
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlide1ViewMode('split')}
                            className={`px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
                              slide1ViewMode === 'split'
                                ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/60 shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                                : 'text-cyan-400/60 hover:text-cyan-200'
                            }`}
                            title="Split View: Editor and Rendered Preview side-by-side"
                          >
                            SPLIT
                          </button>
                        </div>

                        <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded font-bold shrink-0">
                          {boxContent.length} BYTES
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">
                          Page title
                          <input
                            type="text"
                            value={boxTitle}
                            onChange={e => handleTitleUpdate(e.target.value)}
                            onFocus={() => setIsAutoPlay(false)}
                            onPointerDown={e => e.stopPropagation()}
                            aria-label="Page title for your Bitty Box"
                            placeholder="My Box"
                            maxLength={80}
                            className="w-full rounded-lg border border-cyan-400/30 bg-[#02010a] px-2.5 py-2 text-xs normal-case tracking-normal text-cyan-100 placeholder:text-cyan-400/40 outline-none transition focus:border-cyan-300 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">
                          Page description
                          <input
                            type="text"
                            value={boxDescription}
                            onChange={e => handleDescriptionUpdate(e.target.value)}
                            onFocus={() => setIsAutoPlay(false)}
                            onPointerDown={e => e.stopPropagation()}
                            aria-label="Page description for your Bitty Box"
                            placeholder="Optional: describe what this Box contains. You can leave this blank and press Next."
                            maxLength={180}
                            className="w-full rounded-lg border border-cyan-400/30 bg-[#02010a] px-2.5 py-2 text-xs normal-case tracking-normal text-cyan-100 placeholder:text-cyan-400/40 outline-none transition focus:border-cyan-300 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                          />
                        </label>
                      </div>

                      {/* Editor Textarea */}
                      <textarea
                        value={boxContent}
                        onChange={e => handleContentUpdate(e.target.value)}
                        onFocus={() => setIsAutoPlay(false)}
                        onPointerDown={e => e.stopPropagation()}
                        aria-label="Content for your Bitty Box"
                        placeholder="Write text or paste HTML, CSS, or JavaScript code here. Press Next when you're ready to continue."
                        className="w-full flex-1 min-h-[110px] sm:min-h-[130px] md:min-h-[140px] resize-none rounded-lg border border-cyan-400/30 bg-[#02010a] p-2.5 text-xs leading-5 text-cyan-100 placeholder:text-cyan-400/40 outline-none transition focus:border-cyan-300 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2 pt-2 border-t border-cyan-500/20 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-cyan-400/60 text-[10px]">PRESET:</span>
                          <button
                            type="button"
                            onClick={() => handleContentUpdate(DEFAULT_STARTER_CODE)}
                            className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] hover:bg-cyan-900 transition-colors"
                          >
                            Starter Box
                          </button>
                          <button
                            type="button"
                            onClick={() => handleContentUpdate('<h1>Secret Note</h1>\n<p>Only visible to those with the link.</p>')}
                            className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] hover:bg-cyan-900 transition-colors"
                          >
                            Note
                          </button>
                        </div>
                        {boxContent && (
                          <button
                            type="button"
                            onClick={() => handleContentUpdate('')}
                            className="text-[10px] text-cyan-400/60 hover:text-rose-400 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* =========================================================
                      SLIDE 2 (Index 1): NUMERICAL PASSCODE LOCK (OPTIONAL)
                      ========================================================= */}
                  {currentSlide === 1 && (
                    <div className="w-full bg-[#050314]/90 border border-fuchsia-500/40 rounded-xl p-3 sm:p-4 shadow-[0_0_25px_rgba(189,0,255,0.18)] font-mono flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      <div className="flex items-center justify-between border-b border-fuchsia-500/20 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2 text-fuchsia-300 text-xs font-bold">
                          <Key className="w-4 h-4 text-fuchsia-400" />
                          <span>ENABLE PASSCODE LOCK</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTogglePassword(!passwordEnabled)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            passwordEnabled
                              ? 'bg-fuchsia-500 text-black shadow-[0_0_12px_rgba(217,70,239,0.8)]'
                              : 'bg-fuchsia-950/60 border border-fuchsia-500/40 text-fuchsia-400'
                          }`}
                        >
                          {passwordEnabled ? 'ENABLED' : 'OPTIONAL (OFF)'}
                        </button>
                      </div>

                      {passwordEnabled ? (
                        <div className="space-y-2.5 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-fuchsia-300/80">
                            <span>NUMERICAL PASSCODE (8-12 DIGITS)</span>
                            <span className={`bg-fuchsia-950/80 border px-1.5 py-0.5 rounded font-bold ${isPasscodeTooShort ? 'border-rose-500/60 text-rose-300' : 'border-fuchsia-500/40 text-fuchsia-200'}`}>
                              {passwordValue.length} / 12
                            </span>
                          </div>

                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={12}
                              minLength={8}
                              value={passwordValue}
                              onChange={e => {
                                const numbersOnly = e.target.value.replace(/\D/g, '').slice(0, 12);
                                handlePasswordChange(numbersOnly);
                              }}
                              placeholder="8-12 numbers (e.g. 12345678)..."
                              className="w-full rounded-lg border border-fuchsia-400/50 bg-[#02010a] px-3 py-2 text-center text-base tracking-[0.25em] text-fuchsia-100 placeholder:text-fuchsia-400/40 placeholder:text-xs placeholder:tracking-normal outline-none focus:border-fuchsia-300 pr-9 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fuchsia-400 hover:text-fuchsia-200"
                              title={showPassword ? 'Hide passcode' : 'Show passcode'}
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 pt-0.5 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-fuchsia-400/60 text-[10px]">PIN:</span>
                              {['12345678', '87654321', '90210902', '123456789012'].map(pin => (
                                <button
                                  key={pin}
                                  type="button"
                                  onClick={() => handlePasswordChange(pin)}
                                  className="px-1.5 py-0.5 rounded bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300 text-[10px] hover:bg-fuchsia-900"
                                >
                                  {pin}
                                </button>
                              ))}
                            </div>
                            {passwordValue && (
                              <button
                                type="button"
                                onClick={() => handlePasswordChange('')}
                                className="text-[10px] text-rose-400 hover:underline"
                              >
                                CLEAR
                              </button>
                            )}
                          </div>

                          {isPasscodeTooShort && (
                            <div className="flex items-center gap-1.5 text-[10px] text-rose-300 pt-0.5">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Passcode must be at least 8 digits before it can lock the Box.</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-[10px] text-fuchsia-300/80 pt-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">BANK-GRADE ENCRYPTION // LOCKED IN YOUR BROWSER</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-xs text-fuchsia-200/70 space-y-2">
                          <Unlock className="w-8 h-8 text-fuchsia-400/50" />
                          <p className="text-[11px] text-fuchsia-300/80">No passcode required. Anyone with the URL will be able to view the Box.</p>
                          <button
                            type="button"
                            onClick={() => handleTogglePassword(true)}
                            className="px-3 py-1 rounded bg-fuchsia-950 border border-fuchsia-500/40 text-fuchsia-300 text-[10px] font-bold hover:bg-fuchsia-900 transition-colors"
                          >
                            + Enable PIN Lock
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================================
                      SLIDE 3 (Index 2): TIME-BASED LOCK (OPTIONAL)
                      ========================================================= */}
                  {currentSlide === 2 && (
                    <div className="w-full bg-[#050314]/90 border border-amber-500/40 rounded-xl p-3 sm:p-4 shadow-[0_0_25px_rgba(245,158,11,0.18)] font-mono flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span>ENABLE TIME-BASED LOCK</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleTimeLock(!timeLockEnabled)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            timeLockEnabled
                              ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                              : 'bg-amber-950/60 border border-amber-500/40 text-amber-400'
                          }`}
                        >
                          {timeLockEnabled ? 'ENABLED' : 'OPTIONAL (OFF)'}
                        </button>
                      </div>

                      {timeLockEnabled ? (
                        <div className="space-y-3 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
                          {/* Mode selector */}
                          <div className="space-y-1.5">
                            <div className="text-[11px] text-amber-300/80 font-bold">LOCK MODE:</div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {([
                                { id: 'expiry', label: 'Expires', sub: 'Duration' },
                                { id: 'delay', label: 'Time Until Open', sub: 'Sleeper' },
                                { id: 'range', label: 'Date Range', sub: 'Scheduled' },
                                { id: 'hybrid', label: 'Reveal + Decay', sub: 'Hybrid' },
                              ] as const).map(m => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleTimeLockModeChange(m.id)}
                                  className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold leading-tight transition-all ${
                                    timeLockMode === m.id
                                      ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                      : 'bg-amber-950/30 border-amber-500/30 text-amber-400 hover:bg-amber-900/40'
                                  }`}
                                >
                                  <div>{m.label}</div>
                                  <div className="text-[8px] opacity-70 uppercase tracking-wide">{m.sub}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Expiry (current behavior) */}
                          {timeLockMode === 'expiry' && (
                            <DurationTimeControl
                              label="SELECT EXPIRATION DURATION:"
                              presets={[1, 6, 24, 168]}
                              value={timeExpiryHours}
                              onChange={handleTimeExpiryHoursChange}
                              hint="Link self-destructs after this duration."
                            />
                          )}

                          {/* Delay (Time Until Open) */}
                          {timeLockMode === 'delay' && (
                            <DurationTimeControl
                              label="UNLOCKS AFTER (TIME UNTIL OPEN):"
                              presets={[6, 24, 72, 168]}
                              value={timeDelayHours}
                              onChange={handleTimeDelayHoursChange}
                              hint="Link stays inert & unopenable until then."
                            />
                          )}

                          {/* Date Range (Opens at / Locks on) */}
                          {timeLockMode === 'range' && (
                            <DateRangeControl
                              openAt={timeOpenAt}
                              lockAt={timeLockAt}
                              onOpenAt={handleTimeOpenAtChange}
                              onLockAt={handleTimeLockAtChange}
                            />
                          )}

                          {/* Hybrid (Reveal + Self-Destruct) */}
                          {timeLockMode === 'hybrid' && (
                            <div className="space-y-2">
                              <div className="text-[10px] text-amber-300/80 font-bold">REVEAL INSTANT:</div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {([{ id: 'delay', label: 'After Delay' }, { id: 'date', label: 'On Date' }] as const).map(o => (
                                  <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => handleHybridRevealModeChange(o.id)}
                                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all ${
                                      hybridRevealMode === o.id
                                        ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                        : 'bg-amber-950/30 border-amber-500/30 text-amber-400 hover:bg-amber-900/40'
                                    }`}
                                  >
                                    {o.label}
                                  </button>
                                ))}
                              </div>

                              {hybridRevealMode === 'delay' ? (
                                <DurationTimeControl
                                  label="REVEALS AFTER (TIME UNTIL OPEN):"
                                  presets={[6, 24, 72, 168]}
                                  value={timeDelayHours}
                                  onChange={handleTimeDelayHoursChange}
                                  compact
                                />
                              ) : (
                                <div className="space-y-1.5">
                                  <div className="text-[10px] text-amber-300/80 font-bold">REVEALS ON (DATE/TIME):</div>
                                  <input
                                    type="datetime-local"
                                    value={timeOpenAt}
                                    onChange={e => handleTimeOpenAtChange(e.target.value)}
                                    className="w-full rounded-lg border border-amber-400/50 bg-[#02010a] px-2 py-1.5 text-[11px] text-amber-100 outline-none focus:border-amber-300 font-mono"
                                  />
                                </div>
                              )}

                              <DurationTimeControl
                                label="SELF-DESTRUCTS AFTER REVEAL:"
                                presets={[1, 6, 24, 168]}
                                value={hybridSelfDestructHours}
                                onChange={handleHybridSelfDestructHoursChange}
                                compact
                              />
                              <div className="text-[9px] text-amber-300/60 truncate">Reveals at scheduled instant, then auto-burns after the decay window.</div>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-[10px] text-amber-300/80 pt-0.5">
                            <Timer className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">
                              {timeLockMode === 'expiry' && 'TIMER // SELF-DESTRUCTS AFTER TIME IS UP'}
                              {timeLockMode === 'delay' && 'COUNTDOWN // STAYS LOCKED UNTIL TIME ARRIVES'}
                              {timeLockMode === 'range' && 'SCHEDULED // OPENS AND CLOSES ON SET DATES'}
                              {timeLockMode === 'hybrid' && 'TIMED DROP // OPENS AT SET TIME, THEN EXPIRES'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-xs text-amber-200/70 space-y-2">
                          <Clock className="w-8 h-8 text-amber-400/50" />
                          <p className="text-[11px] text-amber-300/80">No time expiration set. The Box will remain accessible indefinitely.</p>
                          <button
                            type="button"
                            onClick={() => handleToggleTimeLock(true)}
                            className="px-3 py-1 rounded bg-amber-950 border border-amber-500/40 text-amber-300 text-[10px] font-bold hover:bg-amber-900 transition-colors"
                          >
                            + Enable Expiry Window
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================================
                      SLIDE 4 (Index 3): ACCESS LIMIT LOCK (OPTIONAL)
                      ========================================================= */}
                  {currentSlide === 3 && (
                    <div className="w-full bg-[#050314]/90 border border-emerald-500/40 rounded-xl p-3 sm:p-4 shadow-[0_0_25px_rgba(0,255,204,0.18)] font-mono flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                          <Gauge className="w-4 h-4 text-emerald-400" />
                          <span>ENABLE VIEW LIMIT LOCK</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleAccessLimit(!accessLimitEnabled)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            accessLimitEnabled
                              ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(0,255,204,0.8)]'
                              : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                          }`}
                        >
                          {accessLimitEnabled ? 'ENABLED' : 'OPTIONAL (OFF)'}
                        </button>
                      </div>

                      {accessLimitEnabled ? (
                        <div className="space-y-2.5 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
                          <div className="text-[11px] text-emerald-300/80 font-bold">SET ALLOWABLE VIEWS:</div>
                          <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                            {[1, 3, 5, 10].map(q => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => {
                                  setIsCustomAccessLimit(false);
                                  handleAccessLimitMaxOpensChange(q);
                                }}
                                className={`py-1.5 px-1 sm:px-2 rounded-lg border text-[11px] font-bold transition-all truncate ${
                                  !isCustomAccessLimit && accessLimitMaxOpens === q
                                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(0,255,204,0.4)]'
                                    : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                                }`}
                              >
                                {q === 1 ? '1 (Burn)' : `${q}`}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                if (!isPro) {
                                  onOpenPaywall?.('Custom View Limit Lock');
                                  return;
                                }
                                setIsCustomAccessLimit(true);
                                const parsed = parseInt(customAccessLimitInput, 10);
                                if (!isNaN(parsed) && parsed >= 1 && parsed <= 1000000) {
                                  handleAccessLimitMaxOpensChange(parsed);
                                }
                              }}
                              className={`py-1.5 px-1 sm:px-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                isCustomAccessLimit
                                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(0,255,204,0.4)]'
                                  : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                              }`}
                              title={isPro ? 'Custom View Limit (Up to 1,000,000)' : 'PRO Feature: Unlock custom view limits up to 1,000,000'}
                            >
                              <span className="truncate">Custom</span>
                              <span className="px-1 py-0.2 rounded text-[8px] font-black tracking-wider bg-fuchsia-950 text-amber-300 border border-amber-500/50 shadow-[0_0_6px_rgba(245,158,11,0.3)] shrink-0">
                                PRO
                              </span>
                            </button>
                          </div>

                          {isCustomAccessLimit && (
                            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-2 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-emerald-300 font-bold">CUSTOM CAPACITY (1 - 1,000,000):</span>
                                <span className="text-emerald-400/70 font-mono">Max 1M Views</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={1000000}
                                  value={customAccessLimitInput}
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    setCustomAccessLimitInput(valStr);
                                    const val = parseInt(valStr, 10);
                                    if (!isNaN(val) && val >= 1 && val <= 1000000) {
                                      handleAccessLimitMaxOpensChange(val);
                                    }
                                  }}
                                  onBlur={() => {
                                    let val = parseInt(customAccessLimitInput, 10);
                                    if (isNaN(val) || val < 1) val = 1;
                                    if (val > 1000000) val = 1000000;
                                    setCustomAccessLimitInput(val.toString());
                                    handleAccessLimitMaxOpensChange(val);
                                  }}
                                  placeholder="e.g. 500 or 100000"
                                  className="flex-1 bg-black/70 border border-emerald-500/40 rounded px-2.5 py-1 text-xs text-emerald-200 font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                                />
                                <span className="text-[11px] text-emerald-300 font-bold whitespace-nowrap">
                                  {accessLimitMaxOpens.toLocaleString()} {accessLimitMaxOpens === 1 ? 'Open' : 'Opens'}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-300/80 pt-0.5">
                            <Flame className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">VIEW COUNTER // LOCKS PERMANENTLY WHEN REACHED</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-xs text-emerald-200/70 space-y-2">
                          <Gauge className="w-8 h-8 text-emerald-400/50" />
                          <p className="text-[11px] text-emerald-300/80">Unlimited opens. No access cap will be enforced.</p>
                          <button
                            type="button"
                            onClick={() => handleToggleAccessLimit(true)}
                            className="px-3 py-1 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold hover:bg-emerald-900 transition-colors"
                          >
                            + Enable Open Quota
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================================
                      FINAL SLIDE: CONFIGURED LOCKS SUMMARY
                      ========================================================= */}
                  {isTerminalSlide && (
                    <div className="w-full bg-[#050314]/90 border border-cyan-500/40 rounded-xl p-3 sm:p-3.5 shadow-[0_0_25px_rgba(0,242,255,0.2)] font-mono text-left flex flex-col justify-between h-full min-h-[220px] md:min-h-[260px]">
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
                        <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold font-cyber">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>REVIEW YOUR BOX</span>
                        </div>
                        <span className="text-[9px] text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                          {boxContent.length} BYTES
                        </span>
                      </div>

                      <div className="mb-2 rounded-lg border border-cyan-500/30 bg-cyan-950/25 p-2 text-cyan-100/90">
                        <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-cyan-400/80 font-bold">
                          <span>Title</span>
                          <span>Preflight</span>
                        </div>
                        <div className="mt-1 text-sm font-black text-cyan-100 truncate">{boxTitle || 'My Box'}</div>
                        <div className="mt-0.5 text-[10px] text-cyan-200/70 line-clamp-2">
                          {boxDescription.trim() || 'No page description — clean, silent, and ready to ship.'}
                        </div>
                      </div>

                      {/* Lock Status Items */}
                      <div className="space-y-2 text-xs flex-1 flex flex-col justify-around">
                        {/* 1. Passcode Lock */}
                        <div className={`p-2 sm:p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                          passwordEnabled && passwordValue.trim()
                            ? 'bg-fuchsia-950/40 border-fuchsia-500/50 text-fuchsia-200'
                            : 'bg-[#08031a]/60 border-zinc-800/80 text-zinc-500'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Key className={`w-4 h-4 shrink-0 ${passwordEnabled && passwordValue.trim() ? 'text-fuchsia-400' : 'text-zinc-600'}`} />
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] truncate">PASSCODE LOCK</div>
                              <div className="text-[10px] opacity-80 truncate">
                                {passwordEnabled && passwordValue.trim() ? `${passwordValue.length}-Digit PIN (AES-256-GCM)` : 'Disabled'}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded border shrink-0 ${
                            passwordEnabled && passwordValue.trim()
                              ? 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]'
                              : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                          }`}>
                            {passwordEnabled && passwordValue.trim() ? 'ON' : 'OFF'}
                          </span>
                        </div>

                        {/* 2. Timed Lock */}
                        <div className={`p-2 sm:p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                          timeLockEnabled
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                            : 'bg-[#08031a]/60 border-zinc-800/80 text-zinc-500'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className={`w-4 h-4 shrink-0 ${timeLockEnabled ? 'text-amber-400' : 'text-zinc-600'}`} />
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] truncate">TIME-BASED LOCK</div>
                              <div className="text-[10px] opacity-80 truncate">
                                {timeLockSummary}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded border shrink-0 ${
                            timeLockEnabled
                              ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                              : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                          }`}>
                            {timeLockEnabled ? 'ON' : 'OFF'}
                          </span>
                        </div>

                        {/* 3. Access Limit Lock */}
                        <div className={`p-2 sm:p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                          accessLimitEnabled
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                            : 'bg-[#08031a]/60 border-zinc-800/80 text-zinc-500'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Gauge className={`w-4 h-4 shrink-0 ${accessLimitEnabled ? 'text-emerald-400' : 'text-zinc-600'}`} />
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] truncate">ACCESS LIMIT LOCK</div>
                              <div className="text-[10px] opacity-80 truncate">
                                {accessLimitEnabled ? (accessLimitMaxOpens === 1 ? '1 Open (Burn on Read)' : `${accessLimitMaxOpens.toLocaleString()} Opens Allowed`) : 'Disabled'}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded border shrink-0 ${
                            accessLimitEnabled
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(0,255,150,0.5)]'
                              : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                          }`}>
                            {accessLimitEnabled ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    RIGHT COLUMN (md:col-span-6): Slide Info & Actions
                    ───────────────────────────────────────────────────────────── */}
                <div className="md:col-span-6 flex flex-col justify-between space-y-3 sm:space-y-4">
                  {/* Slide 01 SPLIT Mode: Live Preview Window completely takes over right side */}
                  {currentSlide === 0 && slide1ViewMode === 'split' ? (
                    <div className="flex-1 w-full bg-[#050314]/90 border border-cyan-500/40 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(0,242,255,0.2)] flex flex-col min-h-[220px] md:min-h-[260px] font-mono">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-[#09051f] border-b border-cyan-500/25 text-[10px] text-cyan-300">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <CyberScrambleText text="PREVIEW" speed={20} />
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>LIVE RENDERED OUTPUT</span>
                        </div>
                      </div>
                      <div className="flex-1 w-full relative min-h-[160px] sm:min-h-[190px] bg-white">
                        <iframe
                          srcDoc={slidePreviewHtml}
                          title="Slide 01 Live Rendered Output Preview"
                          className="w-full h-full border-0 absolute inset-0 bg-white"
                          sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-downloads"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Slide Top Metadata Tag */}
                      <div className="flex items-center justify-between gap-2 min-h-[32px]">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] sm:text-[11px] tracking-wider shadow-[0_0_12px_rgba(0,242,255,0.2)]">
                          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                          <CyberScrambleText text={activeSlideData.tag} speed={20} />
                        </div>
                        {currentSlide === 1 ? (
                          <div className="flex items-center justify-end scale-[0.52] sm:scale-[0.58] origin-right -my-3 -mr-1">
                            <HoloToggle
                              id="holo-toggle-slide-02"
                              checked={passwordEnabled}
                              onChange={handleTogglePassword}
                            />
                          </div>
                        ) : currentSlide === 2 ? (
                          <div className="flex items-center justify-end scale-[0.52] sm:scale-[0.58] origin-right -my-3 -mr-1">
                            <HoloToggle
                              id="holo-toggle-slide-03"
                              checked={timeLockEnabled}
                              onChange={handleToggleTimeLock}
                            />
                          </div>
                        ) : currentSlide === 3 ? (
                          <div className="flex items-center justify-end scale-[0.52] sm:scale-[0.58] origin-right -my-3 -mr-1">
                            <HoloToggle
                              id="holo-toggle-slide-04"
                              checked={accessLimitEnabled}
                              onChange={handleToggleAccessLimit}
                            />
                          </div>
                        ) : currentSlide === slides.length - 1 ? (
                          <button
                            type="button"
                            onClick={handleStartOver}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900/90 border border-rose-500/50 hover:border-rose-400 text-rose-300 hover:text-white text-[10px] sm:text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] cursor-pointer"
                            title="Reset all settings and start over fresh"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>START OVER</span>
                          </button>
                        ) : (
                          <div className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest">
                            <CyberScrambleText text={activeSlideData.category} speed={15} />
                          </div>
                        )}
                      </div>

                      {/* Slide Headline & Description (hidden on final summary) */}
                      {currentSlide !== slides.length - 1 && (
                        <div className="space-y-1.5 text-left">
                          <h2 className="text-base sm:text-lg md:text-xl font-extrabold font-mono tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-teal-100 to-fuchsia-300 leading-tight">
                            <span
                              className={`block text-sm sm:text-base md:text-lg ${
                                activeSlideData.accentColor === 'fuchsia'
                                  ? 'text-fuchsia-400 drop-shadow-[0_0_12px_rgba(217,70,239,0.8)]'
                                  : activeSlideData.accentColor === 'emerald'
                                  ? 'text-emerald-300 drop-shadow-[0_0_12px_rgba(0,255,204,0.8)]'
                                  : activeSlideData.accentColor === 'amber'
                                  ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                                  : 'text-cyan-300 drop-shadow-[0_0_12px_rgba(0,242,255,0.8)]'
                              }`}
                            >
                              <CyberScrambleText text={activeSlideData.highlight} speed={22} delay={150} />
                            </span>
                          </h2>

                          <p className="text-[11px] sm:text-xs text-cyan-200/80 font-mono leading-relaxed line-clamp-3 md:line-clamp-4">
                            {activeSlideData.description}
                          </p>
                        </div>
                      )}

                      {/* Feature Bullets (hidden on final summary) */}
                      {currentSlide !== slides.length - 1 && activeSlideData.bullets.length > 0 && (
                        <div className="space-y-1.5 text-left">
                          {activeSlideData.bullets.slice(0, 3).map((bullet) => (
                            <div
                              key={bullet}
                              className="flex items-start gap-1.5 rounded-md border border-cyan-500/20 bg-cyan-950/20 px-2 py-1 text-[10px] sm:text-[11px] font-mono leading-tight text-cyan-100/90"
                            >
                              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" />
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Final slide: Dynamic Credit Cost Calculation Box */}
                      {isTerminalSlide && (
                        <div className="flex-1 w-full bg-[#050314]/95 border border-cyan-500/40 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(0,242,255,0.2)] flex flex-col justify-between p-3 font-mono relative group min-h-[140px] sm:min-h-[160px]">
                          {/* Ambient glow and cyber scanlines */}
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,242,255,0.12),transparent_70%)] pointer-events-none" />
                          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.35)_51%)] bg-[length:100%_4px] pointer-events-none opacity-30" />

                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 relative z-10">
                            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold font-cyber">
                              <Coins className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                              <CyberScrambleText text={chainEnabled ? "CHAIN GENERATION TOTAL COST" : "ESTIMATED GENERATION COST"} speed={20} />
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400/40 text-cyan-300 shadow-[0_0_8px_rgba(0,242,255,0.3)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              <span>{chainEnabled ? `${chainTotal} ${chainTotal === 1 ? 'BOX' : 'BOXES'} IN CHAIN` : 'LIVE QUOTA'}</span>
                            </div>
                          </div>

                          {/* Hero Animated Total Cost Display */}
                          <div className="my-1.5 py-1.5 sm:py-2 px-3 rounded-lg bg-[#08041d]/90 border border-cyan-500/30 flex items-center justify-between gap-2 relative z-10 shadow-inner">
                            <div className="min-w-0">
                              <div className="text-[10px] text-cyan-400/90 uppercase tracking-wider font-bold">
                                {chainEnabled ? `TOTAL CHAIN COST (${chainTotal} ${chainTotal === 1 ? 'BOX' : 'BOXES'})` : 'REQUIRED CREDITS'}
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate">
                                {chainEnabled ? (
                                  <span>
                                    {chainCreditCalculation.boxBreakdowns.map((b, idx) => `Box ${idx + 1}${b.isCloned ? ' clone' : ''}: ${b.totalCost} CR`).join(' + ')}
                                  </span>
                                ) : (
                                  isPasscodeActive || isTimeLockActive || isAccessLimitActive
                                    ? `${[isPasscodeActive && 'PIN (Free)', isTimeLockActive && (timeLockMode === 'hybrid' ? 'Reveal+Decay (+10)' : 'Timer (+10)'), isAccessLimitActive && 'Views (+10)'].filter(Boolean).join(' + ')}`
                                    : 'Standard Link (Free Forever • No Locks Needed)'
                                )}
                              </div>
                            </div>

                            <div className="flex items-baseline gap-1.5 shrink-0">
                              <motion.span
                                key={calculatedCreditCost}
                                initial={{ scale: 1.35, opacity: 0.5, y: -2 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                className="text-2xl sm:text-3xl font-black font-cyber text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-300 to-fuchsia-300 drop-shadow-[0_0_12px_rgba(0,242,255,0.7)]"
                              >
                                {calculatedCreditCost}
                              </motion.span>
                              <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 tracking-wider">
                                {calculatedCreditCost === 1 ? 'CREDIT' : 'CREDITS'}
                              </span>
                            </div>
                          </div>

                          {/* Mobile-only: collapse toggle for itemized cost + balance */}
                          <button
                            type="button"
                            onClick={() => setCostDetailsOpen(o => !o)}
                            className="mt-2 w-full flex items-center justify-center gap-1 rounded-md bg-cyan-950/70 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 py-1.5 sm:hidden"
                            aria-expanded={costDetailsOpen}
                          >
                            <span>{costDetailsOpen ? 'HIDE COST DETAILS' : 'SHOW COST DETAILS'}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${costDetailsOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Itemized Cost Breakdown: Single Box OR Box Chain */}
                          <div className={`space-y-1.5 text-[10px] relative z-10 ${costDetailsOpen ? 'block' : 'hidden'} sm:!block`}>
                            {chainEnabled ? (
                              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                {chainCreditCalculation.boxBreakdowns.map((box, bIdx) => (
                                  <div
                                    key={bIdx}
                                    className={`p-2 rounded border transition-all ${
                                      bIdx === chainIndex
                                        ? 'bg-cyan-950/50 border-cyan-400/60 shadow-[0_0_8px_rgba(0,242,255,0.2)]'
                                        : 'bg-black/40 border-zinc-800/80'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-bold mb-1">
                                      <span className="flex items-center gap-1.5 text-cyan-300">
                                        <span className="px-1.5 py-0.2 rounded bg-cyan-900/80 text-[9px] text-cyan-200">
                                          BOX {bIdx + 1} TOTAL
                                        </span>
                                        <span className="truncate max-w-[140px]">{box.title}</span>
                                        {box.isCloned && (
                                          <span className="text-[8px] px-1 py-0.2 rounded bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300">
                                            CLONED
                                          </span>
                                        )}
                                      </span>
                                      <span className={`font-mono ${box.totalCost > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                                        {box.totalCost > 0 ? `${box.totalCost} CR` : 'FREE (0 CR)'}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-[9px] text-zinc-400">
                                      {box.allBlocks.map(block => (
                                        <div
                                          key={block.id}
                                          className={`flex items-center justify-between px-1.5 py-0.5 rounded ${
                                            block.active && block.cost > 0
                                              ? 'bg-amber-950/30 text-amber-200 border border-amber-500/20'
                                              : block.active
                                              ? 'bg-cyan-950/30 text-cyan-200 border border-cyan-500/20'
                                              : 'bg-black/20 text-zinc-600'
                                          }`}
                                        >
                                          <span className="truncate">{block.name}</span>
                                          <span className="font-bold shrink-0 ml-1">
                                            {block.active ? (block.cost > 0 ? `+${block.cost} CR` : '0 CR') : '—'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-1.5">
                                {/* Base Payload */}
                                <div className="p-1.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 flex items-center justify-between">
                                  <span className="truncate flex items-center gap-1">
                                    <Code className="w-3 h-3 text-cyan-400 shrink-0" />
                                    Base Link
                                  </span>
                                  <span className="font-bold text-emerald-400 shrink-0">FREE (0 CR)</span>
                                </div>

                                {/* Passcode Lock */}
                                <div className={`p-1.5 rounded border flex items-center justify-between transition-all duration-200 ${
                                  isPasscodeActive
                                    ? 'bg-fuchsia-950/40 border-fuchsia-500/50 text-fuchsia-200 shadow-[0_0_8px_rgba(217,70,239,0.3)]'
                                    : 'bg-black/30 border-zinc-800/80 text-zinc-600'
                                }`}>
                                  <span className="truncate flex items-center gap-1">
                                    <Key className={`w-3 h-3 shrink-0 ${isPasscodeActive ? 'text-fuchsia-400' : 'text-zinc-600'}`} />
                                    Secret PIN
                                  </span>
                                  <span className={`font-bold shrink-0 ${isPasscodeActive ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                    {isPasscodeActive ? 'FREE (0 CR)' : '0 CR'}
                                  </span>
                                </div>

                                {/* Time-Based Lock / Reveal + Decay */}
                                <div className={`p-1.5 rounded border flex items-center justify-between transition-all duration-200 ${
                                  isTimeLockActive
                                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                    : 'bg-black/30 border-zinc-800/80 text-zinc-600'
                                }`}>
                                  <span className="truncate flex items-center gap-1">
                                    {timeLockMode === 'hybrid' ? (
                                      <Flame className={`w-3 h-3 shrink-0 ${isTimeLockActive ? 'text-rose-400' : 'text-zinc-600'}`} />
                                    ) : (
                                      <Clock className={`w-3 h-3 shrink-0 ${isTimeLockActive ? 'text-amber-400' : 'text-zinc-600'}`} />
                                    )}
                                    {timeLockMode === 'hybrid' ? 'Reveal+Decay' : 'Timer Lock'}
                                  </span>
                                  <span className={`font-bold shrink-0 ${isTimeLockActive ? 'text-amber-300' : 'text-zinc-600'}`}>
                                    {isTimeLockActive ? '+10 CR' : '0 CR'}
                                  </span>
                                </div>

                                {/* Access Limit Lock */}
                                <div className={`p-1.5 rounded border flex items-center justify-between transition-all duration-200 ${
                                  isAccessLimitActive
                                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-[0_0_8px_rgba(0,255,204,0.3)]'
                                    : 'bg-black/30 border-zinc-800/80 text-zinc-600'
                                }`}>
                                  <span className="truncate flex items-center gap-1">
                                    <Gauge className={`w-3 h-3 shrink-0 ${isAccessLimitActive ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                    View Limit
                                  </span>
                                  <span className={`font-bold shrink-0 ${isAccessLimitActive ? 'text-emerald-300' : 'text-zinc-600'}`}>
                                    {isAccessLimitActive ? '+10 CR' : '0 CR'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Account Balance & Auto-Deduct Footer (collapsible on mobile) */}
                          <div className={`mt-1.5 pt-1.5 border-t border-cyan-500/20 flex items-center justify-between text-[10px] text-cyan-400/80 relative z-10 ${costDetailsOpen ? 'flex' : 'hidden'} sm:!flex`}>
                            <div className="flex items-center gap-1 truncate">
                              <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{user ? `Balance: ${user.credits} CR` : 'Unlimited Free with No Locks & PIN'}</span>
                            </div>
                            <span className="text-emerald-400 font-bold shrink-0">
                              {user ? `After: ${Math.max(0, (user.credits || 0) - calculatedCreditCost)} CR` : 'PRO ($4/mo) = 0 CR'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Chaining Control Card */}
                      {isTerminalSlide && (
                        <div className="mt-1.5 w-full bg-[#050314]/95 border border-cyan-500/40 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,242,255,0.18)] p-2.5 sm:p-3 font-mono relative group">
                          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 relative z-10">
                            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold font-cyber">
                              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                              <CyberScrambleText text="CHAINING (LINKED BOXES)" speed={20} />
                            </div>
                            <div className="flex items-center gap-2">
                              {chainEnabled && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/40 text-cyan-300">
                                  BOX {chainIndex + 1}/{chainTotal}
                                </span>
                              )}
                              <div className="scale-[0.52] sm:scale-[0.58] origin-right -my-2 -mr-1">
                                <HoloToggle
                                  id="holo-toggle-slide-05-chaining"
                                  checked={chainEnabled}
                                  onChange={onToggleChain}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Mobile-only: collapse toggle for chaining detail */}
                          {chainEnabled && (
                            <button
                              type="button"
                              onClick={() => setChainDetailsOpen(o => !o)}
                              className="mt-2 w-full flex items-center justify-center gap-1 rounded-md bg-cyan-950/70 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 py-1.5 sm:hidden"
                              aria-expanded={chainDetailsOpen}
                            >
                              <span>{chainDetailsOpen ? 'HIDE CHAIN DETAILS' : 'SHOW CHAIN DETAILS'}</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${chainDetailsOpen ? 'rotate-180' : ''}`} />
                            </button>
                          )}

                          {chainEnabled ? (
                            <div className={`mt-2 space-y-2 relative z-10 text-[10px] ${chainDetailsOpen ? 'block' : 'hidden'} sm:!block`}>
                              <div className="flex items-center justify-between text-cyan-200/80">
                                <span>Sequence: <strong className="text-cyan-100">{chainTotal} {chainTotal === 1 ? 'Box' : 'Boxes'}</strong></span>
                                <span className="text-zinc-400">Max: {chainMax}</span>
                              </div>

                              {/* Chain Navigation & Drag-and-Drop Reordering Pills */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {Array.from({ length: chainTotal }).map((_, idx) => {
                                  const isSelected = idx === chainIndex;
                                  const isBeingDragged = draggedChainIndex === idx;
                                  const isDropTarget = dragOverChainIndex === idx && draggedChainIndex !== idx;

                                  return (
                                    <div
                                      key={idx}
                                      draggable={chainTotal > 1}
                                      onDragStart={(e) => handleChainDragStart(e, idx)}
                                      onDragOver={(e) => handleChainDragOver(e, idx)}
                                      onDrop={(e) => handleChainDrop(e, idx)}
                                      onDragEnd={handleChainDragEnd}
                                      className={`group relative flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all select-none ${
                                        isBeingDragged
                                          ? 'opacity-40 scale-95 border border-dashed border-cyan-400'
                                          : isDropTarget
                                          ? 'ring-2 ring-fuchsia-400 bg-fuchsia-950/70 border border-fuchsia-400 scale-105 shadow-[0_0_12px_rgba(217,70,239,0.5)]'
                                          : isSelected
                                          ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-black shadow-[0_0_10px_rgba(0,242,255,0.7)]'
                                          : 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400'
                                      }`}
                                      title={chainTotal > 1 ? "Click to edit, or drag to reorder" : "Click to edit"}
                                    >
                                      {chainTotal > 1 && (
                                        <GripVertical
                                          className={`w-2.5 h-2.5 opacity-60 group-hover:opacity-100 cursor-grab active:cursor-grabbing ${
                                            isSelected ? 'text-black' : 'text-cyan-400'
                                          }`}
                                        />
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => onGoToChainPage?.(idx)}
                                        className="cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit outline-none"
                                      >
                                        Box {idx + 1} {idx === chainTotal - 1 ? '(Final)' : ''}
                                      </button>
                                      {chainTotal > 1 && idx === chainTotal - 1 && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (onDeleteLastChainBox) onDeleteLastChainBox();
                                            else onDeleteChainPage?.(idx);
                                          }}
                                          className={`ml-0.5 p-0.5 rounded transition hover:bg-rose-500/30 ${
                                            isSelected ? 'text-black/80 hover:text-red-900' : 'text-rose-400 hover:text-rose-200'
                                          }`}
                                          title="Delete this final chained box"
                                          aria-label="Delete last box"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Action Buttons: Clone or Scratch Next */}
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                {chainTotal < chainMax && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onCreateNextChainPage?.('clone')}
                                      className="p-1.5 rounded bg-cyan-950/50 border border-cyan-400/40 text-[10px] font-bold text-cyan-200 hover:bg-cyan-900/60 hover:border-cyan-300 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Copy className="w-3 h-3 text-cyan-300" />
                                      <span>Clone into Next</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onCreateNextChainPage?.('scratch')}
                                      className="p-1.5 rounded bg-fuchsia-950/40 border border-fuchsia-400/40 text-[10px] font-bold text-fuchsia-200 hover:bg-fuchsia-900/50 hover:border-fuchsia-300 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <FilePlus2 className="w-3 h-3 text-fuchsia-300" />
                                      <span>Start Blank Next</span>
                                    </button>
                                  </>
                                )}
                              </div>

                              {/* Delete Last Box / Drag hint Footer */}
                              {chainTotal > 1 && (
                                <div className="flex items-center justify-between pt-1 border-t border-cyan-500/20 text-[9px]">
                                  <span className="text-zinc-400">
                                    💡 Drag pills to reorder sequence
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onDeleteLastChainBox) onDeleteLastChainBox();
                                      else onDeleteChainPage?.(chainTotal - 1);
                                    }}
                                    className="px-2 py-1 rounded bg-rose-950/50 border border-rose-500/40 text-[9px] font-bold text-rose-300 hover:bg-rose-900/60 hover:border-rose-400 transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_8px_rgba(244,63,94,0.2)]"
                                    title="Delete the final box in the chain"
                                  >
                                    <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                                    <span>Delete Last Box ({chainTotal})</span>
                                  </button>
                                </div>
                              )}

                              {chainTotal > 3 && (
                                <div className="text-[9px] text-amber-300/80 flex items-center gap-1 pt-0.5">
                                  <span>⚠️ Long chain: URL size increases with each box in the chain.</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-1.5 text-[10px] text-cyan-200/60 relative z-10 leading-tight">
                              Link multiple self-contained Boxes in sequence. Recipient navigates box-by-box with the right edge grip.
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Buttons Bar */}
                  <div
                    className="pt-2 border-t border-cyan-500/20 flex items-center justify-between gap-2"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={prevSlide}
                      className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 text-xs font-mono flex items-center gap-1 shrink-0 transition-colors"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline text-[11px]">Prev</span>
                    </button>

                    {isTerminalSlide ? (
                      <div className="flex-1 min-w-0 rounded-xl border border-cyan-400/50 bg-cyan-950/25 px-2 py-2 text-center font-mono shadow-[0_0_18px_rgba(0,242,255,0.22)] overflow-hidden">
                        <HoloGenerateButton
                          onClick={handleGenerateFinal}
                          isCopied={isCopied}
                          label={chainEnabled && !isLastChainBox ? 'GO TO LAST BOX TO GENERATE' : (requiresCredits ? `GET CREDITS (${calculatedCreditCost} CR)` : "GENERATE BOX")}
                          className="my-0 scale-[0.72] sm:scale-[0.78] md:scale-[0.82] origin-center"
                        />
                        {requiresCredits && (
                          <div className="-mt-2 text-[9px] sm:text-[10px] text-cyan-300/75">
                            Requires {calculatedCreditCost} credits or PRO membership to generate with active locks.
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={nextSlide}
                        className="flex-1 py-2 sm:py-2.5 px-4 rounded-lg bg-cyan-950/90 hover:bg-cyan-900/90 border border-cyan-400/60 hover:border-cyan-300 text-cyan-100 font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,242,255,0.25)] transition-all hover:scale-[1.01] active:scale-95 group"
                      >
                        <span>{activeSlideData.cta || 'NEXT STEP'}</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-cyan-300" />
                      </button>
                    )}

                    {isTerminalSlide ? (
                      <div className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-700/60 text-zinc-500 text-xs font-mono flex items-center gap-1 shrink-0 cursor-not-allowed" aria-label="Last slide reached">
                        <span className="hidden xs:inline text-[11px]">End</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <button
                        onClick={nextSlide}
                        className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 text-xs font-mono flex items-center gap-1 shrink-0 transition-colors"
                        aria-label="Next slide"
                      >
                        <span className="hidden xs:inline text-[11px]">Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>


      </main>

      {/* Bottom Horizontal Carousel Indicators & Legal/Contact Footer */}
      <footer className="relative z-20 w-full px-4 sm:px-6 py-2.5 sm:py-3 border-t border-cyan-500/20 bg-[#060419]/90 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs font-mono text-cyan-400/70 shrink-0">
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px]">
          <span className="sm:hidden text-cyan-300/80">👈 Swipe left / right to configure 👉</span>
          <span className="hidden sm:inline">Use <kbd className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 rounded text-[9px] text-cyan-200">←</kbd> <kbd className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 rounded text-[9px] text-cyan-200">→</kbd> to navigate steps</span>
        </div>

        <div className="flex items-center gap-1.5">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`relative h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-7 bg-gradient-to-r from-cyan-400 to-fuchsia-400 shadow-[0_0_10px_rgba(0,242,255,0.8)]'
                    : 'w-2 bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900/60 hover:w-3.5'
                }`}
                title={`Jump to ${slide.category}`}
                aria-label={`Jump to slide ${index + 1}`}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] sm:text-[11px] text-cyan-400/80">
          <button
            type="button"
            onClick={() => {
              setLegalModalTab('terms');
              setIsLegalModalOpen(true);
            }}
            className="hover:text-cyan-200 hover:underline transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <span className="text-cyan-500/40 select-none">&bull;</span>
          <button
            type="button"
            onClick={() => {
              setLegalModalTab('privacy');
              setIsLegalModalOpen(true);
            }}
            className="hover:text-cyan-200 hover:underline transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span className="text-cyan-500/40 select-none">&bull;</span>
          <a
            href="mailto:support@bittybox.org"
            className="hover:text-cyan-200 hover:underline transition-colors cursor-pointer"
          >
            Contact Us
          </a>
        </div>
      </footer>

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <QrModal
          url={qrModalUrl || generatedUrl || window.location.href}
          title={boxTitle}
          onClose={() => setIsQrModalOpen(false)}
        />
      )}

      {/* Legal Modal (Terms of Service & Privacy Policy) */}
      <LegalModal
        isOpen={isLegalModalOpen}
        initialTab={legalModalTab}
        onClose={() => setIsLegalModalOpen(false)}
      />


    </div>
  );
};
