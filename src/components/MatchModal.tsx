import React from 'react';
import { Match, Item } from '../types';
import { X, CheckCircle2, MapPin, Calendar, Clock, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

interface MatchModalProps {
  match: Match;
  lostItem: Item;
  foundItem: Item;
  currentUserId: string;
  onClose: () => void;
  onStartVerification: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  match,
  lostItem,
  foundItem,
  currentUserId,
  onClose,
  onStartVerification,
}) => {
  const isLostReporter = lostItem.user_id === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0c101d] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden my-8 text-white">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Possible Match Detected</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tabular-nums">
                  {match.score}% Match
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                FIND BACK smart campus matching algorithm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-xs text-indigo-300 leading-relaxed flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Student Privacy Protected</p>
              <p className="text-indigo-300 mt-0.5">
                Contact information and personal student IDs are protected. Ownership must be verified before safe campus handover can proceed.
              </p>
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lost Item Card */}
            <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                  Reported Lost
                </span>
                {isLostReporter && (
                  <span className="text-[10px] font-medium text-slate-400">Your Report</span>
                )}
              </div>
              {lostItem.photo_url && (
                <img
                  src={lostItem.photo_url}
                  alt={lostItem.name}
                  className="w-full h-32 object-cover rounded-xl mb-3 border border-rose-500/20"
                />
              )}
              <h3 className="font-bold text-white text-base">{lostItem.name}</h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                {lostItem.description}
              </p>
              <div className="mt-3 pt-3 border-t border-rose-500/10 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lostItem.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span className="tabular-nums">{lostItem.date} ({lostItem.approx_time})</span>
                </div>
              </div>
            </div>

            {/* Found Item Card */}
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Reported Found
                </span>
                {!isLostReporter && (
                  <span className="text-[10px] font-medium text-slate-400">Your Report</span>
                )}
              </div>
              {foundItem.photo_url && (
                <img
                  src={foundItem.photo_url}
                  alt={foundItem.name}
                  className="w-full h-32 object-cover rounded-xl mb-3 border border-emerald-500/20"
                />
              )}
              <h3 className="font-bold text-white text-base">{foundItem.name}</h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                {foundItem.description}
              </p>
              <div className="mt-3 pt-3 border-t border-emerald-500/10 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{foundItem.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span className="tabular-nums">{foundItem.date} ({foundItem.approx_time})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scoring breakdown details */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Match Algorithm Breakdown
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Category</div>
                <div className="font-bold text-indigo-400 tabular-nums mt-0.5">{match.breakdown.category}/20</div>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Name Match</div>
                <div className="font-bold text-indigo-400 tabular-nums mt-0.5">{match.breakdown.name}/25</div>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Location</div>
                <div className="font-bold text-indigo-400 tabular-nums mt-0.5">{match.breakdown.location}/25</div>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Date/Time</div>
                <div className="font-bold text-indigo-400 tabular-nums mt-0.5">{match.breakdown.time}/15</div>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400">Description</div>
                <div className="font-bold text-indigo-400 tabular-nums mt-0.5">{match.breakdown.description}/15</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={onStartVerification}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white lovable-glow-btn rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Verify Ownership</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
