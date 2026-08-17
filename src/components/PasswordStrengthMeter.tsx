import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles, 
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface PasswordStrengthMeterProps {
  password?: string;
  onChangePassword: (newPassword: string) => void;
}

export interface PasswordAnalysis {
  score: number; // 0 to 100
  label: string;
  color: string;
  barColor: string;
  textColor: string;
  borderColor: string;
  entropyBits: number;
  crackTimeText: string;
  hasMinLength: boolean;
  hasGoodLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export const analyzePassword = (pwd: string): PasswordAnalysis => {
  if (!pwd) {
    return {
      score: 0,
      label: 'NO CIPHER SET (PUBLIC URL)',
      color: 'gray',
      barColor: 'bg-zinc-600',
      textColor: 'text-zinc-400',
      borderColor: 'border-zinc-700',
      entropyBits: 0,
      crackTimeText: 'Instant',
      hasMinLength: false,
      hasGoodLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSymbol: false,
    };
  }

  const length = pwd.length;
  const hasMinLength = length >= 8;
  const hasGoodLength = length >= 12;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

  // Pool size calculation for Shannon entropy
  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSymbol) poolSize += 32;

  const entropyBits = Math.round(length * Math.log2(Math.max(2, poolSize)));

  // Score calculation (0 to 100)
  let score = 0;
  if (length >= 6) score += 15;
  if (length >= 8) score += 15;
  if (length >= 12) score += 20;
  if (length >= 16) score += 10;
  if (hasUpper) score += 10;
  if (hasLower) score += 10;
  if (hasNumber) score += 10;
  if (hasSymbol) score += 10;

  // Bonus for high diversity
  const varietyCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  if (varietyCount >= 3 && length >= 10) score = Math.min(100, score + 10);
  if (varietyCount === 4 && length >= 14) score = 100;

  score = Math.min(100, Math.max(5, score));

  // Determine classification and crack time estimation
  if (score < 30) {
    return {
      score,
      label: 'VERY WEAK // VULNERABLE',
      color: 'rose',
      barColor: 'bg-rose-500',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/50',
      entropyBits,
      crackTimeText: '< 1 second',
      hasMinLength,
      hasGoodLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSymbol,
    };
  } else if (score < 55) {
    return {
      score,
      label: 'WEAK // BASIC PHRASE',
      color: 'orange',
      barColor: 'bg-orange-500',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/50',
      entropyBits,
      crackTimeText: '~30 seconds to 5 minutes',
      hasMinLength,
      hasGoodLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSymbol,
    };
  } else if (score < 75) {
    return {
      score,
      label: 'MODERATE // ACCEPTABLE',
      color: 'amber',
      barColor: 'bg-amber-400',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-500/50',
      entropyBits,
      crackTimeText: '~3 to 18 months',
      hasMinLength,
      hasGoodLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSymbol,
    };
  } else if (score < 90) {
    return {
      score,
      label: 'STRONG // SECURE ARMOR',
      color: 'teal',
      barColor: 'bg-teal-400',
      textColor: 'text-teal-300',
      borderColor: 'border-teal-500/50',
      entropyBits,
      crackTimeText: '~4,000+ years',
      hasMinLength,
      hasGoodLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSymbol,
    };
  } else {
    return {
      score: 100,
      label: 'QUANTUM VAULT // MILITARY GRADE',
      color: 'cyan',
      barColor: 'bg-gradient-to-r from-teal-400 via-cyan-400 to-fuchsia-400',
      textColor: 'text-cyan-300',
      borderColor: 'border-cyan-400',
      entropyBits,
      crackTimeText: '100+ Trillion Years',
      hasMinLength,
      hasGoodLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSymbol,
    };
  }
};

