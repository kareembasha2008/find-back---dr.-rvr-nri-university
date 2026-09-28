import React from 'react';
import { Home, Search, FileText, User as UserIcon, Plus } from 'lucide-react';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  unreadCount: number;
  onOpenReportSheet?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPath,
  onNavigate,
  unreadCount,
  onOpenReportSheet,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080b14]/90 backdrop-blur-xl border-t border-slate-800/80 px-2 select-none md:hidden pb-safe">
      <div className="grid grid-cols-5 h-16 items-center max-w-lg mx-auto relative">
        {/* Tab 1: Home */}
        <button
          onClick={() => onNavigate('/home')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-all active:scale-95 cursor-pointer ${
            currentPath === '/home' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Home Feed"
        >
          <Home className={`w-5 h-5 ${currentPath === '/home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] tracking-tight mt-1 ${currentPath === '/home' ? 'font-bold' : 'font-medium'}`}>
            Home
          </span>
          {currentPath === '/home' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/80 mt-0.5"></span>
          )}
        </button>

        {/* Tab 2: Search & Explore */}
        <button
          onClick={() => onNavigate('/search')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-all active:scale-95 cursor-pointer ${
            currentPath === '/search' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Search items"
        >
          <Search className={`w-5 h-5 ${currentPath === '/search' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] tracking-tight mt-1 ${currentPath === '/search' ? 'font-bold' : 'font-medium'}`}>
            Search
          </span>
          {currentPath === '/search' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/80 mt-0.5"></span>
          )}
        </button>

        {/* Tab 3: Center Elevated (+ Report) Action Button */}
        <div className="flex flex-col items-center justify-center relative -top-3">
          <button
            onClick={() => {
              if (onOpenReportSheet) {
                onOpenReportSheet();
              } else {
                onNavigate('/lost');
              }
            }}
            className="w-12 h-12 rounded-full lovable-glow-btn text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center active:scale-90 transition-all border-2 border-indigo-400/40 cursor-pointer"
            title="Report Item"
            aria-label="Report lost or found item"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-bold text-slate-300 tracking-tight mt-1">
            Report
          </span>
        </div>

        {/* Tab 4: My Reports */}
        <button
          onClick={() => onNavigate('/reports')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-all active:scale-95 cursor-pointer ${
            currentPath === '/reports' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
          }`}
          aria-label="My Reports"
        >
          <div className="relative">
            <FileText className={`w-5 h-5 ${currentPath === '/reports' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          </div>
          <span className={`text-[10px] tracking-tight mt-1 ${currentPath === '/reports' ? 'font-bold' : 'font-medium'}`}>
            Reports
          </span>
          {currentPath === '/reports' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/80 mt-0.5"></span>
          )}
        </button>

        {/* Tab 5: Profile */}
        <button
          onClick={() => onNavigate('/profile')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-all active:scale-95 cursor-pointer ${
            currentPath === '/profile' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Student Profile"
        >
          <div className="relative">
            <UserIcon className={`w-5 h-5 ${currentPath === '/profile' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-slate-900"></span>
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-1 ${currentPath === '/profile' ? 'font-bold' : 'font-medium'}`}>
            Profile
          </span>
          {currentPath === '/profile' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/80 mt-0.5"></span>
          )}
        </button>
      </div>

      {/* iOS/Android Home Indicator Bar */}
      <div className="pb-1.5 pt-0.5">
        <div className="w-32 h-1 bg-slate-800 rounded-full mx-auto" />
      </div>
    </nav>
  );
};
