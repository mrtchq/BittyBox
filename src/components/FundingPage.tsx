import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Coins,
  Zap,
  Bot,
  Shield,
  Lock,
  Check,
  Copy,
  ExternalLink,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Wallet,
  Radio,
  ScrollText,
  BadgeCheck,
  CircleDollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CyberScrambleText } from './CyberScrambleText';
import { MonetizeBoxPanel } from './MonetizeBoxPanel';

interface FundingPageProps {
  onOpenEditor?: () => void;
  onOpenAgents?: () => void;
}

type TabType = 'explainer' | 'monetize' | 'policies' | 'status';

type X402Status = {
  enabled: boolean;
  protocolVersion?: number;
  network?: string;
  scheme?: string;
  asset?: string;
  facilitatorOrigin?: string;
  receiver?: string | null;
};

type PolicyTemplate = {
  id: string;
  title: string;
  description: string;
  useCase: string;
  paymentScheme: string;
  availability: string;
};

const API_BASE = import.meta.env?.VITE_API_BASE || '';

const NETWORK_LABELS: Record<string, string> = {
  'eip155:8453': 'Base Mainnet',
  'eip155:84532': 'Base Sepolia (testnet)',
};

function networkLabel(network?: string) {
  if (!network) return '—';
  return NETWORK_LABELS[network] || network;
}

function isTestnet(network?: string) {
  return network === 'eip155:84532';
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-500/20"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function Row({ k, v, mono = false }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2.5 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-cyan-300/60">{k}</span>
      <span className={`text-right text-[13px] text-cyan-50 ${mono ? 'font-mono text-[12px]' : 'font-medium'}`}>
        {v}
      </span>
    </div>
  );
}

