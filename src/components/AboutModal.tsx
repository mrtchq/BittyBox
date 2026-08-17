import React from 'react';
import { Box, Zap, Shield, Globe, Cpu, Lock, Link as LinkIcon, FileCode, CheckCircle2, Compass } from 'lucide-react';

interface AboutModalProps {
  onClose?: () => void;
  onOpenEditor?: () => void;
  onStartTour?: () => void;
  onReplaySplash?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onOpenEditor, onStartTour, onReplaySplash }) => {
  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-200">
      <div className="bento-card p-6 sm:p-10 relative">
        <div className="bento-corner-accent top-l" />
        <div className="bento-corner-accent top-r" />
        <div className="bento-corner-accent bot-l" />
        <div className="bento-corner-accent bot-r" />

        {/* Header Badge */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-mono mb-4">
            <Zap className="w-3.5 h-3.5 text-cyan-300" />
            ZERO SERVER PERSISTENCE &bull; 100% URL PACKED
          </div>
          <h2 className="font-cyber text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-fuchsia-400">
            HOW BITTY BOX OPERATES
          </h2>
          <p className="text-sm text-purple-200/80 mt-3 leading-relaxed">
            Bitty Box transforms entire HTML webpages, rich multimedia, recipes, games, and encrypted documents into compact, self-inflating URL fragments.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-5 rounded-xl bg-purple-950/40 border border-purple-500/20 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-400/40 flex items-center justify-center mb-4 text-cyan-300">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-cyber text-sm font-bold text-cyan-200 mb-2">1. GZIP COMPRESSION</h3>
            <p className="text-xs text-purple-200/70 leading-relaxed font-mono">
              Raw HTML and assets are passed through high-ratio Deflate/Gzip compression algorithms, collapsing code size by up to 80-90%.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-purple-950/40 border border-purple-500/20 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-950 border border-fuchsia-400/40 flex items-center justify-center mb-4 text-fuchsia-300">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-cyber text-sm font-bold text-fuchsia-200 mb-2">2. AES-256 CIPHER</h3>
            <p className="text-xs text-purple-200/70 leading-relaxed font-mono">
              Optional cryptographic encryption using client-side Web Crypto AES-GCM ensures only holders of the passcode can inflate the data.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-purple-950/40 border border-purple-500/20 flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-teal-950 border border-teal-400/40 flex items-center justify-center mb-4 text-teal-300">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-cyber text-sm font-bold text-teal-200 mb-2">3. ZERO-FOOTPRINT URL</h3>
            <p className="text-xs text-purple-200/70 leading-relaxed font-mono">
              The entire application is encoded into the URL hash fragment (<code className="text-cyan-300">#...</code>). Browsers never send the hash to any server.
            </p>
          </div>
        </div>

        {/* Tech Specifications */}
        <div className="bg-[#080212] p-6 rounded-xl border border-cyan-500/30 mb-8">
          <h4 className="font-cyber text-xs uppercase tracking-wider text-cyan-300 mb-4 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            Supported Micro-Payload Architectures
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-purple-200/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Full HTML5 / CSS3 / JavaScript Web Apps</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Schema.org Recipe Cards with Timers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Interactive HTML5 Canvas & 2D Contexts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>MECARD / VCARD Holo Identity Cards</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Executable Bookmarklet Generators</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Raw File Compress & URL Downloader</span>
            </div>
          </div>
        </div>

        {/* Call to action & Tour trigger */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {onReplaySplash && (
            <button
              onClick={onReplaySplash}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-fuchsia-950/70 border border-fuchsia-400/50 text-fuchsia-200 hover:text-white hover:bg-fuchsia-900/80 font-cyber text-xs tracking-wider transition shadow-sm"
            >
              <Zap className="w-4 h-4 text-fuchsia-300 animate-pulse" />
              <span>REPLAY INTRO BOOT</span>
            </button>
          )}

          {onStartTour && (
            <button
              onClick={onStartTour}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-950/70 border border-teal-400/50 text-teal-200 hover:text-white hover:bg-purple-900/80 font-cyber text-xs tracking-wider transition shadow-sm"
            >
              <Compass className="w-4 h-4 text-teal-300 animate-spin-slow" />
              <span>START GUIDED WALKTHROUGH</span>
            </button>
          )}

          {onOpenEditor && (
            <button
              onClick={onOpenEditor}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white font-cyber text-xs tracking-wider shadow-[0_0_25px_rgba(0,221,255,0.5)] hover:scale-105 transition"
            >
              LAUNCH BITTY BOX STUDIO
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
