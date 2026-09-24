import { useState, useEffect, useCallback } from 'react';

export const DEV_MODE_PASSWORD = '07071987';
export const DEV_MODE_STORAGE_KEY = 'bitty_dev_mode';
export const DEV_MODE_EVENT = 'bitty_dev_mode_change';

/**
 * Check whether Dev Mode is currently activated in local storage.
 */
export function isDevModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DEV_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Attempt to enable Dev Mode with the provided passcode.
 */
export function enableDevMode(passcode: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Window unavailable' };
  const cleaned = String(passcode || '').trim();
  if (cleaned !== DEV_MODE_PASSWORD) {
    return { success: false, error: 'Invalid passcode. Dev Mode requires passcode 07071987.' };
  }

  try {
    localStorage.setItem(DEV_MODE_STORAGE_KEY, 'true');
    window.dispatchEvent(new CustomEvent(DEV_MODE_EVENT, { detail: { enabled: true } }));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Storage error' };
  }
}

/**
 * Disable Dev Mode.
 */
export function disableDevMode(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEV_MODE_STORAGE_KEY, 'false');
    window.dispatchEvent(new CustomEvent(DEV_MODE_EVENT, { detail: { enabled: false } }));
  } catch {}
}

/**
 * React hook to reactively track and control Dev Mode state.
 */
export function useDevMode() {
  const [isDevMode, setIsDevMode] = useState<boolean>(() => isDevModeEnabled());

  useEffect(() => {
    const handleUpdate = () => {
      setIsDevMode(isDevModeEnabled());
    };

    window.addEventListener(DEV_MODE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(DEV_MODE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleEnable = useCallback((passcode: string) => {
    const res = enableDevMode(passcode);
    if (res.success) {
      setIsDevMode(true);
    }
    return res;
  }, []);

  const handleDisable = useCallback(() => {
    disableDevMode();
    setIsDevMode(false);
  }, []);

  return {
    isDevMode,
    enableDevMode: handleEnable,
    disableDevMode: handleDisable,
  };
}
