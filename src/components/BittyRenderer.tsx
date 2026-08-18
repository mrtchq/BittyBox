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
  const [content, setContent] = useState<string>(() => {
    // If activeContent is provided, use it immediately
    if (activeContent && activeContent.trim()) {
      return activeContent;
    }
    return '';
  });
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [needsPassword, setNeedsPassword] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !!(hashFragment && hashFragment.trim() && (!activeContent || !activeContent.trim()));
  });
  // Step #3 polish: shake on wrong passcode + fade-out on successful unlock
  const [shake, setShake] = useState<boolean>(false);
  const [unlocking, setUnlocking] = useState<boolean>(false);

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
      if (result.needsPassword) {
        setNeedsPassword(true);
        setIsEncrypted(true);
        setError(result.error);
        if (passcode) {
          // a submitted passcode failed → shake the input (re-triggers each attempt)
          setShake(false);
          requestAnimationFrame(() => requestAnimationFrame(() => setShake(true)));
        }
        return;
      }
      if (activeContent && activeContent.trim()) {
        setContent(activeContent);
        return;
      }
      setError(result.error);
      return;
    }

    if (result.needsPassword) {
      setIsEncrypted(true);
      setNeedsPassword(true);
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
    if (activeContent && activeContent.trim()) {
      setContent(activeContent);
    }
    if (hashFragment && hashFragment.trim()) {
      loadData();
    }
  }, [hashFragment, activeContent]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    loadData(passwordInput.trim());
  };

  // ── Time-window lock (Step #3) ──────────────────────────────────────────────
  // Server stays authoritative; this only surfaces the live countdown and
  // blocks the unlock UI before `not_before` / after `expires_at`. Evaluated
  // FIRST per the cross-cutting rule — if inert/expired, downstream gates
  // (password etc.) are never shown.
  const twConfig = metadata?.lockConfig?.timeWindow ?? null;
  const twEnabled = !!(twConfig && twConfig.enabled);
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

          {!expired && (
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

  // Compute final HTML for the iframe - 100% identical to the live preview
  let finalHtml = '';
  if (!needsPassword && content) {
    finalHtml = getRenderedHtml(content, metadata);
  }

  // If password is required to decrypt
  if (needsPassword) {
    return (
      <div className={`fixed inset-0 w-screen h-screen bg-[#050515] flex items-center justify-center p-4 z-50 overflow-hidden font-sans ${unlocking ? 'bitty-fade-out' : ''}`}>
        <div className="w-full max-w-md p-6 bento-card-purple shadow-[0_0_50px_rgba(255,0,222,0.3)] relative animate-in zoom-in-95 duration-200">
          <div className="bento-corner-accent top-l bento-corner-accent-purple" />
          <div className="bento-corner-accent top-r bento-corner-accent-purple" />
          <div className="bento-corner-accent bot-l bento-corner-accent-purple" />
          <div className="bento-corner-accent bot-r bento-corner-accent-purple" />

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-950 border border-fuchsia-500/50 mx-auto flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,0,222,0.4)]">
              <Lock className="w-6 h-6 text-fuchsia-400 animate-pulse" />
            </div>
            <h3 className="font-cyber text-lg font-bold text-white tracking-wide">
              <CyberScrambleText text="ENCRYPTED BITTY BOX" speed={25} />
            </h3>
            <p className="text-xs text-purple-200/80 font-mono mt-1">
              This payload is encrypted with AES-256 cipher. Enter the secret passcode to view.
            </p>
            {twEnabled && tw.status === 'OPEN' && tw.remainingLabel && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-fuchsia-950/70 border border-fuchsia-500/40">
                <Timer className="w-3.5 h-3.5 text-fuchsia-300" />
                <span className="text-[10px] font-mono text-fuchsia-200 uppercase tracking-wider">
                  {tw.boundary === 'expires' ? 'Locks in' : 'Burns in'} {tw.remainingLabel}
                </span>
              </div>
            )}
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
                  className={`w-full bg-[#090314] border border-fuchsia-500/40 rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder:text-purple-400/40 focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400 font-mono ${shake ? 'bitty-shake' : ''}`}
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
