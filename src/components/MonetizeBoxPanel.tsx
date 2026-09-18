import React, { useCallback, useEffect, useState } from 'react';
import {
  Coins,
  Check,
  Loader2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Sparkles,
  X,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authJsonHeadersAsync, authHeadersAsync, isSignedIn } from '../utils/authHeaders';

interface MonetizeBoxPanelProps {
  /** Pre-select a box (e.g. launched from a specific box's row). */
  boxId?: string | null;
  onClose?: () => void;
  embedded?: boolean;
}

type Template = {
  id: string;
  title: string;
  description: string;
  useCase: string;
  paymentScheme: string;
  availability: string;
};

type MyBox = {
  id: string;
  title: string;
  published: boolean;
  policy: { templateId: string; title: string; payment?: any } | null;
  createdAt: string;
};

type Step = 'pick-box' | 'pick-template' | 'set-price' | 'done';

const PRICE_PRESETS = ['$0.01', '$0.05', '$0.25', '$1.00'];

export function MonetizeBoxPanel({ boxId: preselectedBoxId, onClose, embedded }: MonetizeBoxPanelProps) {
  const [step, setStep] = useState<Step>(preselectedBoxId ? 'pick-template' : 'pick-box');
  const [boxes, setBoxes] = useState<MyBox[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedBox, setSelectedBox] = useState<string | null>(preselectedBoxId || null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [price, setPrice] = useState('$0.01');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ endpoint?: string; price?: string } | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSignedIn(isSignedIn());
      const tRes = await fetch('/api/policy/templates', { headers: { Accept: 'application/json' } });
      const tData = await tRes.json();
      setTemplates(tData.templates || []);

      const h = await authHeadersAsync();
      if (h) {
        const bRes = await fetch('/api/boxes/mine', { headers: { ...h, Accept: 'application/json' } });
        const bData = await bRes.json();
        if (bData.success) setBoxes(bData.boxes || []);
        else setError(bData.error || 'Could not load your boxes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeTemplates = templates.filter(t => t.availability === 'active');
  const chosenBox = boxes.find(b => b.id === selectedBox);
  const chosenTemplate = templates.find(t => t.id === selectedTemplate);

  const applyPolicy = async () => {
    if (!selectedBox || !selectedTemplate) return;
    setSaving(true);
    setError(null);
    try {
      const h = await authJsonHeadersAsync();
      if (!h) {
        setError('Sign in to monetize a box.');
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/boxes/${selectedBox}/policy`, {
        method: 'PUT',
        headers: h,
        body: JSON.stringify({ templateId: selectedTemplate, config: { price } }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Could not apply policy');
        setSaving(false);
        return;
      }
      // Publishing is required for the paid endpoint to serve.
      try {
        await fetch(`/api/boxes/${selectedBox}/publish`, { method: 'POST', headers: h });
      } catch {
        /* best effort */
      }
      setResult({ endpoint: data.x402?.endpoint, price });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSaving(false);
    }
  };

  const removePolicy = async () => {
    if (!selectedBox) return;
    setSaving(true);
    const h = await authJsonHeadersAsync();
    if (!h) {
      setError('Sign in required.');
      setSaving(false);
      return;
    }
    try {
      await fetch(`/api/boxes/${selectedBox}/policy`, { method: 'DELETE', headers: h });
      setStep('pick-template');
      setResult(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setSaving(false);
    }
  };

  const body = (
    <div className={embedded ? '' : 'mx-auto w-full max-w-2xl px-4 pb-24 pt-8'}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">
            <Sparkles size={10} /> Monetize
          </div>
          <h2 className="text-xl font-black tracking-tight text-cyan-50">
            Make a box payable
          </h2>
          <p className="mt-1 text-[12px] text-cyan-200/60">
            Attach an x402 policy. Agents pay in USDC to unlock — no checkout page.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-cyan-300/70 transition hover:bg-white/10"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="mb-5 flex items-center gap-1.5">
        {(['pick-box', 'pick-template', 'set-price'] as Step[]).map((s, i) => {
          const order = ['pick-box', 'pick-template', 'set-price', 'done'];
          const active = order.indexOf(step) >= order.indexOf(s);
          return (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition ${active ? 'bg-amber-400' : 'bg-white/10'}`}
            />
          );
        })}
      </div>

      {!signedIn && (
        <div className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-4">
          <div className="flex items-center gap-2 text-[13px] font-bold text-amber-200">
            <Lock size={15} /> Sign in required
          </div>
          <p className="mt-1 text-[12px] text-amber-100/70">
            Only a box's owner can attach a payment policy. Sign in with Google from the account panel, then reload.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-cyan-300/60">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <div className="flex items-center gap-2 text-[13px] font-bold text-rose-200">
            <AlertTriangle size={15} /> {error}
          </div>
        </div>
      )}

      {/* ---------- STEP: PICK BOX ---------- */}
      {!loading && step === 'pick-box' && (
        <div className="space-y-2.5">
          {boxes.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/30 p-6 text-center">
              <Coins size={26} className="mx-auto mb-2 text-cyan-500/40" />
              <div className="text-[13px] font-bold text-cyan-100">No boxes yet</div>
              <p className="mt-1 text-[12px] text-cyan-200/60">
                Create a box while signed in, then come back to monetize it.
              </p>
            </div>
          ) : (
            boxes.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setSelectedBox(b.id);
                  setStep('pick-template');
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-amber-400/40 hover:bg-white/[0.06]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-cyan-50">
                    {b.title || 'Untitled box'}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-cyan-300/50">{b.id.slice(0, 14)}…</span>
                    {b.policy && (
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                        {b.policy.payment?.price || 'paid'}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-cyan-300/50" />
              </button>
            ))
          )}
        </div>
      )}

      {/* ---------- STEP: PICK TEMPLATE ---------- */}
      {!loading && step === 'pick-template' && (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setStep('pick-box')}
            className="mb-1 text-[11px] font-bold uppercase tracking-wider text-cyan-300/60 hover:text-cyan-200"
          >
            ← Change box
          </button>
          {activeTemplates.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSelectedTemplate(t.id);
                setStep('set-price');
              }}
              className={`w-full rounded-xl border p-4 text-left transition ${
                selectedTemplate === t.id
                  ? 'border-amber-400/60 bg-amber-400/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-amber-400/40 hover:bg-white/[0.06]'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[13px] font-bold text-cyan-50">{t.title}</span>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                  Live
                </span>
              </div>
              <p className="text-[12px] leading-relaxed text-cyan-100/70">{t.description}</p>
              <p className="mt-1 text-[11px] text-cyan-300/50">Use case: {t.useCase}</p>
            </button>
          ))}
        </div>
      )}

      {/* ---------- STEP: SET PRICE ---------- */}
      {!loading && step === 'set-price' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setStep('pick-template')}
            className="text-[11px] font-bold uppercase tracking-wider text-cyan-300/60 hover:text-cyan-200"
          >
            ← Change template
          </button>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-cyan-300/60">Template</div>
            <div className="text-[14px] font-bold text-cyan-50">{chosenTemplate?.title}</div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-wider text-cyan-300/60">
              Price per unlock (USDC)
            </label>
            <div className="mb-2.5 flex flex-wrap gap-2">
              {PRICE_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrice(p)}
                  className={`rounded-lg border px-3 py-1.5 text-[12px] font-bold transition ${
                    price === p
                      ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                      : 'border-white/10 bg-white/5 text-cyan-200/70 hover:border-amber-400/30'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full rounded-lg border border-cyan-500/30 bg-black/40 px-3 py-2.5 font-mono text-[14px] text-cyan-50 outline-none transition focus:border-amber-400"
              placeholder="$0.01"
            />
            <p className="mt-1.5 text-[11px] text-cyan-300/50">
              Micropayments start at $0.01. You keep 100% — funds settle to your wallet.
            </p>
          </div>

          <button
            type="button"
            onClick={applyPolicy}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-amber-400/20 px-4 py-3 text-[13px] font-black uppercase tracking-wider text-amber-100 transition hover:bg-amber-400/30 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Coins size={16} />}
            {saving ? 'Applying…' : 'Monetize this box'}
          </button>
        </div>
      )}

      {/* ---------- STEP: DONE ---------- */}
      {!loading && step === 'done' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.07] p-5 text-center">
            <Check size={28} className="mx-auto mb-2 text-emerald-300" />
            <div className="text-[15px] font-black text-emerald-100">Your box is payable</div>
            <p className="mt-1 text-[12px] text-emerald-100/70">
              {chosenTemplate?.title} · {result?.price || price} USDC per unlock
            </p>
          </div>

          {result?.endpoint && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                <Radio size={13} /> Paid endpoint
              </div>
              <code className="block break-all font-mono text-[11px] text-cyan-300/80">
                {result.endpoint}
              </code>
              <p className="mt-2 text-[11px] text-cyan-300/50">
                Unpaid requests now return HTTP 402 with payment requirements.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setStep('pick-box');
                setResult(null);
                load();
              }}
              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-[12px] font-bold uppercase tracking-wider text-cyan-200 transition hover:bg-white/10"
            >
              Monetize another
            </button>
            <button
              type="button"
              onClick={removePolicy}
              disabled={saving}
              className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-[12px] font-bold uppercase tracking-wider text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      {body}
    </motion.div>
  );
}

export default MonetizeBoxPanel;
