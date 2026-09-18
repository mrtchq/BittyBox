import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Lock,
  Minimize2,
  ShieldCheck,
  Radio,
  Users,
  Sparkles,
  KeyRound,
  Ticket,
  Copy,
  Check,
  Timer,
  UserPlus,
  LogOut
} from 'lucide-react';
import type { BittyPeer, BittyChatMessage } from '../bitty-live';

export type InviteRole = 'host' | 'guest' | null;

interface BittyLiveChatProps {
  isLive: boolean;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  messages: BittyChatMessage[];
  onSendMessage: (text: string) => void;
  peerCount: number;
  peers: BittyPeer[];
  onSwitchToPrivate?: () => void;
  unreadCount: number;
  boxId?: string | null;
  // Ephemeral invite-code rendezvous (replaces URL sharing)
  inviteCode?: string | null;
  inviteRole?: InviteRole;
  inviteExpiresAt?: number | null;
  inviteError?: string | null;
  isJoiningInvite?: boolean;
  onCreateInvite?: () => void;
  onJoinWithCode?: (code: string) => void;
}

// Consistent peer color generator based on peerId
function getPeerColor(peerId: string): { bg: string; text: string; border: string } {
  const colors = [
    { bg: 'bg-cyan-950/60', text: 'text-cyan-300', border: 'border-cyan-800/40' },
    { bg: 'bg-violet-950/60', text: 'text-violet-300', border: 'border-violet-800/40' },
    { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-800/40' },
    { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-800/40' },
    { bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-800/40' },
    { bg: 'bg-indigo-950/60', text: 'text-indigo-300', border: 'border-indigo-800/40' },
    { bg: 'bg-teal-950/60', text: 'text-teal-300', border: 'border-teal-800/40' },
  ];
  let hash = 0;
  for (let i = 0; i < peerId.length; i++) {
    hash = (hash << 5) - hash + peerId.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % colors.length;
  return colors[idx];
}

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${s}s`;
}

export function BittyLiveChat({
  isLive,
  isOpen,
  onClose,
  onToggle,
  messages,
  onSendMessage,
  peerCount,
  peers,
  onSwitchToPrivate,
  unreadCount,
  boxId,
  inviteCode = null,
  inviteRole = null,
  inviteExpiresAt = null,
  inviteError = null,
  isJoiningInvite = false,
  onCreateInvite,
  onJoinWithCode
}: BittyLiveChatProps) {
  const [inputText, setInputText] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isInviteSession = isLive && Boolean(inviteCode);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Tick the invite countdown while a code is active
  useEffect(() => {
    if (!isOpen || !inviteExpiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [isOpen, inviteExpiresAt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim() || isJoiningInvite) return;
    onJoinWithCode?.(codeInput);
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — code stays visible for manual copy
    }
  };

  const inviteRemainingMs = inviteExpiresAt ? inviteExpiresAt - now : null;
  const inviteExpired = inviteRemainingMs !== null && inviteRemainingMs <= 0;

  return (
    <>
      {/* Floating Chat Trigger Launcher Button — always visible so the
          chatbox itself is the only thing anyone needs to join */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 border border-emerald-500/40 hover:border-emerald-400 shadow-xl shadow-emerald-950/50 backdrop-blur-md transition-all cursor-pointer group"
          title={isLive ? 'Open Box Live Chat (P2P Ephemeral)' : 'Join or start a live chat with an invite code'}
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-slate-950 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium tracking-wide hidden sm:inline text-slate-200">
            {isLive ? 'Box Chat' : 'Live Chat'}
          </span>
          {isLive && peerCount > 0 && (
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.2 rounded-full border border-emerald-800/50">
              {peerCount + 1}
            </span>
          )}
          {!isLive && (
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-1.5 py-0.2 rounded-full border border-cyan-800/50">
              Join
            </span>
          )}
        </button>
      )}

      {/* Chat Window Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-96 h-[480px] max-h-[82vh] flex flex-col rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white tracking-wide">
                    {!isLive ? 'Join Live Chat' : isInviteSession ? 'Invite Chat' : 'Box Live Chat'}
                  </span>
                  {isLive && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  {!isLive ? (
                    <span>Connect with an invite code</span>
                  ) : isInviteSession && inviteCode ? (
                    <span className="font-mono text-cyan-400/80">Code {inviteCode}</span>
                  ) : (
                    <>
                      <span>{peerCount + 1} active in Box</span>
                      {boxId && (
                        <span className="font-mono text-cyan-400/80">• {boxId.slice(0, 10)}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isLive && onSwitchToPrivate && (
                <button
                  onClick={onSwitchToPrivate}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="Leave session"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* NOT LIVE — invite-code rendezvous panel. No URL to share. */}
          {!isLive && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
              <div className="flex flex-col items-center text-center pt-1 space-y-1.5">
                <div className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div className="font-medium text-slate-200 text-xs">Chat-first live session</div>
                <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed">
                  No link to share. Join with a 6-letter invite code, or create one and read it out to your guest.
                </p>
              </div>

              {inviteError && (
                <div className="p-2 rounded-lg bg-red-950/40 border border-red-900/50 text-[11px] text-red-300 leading-relaxed">
                  {inviteError}
                </div>
              )}

              {onJoinWithCode && (
                <form onSubmit={handleJoinSubmit} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <Ticket className="w-3 h-3 text-cyan-400" />
                    Have a code? Join
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                      placeholder="e.g. K7Q2XD"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono tracking-[0.2em] text-center placeholder:text-slate-600 placeholder:tracking-normal focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={codeInput.trim().length < 6 || isJoiningInvite}
                      className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold transition-all cursor-pointer shrink-0"
                    >
                      {isJoiningInvite ? 'Joining…' : 'Join'}
                    </button>
                  </div>
                </form>
              )}

              {onCreateInvite && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex-1 h-px bg-slate-800/80" />
                    <span>or</span>
                    <span className="flex-1 h-px bg-slate-800/80" />
                  </div>
                  <button
                    onClick={onCreateInvite}
                    disabled={isJoiningInvite}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-900/30 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isJoiningInvite ? 'Starting…' : 'Invite — generate a code'}</span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                    Your code listens for 30 seconds. If nobody joins, it expires and you generate a new one.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* LIVE INVITE SESSION — code banner + countdown */}
          {isInviteSession && inviteCode && (
            <div className="px-3 pt-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {inviteRole === 'host' ? 'Share this code with your guest:' : 'Connected with code:'}
                  </span>
                  {inviteExpiresAt && !inviteExpired && peerCount === 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-300 font-mono">
                      <Timer className="w-3 h-3" />
                      {inviteRemainingMs !== null ? formatCountdown(inviteRemainingMs) : ''}
                    </span>
                  )}
                  {peerCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-medium">
                      <Users className="w-3 h-3" />
                      {peerCount + 1} connected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-center text-xl font-mono font-bold tracking-[0.3em] text-cyan-200 select-all">
                    {inviteCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="px-2 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    title="Copy invite code"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                {inviteExpired && peerCount === 0 ? (
                  <p className="text-[10px] text-red-300 leading-relaxed">
                    Code expired — nobody joined within 30 seconds. Leave and generate a new code.
                  </p>
                ) : peerCount === 0 ? (
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {inviteRole === 'host'
                      ? 'Listening for your guest… the code expires 30s after it was created.'
                      : 'Waiting for the host…'}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {/* Messages Feed (live only) */}
          {isLive && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                  <div className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="font-medium text-slate-300 text-xs">Ephemeral P2P Chat</div>
                  <p className="text-[11px] text-slate-500 max-w-[220px] leading-relaxed">
                    Send a message to peers in this session. Messages exist only in browser memory and are never saved on a server.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-1.5">
                        <span className="text-[10px] text-slate-400 bg-slate-900/80 border border-slate-800/80 px-2.5 py-0.5 rounded-full">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const peerTheme = getPeerColor(msg.senderId);
                  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  if (msg.isSelf) {
                    return (
                      <div key={msg.id} className="flex flex-col items-end space-y-0.5 ml-8">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mr-1">
                          <span className="font-semibold text-emerald-400">You</span>
                          <span>•</span>
                          <span>{timeStr}</span>
                        </div>
                        <div className="p-2.5 rounded-2xl rounded-tr-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-normal shadow-sm shadow-emerald-950/40 break-words max-w-full">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex flex-col items-start space-y-0.5 mr-8">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 ml-1">
                        <span className={`font-semibold px-1.5 py-0.2 rounded border ${peerTheme.bg} ${peerTheme.text} ${peerTheme.border}`}>
                          {msg.senderName || `Peer-${msg.senderId.slice(0, 4)}`}
                        </span>
                        <span>•</span>
                        <span>{timeStr}</span>
                      </div>
                      <div className="p-2.5 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800/80 text-slate-100 font-normal shadow-sm break-words max-w-full">
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input & Footer (live only) */}
          {isLive && (
            <div className="p-2.5 border-t border-slate-800/80 bg-slate-900/40">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isInviteSession ? 'Message your guest…' : 'Message peers in this Box…'}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-all cursor-pointer shrink-0 shadow-md shadow-emerald-950/50"
                  title="Send message (Enter)"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="mt-1.5 px-1 flex items-center justify-between text-[9px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>WebRTC Data Channel</span>
                </span>
                {isInviteSession ? (
                  <button
                    onClick={onSwitchToPrivate}
                    className="flex items-center gap-1 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                    title="Leave this invite session"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Leave session</span>
                  </button>
                ) : (
                  <span>Encrypted & Serverless</span>
                )}
              </div>
            </div>
          )}

          {/* Dismiss (not live) */}
          {!isLive && (
            <div className="p-2.5 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
              <span className="px-1 flex items-center gap-1 text-[9px] text-slate-500">
                <Radio className="w-3 h-3 text-cyan-500" />
                <span>P2P relay: {typeof window !== 'undefined' ? window.location.host : ''}</span>
              </span>
              <button
                onClick={onClose}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Close</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
