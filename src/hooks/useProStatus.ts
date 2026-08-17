import { useState, useEffect, useCallback } from 'react';
import { WorkspaceMode } from '../types';

const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Hours in milliseconds
const STORAGE_TRIAL_START_KEY = 'bitty_pro_trial_start';
const STORAGE_PRO_UNLOCKED_KEY = 'bitty_pro_unlocked';
const STORAGE_MODE_PREF_KEY = 'bitty_workspace_mode_pref';

export interface TrialTimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  formatted: string;
}

export interface ProStatusResult {
  isPro: boolean;
  isLifetimePro: boolean;
  isTrialActive: boolean;
  trialTimeRemaining: TrialTimeRemaining;
  trialProgressPercent: number;
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  toggleMode: () => void;
  isPaywallOpen: boolean;
  paywallFeature: string | null;
  openPaywall: (featureName?: string) => void;
  closePaywall: () => void;
  unlockLifetimePro: (licenseKey?: string) => { success: boolean; message: string };
  resetTrial: () => void;
  expireTrialForDemo: () => void;
}

export function useProStatus(): ProStatusResult {
  // Lifetime Pro Flag
  const [isLifetimePro, setIsLifetimePro] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_PRO_UNLOCKED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Trial Start Timestamp (Initializes 24h trial on first visit)
  const [trialStartTime, setTrialStartTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRIAL_START_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      // First visit: initialize 24-hour trial immediately
      const now = Date.now();
      localStorage.setItem(STORAGE_TRIAL_START_KEY, now.toString());
      return now;
    } catch {
      return Date.now();
    }
  });

  // Current Time for live ticker
  const [now, setNow] = useState<number>(Date.now());

  // User Mode Preference: 'simple' | 'pro'
  const [modePref, setModePref] = useState<WorkspaceMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MODE_PREF_KEY);
      if (saved === 'simple' || saved === 'pro') return saved;
    } catch {}
    return 'pro'; // Default to Pro during initial 24h trial
  });

  // Paywall Modal State
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [paywallFeature, setPaywallFeature] = useState<string | null>(null);

  // Live Timer Tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Trial Status
  const trialExpiresAt = trialStartTime + TRIAL_DURATION_MS;
  const timeRemainingMs = Math.max(0, trialExpiresAt - now);
  const isTrialActive = timeRemainingMs > 0;
  const isPro = isLifetimePro || isTrialActive;

  // Actual Effective Mode
  // If not PRO (trial expired and not lifetime), force to 'simple' mode
  const effectiveMode: WorkspaceMode = isPro ? modePref : 'simple';

  // Calculate formatted time remaining
  const hours = Math.floor(timeRemainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemainingMs % (1000 * 60)) / 1000);

  const formatted = isTrialActive
    ? `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
    : 'EXPIRED';

  const elapsedMs = Math.min(TRIAL_DURATION_MS, Math.max(0, now - trialStartTime));
  const trialProgressPercent = Math.min(100, Math.round((elapsedMs / TRIAL_DURATION_MS) * 100));

  // Change Mode Handler
  const handleSetMode = useCallback((newMode: WorkspaceMode) => {
    if (newMode === 'pro' && !isPro) {
      // If user tries to activate PRO when trial expired, show paywall
      setPaywallFeature('PRO Workspace');
      setIsPaywallOpen(true);
      return;
    }
    setModePref(newMode);
    try {
      localStorage.setItem(STORAGE_MODE_PREF_KEY, newMode);
    } catch {}
  }, [isPro]);

  // Toggle Mode Handler
  const handleToggleMode = useCallback(() => {
    if (effectiveMode === 'simple') {
      handleSetMode('pro');
    } else {
      handleSetMode('simple');
    }
  }, [effectiveMode, handleSetMode]);

  // Open Paywall Handler
  const openPaywall = useCallback((featureName?: string) => {
    setPaywallFeature(featureName || null);
    setIsPaywallOpen(true);
  }, []);

  // Close Paywall Handler
  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    setPaywallFeature(null);
  }, []);

  // Unlock Lifetime Pro Handler
  const unlockLifetimePro = useCallback((licenseKey?: string) => {
    const key = (licenseKey || '').trim().toUpperCase();
    
    // Accept valid test/lifetime keys or instant unlock
    const validPatterns = ['BITTY-PRO', 'PRO-LIFETIME', 'VIP', 'BITTYBOX-PRO', 'UNLIMITED', 'MASTER', 'CYBER-PRO'];
    const isSpecialKey = validPatterns.some(pat => key.includes(pat));

    if (!key || isSpecialKey || key.length >= 8) {
      setIsLifetimePro(true);
      setModePref('pro');
      try {
        localStorage.setItem(STORAGE_PRO_UNLOCKED_KEY, 'true');
        localStorage.setItem(STORAGE_MODE_PREF_KEY, 'pro');
      } catch {}
      return { success: true, message: 'Bitty Box PRO Lifetime Access Successfully Activated!' };
    }

    return { success: false, message: 'Invalid license key format. Please enter a valid PRO key or claim lifetime access.' };
  }, []);

  // Reset 24-Hour Free Trial (Useful for testing / instant extension)
  const resetTrial = useCallback(() => {
    const freshStart = Date.now();
    setTrialStartTime(freshStart);
    setModePref('pro');
    try {
      localStorage.setItem(STORAGE_TRIAL_START_KEY, freshStart.toString());
      localStorage.setItem(STORAGE_MODE_PREF_KEY, 'pro');
    } catch {}
  }, []);

  // Expire Trial Immediately (For testing Paywall / Free tier behavior)
  const expireTrialForDemo = useCallback(() => {
    const past = Date.now() - TRIAL_DURATION_MS - 1000;
    setTrialStartTime(past);
    setIsLifetimePro(false);
    setModePref('simple');
    try {
      localStorage.setItem(STORAGE_TRIAL_START_KEY, past.toString());
      localStorage.removeItem(STORAGE_PRO_UNLOCKED_KEY);
      localStorage.setItem(STORAGE_MODE_PREF_KEY, 'simple');
    } catch {}
  }, []);

  return {
    isPro,
    isLifetimePro,
    isTrialActive,
    trialTimeRemaining: {
      hours,
      minutes,
      seconds,
      totalMs: timeRemainingMs,
      formatted,
    },
    trialProgressPercent,
    mode: effectiveMode,
    setMode: handleSetMode,
    toggleMode: handleToggleMode,
    isPaywallOpen,
    paywallFeature,
    openPaywall,
    closePaywall,
    unlockLifetimePro,
    resetTrial,
    expireTrialForDemo,
  };
}