export const generateStrongKey = (): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*-_=+';
  const length = 16;
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password = '',
  onChangePassword,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const analysis = useMemo(() => analyzePassword(password), [password]);

  const handleGenerateKey = () => {
    const key = generateStrongKey();
    onChangePassword(key);
  };

  const handleCopyKey = async () => {
    if (!password) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(password);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
    } catch {}
  };

  return (
    <div className="w-full mt-3 p-3.5 rounded-xl bg-black/50 border border-fuchsia-500/25 space-y-3">
      {/* Header & Passcode Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-[11px] font-mono text-fuchsia-300 flex items-center gap-1.5 uppercase font-bold">
          <Lock className="w-3.5 h-3.5 text-fuchsia-400" />
          AES-256 CLIENT CIPHER KEY
        </label>

        {/* Action button bar: Generate key & Show/hide */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleGenerateKey}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-200 hover:text-white hover:bg-fuchsia-900/80 text-[10px] font-cyber transition shadow-sm"
            title="Generate 16-character cryptographic high-entropy passkey"
          >
            <Sparkles className="w-3 h-3 text-fuchsia-400" />
            <span>GENERATE STRONG KEY</span>
          </button>

          {password && (
            <button
              type="button"
              onClick={handleCopyKey}
              className="flex items-center gap-1 px-2 py-1 rounded bg-black/60 border border-cyan-500/30 text-cyan-300 hover:text-white text-[10px] font-mono transition"
              title="Copy passcode"
            >
              {copiedKey ? <Check className="w-3 h-3 text-teal-300" /> : <Copy className="w-3 h-3" />}
              <span className="hidden sm:inline">{copiedKey ? 'COPIED' : 'COPY'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Password Input field with Show/Hide toggle */}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => onChangePassword(e.target.value)}
          placeholder="Enter secret passcode to lock payload with AES-GCM-256 (or leave empty for public)..."
          className="w-full bg-[#080214] border border-fuchsia-500/40 rounded-lg pl-3 pr-10 py-2 text-xs text-fuchsia-100 placeholder:text-purple-400/40 focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400 font-mono tracking-wider"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-fuchsia-300 transition p-1"
          title={showPassword ? 'Hide passcode' : 'Reveal passcode'}
        >
          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Real-time Strength Meter Bar & Telemetry */}
      {password ? (
        <div className="space-y-2 pt-1">
          {/* Status Label & Score */}
          <div className="flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 font-bold">
              <span className={analysis.textColor}>{analysis.label}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-purple-300/70">ENTROPY: <strong className="text-cyan-300">{analysis.entropyBits} bits</strong></span>
              <span className="px-1.5 py-0.5 rounded bg-black/60 border border-fuchsia-500/30 text-fuchsia-200 font-bold">
                {analysis.score}%
              </span>
            </div>
          </div>

          {/* Animated Gradient Progress Bar */}
          <div className="w-full h-2 bg-black/80 rounded-full overflow-hidden border border-fuchsia-500/30 p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${analysis.barColor}`}
              style={{ width: `${analysis.score}%` }}
            />
          </div>

          {/* Security Criteria Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono">
            <div className={`flex items-center gap-1 px-2 py-1 rounded border ${
              analysis.hasMinLength ? 'bg-teal-950/60 border-teal-500/40 text-teal-300' : 'bg-black/40 border-zinc-700/60 text-zinc-400'
            }`}>
              {analysis.hasMinLength ? <CheckCircle2 className="w-3 h-3 text-teal-400" /> : <XCircle className="w-3 h-3 text-zinc-500" />}
              <span>8+ Chars ({password.length})</span>
            </div>

            <div className={`flex items-center gap-1 px-2 py-1 rounded border ${
              analysis.hasUpper && analysis.hasLower ? 'bg-teal-950/60 border-teal-500/40 text-teal-300' : 'bg-black/40 border-zinc-700/60 text-zinc-400'
            }`}>
              {analysis.hasUpper && analysis.hasLower ? <CheckCircle2 className="w-3 h-3 text-teal-400" /> : <XCircle className="w-3 h-3 text-zinc-500" />}
              <span>Mixed Case (aA)</span>
            </div>

            <div className={`flex items-center gap-1 px-2 py-1 rounded border ${
              analysis.hasNumber ? 'bg-teal-950/60 border-teal-500/40 text-teal-300' : 'bg-black/40 border-zinc-700/60 text-zinc-400'
            }`}>
              {analysis.hasNumber ? <CheckCircle2 className="w-3 h-3 text-teal-400" /> : <XCircle className="w-3 h-3 text-zinc-500" />}
              <span>Numbers (0-9)</span>
            </div>

            <div className={`flex items-center gap-1 px-2 py-1 rounded border ${
              analysis.hasSymbol ? 'bg-teal-950/60 border-teal-500/40 text-teal-300' : 'bg-black/40 border-zinc-700/60 text-zinc-400'
            }`}>
              {analysis.hasSymbol ? <CheckCircle2 className="w-3 h-3 text-teal-400" /> : <XCircle className="w-3 h-3 text-zinc-500" />}
              <span>Symbols (!@#$)</span>
            </div>
          </div>

          {/* Crack Resistance Telemetry Box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] font-mono text-purple-300/80 bg-purple-950/30 p-2 rounded border border-purple-500/20 gap-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
              <span>ESTIMATED BRUTE-FORCE RESISTANCE: <strong className="text-white">{analysis.crackTimeText}</strong></span>
            </div>
            <span className="text-[9px] text-fuchsia-300/60 font-sans">AES-256-GCM + PBKDF2 (100k rounds)</span>
          </div>
        </div>
      ) : (
        <p className="text-[10px] font-mono text-purple-300/60 flex items-center gap-1.5">
          <Info className="w-3 h-3 text-purple-400 flex-shrink-0" />
          <span>If unlocked, the Bitty Box is compressed with Quantum GZIP and publicly accessible to anyone with the link.</span>
        </p>
      )}
    </div>
  );
};
