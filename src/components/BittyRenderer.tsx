import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Key,
  Eye,
  EyeOff,
  AlertTriangle, 
  RefreshCw,
  Clock,
  Timer
} from 'lucide-react';
import { BittyMetadata } from '../types';
import { decompressBittyData, getRenderedHtml } from '../utils/bittyEngine';
import { CyberScrambleText } from './CyberScrambleText';
import { useTimeWindow } from '../utils/timeWindow';

interface BittyRendererProps {
  hashFragment: string;
  metadata: BittyMetadata;
  activeContent?: string;
  onEdit?: (content: string, metadata: Partial<BittyMetadata>) => void;
  onOpenQr?: () => void;
  onShare?: () => void;
  onCloseSession?: () => void;
}

export const BittyRenderer: React.FC<BittyRendererProps> = ({
  hashFragment,
  metadata,
  activeContent,
  onEdit,
}) => {
  const effectiveHash = hashFragment || (typeof window !== 'undefined' ? window.location.hash : '');
  const isEncryptedFragment = Boolean(
    effectiveHash &&
    (effectiveHash.includes('cipher=') ||
     effectiveHash.includes('cipher%3D') ||
     decodeURIComponent(effectiveHash).includes('cipher='))
  );

  const [content, setContent] = useState<string>(() => {
    // Only use activeContent if there is NO hash fragment to load
    if (!effectiveHash && activeContent && activeContent.trim()) {
      return activeContent;
    }
    return '';
  });
  const [isEncrypted, setIsEncrypted] = useState<boolean>(isEncryptedFragment);
  const [needsPassword, setNeedsPassword] = useState<boolean>(isEncryptedFragment);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return Boolean(effectiveHash && effectiveHash.trim() && !isEncryptedFragment);
  });
  // Step #3 polish: shake on wrong passcode + fade-out on successful unlock
  const [shake, setShake] = useState<boolean>(false);
  const [unlocking, setUnlocking] = useState<boolean>(false);

  const [isCheckingQuota, setIsCheckingQuota] = useState<boolean>(() => Boolean(metadata?.boxId));
  const [quotaBlocked, setQuotaBlocked] = useState<boolean>(false);
  const [quotaReason, setQuotaReason] = useState<string | null>(null);
  const [remainingOpens, setRemainingOpens] = useState<number | null>(null);

  const loadData = async (passcode?: string) => {
    const targetHash = hashFragment || (typeof window !== 'undefined' ? window.location.hash : '');
    if (!targetHash || !targetHash.trim()) {
      if (activeContent) {
        setContent(activeContent);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await decompressBittyData(targetHash, passcode);
    setIsLoading(false);

    if (result.error) {
      if (result.needsPassword) {
        setNeedsPassword(true);
        setIsEncrypted(true);
        setContent('');
        setError(result.error);
        if (passcode) {
          // a submitted passcode failed → shake the input (re-triggers each attempt)
          setShake(false);
          requestAnimationFrame(() => requestAnimationFrame(() => setShake(true)));
        }
        return;
      }
      setContent('');
      setError(result.error);
      return;
    }

    if (result.needsPassword) {
      setIsEncrypted(true);
      setNeedsPassword(true);
      setContent('');
      return;
    }

    setIsEncrypted(result.isEncrypted);
    setContent(result.content);
    if (needsPassword) {
      // was locked → play a smooth fade-out on the overlay, then unmount
      setUnlocking(true);
      window.setTimeout(() => {
        setNeedsPassword(false);
        setUnlocking(false);
      }, 320);
    } else {
      setNeedsPassword(false);
    }
  };

  useEffect(() => {
    const targetHash = hashFragment || (typeof window !== 'undefined' ? window.location.hash : '');
    if (!targetHash && activeContent && activeContent.trim()) {
      setContent(activeContent);
    }
    if (targetHash && targetHash.trim()) {
      loadData();
    }
  }, [hashFragment]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    loadData(passwordInput.trim());
  };

  useEffect(() => {
    if (!metadata?.boxId) {
      setIsCheckingQuota(false);
      return;
    }

    let isMounted = true;
    setIsCheckingQuota(true);
    const checkQuota = async () => {
      try {
        const res = await fetch(`/api/boxes/${metadata.boxId}/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!isMounted) return;

        setIsCheckingQuota(false);
        if (!res.ok || data.allowed === false) {
          setQuotaBlocked(true);
          const msg = data.deniedCodes?.includes('open_limit_reached')
            ? 'This Bitty Box has reached its maximum allowable opens and is permanently sealed.'
            : (data.reason || 'Access denied for this Box.');
          setQuotaReason(msg);
        } else {
          if (data.remainingOpens !== undefined) {
            setRemainingOpens(data.remainingOpens);
          }
        }
      } catch {
        if (isMounted) setIsCheckingQuota(false);
      }
    };

    checkQuota();
    return () => { isMounted = false; };
  }, [metadata?.boxId]);

  // ── Time-window lock (Step #3) ──────────────────────────────────────────────
  // Server stays authoritative; this only surfaces the live countdown and
  // blocks the unlock UI before `not_before` / after `expires_at`. Evaluated
  // FIRST per the cross-cutting rule — if inert/expired, downstream gates
  // (password etc.) are never shown.
  const twConfig = metadata?.lockConfig?.timeWindow ?? null;
  const twEnabled = !!(twConfig && twConfig.enabled);
  const showCountdown = twConfig?.showCountdown !== false;
  const showRemainingCount = metadata?.lockConfig?.openLimit?.showRemainingCount !== false;
  const tw = useTimeWindow(twEnabled ? twConfig : null);
  const twBlocked = twEnabled && (tw.status === 'PENDING' || tw.status === 'EXPIRED');

  if (twBlocked) {
    const expired = tw.status === 'EXPIRED';
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#050515] flex items-center justify-center p-4 z-50 overflow-hidden font-sans">
        <div className="w-full max-w-md p-6 bento-card-purple shadow-[0_0_50px_rgba(255,0,222,0.3)] relative animate-in zoom-in-95 duration-200">
          <div className="bento-corner-accent top-l bento-corner-accent-purple" />
          <div className="bento-corner-accent top-r bento-corner-accent-purple" />
          <div className="bento-corner-accent bot-l bento-corner-accent-purple" />
          <div className="bento-corner-accent bot-r bento-corner-accent-purple" />

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-950 border border-fuchsia-500/50 mx-auto flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,0,222,0.4)]">
              {expired ? (
                <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
              ) : (
                <Clock className="w-6 h-6 text-fuchsia-400 animate-pulse" />
              )}
            </div>
            <h3 className="font-cyber text-lg font-bold text-white tracking-wide">
              <CyberScrambleText text={expired ? 'LINK EXPIRED' : 'TIME-LOCKED BITTY BOX'} speed={25} />
            </h3>
            <p className="text-xs text-purple-200/80 font-mono mt-1">
              {expired
                ? 'This time-limited link has auto-revoked and is no longer available.'
                : 'This link is scheduled. It is not yet unlocked — check back when the timer reaches zero.'}
            </p>
          </div>

          {!expired && showCountdown && (
            <div className="mb-4">
              <div className="text-center text-[10px] font-mono text-fuchsia-300 uppercase tracking-widest mb-2">
                Unlocks in
              </div>
              <div className="text-center font-cyber text-2xl text-white tracking-[0.15em] tabular-nums">
                {tw.remainingLabel ?? '00 : 00 : 00 : 00'}
              </div>
              <div className="text-center text-[10px] font-mono text-purple-300/60 mt-1">
                DD : HH : MM : SS
              </div>
            </div>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(content || '', metadata)}
              className="w-full py-3 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-cyber tracking-wider hover:bg-cyan-900 transition cursor-pointer"
            >
              OPEN STUDIO TO REBUILD
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Access Quota Limit Gate ───────────────────────────────────────────────
  if (quotaBlocked) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#050515] flex items-center justify-center p-4 z-50 overflow-hidden font-sans">
        <div className="w-full max-w-md p-6 bento-card border-rose-500/50 shadow-[0_0_50px_rgba(244,63,94,0.3)] relative animate-in zoom-in-95 duration-200">
          <div className="bento-corner-accent top-l" />
          <div className="bento-corner-accent top-r" />
          <div className="bento-corner-accent bot-l" />
          <div className="bento-corner-accent bot-r" />

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-500/50 mx-auto flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
            </div>
            <h3 className="font-cyber text-lg font-bold text-white tracking-wide">
              <CyberScrambleText text="ACCESS LIMIT EXHAUSTED" speed={25} />
            </h3>
            <p className="text-xs text-rose-200/80 font-mono mt-2">
              {quotaReason || 'This Bitty Box was configured with a strict allowable open quota and has burned.'}
            </p>
          </div>

          {onEdit && (
            <button
              onClick={() => onEdit(content || '', metadata)}
              className="w-full py-3 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-cyber tracking-wider hover:bg-cyan-900 transition cursor-pointer"
            >
              OPEN STUDIO TO REBUILD
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Access Quota Checking Loader ─────────────────────────────────────────
  if (isCheckingQuota) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#050515] flex items-center justify-center p-4 z-50 font-sans">
        <div className="text-center p-8 flex flex-col items-center">
          <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
          <h4 className="font-cyber text-sm text-emerald-300 tracking-wider">VERIFYING ACCESS QUOTA...</h4>
          <p className="text-xs font-mono text-emerald-300/70 mt-2">Checking session limit</p>
        </div>
      </div>
    );
  }

  // Compute final HTML for the iframe - 100% identical to the live preview
  let finalHtml = '';
  if (!needsPassword && !isEncrypted && content) {
    finalHtml = getRenderedHtml(content, metadata);
  } else if (!needsPassword && isEncrypted && content) {
    finalHtml = getRenderedHtml(content, metadata);
  }

  // If password is required to decrypt
  if (needsPassword || (isEncrypted && !content)) {
    return (
      <div className={`fixed inset-0 w-screen h-screen bg-[#050515] flex items-center justify-center p-4 z-50 overflow-hidden font-sans ${unlocking ? 'bitty-fade-out' : ''}`}>
        <div className="w-full max-w-md p-6 bento-card-purple shadow-[0_0_50px_rgba(255,0,222,0.3)] relative animate-in zoom-in-95 duration-200">
          <div className="bento-corner-accent top-l bento-corner-accent-purple" />
          <div className="bento-corner-accent top-r bento-corner-accent-purple" />
          <div className="bento-corner-accent bot-l bento-corner-accent-purple" />
          <div className="bento-corner-accent bot-r bento-corner-accent-purple" />

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-950 border border-fuchsia-500/50 mx-auto flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,0,222,0.4)]">
              <Key className="w-6 h-6 text-fuchsia-400 animate-pulse" />
            </div>
            <h3 className="font-cyber text-lg font-bold text-white tracking-wide">
              <CyberScrambleText text="PASSCODE PROTECTED BOX" speed={25} />
            </h3>
            <p className="text-xs text-purple-200/80 font-mono mt-1">
              This Bitty Box is locked. Enter the numerical passcode (up to 8 digits) to view.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {twEnabled && showCountdown && tw.status === 'OPEN' && tw.remainingLabel && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-fuchsia-950/70 border border-fuchsia-500/40">
                  <Timer className="w-3.5 h-3.5 text-fuchsia-300" />
                  <span className="text-[10px] font-mono text-fuchsia-200 uppercase tracking-wider">
                    {tw.boundary === 'expires' ? 'Locks in' : 'Burns in'} {tw.remainingLabel}
                  </span>
                </div>
              )}
              {showRemainingCount && remainingOpens !== null && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-wider font-bold">
                    {remainingOpens} {remainingOpens === 1 ? 'Open' : 'Opens'} Remaining
                  </span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-fuchsia-300 mb-1.5 uppercase tracking-wider">
                <span>NUMERICAL PASSCODE</span>
                <span className="text-fuchsia-400/80 text-[10px]">{passwordInput.length} / 8 DIGITS</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={passwordInput}
                  onChange={e => {
                    const numbersOnly = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setPasswordInput(numbersOnly);
                    if (error) setError(null);
                  }}
                  placeholder="Enter 1-8 digit passcode..."
                  autoFocus
                  className={`w-full bg-[#090314] border border-fuchsia-500/40 rounded-xl pl-4 pr-11 py-3 text-center text-lg tracking-[0.25em] text-white placeholder:text-purple-400/40 placeholder:text-xs placeholder:tracking-normal focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400 font-mono ${shake ? 'bitty-shake' : ''}`}
                  onAnimationEnd={() => setShake(false)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-fuchsia-300 transition cursor-pointer"
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
                  <span>AUTHENTICATING PASSCODE...</span>
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
      </div>
    );
  }

  // If there's an unrecoverable decoding error
  if (error && !content) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#050515] flex items-center justify-center p-4 z-50 font-sans">
        <div className="text-center max-w-md p-6 bento-card border-rose-500/40 relative">
          <div className="bento-corner-accent top-l" />
          <div className="bento-corner-accent top-r" />
          <div className="bento-corner-accent bot-l" />
          <div className="bento-corner-accent bot-r" />

          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h3 className="font-cyber text-base text-rose-200 mb-1">TRANSMISSION DECODE ERROR</h3>
          <p className="text-xs text-purple-200/70 font-mono mb-4">{error}</p>
          {onEdit && (
            <button
              onClick={() => onEdit(content || '', metadata)}
              className="px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-cyber hover:bg-cyan-900 transition cursor-pointer"
            >
              OPEN STUDIO TO REBUILD
            </button>
          )}
        </div>
      </div>
    );
  }

  // If loading without cached content
  if (isLoading && !content) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#050515] flex items-center justify-center p-4 z-50 font-sans">
        <div className="text-center p-8 flex flex-col items-center">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          <h4 className="font-cyber text-sm text-cyan-300 tracking-wider">INFLATING BITTY BOX TRANSMISSION...</h4>
          <p className="text-xs font-mono text-purple-300/70 mt-2">Decompressing URL hash data stream</p>
        </div>
      </div>
    );
  }

  // Render ONLY the pure live preview output in a 100% full-screen iframe with zero Bittybox UI
  return (
    <iframe
      srcDoc={finalHtml}
      title={metadata.title || 'Bitty Box'}
      className="fixed inset-0 w-screen h-screen border-0 m-0 p-0 block bg-transparent z-50"
      sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-downloads"
    />
  );
};
