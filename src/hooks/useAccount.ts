import { useState, useEffect, useCallback } from 'react';
import { BittyUser, ApiKeyMeta } from '../types';

export interface UseAccountResult {
  user: BittyUser | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isDeviceTrusted: boolean;
  trustExpiresAt: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string, displayName?: string, trustDevice?: boolean) => Promise<boolean>;
  register: (email: string, displayName?: string, password?: string, trustDevice?: boolean) => Promise<boolean>;
  requestMagicLink: (email: string, displayName?: string, trustDevice?: boolean) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyMagicLink: (token: string, trustDevice?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  generateApiKey: (label?: string, scopes?: string[]) => Promise<{ rawKey: string; key: ApiKeyMeta } | null>;
  revokeApiKey: (keyId: string) => Promise<boolean>;
  testApiKey: (key: string) => Promise<{ valid: boolean; error?: string; user?: any; key?: any }>;
  purchaseCredits: (packageId: string, amount?: number, costCents?: number) => Promise<boolean>;
  recordCreatedBox: (linkData: {
    title: string;
    url: string;
    format?: string;
    byteSize?: number;
    compressedSize?: number;
    encrypted?: boolean;
    locks?: {
      password?: boolean;
      timeWindow?: boolean;
      accessLimit?: boolean;
    };
  }) => Promise<boolean>;
  deleteTrackedBox: (linkId: string) => Promise<boolean>;
}

