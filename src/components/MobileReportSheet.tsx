import React, { useEffect } from 'react';
import { Search, PlusCircle, Shield, X, ArrowRight, MapPin, Sparkles } from 'lucide-react';

interface MobileReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (path: string) => void;
  onOpenAi: () => void;
}

export const MobileReportSheet: React.FC<MobileReportSheetProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  onOpenAi,
}) => {
  // Prevent body scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Tap outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet Content Container */}
      <div className="bg-[#0c101d] rounded-t-3xl border-t border-slate-800 shadow-2xl p-5 pb-8 max-w-lg mx-auto w-full animate-slide-up text-white">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Report Campus Item
            </h3>
            <p className="text-xs text-slate-400">
              Dr. RVR NRI University · Lost & Found System
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center min-h-[44px] min-w-[44px] transition-colors cursor-pointer"
            aria-label="Close sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Options */}
        <div className="space-y-3">
          {/* Lost Option */}
          <button
            onClick={() => {
              onClose();
              onSelectAction('/lost');
            }}
            className="w-full p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-left transition-all active:scale-[0.98] flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
                <Search className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Missing Property
                </span>
                <h4 className="text-sm font-bold text-white">
                  I Lost Something
                </h4>
                <p className="text-[11px] text-slate-400">
                  ID card, wallet, keys, electronics, or personal items
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Found Option */}
          <button
            onClick={() => {
              onClose();
              onSelectAction('/found');
            }}
            className="w-full p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-left transition-all active:scale-[0.98] flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <PlusCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Discovered Item
                </span>
                <h4 className="text-sm font-bold text-white">
                  I Found Something
                </h4>
                <p className="text-[11px] text-slate-400">
                  Safely log items found in classrooms, labs, or campus grounds
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Ask AI Option */}
          <button
            onClick={() => {
              onClose();
              onOpenAi();
            }}
            className="w-full p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-all active:scale-[0.98] flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Ask Campus AI Assistant
                </h4>
                <p className="text-[11px] text-slate-400">
                  Location advice, security desk guidance & Maps search
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