export function FundingPage({ onOpenEditor, onOpenAgents }: FundingPageProps) {
  const [tab, setTab] = useState<TabType>('explainer');
  const [status, setStatus] = useState<X402Status | null>(null);
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t] = await Promise.all([
        apiGet<{ success: boolean; x402: X402Status }>('/api/x402/status'),
        apiGet<{ success: boolean; templates: PolicyTemplate[] }>('/api/policy/templates'),
      ]);
      setStatus(s.x402 || null);
      setTemplates(t.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load x402 status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = useMemo(
    () => templates.filter(t => t.availability === 'active').length,
    [templates],
  );

  const testnet = isTestnet(status?.network);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'explainer', label: 'What is x402', icon: <Zap size={14} /> },
    { id: 'monetize', label: 'Monetize a Box', icon: <Coins size={14} /> },
    { id: 'policies', label: 'Payment Policies', icon: <ScrollText size={14} /> },
    { id: 'status', label: 'Live Rail', icon: <Radio size={14} /> },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          </span>
          Top Secret
        </div>

        <h1 className="mb-3 text-3xl font-black tracking-tight text-cyan-50 sm:text-4xl">
          <CyberScrambleText text="FUNDING" className="text-cyan-50" />
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-cyan-200/70">
          Bitty Box is becoming an <strong className="text-cyan-100">agent-native vending machine</strong>.
          Machines will pay machines — in stablecoins, over plain HTTP, with no checkout page,
          no account, and no middleman.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition ${
              tab === t.id
                ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                : 'border-white/10 bg-white/5 text-cyan-300/60 hover:border-cyan-400/30 hover:text-cyan-200'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* ---------------- EXPLAINER ---------------- */}
          {tab === 'explainer' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/5 p-6">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-cyan-50">
                  <Coins size={18} className="text-amber-300" />
                  The 402 status code, finally used
                </h2>
                <p className="text-sm leading-relaxed text-cyan-100/80">
                  HTTP reserved <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-cyan-200">402 Payment Required</code> in
                  the 1990s — then left it empty for thirty years because there was no native way to
                  move money on the web. Stablecoins fixed that. x402 turns any URL into a
                  paywall that <em>any</em> client — human or AI agent — can satisfy automatically.
                </p>
              </div>

              {/* The loop */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-cyan-200">
                  How an agent buys from a Bitty Box
                </h3>
                <ol className="space-y-3">
                  {[
                    { n: 1, t: 'Agent requests the paid resource', d: 'GET /api/boxes/:id/x402/payload' },
                    { n: 2, t: 'Server answers 402 + payment requirements', d: 'machine-readable price, network, asset, receiver' },
                    { n: 3, t: 'Agent signs a USDC payment', d: 'EIP-3009 transfer — the agent pays no gas' },
                    { n: 4, t: 'Agent retries with PAYMENT-SIGNATURE', d: 'same URL, one extra header' },
                    { n: 5, t: 'Facilitator verifies + settles, payload unlocks', d: 'HTTP 200' },
                  ].map(step => (
                    <li key={step.n} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-[11px] font-black text-cyan-200">
                        {step.n}
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-cyan-50">{step.t}</div>
                        <div className="font-mono text-[11px] text-cyan-300/60">{step.d}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Why it matters */}
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: <Bot size={18} />, t: 'Built for agents', d: 'No checkout page means an AI can transact at machine speed without a browser, session, or account.' },
                  { icon: <Shield size={18} />, t: 'You keep custody', d: 'Payments settle directly to your wallet. There is no custodial balance and no platform holding your funds.' },
                  { icon: <Zap size={18} />, t: 'Pennies, not subscriptions', d: 'Price a single unlock at $0.01. Micropayments finally cost less than they are worth collecting.' },
                ].map(c => (
                  <div key={c.t} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="mb-2 text-cyan-300">{c.icon}</div>
                    <div className="mb-1 text-[13px] font-bold text-cyan-50">{c.t}</div>
                    <p className="text-[12px] leading-relaxed text-cyan-200/60">{c.d}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-5">
                <div className="mb-2 flex items-center gap-2 text-[13px] font-bold text-amber-200">
                  <AlertTriangle size={16} />
                  Where this is today
                </div>
                <p className="text-[12px] leading-relaxed text-amber-100/70">
                  The payment rail is live and testable. Staging runs on <strong>Base Sepolia testnet</strong> with
                  free test USDC so it can be exercised without spending real money. Production is
                  configured for <strong>Base mainnet</strong>. Wallet connection and in-browser
                  payment signing are the next milestone — today, an agent (or <code className="font-mono">curl</code>) is the buyer.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onOpenAgents}
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-cyan-100 transition hover:bg-cyan-500/25"
                  >
                    <Bot size={14} /> See the agent protocol
                  </button>
                  <button
                    type="button"
                    onClick={onOpenEditor}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-cyan-200 transition hover:bg-white/10"
                  >
                    <Lock size={14} /> Back to editor
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- POLICIES ---------------- */}
          {tab === 'monetize' && (
            <MonetizeBoxPanel embedded />
          )}

          {tab === 'policies' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] text-cyan-200/70">
                  {templates.length} payment policies registered · <strong className="text-cyan-100">{activeCount} live</strong>
                </p>
                <button
                  type="button"
                  onClick={load}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-200 transition hover:bg-white/10"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-cyan-300/60">
                  <Loader2 size={16} className="animate-spin" /> Loading policies…
                </div>
              )}

              {!loading && templates.map(t => {
                const live = t.availability === 'active';
                return (
                  <div
                    key={t.id}
                    className={`rounded-xl border p-5 ${
                      live ? 'border-cyan-500/20 bg-white/[0.03]' : 'border-white/5 bg-black/20 opacity-70'
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-bold text-cyan-50">{t.title}</h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          live
                            ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                            : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                        }`}
                      >
                        {live ? 'Live' : 'Registered'}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan-300/70">
                        {t.paymentScheme}
                      </span>
                    </div>
                    <p className="mb-1.5 text-[13px] leading-relaxed text-cyan-100/75">{t.description}</p>
                    <p className="text-[12px] text-cyan-300/60">
                      <span className="uppercase tracking-wider">Use case:</span> {t.useCase}
                    </p>
                    <div className="mt-3">
                      <CopyButton value={t.id} label="Copy template id" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------------- STATUS ---------------- */}
          {tab === 'status' && (
            <div className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-cyan-300/60">
                  <Loader2 size={16} className="animate-spin" /> Reading payment rail…
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
                  <div className="mb-1 flex items-center gap-2 text-[13px] font-bold text-rose-200">
                    <AlertTriangle size={16} /> Could not read x402 status
                  </div>
                  <p className="font-mono text-[11px] text-rose-200/70">{error}</p>
                </div>
              )}

              {!loading && !error && status && (
                <>
                  <div
                    className={`rounded-xl border p-5 ${
                      status.enabled
                        ? testnet
                          ? 'border-amber-400/30 bg-amber-400/[0.07]'
                          : 'border-emerald-400/30 bg-emerald-400/[0.07]'
                        : 'border-white/10 bg-black/30'
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      {status.enabled ? (
                        testnet ? (
                          <BadgeCheck size={18} className="text-amber-300" />
                        ) : (
                          <BadgeCheck size={18} className="text-emerald-300" />
                        )
                      ) : (
                        <Lock size={18} className="text-cyan-300/50" />
                      )}
                      <span className="text-[15px] font-bold text-cyan-50">
                        {status.enabled ? (testnet ? 'Rail live — testnet' : 'Rail live — mainnet') : 'Rail offline'}
                      </span>
                    </div>

                    {testnet && (
                      <p className="mb-3 text-[12px] leading-relaxed text-amber-100/70">
                        This environment settles on <strong>Base Sepolia</strong> using test USDC. No real
                        funds move here.
                      </p>
                    )}

                    <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-2">
                      <Row k="Protocol" v={`x402 v${status.protocolVersion ?? '—'}`} />
                      <Row k="Network" v={networkLabel(status.network)} />
                      <Row k="Scheme" v={status.scheme || '—'} mono />
                      <Row k="Asset" v={status.asset || '—'} />
                      <Row k="Facilitator" v={status.facilitatorOrigin || '—'} mono />
                      <Row
                        k="Receiver"
                        v={
                          status.receiver ? (
                            <span className="flex items-center justify-end gap-2">
                              <span className="font-mono text-[11px]">
                                {status.receiver.slice(0, 6)}…{status.receiver.slice(-4)}
                              </span>
                              <CopyButton value={status.receiver} label="" />
                            </span>
                          ) : (
                            '—'
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/30 p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-cyan-200">
                      <Wallet size={16} /> Try it from a terminal
                    </h3>
                    <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-[11px] leading-relaxed text-cyan-200/80">
{`# 1. Read the payment rail
curl -s ${API_BASE || ''}/api/x402/status

# 2. Ask for a paid box (expect 402)
curl -i ${API_BASE || ''}/api/boxes/<BOX_ID>/x402/payload

# 3. Pay and unlock with the agent-buyer demo
node agent-buyer.mjs --dry-run`}
                    </pre>
                    <div className="mt-3">
                      <CopyButton value={`curl -i ${API_BASE || ''}/api/boxes/<BOX_ID>/x402/payload`} label="Copy probe" />
                    </div>
                  </div>

                  <a
                    href="https://faucet.circle.com/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-3">
                      <CircleDollarSign size={18} className="text-cyan-300" />
                      <span>
                        <span className="block text-[13px] font-bold text-cyan-50">Get free test USDC</span>
                        <span className="block text-[12px] text-cyan-200/60">Circle faucet · select Base Sepolia</span>
                      </span>
                    </span>
                    <ExternalLink size={16} className="text-cyan-300/60" />
                  </a>
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {loading && tab !== 'explainer' && (
        <div className="sr-only">Loading</div>
      )}
    </div>
  );
}

export default FundingPage;
