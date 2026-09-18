import React, { useState } from 'react';
import { Check, Coins, Clock3, Crown, Gift, Link2, KeyRound, X } from 'lucide-react';

export interface PaymentPolicyDraft {
  templateId: string;
  price: string;
  releaseAt?: string;
  maxOpens?: number;
  maxClaims?: number;
  previousBoxId?: string;
  accessWindowSeconds?: number;
  maxCalls?: number;
}

const POLICIES = [
  { id: 'pay-to-open-secret', name: 'Coin-Operated Secret', icon: KeyRound, color: 'fuchsia', what: 'One exact USDC payment opens the secret once, then the trapdoor burns.', use: 'Paid reveals, downloads, private briefs, and one-shot answers.' },
  { id: 'paywall-time-capsule', name: 'Future-Proof Paywall', icon: Clock3, color: 'amber', what: 'A payer unlocks only after your scheduled release time, within a view cap.', use: 'Embargoed reports, timed launches, and paid future messages.' },
  { id: 'first-payers-vault', name: 'Velvet Rope Vault', icon: Crown, color: 'violet', what: 'Only the first verified payers get in; the vault closes at your claim limit.', use: 'Founder access, limited editions, and capped presales.' },
  { id: 'tip-to-reveal', name: 'Tip Jar Trapdoor', icon: Gift, color: 'emerald', what: 'A minimum USDC tip opens the reveal; generous visitors may pay more.', use: 'Creator extras, easter eggs, patron drops, and thank-you downloads.' },
  { id: 'chain-of-commerce', name: 'Commerce Dominoes', icon: Link2, color: 'cyan', what: 'Payment unlocks this box only after a previous commercial step is verified.', use: 'Paid courses, progressive stories, data rooms, and agent supply chains.' },
  { id: 'paid-api-key-box', name: 'Keyhole Meter', icon: Coins, color: 'sky', what: 'A payment binds access to one wallet, one time window, and a call allowance.', use: 'Temporary API keys, demos, partner sandboxes, and machine-bought credentials.' },
] as const;

interface Props {
  value?: PaymentPolicyDraft;
  onChange: (value?: PaymentPolicyDraft) => void;
  onClose: () => void;
}

export const PaymentPolicyLockPanel: React.FC<Props> = ({ value, onChange, onClose }) => {
  const [selected, setSelected] = useState(value?.templateId || 'pay-to-open-secret');
  const [price, setPrice] = useState(value?.price || '$0.01');
  const [maxClaims, setMaxClaims] = useState(value?.maxClaims || 10);
  const [maxOpens, setMaxOpens] = useState(value?.maxOpens || 1);
  const [accessWindowSeconds, setAccessWindowSeconds] = useState(value?.accessWindowSeconds || 3600);
  const [maxCalls, setMaxCalls] = useState(value?.maxCalls || 100);
  const [previousBoxId, setPreviousBoxId] = useState(value?.previousBoxId || '');
  const [releaseAt, setReleaseAt] = useState(
    value?.releaseAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  );
  const chosen = POLICIES.find(p => p.id === selected) || POLICIES[0];
  const Icon = chosen.icon;

  const apply = () => {
    onChange({
      templateId: selected,
      price,
      maxClaims,
      maxOpens,
      accessWindowSeconds,
      maxCalls,
      previousBoxId,
      releaseAt: selected === 'paywall-time-capsule' ? new Date(releaseAt).toISOString() : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-cyan-400/30 bg-[#050414] p-4 text-cyan-50 shadow-[0_0_60px_rgba(0,242,255,0.2)] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300"><Coins size={13} /> Agent payment lock</div>
            <h2 className="text-xl font-black">Turn this Box into a vending machine</h2>
            <p className="mt-1 text-xs text-cyan-200/60">An agent receives HTTP 402, pays USDC, and gets your payload. No checkout page.</p>
          </div>
          <button type="button" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-200"><X size={18} /></button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {POLICIES.map(policy => {
            const PIcon = policy.icon;
            const active = selected === policy.id;
            return (
              <button key={policy.id} type="button" onClick={() => setSelected(policy.id)} className={`min-h-11 rounded-xl border p-3 text-left transition ${active ? 'border-amber-300/70 bg-amber-300/10' : 'border-white/10 bg-white/[0.03] hover:border-cyan-300/40'}`}>
                <div className="flex items-start gap-2"><PIcon size={17} className={active ? 'text-amber-300' : 'text-cyan-300'} /><span className="text-xs font-black">{policy.name}</span>{active && <Check size={14} className="ml-auto text-emerald-300" />}</div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-cyan-100/70">{policy.what}</p>
                <p className="mt-1 text-[10px] text-cyan-300/50">Best for: {policy.use}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-300/70">Price in USDC
            <input value={price} onChange={e => setPrice(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-cyan-400/30 bg-black/40 px-3 font-mono text-sm text-cyan-50" placeholder="$0.01" />
          </label>
          {selected === 'first-payers-vault' && <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-300/70">First payer limit
            <input type="number" min="1" value={maxClaims} onChange={e => setMaxClaims(Number(e.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-cyan-400/30 bg-black/40 px-3 text-sm" />
          </label>}
          {selected === 'paywall-time-capsule' && (
            <>
              <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-300/70">Release date &amp; time
                <input type="datetime-local" value={releaseAt} onChange={e => setReleaseAt(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-cyan-400/30 bg-black/40 px-3 text-sm" />
              </label>
              <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-300/70">Maximum opens
                <input type="number" min="1" value={maxOpens} onChange={e => setMaxOpens(Number(e.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-cyan-400/30 bg-black/40 px-3 text-sm" />
              </label>
            </>
          )}
          {selected === 'paid-api-key-box' && <>
            <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-300/70">Access window (seconds)
              <input type="number" min="1" value={accessWindowSeconds} onChange={e => setAccessWindowSeconds(Number(e.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-cyan-400/30 bg-black/40 px-3 text-sm" />
            </label>
            <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-300/70">Maximum API calls
              <input type="number" min="1" value={maxCalls} onChange={e => setMaxCalls(Number(e.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-cyan-400/30 bg-black/40 px-3 text-sm" />
            </label>
          </>}
          {selected === 'chain-of-commerce' && <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-300/70 sm:col-span-2">Previous Box ID
            <input value={previousBoxId} onChange={e => setPreviousBoxId(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-cyan-400/30 bg-black/40 px-3 font-mono text-sm" placeholder="bbx_..." />
          </label>}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {value && <button type="button" onClick={() => { onChange(undefined); onClose(); }} className="min-h-11 rounded-xl border border-rose-400/30 px-4 text-xs font-black uppercase tracking-wider text-rose-200">Remove payment lock</button>}
          <button type="button" onClick={apply} className="min-h-11 rounded-xl border border-amber-300/60 bg-amber-300/15 px-5 text-xs font-black uppercase tracking-wider text-amber-100">Apply {chosen.name}</button>
        </div>
      </div>
    </div>
  );
};
