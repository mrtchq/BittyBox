import React, { useState, useEffect } from 'react';
import { X, Map, ShieldAlert, Cpu, Wrench, ExternalLink, Sparkles, Filter } from 'lucide-react';
import { LOCK_TYPES, LockTypeDef } from '../../data/lockTypes';

interface RoadmapLocksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoadmapLocksModal: React.FC<RoadmapLocksModalProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<'all' | 'software' | 'hardware'>('all');

  const roadmapLocks = LOCK_TYPES.filter(l => !l.canGoLiveToday);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredLocks = roadmapLocks.filter(lock => {
    if (filter === 'all') return true;
    return lock.blockerType === filter;
  });

  const softwareCount = roadmapLocks.filter(l => l.blockerType === 'software').length;
  const hardwareCount = roadmapLocks.filter(l => l.blockerType === 'hardware').length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-mono select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#09071c] border border-amber-500/40 rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-950/90 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Map className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                <span>ROADMAP LOCK SPECIFICATION</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 font-mono">
                  {roadmapLocks.length} LOCKS
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                Locks requiring physical hardware or special software engineering
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="text-[10px] sm:text-[11px] text-slate-400">
            Scroll vertically through deferred locks:
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-amber-950 border border-amber-500/60 text-amber-300 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
            >
              All ({roadmapLocks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('software')}
              className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                filter === 'software'
                  ? 'bg-blue-950 border border-blue-500/60 text-blue-300 font-bold shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
            >
              Special Engineering ({softwareCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('hardware')}
              className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                filter === 'hardware'
                  ? 'bg-purple-950 border border-purple-500/60 text-purple-300 font-bold shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
            >
              Physical Hardware ({hardwareCount})
            </button>
          </div>
        </div>

        {/* Vertically Scrollable Locks List */}
        <div className="overflow-y-auto p-3 sm:p-5 space-y-3 flex-1 scrollbar-thin">
          {filteredLocks.map(item => {
            const Icon = item.icon;
            const isHw = item.blockerType === 'hardware';
            return (
              <div
                key={item.id}
                className="p-3 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/30 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                        isHw
                          ? 'bg-purple-950/80 border-purple-500/40 text-purple-300'
                          : 'bg-blue-950/80 border-blue-500/40 text-blue-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400/80 font-bold mr-1.5 font-mono">
                        #{item.num || item.id}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-white">{item.name}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${
                      isHw
                        ? 'bg-purple-950/70 text-purple-300 border-purple-600/40'
                        : 'bg-blue-950/70 text-blue-300 border-blue-600/40'
                    }`}
                  >
                    {item.blockerCategory || (isHw ? 'Physical Hardware' : 'Special Software Engineering')}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-1 pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-rose-950/30 border border-rose-800/30 rounded-lg p-2 text-rose-200">
                    <strong className="text-rose-400 block mb-0.5 uppercase tracking-wider text-[9px]">
                      Why Not Live Today:
                    </strong>
                    <span>{item.whyNotToday || item.tagline}</span>
                  </div>
                  <div className="bg-cyan-950/30 border border-cyan-800/30 rounded-lg p-2 text-cyan-200">
                    <strong className="text-cyan-400 block mb-0.5 uppercase tracking-wider text-[9px]">
                      Planned Architecture:
                    </strong>
                    <span>{item.plannedArch || item.useCase}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-950/90 flex items-center justify-between text-[11px] shrink-0">
          <span className="text-slate-400">
            <span className="text-emerald-400 font-bold">16 live locks</span> ready in WebCrypto
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
