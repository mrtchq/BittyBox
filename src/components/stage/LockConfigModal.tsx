import React, { useEffect, useState } from 'react';
import { X, Check, Trash2, Eye, EyeOff, Clock, Lock } from 'lucide-react';
import { useStage, useDraft } from '../../stores/stageStore';
import { getLockType } from '../../data/lockTypes';

interface LockConfigModalProps {
  lockId: string | null;
  onClose: () => void;
  chainEnabled?: boolean;
  onToggleChain?: (enabled: boolean) => void;
}

const inputCls =
  'w-full rounded-xl border border-cyan-400/40 bg-[#02010a] px-3 py-2.5 text-sm text-cyan-100 placeholder:text-cyan-400/30 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/25 transition-all select-text';
const labelCls = 'text-[11px] font-bold text-cyan-300 tracking-wide';

export const LockConfigModal: React.FC<LockConfigModalProps> = ({
  lockId,
  onClose,
  chainEnabled = false,
  onToggleChain,
}) => {
  const { state, dispatch, beginDraft, commitDraft, discardDraft } = useStage();
  const draft = useDraft();
  const [showSecret, setShowSecret] = useState(false);
  const lock = getLockType(lockId);

  // Every configurable lock edits a cancelable draft, mirroring the stage views.
  useEffect(() => {
    if (lockId) {
      beginDraft();
      setShowSecret(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockId]);

  if (!lock || !draft) return null;

  const close = () => {
    discardDraft();
    onClose();
  };

  const removeAndClose = (action: { type: 'REMOVE_PASSWORD' } | { type: 'REMOVE_TIME_LOCK' } | { type: 'REMOVE_ACCESS_LIMIT' }) => {
    dispatch(action);
    discardDraft();
    onClose();
  };

  const isConfigured = (): boolean => {
    switch (lock.kind) {
      case 'passcode':
        return state.password.length > 0 && /^\d+$/.test(state.password);
      case 'passphrase':
        return state.password.length > 0 && /\D/.test(state.password);
      case 'time-capsule':
        return state.timeLockEnabled && state.timeLockMode === 'range' && Boolean(state.timeOpenAt) && !state.timeLockAt;
      case 'burn':
        return state.accessLimitEnabled && state.accessLimitMaxOpens === 1;
      case 'max-opens':
        return state.accessLimitEnabled && state.accessLimitMaxOpens > 1;
      case 'access-window':
        return state.timeLockEnabled && state.timeLockMode === 'range' && Boolean(state.timeOpenAt) && Boolean(state.timeLockAt);
      case 'countdown':
        return state.timeLockEnabled && (state.timeLockMode === 'delay' || state.showTimeCountdown);
      case 'chain':
        return chainEnabled;
      default:
        return false;
    }
  };

  const renderBody = () => {
    switch (lock.kind) {
      case 'passcode': {
        const valid = draft.password.length >= 8 && draft.password.length <= 12 && /^\d*$/.test(draft.password);
        const apply = () => {
          if (valid) commitDraft();
          onClose();
        };
        return (
          <>
            <label className={labelCls}>NUMERIC PIN (8–12 DIGITS)</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={12}
                value={draft.password}
                onChange={e => draft.setPassword(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Enter 8-12 digits..."
                autoFocus
                className={`${inputCls} text-center text-lg tracking-[0.25em] pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer"
                title={showSecret ? 'Hide PIN' : 'Show PIN'}
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {draft.password.length > 0 && !valid && (
              <p className="text-[11px] text-rose-300">PIN must be 8–12 digits to lock the Box.</p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={apply}
                disabled={!valid}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  valid
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(0,242,255,0.5)] hover:scale-[1.01]'
                    : 'bg-cyan-950/40 border border-cyan-500/20 text-cyan-500/50 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" /> Apply Lock
              </button>
              {isConfigured() && (
                <button
                  type="button"
                  onClick={() => removeAndClose({ type: 'REMOVE_PASSWORD' })}
                  className="px-3 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-900/50 transition-all cursor-pointer"
                  title="Disable passcode lock"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        );
      }
      case 'passphrase': {
        const valid = draft.password.length >= 8 && draft.password.length <= 128;
        const apply = () => {
          if (valid) commitDraft();
          onClose();
        };
        return (
          <>
            <label className={labelCls}>SECRET PHRASE (MIN 8 CHARACTERS)</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                maxLength={128}
                value={draft.password}
                onChange={e => draft.setPassword(e.target.value.slice(0, 128))}
                placeholder="Correct horse battery staple…"
                autoFocus
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer"
                title={showSecret ? 'Hide phrase' : 'Show phrase'}
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {draft.password.length > 0 && !valid && (
              <p className="text-[11px] text-rose-300">Passphrase must be at least 8 characters.</p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={apply}
                disabled={!valid}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  valid
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(0,242,255,0.5)] hover:scale-[1.01]'
                    : 'bg-cyan-950/40 border border-cyan-500/20 text-cyan-500/50 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" /> Apply Lock
              </button>
              {isConfigured() && (
                <button
                  type="button"
                  onClick={() => removeAndClose({ type: 'REMOVE_PASSWORD' })}
                  className="px-3 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-900/50 transition-all cursor-pointer"
                  title="Disable passphrase lock"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        );
      }
      case 'time-capsule': {
        const valid = Boolean(draft.timeOpenAt);
        const apply = () => {
          draft.setTimeLockMode('range');
          draft.setTimeLockAt('');
          draft.setTimeLock(true);
          commitDraft();
          onClose();
        };
        return (
          <>
            <label className={labelCls}>OPENS ON (DATE / TIME)</label>
            <input
              type="datetime-local"
              value={draft.timeOpenAt}
              onChange={e => {
                draft.setTimeOpenAt(e.target.value);
                draft.setTimeLockMode('range');
                draft.setTimeLock(true);
              }}
              className={inputCls}
            />
            <p className="text-[10px] text-cyan-400/70">Stays sealed until this moment, then opens with no end date.</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={apply}
                disabled={!valid}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  valid
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(0,242,255,0.5)] hover:scale-[1.01]'
                    : 'bg-cyan-950/40 border border-cyan-500/20 text-cyan-500/50 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" /> Apply Lock
              </button>
              {isConfigured() && (
                <button
                  type="button"
                  onClick={() => removeAndClose({ type: 'REMOVE_TIME_LOCK' })}
                  className="px-3 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-900/50 transition-all cursor-pointer"
                  title="Disable time capsule lock"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        );
      }
      case 'burn': {
        const apply = () => {
          draft.setAccessLimitMaxOpens(1);
          draft.setAccessLimit(true);
          commitDraft();
          onClose();
        };
        return (
          <>
            <p className="text-xs text-cyan-200/85 leading-relaxed">
              One opening only. After the first successful view the Box locks permanently.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={apply}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.5)] hover:scale-[1.01] transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" /> {isConfigured() ? 'Burn Lock Active' : 'Enable Burn Lock'}
              </button>
              {isConfigured() && (
                <button
                  type="button"
                  onClick={() => removeAndClose({ type: 'REMOVE_ACCESS_LIMIT' })}
                  className="px-3 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-900/50 transition-all cursor-pointer"
                  title="Disable burn lock"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        );
      }
      case 'max-opens': {
        const presets = [1, 3, 5, 10];
        const apply = () => {
          draft.setAccessLimit(true);
          commitDraft();
          onClose();
        };
        return (
          <>
            <div className="flex items-center justify-between">
              <label className={labelCls}>MAXIMUM OPENS</label>
              <span className="text-xs font-bold text-cyan-200 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded">
                {draft.accessLimitMaxOpens === 1 ? '1 Open (Burn)' : `${draft.accessLimitMaxOpens} Opens`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {presets.map(count => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    draft.setAccessLimitMaxOpens(count);
                    draft.setAccessLimit(true);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    draft.accessLimitMaxOpens === count
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,242,255,0.4)]'
                      : 'bg-[#02010a]/80 border-cyan-500/20 text-cyan-400/60 hover:border-cyan-500/40'
                  }`}
                >
                  {count === 1 ? '1 (Burn)' : `${count}`}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-cyan-400/70 font-bold uppercase">Custom limit (up to 1,000,000)</label>
              <input
                type="number"
                min={1}
                max={1000000}
                value={draft.accessLimitMaxOpens}
                onChange={e => {
                  draft.setAccessLimitMaxOpens(Math.max(1, Math.min(1000000, Number(e.target.value) || 1)));
                  draft.setAccessLimit(true);
                }}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.showRemainingAccessCount}
                onChange={e => {
                  draft.setShowRemainingAccessCount(e.target.checked);
                  draft.setAccessLimit(true);
                }}
                className="accent-cyan-500 cursor-pointer"
              />
              <span className="text-xs text-cyan-300">Display remaining views on lock screen</span>
            </label>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={apply}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.5)] hover:scale-[1.01] transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" /> Apply Lock
              </button>
              {isConfigured() && (
                <button
                  type="button"
                  onClick={() => removeAndClose({ type: 'REMOVE_ACCESS_LIMIT' })}
                  className="px-3 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-900/50 transition-all cursor-pointer"
                  title="Disable max opens lock"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        );
      }
      case 'access-window': {
        const valid = Boolean(draft.timeOpenAt) || Boolean(draft.timeLockAt);
        const apply = () => {
          draft.setTimeLockMode('range');
          draft.setTimeLock(true);
          commitDraft();
          onClose();
        };
        return (
          <>
            <div className="space-y-1">
              <label className={labelCls}>OPENS ON (START)</label>
              <input
                type="datetime-local"
                value={draft.timeOpenAt}
                onChange={e => {
                  draft.setTimeOpenAt(e.target.value);
                  draft.setTimeLockMode('range');
                  draft.setTimeLock(true);
                }}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>LOCKS ON (END)</label>
              <input
                type="datetime-local"
                value={draft.timeLockAt}
                onChange={e => {
                  draft.setTimeLockAt(e.target.value);
                  draft.setTimeLockMode('range');
                  draft.setTimeLock(true);
                }}
                className={inputCls}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={apply}
                disabled={!valid}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  valid
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(0,242,255,0.5)] hover:scale-[1.01]'
                    : 'bg-cyan-950/40 border border-cyan-500/20 text-cyan-500/50 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" /> Apply Lock
              </button>
              {isConfigured() && (
                <button
                  type="button"
                  onClick={() => removeAndClose({ type: 'REMOVE_TIME_LOCK' })}
                  className="px-3 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-900/50 transition-all cursor-pointer"
                  title="Disable access window lock"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        );
      }
      case 'countdown': {
        const presets = [1, 6, 24, 168];
        const apply = () => {
          draft.setTimeLockMode('delay');
          draft.setShowTimeCountdown(true);
          draft.setTimeLock(true);
          commitDraft();
          onClose();
        };
        return (
          <>
            <div className="flex items-center justify-between">
              <label className={labelCls}>WAIT DURATION</label>
              <span className="text-xs font-bold text-cyan-200 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded">
                {draft.timeDelayHours === 168 ? '7 Days' : `${draft.timeDelayHours} Hours`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {presets.map(hours => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => {
                    draft.setTimeDelayHours(hours);
                    draft.setTimeLockMode('delay');
                    draft.setTimeLock(true);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    draft.timeDelayHours === hours
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                      : 'bg-[#02010a]/80 border-cyan-500/20 text-cyan-400/60 hover:border-cyan-500/40'
                  }`}
                >
                  {hours === 168 ? '7 Days' : `${hours}h`}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-cyan-400/70">The recipient waits through a live cinematic countdown before reveal.</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={apply}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.5)] hover:scale-[1.01] transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4" /> Apply Lock
              </button>
              {isConfigured() && (
                <button
                  type="button"
                  onClick={() => removeAndClose({ type: 'REMOVE_TIME_LOCK' })}
                  className="px-3 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-900/50 transition-all cursor-pointer"
                  title="Disable countdown lock"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        );
      }
      case 'chain': {
        return (
          <>
            <p className="text-xs text-cyan-200/85 leading-relaxed">
              Chain Key links this Box into a cryptographic sequence: each Box unlocks only after its
              predecessor is verified. Enable chained-sequence mode, then use <strong>NEXT BOX</strong> to
              extend the hunt, story, or onboarding flow.
            </p>
            <button
              type="button"
              onClick={() => {
                onToggleChain?.(!chainEnabled);
                onClose();
              }}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                chainEnabled
                  ? 'border border-cyan-400/60 bg-cyan-950/60 text-cyan-200'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(0,242,255,0.5)] hover:scale-[1.01]'
              }`}
            >
              <Lock className="w-4 h-4" /> {chainEnabled ? 'Chained Mode Enabled — Disable' : 'Enable Chained Mode'}
            </button>
          </>
        );
      }
      case 'soon':
      default: {
        return (
          <>
            <p className="text-xs text-cyan-200/85 leading-relaxed">{lock.description}</p>
            <div className="rounded-xl border border-cyan-500/20 bg-[#02010a]/70 p-3">
              <div className="text-[10px] font-bold text-cyan-400/70 uppercase tracking-wider mb-1">Best for</div>
              <p className="text-xs text-cyan-200/80 leading-relaxed">{lock.useCase}</p>
            </div>
            <div className="flex items-center justify-center">
              <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold tracking-widest">
                COMING SOON
              </span>
            </div>
            <button
              type="button"
              onClick={close}
              className="w-full py-2.5 rounded-xl border border-cyan-500/30 text-cyan-300 text-xs hover:bg-cyan-950/40 hover:border-cyan-400 transition-all cursor-pointer"
            >
              Close
            </button>
          </>
        );
      }
    }
  };

  const Icon = lock.icon;
  const configured = isConfigured();
  const timedKinds: Array<string> = ['time-capsule', 'access-window', 'countdown'];
  const accent = lock.kind === 'passcode' || lock.kind === 'passphrase' ? 'fuchsia' : timedKinds.includes(lock.kind) ? 'amber' : lock.kind === 'burn' || lock.kind === 'max-opens' ? 'emerald' : 'cyan';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-3 sm:items-center"
      onMouseDown={e => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={`max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border bg-[#050314]/95 p-4 sm:p-5 shadow-[0_0_50px_rgba(0,242,255,0.2)] ${
          accent === 'fuchsia'
            ? 'border-fuchsia-500/40'
            : accent === 'amber'
              ? 'border-amber-500/40'
              : accent === 'emerald'
                ? 'border-emerald-500/40'
                : 'border-cyan-500/40'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                accent === 'fuchsia'
                  ? 'bg-fuchsia-950/80 border-fuchsia-500/40'
                  : accent === 'amber'
                    ? 'bg-amber-950/80 border-amber-500/40'
                    : accent === 'emerald'
                      ? 'bg-emerald-950/80 border-emerald-500/40'
                      : 'bg-cyan-950/80 border-cyan-500/40'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  accent === 'fuchsia'
                    ? 'text-fuchsia-300'
                    : accent === 'amber'
                      ? 'text-amber-300'
                      : accent === 'emerald'
                        ? 'text-emerald-300'
                        : 'text-cyan-300'
                }`}
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-cyan-100 tracking-wide font-cyber">{lock.name.toUpperCase()}</h2>
              <p className="text-[10px] text-cyan-400/70">{lock.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {configured && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[9px] font-bold tracking-widest">
                ACTIVE
              </span>
            )}
            <button
              type="button"
              onClick={close}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-cyan-200 hover:border-cyan-400/50 transition-all cursor-pointer"
              aria-label="Close lock configuration"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-cyan-300/70 leading-relaxed mb-3">{lock.description}</p>

        <div className="space-y-3">{renderBody()}</div>
      </div>
    </div>
  );
};
