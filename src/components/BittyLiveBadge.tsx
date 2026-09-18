import React, { useState } from 'react';
import { 
  Radio, 
  ChevronDown, 
  User, 
  Bot, 
  Cpu, 
  ShieldCheck, 
  Lock, 
  Share2, 
  Copy, 
  Check, 
  Zap, 
  ExternalLink,
  MessageSquare,
  LogOut
} from 'lucide-react';
import type { BittyPeer } from '../bitty-live';

interface BittyLiveBadgeProps {
  peerCount: number;
  peers: BittyPeer[];
  roomId?: string;
  boxId?: string | null;
  onEnableLive?: () => void;
  onSwitchToPrivate?: () => void;
  onToggleChat?: () => void;
  unreadChatCount?: number;
  shareUrl?: string;
}

export function BittyLiveBadge({
  peerCount,
  peers,
  roomId,
  boxId,
  onEnableLive,
  onSwitchToPrivate,
  onToggleChat,
  unreadChatCount = 0,
  shareUrl
}: BittyLiveBadgeProps) {
  const [showDebug, setShowDebug] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLive = Boolean(boxId);
  const displayShareUrl = shareUrl || (boxId ? `${window.location.origin}/#/Live%20Box/box/${boxId}` : window.location.href);

  const getPeerIcon = (type: string) => {
    switch (type) {
      case 'server-agent':
      case 'browser-agent':
      case 'game-agent':
      case 'voice-agent':
        return <Bot className="w-3.5 h-3.5 text-cyan-400" />;
      case 'service':
        return <Cpu className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <User className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(displayShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative inline-block text-xs select-none">
      {/* Trigger Pill */}
      {isLive ? (
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-400 hover:border-emerald-400/60 transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
          title="Bitty Live P2P Active - Click to inspect peers, chat, or leave session"
        >
          <span className="relative flex h-2 w-2">
            {peerCount > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${peerCount > 0 ? 'bg-emerald-500' : 'bg-emerald-400/50'}`}></span>
          </span>
          <span className="font-semibold tracking-wide">
            {peerCount > 0 ? `${peerCount} in this Box` : 'Live (Solo)'}
          </span>
          {unreadChatCount > 0 && (
            <span className="flex h-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-[9px]">
              {unreadChatCount}
            </span>
          )}
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showDebug ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all cursor-pointer"
          title="Private Local Draft - Click to enable live P2P collaboration"
        >
          <Lock className="w-3 h-3 text-slate-400" />
          <span className="font-medium tracking-wide">Private Draft</span>
          <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showDebug ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown Drawer */}
      {showDebug && (
        <div className="absolute right-0 top-full mt-2 w-84 p-3.5 bg-slate-950/95 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl z-50 text-slate-300">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
              {isLive ? <Radio className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isLive ? 'Box P2P Session' : 'Local Draft'}</span>
            </div>
            {isLive && boxId && (
              <span className="text-[10px] text-cyan-400 font-mono font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                {boxId}
              </span>
            )}
          </div>

          {!isLive ? (
            <div className="space-y-3 py-1">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                You are currently editing a private draft. No other users or agents can see your work.
              </p>
              {onEnableLive && (
                <button
                  onClick={() => {
                    onEnableLive();
                    setShowDebug(true);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-900/30 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Enable Live Collaboration</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Share Link Field */}
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Unique Box Live Link:</span>
                  <span className="text-[9px] text-emerald-400 font-mono">Isolated to this Box</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={displayShareUrl}
                    className="w-full bg-slate-950 border border-slate-700/60 rounded px-2 py-1 text-[10px] text-slate-300 font-mono select-all truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-sm shadow-emerald-900/40"
                    title="Copy unique link to invite a peer"
                  >
                    {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Chat Quick Action */}
              {onToggleChat && (
                <button
                  onClick={() => {
                    onToggleChat();
                    setShowDebug(false);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/60 text-slate-200 text-xs font-medium flex items-center justify-between cursor-pointer transition-all hover:bg-slate-800/80"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open Live Box Chat</span>
                  </div>
                  {unreadChatCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">
                      {unreadChatCount} unread
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">P2P</span>
                  )}
                </button>
              )}

              {/* Peers List */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                  <span>Connected Peers ({peerCount})</span>
                  {roomId && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Mesh: {roomId.slice(0, 8)}
                    </span>
                  )}
                </div>

                {peers.length === 0 ? (
                  <div className="p-2 rounded bg-slate-900/40 border border-slate-800/40 text-[11px] text-slate-400 space-y-1">
                    <div className="text-slate-300 font-medium">No other peers connected yet.</div>
                    <div className="text-[10px] text-slate-500 leading-relaxed">
                      Send the link above to a collaborator or agent. Only users with this link can enter this Box.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {peers.map((peer) => (
                      <div key={peer.peerId} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-[11px]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-medium text-slate-200">
                            {getPeerIcon(peer.peerType)}
                            <span>{peer.displayName || `${peer.peerType} (${peer.peerId.slice(0, 6)})`}</span>
                          </div>
                          {peer.latency !== undefined && (
                            <span className="text-[10px] text-slate-500">{peer.latency}ms</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="capitalize">{peer.peerType}</span>
                          <span className="font-mono text-slate-500">{peer.peerId.slice(0, 8)}</span>
                        </div>
                        {peer.capabilities && peer.capabilities.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {peer.capabilities.map((cap) => (
                              <span key={cap} className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px] font-mono">
                                {cap}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leave Session & Switch to Private Draft */}
              {onSwitchToPrivate && (
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      onSwitchToPrivate();
                      setShowDebug(false);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 hover:border-red-700/60 text-red-300 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all"
                    title="Disconnect from peers and return to a private local draft"
                  >
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    <span>Leave Live & Go Private</span>
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>Relay: bittybox.org</span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <ShieldCheck className="w-3 h-3" /> E2EE WebRTC
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
