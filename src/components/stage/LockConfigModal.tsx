import React, { useEffect, useState } from 'react';
import { X, Check, Trash2, Eye, EyeOff, Clock, Lock, Mail, Send, Copy, RefreshCw, Sparkles, CheckCircle2, Hourglass, ShieldCheck, AlertTriangle } from 'lucide-react';
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

function generateNewMagicKey(): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let seg1 = '';
  let seg2 = '';
  for (let i = 0; i < 4; i++) {
    seg1 += chars.charAt(Math.floor(Math.random() * chars.length));
    seg2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MK-${seg1}-${seg2}`;
}

// Accepts whatever the user types — dashes or not, upper or lower case — and
// returns the canonical MK-XXXX-XXXX shape. The dashes come from the field
// itself so the user never has to type one or tab past one.
function formatMagicKey(raw: string): string {
  const cleaned = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = cleaned.startsWith('MK') ? cleaned.slice(2) : cleaned;
  const a = body.slice(0, 4);
  const b = body.slice(4, 8);
  if (b) return `MK-${a}-${b}`;
  if (a) return `MK-${a}`;
  return 'MK-';
}

interface MagicKeySetupBodyProps {
  draftPassword: string;
  boxTitle: string;
  onApplyKey: (key: string) => void;
  onRemoveKey?: () => void;
  isConfigured: boolean;
  onClose: () => void;
}

const MagicKeySetupBody: React.FC<MagicKeySetupBodyProps> = ({
  draftPassword,
  boxTitle,
  onApplyKey,
  onRemoveKey,
  isConfigured,
  onClose,
}) => {
  const [magicKey, setMagicKey] = useState<string>(() => {
    return draftPassword && draftPassword.trim().length >= 4 ? formatMagicKey(draftPassword) : generateNewMagicKey();
  });
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; id?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(magicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleRegenerate = () => {
    const newKey = generateNewMagicKey();
    setMagicKey(newKey);
    setSendResult(null);
  };

  const handleSendAndApply = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setSendResult({ success: false, error: 'Please enter a valid recipient email address.' });
      return;
    }
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/magic-key/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail.trim(),
          recipientName: recipientName.trim(),
          magicKey: magicKey.trim(),
          boxTitle: boxTitle || 'Untitled Bitty Box',
          note: personalNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSendResult({ success: false, error: data.error || 'Failed to dispatch email via Resend.' });
      } else {
        setSendResult({ success: true, id: data.id });
        onApplyKey(magicKey.trim());
      }
    } catch (err: any) {
      setSendResult({ success: false, error: err.message || 'Network error dispatching email via Resend.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleApplyWithoutEmail = () => {
    onApplyKey(magicKey.trim());
    onClose();
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Key Display Card */}
      <div className="rounded-xl border border-yellow-500/40 bg-[#070514]/90 p-3.5 space-y-2 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>One-Time Magic Key</span>
          </label>
          <span className="text-[9px] text-yellow-400/80 bg-yellow-950/70 border border-yellow-600/40 px-2 py-0.5 rounded-full font-bold">
            EPHEMERAL SECRET
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={magicKey}
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={11}
            onChange={e => {
              setMagicKey(formatMagicKey(e.target.value));
              setSendResult(null);
            }}
            className="flex-1 bg-[#02010a] border border-yellow-500/50 rounded-xl px-3 py-2.5 text-center text-base sm:text-lg font-bold tracking-[0.2em] text-yellow-200 shadow-[inset_0_0_15px_rgba(234,179,8,0.15)] focus:border-yellow-300 focus:outline-none select-text"
            placeholder="MK-XXXX-XXXX"
          />
          <button
            type="button"
            onClick={handleRegenerate}
            className="p-2.5 rounded-xl border border-yellow-500/40 bg-yellow-950/50 hover:bg-yellow-900/60 text-yellow-300 transition-all cursor-pointer"
            title="Generate new random key"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-2.5 rounded-xl border border-yellow-500/40 bg-yellow-950/50 hover:bg-yellow-900/60 text-yellow-300 transition-all cursor-pointer min-w-[38px] flex items-center justify-center"
            title="Copy magic key"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-yellow-300/60 leading-tight">
          This key is required to decrypt the Box ciphertext. Deliver it to your designated recipient.
        </p>
      </div>

      {/* Dedicated Recipient Email Delivery Form */}
      <div className="rounded-xl border border-cyan-500/30 bg-[#040210]/90 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-200">
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>DELIVER VIA RESEND</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE EMAIL
          </span>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-cyan-300/90 uppercase tracking-wider">Recipient Email *</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={e => {
              setRecipientEmail(e.target.value);
              if (sendResult) setSendResult(null);
            }}
            placeholder="recipient@example.com"
            className="w-full rounded-xl border border-cyan-400/40 bg-[#02010a] px-3 py-2 text-xs sm:text-sm text-cyan-100 placeholder:text-cyan-400/30 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400 select-text"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-cyan-300/90 uppercase tracking-wider">Recipient Name (Optional)</label>
          <input
            type="text"
            value={recipientName}
            onChange={e => setRecipientName(e.target.value)}
            placeholder="e.g. VIP Guest"
            className="w-full rounded-xl border border-cyan-400/40 bg-[#02010a] px-3 py-2 text-xs sm:text-sm text-cyan-100 placeholder:text-cyan-400/30 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400 select-text"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-cyan-300/90 uppercase tracking-wider">Personal Memo (Optional)</label>
          <textarea
            rows={2}
            value={personalNote}
            onChange={e => setPersonalNote(e.target.value)}
            placeholder="Optional personal message included in the delivery email..."
            className="w-full rounded-xl border border-cyan-400/40 bg-[#02010a] px-3 py-2 text-xs text-cyan-100 placeholder:text-cyan-400/30 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400 select-text resize-none"
          />
        </div>
      </div>

      {/* Result feedback alert */}
      {sendResult?.success && (
        <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/80 p-3 text-xs text-emerald-200 flex items-start gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-emerald-300">Magic Key Sent Successfully!</p>
            <p className="text-[11px] text-emerald-200/80 mt-0.5">
              Delivered to <strong className="text-white">{recipientEmail}</strong> via Resend.
            </p>
            {sendResult.id && (
              <p className="text-[9px] font-mono text-emerald-400/70 mt-0.5 truncate">Delivery ID: {sendResult.id}</p>
            )}
          </div>
        </div>
      )}

      {sendResult?.error && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/80 p-3 text-xs text-rose-200 flex items-start gap-2 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
          <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-rose-300">Delivery Failed</p>
            <p className="text-[11px] text-rose-200/80 mt-0.5">{sendResult.error}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={handleSendAndApply}
          disabled={isSending || !magicKey || magicKey.trim().length < 4}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isSending
              ? 'bg-yellow-950/60 border border-yellow-500/40 text-yellow-400 animate-pulse'
              : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:brightness-110 active:scale-[0.99]'
          }`}
        >
          {isSending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Sending Key via Resend...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Magic Key &amp; Apply Lock</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApplyWithoutEmail}
            disabled={!magicKey || magicKey.trim().length < 4}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold border border-yellow-500/30 bg-yellow-950/40 text-yellow-300 hover:bg-yellow-900/50 hover:border-yellow-400/60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            title="Apply this magic key without sending an email"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Key Only</span>
          </button>

          {isConfigured && (
            <button
              type="button"
              onClick={onRemoveKey}
              className="px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-900/50 transition-all cursor-pointer flex items-center justify-center"
              title="Disable One-Time Magic Key lock"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Dead-Man Switch configuration ────────────────────────────────────────────
// A liveness-gated release: the server emails the creator a one-click check-in
// link on the chosen cadence. Missing `interval + grace` fires the switch and
// releases the archived Box link to the recipient. Cadence is settable down to
// one minute (60 s), and the grace window can be turned off entirely.

type DurationUnit = 'minutes' | 'hours' | 'days';
const UNIT_MINUTES: Record<DurationUnit, number> = { minutes: 1, hours: 60, days: 1440 };
const UNIT_LABEL: Record<DurationUnit, string> = { minutes: 'min', hours: 'hrs', days: 'days' };

function bestUnit(minutes: number): DurationUnit {
  if (minutes > 0 && minutes % 1440 === 0) return 'days';
  if (minutes > 0 && minutes % 60 === 0) return 'hours';
  return 'minutes';
}
function toMinutes(value: number, unit: DurationUnit): number {
  return Math.max(0, Number(value) || 0) * UNIT_MINUTES[unit];
}
function fromMinutes(minutes: number, unit: DurationUnit): number {
  return Math.round((minutes / UNIT_MINUTES[unit]) * 1000) / 1000;
}
function humanizeMinutes(minutes: number): string {
  const m = Math.round(Number(minutes) || 0);
  if (m <= 0) return 'no grace';
  const days = Math.floor(m / 1440);
  const hours = Math.floor((m % 1440) / 60);
  const mins = m % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (mins) parts.push(`${mins} minute${mins === 1 ? '' : 's'}`);
  return parts.join(' ');
}

function generateSwitchId(): string {
  try {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return 'dms_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'dms_' + Math.random().toString(36).slice(2, 14);
  }
}

function emailLooksValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
}

interface DurationFieldProps {
  value: number;
  unit: DurationUnit;
  onChangeValue: (v: number) => void;
  onChangeUnit: (u: DurationUnit) => void;
  onSetMinutes: (minutes: number) => void;
  min: number;
  presets: Array<{ label: string; minutes: number }>;
  accent: 'violet' | 'amber';
}

const DurationField: React.FC<DurationFieldProps> = ({
  value,
  unit,
  onChangeValue,
  onChangeUnit,
  onSetMinutes,
  min,
  presets,
  accent,
}) => {
  const ring = accent === 'violet' ? 'focus:border-violet-300 focus:ring-violet-400' : 'focus:border-amber-300 focus:ring-amber-400';
  const chipOn = accent === 'violet' ? 'bg-violet-950/90 border-violet-400 text-violet-100' : 'bg-amber-950/90 border-amber-400 text-amber-100';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          step={1}
          value={value}
          onChange={e => onChangeValue(Math.max(min, Number(e.target.value) || min))}
          className={`flex-1 rounded-xl border border-cyan-400/40 bg-[#02010a] px-3 py-2 text-sm text-cyan-100 outline-none focus:ring-1 select-text ${ring}`}
        />
        <div className="flex items-center gap-1">
          {(['minutes', 'hours', 'days'] as DurationUnit[]).map(u => (
            <button
              key={u}
              type="button"
              onClick={() => onChangeUnit(u)}
              className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                unit === u ? chipOn : 'bg-[#02010a]/80 border-cyan-500/20 text-cyan-400/60 hover:border-cyan-500/40'
              }`}
            >
              {UNIT_LABEL[u]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {presets.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => onSetMinutes(p.minutes)}
            className="px-2 py-0.5 rounded-md border border-cyan-500/25 bg-[#02010a]/70 text-[10px] text-cyan-300/70 hover:border-cyan-400/60 hover:text-cyan-200 transition-all cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

interface DeadManSwitchSetupBodyProps {
  draft: NonNullable<ReturnType<typeof useDraft>>;
  boxTitle: string;
  isConfigured: boolean;
  onApply: () => void;
  onRemove: () => void;
  onClose: () => void;
}

const DeadManSwitchSetupBody: React.FC<DeadManSwitchSetupBodyProps> = ({
  draft,
  boxTitle,
  isConfigured,
  onApply,
  onRemove,
  onClose,
}) => {
  const switchId = draft.deadmanSwitchId;
  const [intervalUnit, setIntervalUnit] = useState<DurationUnit>(() => bestUnit(draft.deadmanIntervalMinutes));
  const [intervalValue, setIntervalValue] = useState<number>(() =>
    fromMinutes(draft.deadmanIntervalMinutes, bestUnit(draft.deadmanIntervalMinutes))
  );
  const [graceUnit, setGraceUnit] = useState<DurationUnit>(() =>
    bestUnit(draft.deadmanGraceMinutes > 0 ? draft.deadmanGraceMinutes : 60)
  );
  const [graceValue, setGraceValue] = useState<number>(() =>
    fromMinutes(draft.deadmanGraceMinutes > 0 ? draft.deadmanGraceMinutes : 60, bestUnit(draft.deadmanGraceMinutes > 0 ? draft.deadmanGraceMinutes : 60))
  );

  const [liveStatus, setLiveStatus] = useState<null | {
    status: string;
    nextDueAt?: string;
    releasesAt?: string;
    triggered?: boolean;
  }>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<null | { ok: boolean; text: string }>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [testing, setTesting] = useState<'' | 'remind' | 'fire'>('');
  const [testMessage, setTestMessage] = useState<null | { ok: boolean; text: string }>(null);

  const token = (() => {
    if (!switchId) return '';
    try {
      return localStorage.getItem(`bitty_deadman_token_${switchId}`) || '';
    } catch {
      return '';
    }
  })();

  const refreshStatus = React.useCallback(() => {
    if (!switchId) return;
    fetch(`/api/deadman/status/${switchId}`, { headers: { Accept: 'application/json' } })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.success) setLiveStatus(data.switch);
      })
      .catch(() => {});
  }, [switchId]);

  // Prefer the server's authoritative state when we already have a switch id.
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const applyInterval = (v: number) => {
    setIntervalValue(v);
    draft.setDeadmanIntervalMinutes(Math.max(1, Math.round(toMinutes(v, intervalUnit))));
  };
  const setIntervalPreset = (minutes: number) => {
    const u = bestUnit(minutes);
    setIntervalUnit(u);
    setIntervalValue(fromMinutes(minutes, u));
    draft.setDeadmanIntervalMinutes(Math.max(1, Math.round(minutes)));
  };
  const changeIntervalUnit = (u: DurationUnit) => {
    setIntervalUnit(u);
    setIntervalValue(fromMinutes(draft.deadmanIntervalMinutes, u));
  };
  const applyGrace = (v: number) => {
    setGraceValue(v);
    draft.setDeadmanGraceMinutes(Math.max(1, Math.round(toMinutes(v, graceUnit))));
  };
  const setGracePreset = (minutes: number) => {
    const u = bestUnit(minutes);
    setGraceUnit(u);
    setGraceValue(fromMinutes(minutes, u));
    draft.setDeadmanGraceMinutes(Math.max(1, Math.round(minutes)));
  };
  const changeGraceUnit = (u: DurationUnit) => {
    setGraceUnit(u);
    setGraceValue(fromMinutes(draft.deadmanGraceMinutes > 0 ? draft.deadmanGraceMinutes : 60, u));
  };
  const toggleGrace = (enabled: boolean) => {
    draft.setDeadmanGraceEnabled(enabled);
    if (enabled && draft.deadmanGraceMinutes <= 0) {
      draft.setDeadmanGraceMinutes(Math.max(1, Math.round(toMinutes(graceValue || 60, graceUnit))));
    }
  };

  const handleCheckIn = async () => {
    if (!token) return;
    setCheckingIn(true);
    setCheckInMessage(null);
    try {
      const res = await fetch(`/api/deadman/checkin/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const due = data.switch?.nextDueAt ? new Date(data.switch.nextDueAt).toLocaleString() : 'the next interval';
        setLiveStatus(data.switch);
        setCheckInMessage({ ok: true, text: `Checked in. Next check-in due ${due}.` });
      } else {
        setCheckInMessage({ ok: false, text: 'Could not check in — the link may have been replaced. Arm again to get a fresh check-in link.' });
      }
    } catch {
      setCheckInMessage({ ok: false, text: 'Network error while checking in.' });
    } finally {
      setCheckingIn(false);
    }
  };

  const runTest = async (kind: 'remind' | 'fire') => {
    if (!token) return;
    setTesting(kind);
    setTestMessage(null);
    try {
      const res = await fetch(`/api/deadman/test-${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setTestMessage({ ok: false, text: data.error || `Test ${kind} failed.` });
      } else if (kind === 'remind') {
        setTestMessage({
          ok: data.delivery?.success !== false,
          text: data.delivery?.success === false
            ? `Reminder could not be delivered: ${data.delivery.error || 'unknown error'}`
            : 'Test check-in email sent to your inbox.',
        });
      } else {
        setTestMessage({
          ok: true,
          text: data.alreadyTriggered
            ? 'This switch was already fired.'
            : data.delivery?.success === false
              ? `Switch fired, but the release email was not delivered (${data.delivery.error || 'no recipient set'}).`
              : 'Switch fired and the release email was delivered to the recipient.',
        });
      }
      refreshStatus();
    } catch {
      setTestMessage({ ok: false, text: `Network error running test ${kind}.` });
    } finally {
      setTesting('');
    }
  };

  const handleCopyCheckIn = async () => {
    if (!token || typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/api/deadman/checkin/${token}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const creatorValid = emailLooksValid(draft.deadmanCreatorEmail);
  const recipientValid = emailLooksValid(draft.deadmanRecipientEmail);
  const canApply = creatorValid && recipientValid;
  const graceOn = draft.deadmanGraceEnabled;
  const totalMinutes = draft.deadmanIntervalMinutes + (graceOn ? draft.deadmanGraceMinutes : 0);

  return (
    <div className="space-y-3 font-mono">
      {/* Explainer */}
      <div className="rounded-xl border border-violet-500/40 bg-[#0b0718]/90 p-3.5 space-y-2 shadow-[0_0_20px_rgba(139,92,246,0.18)]">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-300 uppercase tracking-wider">
          <Hourglass className="w-3.5 h-3.5 text-violet-400" />
          <span>Liveness-gated release</span>
        </div>
        <p className="text-[11px] text-violet-200/80 leading-relaxed">
          We email you a one-click check-in link on your cadence. Keep checking in and nothing is
          released. Go silent past <strong className="text-white">interval + grace</strong> and the
          archived Box link is delivered to your recipient automatically.
        </p>
        <p className="text-[10px] text-violet-300/60 leading-relaxed">
          Cadence is settable down to 1 minute and grace can be switched off — handy for testing the
          full reminder and release path quickly.
        </p>
      </div>

      {/* Cadence */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={labelCls}>CHECK-IN EVERY</label>
          <span className="text-xs font-bold text-violet-200 bg-violet-950/80 border border-violet-500/40 px-2 py-0.5 rounded">
            {humanizeMinutes(draft.deadmanIntervalMinutes)}
          </span>
        </div>
        <DurationField
          value={intervalValue}
          unit={intervalUnit}
          onChangeValue={applyInterval}
          onChangeUnit={changeIntervalUnit}
          onSetMinutes={setIntervalPreset}
          min={1}
          accent="violet"
          presets={[
            { label: '1 min', minutes: 1 },
            { label: '5 min', minutes: 5 },
            { label: '1 hr', minutes: 60 },
            { label: '1 day', minutes: 1440 },
            { label: '7 days', minutes: 10080 },
          ]}
        />
      </div>

      {/* Grace */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className={labelCls}>GRACE PERIOD</label>
          <button
            type="button"
            onClick={() => toggleGrace(!graceOn)}
            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer ${
              graceOn
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
            title={graceOn ? 'Turn the grace period off' : 'Turn the grace period on'}
          >
            {graceOn ? 'ON' : 'OFF'}
          </button>
        </div>
        {graceOn ? (
          <>
            <div className="flex items-center justify-end">
              <span className="text-xs font-bold text-violet-200 bg-violet-950/80 border border-violet-500/40 px-2 py-0.5 rounded">
                {humanizeMinutes(draft.deadmanGraceMinutes)}
              </span>
            </div>
            <DurationField
              value={graceValue}
              unit={graceUnit}
              onChangeValue={applyGrace}
              onChangeUnit={changeGraceUnit}
              onSetMinutes={setGracePreset}
              min={1}
              accent="amber"
              presets={[
                { label: '1 min', minutes: 1 },
                { label: '5 min', minutes: 5 },
                { label: '1 hr', minutes: 60 },
                { label: '1 day', minutes: 1440 },
              ]}
            />
            <p className="text-[10px] text-violet-300/60 leading-tight">
              Releases {humanizeMinutes(totalMinutes)} after your last check-in.
            </p>
          </>
        ) : (
          <p className="text-[10px] text-amber-300/80 leading-tight">
            No grace: the switch releases exactly {humanizeMinutes(draft.deadmanIntervalMinutes)} after
            your last check-in.
          </p>
        )}
      </div>

      {/* Contacts */}
      <div className="rounded-xl border border-cyan-500/30 bg-[#040210]/90 p-3.5 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-200">
          <Mail className="w-3.5 h-3.5 text-cyan-400" />
          <span>CHECK-IN &amp; DELIVERY</span>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-cyan-300/90 uppercase tracking-wider">Your Email (check-in) *</label>
          <input
            type="email"
            value={draft.deadmanCreatorEmail}
            onChange={e => draft.setDeadmanCreatorEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-cyan-400/40 bg-[#02010a] px-3 py-2 text-xs sm:text-sm text-cyan-100 placeholder:text-cyan-400/30 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400 select-text"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-cyan-300/90 uppercase tracking-wider">Recipient Email *</label>
          <input
            type="email"
            value={draft.deadmanRecipientEmail}
            onChange={e => draft.setDeadmanRecipientEmail(e.target.value)}
            placeholder="recipient@example.com"
            className="w-full rounded-xl border border-cyan-400/40 bg-[#02010a] px-3 py-2 text-xs sm:text-sm text-cyan-100 placeholder:text-cyan-400/30 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400 select-text"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-cyan-300/90 uppercase tracking-wider">Recipient Name (Optional)</label>
          <input
            type="text"
            value={draft.deadmanRecipientName}
            onChange={e => draft.setDeadmanRecipientName(e.target.value)}
            placeholder="e.g. Mum, Alex, Estate Trustee"
            className="w-full rounded-xl border border-cyan-400/40 bg-[#02010a] px-3 py-2 text-xs sm:text-sm text-cyan-100 placeholder:text-cyan-400/30 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400 select-text"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-cyan-300/90 uppercase tracking-wider">Message on Release (Optional)</label>
          <textarea
            rows={2}
            value={draft.deadmanNote}
            onChange={e => draft.setDeadmanNote(e.target.value)}
            placeholder="Included in the release email…"
            className="w-full rounded-xl border border-cyan-400/40 bg-[#02010a] px-3 py-2 text-xs text-cyan-100 placeholder:text-cyan-400/30 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400 select-text resize-none"
          />
        </div>
        {draft.deadmanCreatorEmail && !creatorValid && (
          <p className="text-[11px] text-rose-300">Enter a valid email for your check-in links.</p>
        )}
        {draft.deadmanRecipientEmail && !recipientValid && (
          <p className="text-[11px] text-rose-300">Enter a valid recipient email.</p>
        )}
      </div>

      {isConfigured && switchId && !token && !liveStatus && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-950/30 p-3 text-[11px] text-violet-200/80 leading-relaxed">
          Configured, not yet armed. Generate the Box to arm the switch and receive your first
          check-in email.
        </div>
      )}

      {/* Armed status + easy check-in */}
      {isConfigured && switchId && (token || liveStatus) && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ARMED
            </span>
            <span className="text-[9px] font-mono text-emerald-300/70 truncate">{switchId}</span>
          </div>
          {liveStatus?.nextDueAt && !liveStatus.triggered && (
            <p className="text-[11px] text-emerald-200/85">
              Next check-in due <strong className="text-white">{new Date(liveStatus.nextDueAt).toLocaleString()}</strong>
              {liveStatus.releasesAt ? ` · releases ${new Date(liveStatus.releasesAt).toLocaleString()} if missed` : ''}
            </p>
          )}
          {liveStatus?.triggered && (
            <p className="text-[11px] text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> This switch has already fired. Re-arm to start a new cycle.
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={checkingIn || !token}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                checkingIn || !token
                  ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-500/60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:brightness-110'
              }`}
              title={token ? 'Reset the liveness clock now' : 'Arm the switch to get a check-in link'}
            >
              {checkingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{checkingIn ? 'Checking in…' : 'Check In Now'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyCheckIn}
              disabled={!token}
              className="px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 text-xs hover:bg-emerald-900/50 transition-all cursor-pointer disabled:opacity-40"
              title="Copy my check-in link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {checkInMessage && (
            <p className={`text-[11px] ${checkInMessage.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
              {checkInMessage.text}
            </p>
          )}

          {/* Test hooks — exercise the real paths without waiting */}
          <div className="pt-2 mt-1 border-t border-emerald-500/20 space-y-2">
            <div className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">Test the paths</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => runTest('remind')}
                disabled={!token || testing !== ''}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold border border-cyan-500/40 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/50 transition-all cursor-pointer disabled:opacity-40"
                title="Send the check-in reminder email right now"
              >
                {testing === 'remind' ? 'Sending…' : 'Send test reminder'}
              </button>
              <button
                type="button"
                onClick={() => runTest('fire')}
                disabled={!token || testing !== '' || Boolean(liveStatus?.triggered)}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold border border-rose-500/40 bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 transition-all cursor-pointer disabled:opacity-40"
                title="Fire the switch immediately and deliver the release email"
              >
                {testing === 'fire' ? 'Firing…' : 'Fire release now'}
              </button>
            </div>
            {testMessage && (
              <p className={`text-[11px] ${testMessage.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                {testMessage.text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onApply}
          disabled={!canApply}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            canApply
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] hover:scale-[1.01]'
              : 'bg-violet-950/40 border border-violet-500/20 text-violet-500/50 cursor-not-allowed'
          }`}
        >
          <Hourglass className="w-4 h-4" /> {isConfigured ? 'Update Dead-Man Switch' : 'Arm Dead-Man Switch'}
        </button>
        {isConfigured && (
          <button
            type="button"
            onClick={onRemove}
            className="px-3 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-900/50 transition-all cursor-pointer"
            title="Disable Dead-Man Switch"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-[9px] text-violet-300/50 leading-tight">
        Arming saves this configuration. The first check-in email is sent when you generate the Box.
      </p>
    </div>
  );
};

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

  const removeAndClose = (
    action:
      | { type: 'REMOVE_PASSWORD' }
      | { type: 'REMOVE_TIME_LOCK' }
      | { type: 'REMOVE_ACCESS_LIMIT' }
      | { type: 'REMOVE_DEADMAN' }
  ) => {
    dispatch(action);
    discardDraft();
    onClose();
  };

  // Removing a Dead-Man Switch must also disarm it server-side so no release
  // email can fire after the creator cancelled it.
  const removeDeadmanAndClose = () => {
    const switchId = state.deadmanSwitchId;
    let token = '';
    try {
      if (switchId) token = localStorage.getItem(`bitty_deadman_token_${switchId}`) || '';
    } catch {}
    if (token) {
      fetch('/api/deadman/disarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => {});
      try {
        localStorage.removeItem(`bitty_deadman_token_${switchId}`);
      } catch {}
    }
    removeAndClose({ type: 'REMOVE_DEADMAN' });
  };

  const isConfigured = (): boolean => {
    switch (lock.kind) {
      case 'passcode':
        return state.password.length > 0 && /^\d+$/.test(state.password);
      case 'magic-key':
        return state.password.length > 0 && (state.password.startsWith('MK-') || !/^\d+$/.test(state.password));
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
      case 'dead-man-switch':
        return state.deadmanEnabled && Boolean(state.deadmanSwitchId) && Boolean(state.deadmanCreatorEmail);
      default:
        return false;
    }
  };

  const renderBody = () => {
    switch (lock.kind) {
      case 'magic-key': {
        return (
          <MagicKeySetupBody
            draftPassword={draft.password}
            boxTitle={state.title}
            onApplyKey={(key) => {
              draft.setPassword(key);
              commitDraft();
            }}
            onRemoveKey={() => removeAndClose({ type: 'REMOVE_PASSWORD' })}
            isConfigured={isConfigured()}
            onClose={onClose}
          />
        );
      }
      case 'passcode': {
        const valid = draft.password.length >= 8 && draft.password.length <= 24 && /^\d*$/.test(draft.password);
        const apply = () => {
          if (valid) commitDraft();
          onClose();
        };
        return (
          <>
            <label className={labelCls}>NUMERIC PIN (8–24 DIGITS)</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={24}
                value={draft.password}
                onChange={e => draft.setPassword(e.target.value.replace(/\D/g, '').slice(0, 24))}
                placeholder="Enter 8-24 digits..."
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
              <p className="text-[11px] text-rose-300">PIN must be 8–24 digits to lock the Box.</p>
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
      case 'dead-man-switch': {
        return (
          <DeadManSwitchSetupBody
            draft={draft}
            boxTitle={state.title}
            isConfigured={isConfigured()}
            onApply={() => {
              if (!draft.deadmanSwitchId) draft.setDeadmanSwitchId(generateSwitchId());
              draft.setDeadmanEnabled(true);
              commitDraft();
              onClose();
            }}
            onRemove={removeDeadmanAndClose}
            onClose={onClose}
          />
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
  const accent =
    lock.kind === 'magic-key' || lock.id === 'one-time-magic-key'
      ? 'yellow'
      : lock.kind === 'passcode' || lock.kind === 'passphrase'
        ? 'fuchsia'
        : timedKinds.includes(lock.kind)
          ? 'amber'
          : lock.kind === 'burn' || lock.kind === 'max-opens'
            ? 'emerald'
            : lock.kind === 'dead-man-switch'
              ? 'violet'
              : 'cyan';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-3 sm:items-center"
      onMouseDown={e => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={`max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border bg-[#050314]/95 p-4 sm:p-5 shadow-[0_0_50px_rgba(0,242,255,0.2)] ${
          accent === 'yellow'
            ? 'border-yellow-500/40 shadow-[0_0_50px_rgba(234,179,8,0.2)]'
            : accent === 'fuchsia'
              ? 'border-fuchsia-500/40'
              : accent === 'amber'
                ? 'border-amber-500/40'
                : accent === 'emerald'
                  ? 'border-emerald-500/40'
                  : accent === 'violet'
                    ? 'border-violet-500/40 shadow-[0_0_50px_rgba(139,92,246,0.25)]'
                    : 'border-cyan-500/40'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                accent === 'yellow'
                  ? 'bg-yellow-950/80 border-yellow-500/40'
                  : accent === 'fuchsia'
                    ? 'bg-fuchsia-950/80 border-fuchsia-500/40'
                    : accent === 'amber'
                      ? 'bg-amber-950/80 border-amber-500/40'
                      : accent === 'emerald'
                        ? 'bg-emerald-950/80 border-emerald-500/40'
                        : accent === 'violet'
                          ? 'bg-violet-950/80 border-violet-500/40'
                          : 'bg-cyan-950/80 border-cyan-500/40'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  accent === 'yellow'
                    ? 'text-yellow-300'
                    : accent === 'fuchsia'
                      ? 'text-fuchsia-300'
                      : accent === 'amber'
                        ? 'text-amber-300'
                        : accent === 'emerald'
                          ? 'text-emerald-300'
                          : accent === 'violet'
                            ? 'text-violet-300'
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