export function useAccount(): UseAccountResult {
  const [user, setUser] = useState<BittyUser | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('bitty_session_id');
    } catch {
      return null;
    }
  });
  const [isDeviceTrusted, setIsDeviceTrusted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bitty_device_trusted') !== 'false';
    } catch {
      return true;
    }
  });
  const [trustExpiresAt, setTrustExpiresAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem('bitty_device_trust_until');
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (sid: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/accounts/me', {
        headers: {
          'X-Session-Id': sid,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          const trusted = Boolean(data.trusted ?? data.user.settings?.trustThisDevice);
          setIsDeviceTrusted(trusted);
          const exp = data.sessionExpiresAt || data.user.settings?.deviceTrustExpiresAt || null;
          setTrustExpiresAt(exp);
          try {
            localStorage.setItem('bitty_device_trusted', String(trusted));
            if (exp) {
              localStorage.setItem('bitty_device_trust_until', exp);
            }
          } catch {}
          setError(null);
          return;
        }
      }
      if (res.status === 401) {
        localStorage.removeItem('bitty_session_id');
        localStorage.removeItem('bitty_device_trust_until');
        setSessionId(null);
        setUser(null);
        setTrustExpiresAt(null);
      }
    } catch (err: any) {
      console.error('[useAccount] Error fetching user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchProfile(sessionId);
    } else {
      setIsLoading(false);
    }
  }, [sessionId, fetchProfile]);

  const login = async (email: string, password = '', displayName = '', trustDevice = true): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await fetch('/api/accounts/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, trustDevice }),
      });
      const data = await res.json();
      if (data.success && data.user && data.sessionId) {
        setUser(data.user);
        setSessionId(data.sessionId);
        setIsDeviceTrusted(Boolean(data.trusted));
        setTrustExpiresAt(data.expiresAt || null);
        try {
          localStorage.setItem('bitty_session_id', data.sessionId);
          localStorage.setItem('bitty_device_trusted', String(Boolean(data.trusted)));
          if (data.expiresAt) localStorage.setItem('bitty_device_trust_until', data.expiresAt);
        } catch {}
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Login network error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, displayName = '', password = '', trustDevice = true): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await fetch('/api/accounts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, password, trustDevice }),
      });
      const data = await res.json();
      if (data.success && data.user && data.sessionId) {
        setUser(data.user);
        setSessionId(data.sessionId);
        setIsDeviceTrusted(Boolean(data.trusted));
        setTrustExpiresAt(data.expiresAt || null);
        try {
          localStorage.setItem('bitty_session_id', data.sessionId);
          localStorage.setItem('bitty_device_trusted', String(Boolean(data.trusted)));
          if (data.expiresAt) localStorage.setItem('bitty_device_trust_until', data.expiresAt);
        } catch {}
        return true;
      } else {
        setError(data.error || 'Registration failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Registration network error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const requestMagicLink = async (email: string, displayName = '', trustDevice = true): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      setError(null);
      setIsLoading(true);
      try {
        localStorage.setItem('bitty_device_trusted', String(trustDevice));
      } catch {}
      const res = await fetch('/api/accounts/magic/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, trustDevice }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message || 'Magic link sent!' };
      } else {
        const msg = data.error || 'Failed to send magic link';
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err: any) {
      const msg = err.message || 'Network error requesting magic link';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMagicLink = async (token: string, trustDeviceOverride?: boolean): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);
      let trustDevice = trustDeviceOverride;
      if (trustDevice === undefined) {
        try {
          trustDevice = localStorage.getItem('bitty_device_trusted') !== 'false';
        } catch {
          trustDevice = true;
        }
      }
      const res = await fetch('/api/accounts/magic/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, trustDevice }),
      });
      const data = await res.json();
      if (data.success && data.user && data.sessionId) {
        setUser(data.user);
        setSessionId(data.sessionId);
        setIsDeviceTrusted(Boolean(data.trusted));
        setTrustExpiresAt(data.expiresAt || null);
        try {
          localStorage.setItem('bitty_session_id', data.sessionId);
          localStorage.setItem('bitty_device_trusted', String(Boolean(data.trusted)));
          if (data.expiresAt) localStorage.setItem('bitty_device_trust_until', data.expiresAt);
        } catch {}
        return true;
      } else {
        setError(data.error || 'Magic link verification failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Network error verifying magic link');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (sessionId) {
        await fetch('/api/accounts/logout', {
          method: 'POST',
          headers: { 'X-Session-Id': sessionId, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      }
    } catch {}
    try {
      localStorage.removeItem('bitty_session_id');
      localStorage.removeItem('bitty_device_trust_until');
    } catch {}
    setSessionId(null);
    setUser(null);
    setTrustExpiresAt(null);
  };

  const refreshUser = async (): Promise<void> => {
    if (sessionId) {
      await fetchProfile(sessionId);
    }
  };

  const generateApiKey = async (label = 'API Key', scopes = ['links:create', 'links:read', 'mcp:access']) => {
    if (!sessionId) return null;
    try {
      const res = await fetch('/api/accounts/keys', {
        method: 'POST',
        headers: {
          'X-Session-Id': sessionId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label, scopes }),
      });
      const data = await res.json();
      if (data.success && data.key) {
        if (data.user) setUser(data.user);
        return {
          rawKey: data.key.rawKey,
          key: data.key,
        };
      }
      return null;
    } catch (err) {
      console.error('[useAccount] Failed to generate API key:', err);
      return null;
    }
  };

  const revokeApiKey = async (keyId: string): Promise<boolean> => {
    if (!sessionId || !keyId) return false;
    try {
      const res = await fetch(`/api/accounts/keys/${encodeURIComponent(keyId)}`, {
        method: 'DELETE',
        headers: { 'X-Session-Id': sessionId },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return true;
      }
      return Boolean(data.success);
    } catch (err) {
      console.error('[useAccount] Failed to revoke key:', err);
      return false;
    }
  };

  const testApiKey = async (key: string) => {
    try {
      const res = await fetch('/api/accounts/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      return await res.json();
    } catch (err: any) {
      return { valid: false, error: err.message || 'Network error' };
    }
  };

  const purchaseCredits = async (packageId: string, amount = 100, costCents = 500): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const res = await fetch('/api/accounts/credits/purchase', {
        method: 'POST',
        headers: {
          'X-Session-Id': sessionId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId, amount, costCents }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return true;
      }
      return Boolean(data.success);
    } catch (err) {
      console.error('[useAccount] Failed to purchase credits:', err);
      return false;
    }
  };

  const recordCreatedBox = async (linkData: any): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const res = await fetch('/api/accounts/links', {
        method: 'POST',
        headers: {
          'X-Session-Id': sessionId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linkData),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return true;
      }
      return Boolean(data.success);
    } catch (err) {
      console.error('[useAccount] Failed to record created box:', err);
      return false;
    }
  };

  const deleteTrackedBox = async (linkId: string): Promise<boolean> => {
    if (!sessionId || !linkId) return false;
    try {
      const res = await fetch(`/api/accounts/links/${encodeURIComponent(linkId)}`, {
        method: 'DELETE',
        headers: { 'X-Session-Id': sessionId },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return true;
      }
      return Boolean(data.success);
    } catch (err) {
      console.error('[useAccount] Failed to delete tracked box:', err);
      return false;
    }
  };

  return {
    user,
    sessionId,
    isAuthenticated: Boolean(user && sessionId),
    isDeviceTrusted,
    trustExpiresAt,
    isLoading,
    error,
    login,
    register,
    requestMagicLink,
    verifyMagicLink,
    logout,
    refreshUser,
    generateApiKey,
    revokeApiKey,
    testApiKey,
    purchaseCredits,
    recordCreatedBox,
    deleteTrackedBox,
  };
}
