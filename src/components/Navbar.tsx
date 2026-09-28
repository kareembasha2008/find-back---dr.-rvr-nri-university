import React from 'react';
import { User } from '../types';
import { Search, Bell, Shield, LogOut, PlusCircle, HelpCircle, Sparkles } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  currentPath: string;
  onNavigate: (path: string) => void;
  unreadCount: number;
  onLogout: () => void;
  onOpenAiChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentPath,
  onNavigate,
  unreadCount,
  onLogout,
  onOpenAiChat,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#080b14]/85 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <button
          onClick={() => onNavigate(user ? '/home' : '/')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-sm tracking-wider shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            FB
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white leading-none">
              FIND BACK
            </div>
            <div className="text-[10px] font-medium text-slate-400 tracking-tight mt-0.5">
              Dr. RVR NRI University
            </div>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Desktop) */}
        {user && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <button
              onClick={() => onNavigate('/home')}
              className={`transition-colors py-1 border-b-2 cursor-pointer ${
                currentPath === '/home'
                  ? 'border-indigo-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('/search')}
              className={`transition-colors py-1 border-b-2 cursor-pointer ${
                currentPath === '/search'
                  ? 'border-indigo-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => onNavigate('/reports')}
              className={`transition-colors py-1 border-b-2 cursor-pointer ${
                currentPath === '/reports'
                  ? 'border-indigo-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              My Reports
            </button>
            <button
              onClick={() => onNavigate('/notifications')}
              className={`relative transition-colors py-1 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                currentPath === '/notifications'
                  ? 'border-indigo-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums shadow-sm shadow-rose-600/40">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate('/how-it-works')}
              className={`transition-colors py-1 border-b-2 cursor-pointer ${
                currentPath === '/how-it-works'
                  ? 'border-indigo-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              How It Works
            </button>
          </nav>
        )}

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3">
          {onOpenAiChat && (
            <button
              onClick={onOpenAiChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Campus AI Assistant & Google Maps"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ask AI</span>
            </button>
          )}

          {user ? (
            <>
              {/* User Profile Pill button */}
              <button
                onClick={() => onNavigate('/profile')}
                className="flex items-center gap-2 p-1.5 pl-3 pr-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors text-xs font-semibold text-slate-200 cursor-pointer"
              >
                <span className="hidden sm:inline max-w-[120px] truncate text-slate-300">
                  {user.full_name}
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user.full_name.charAt(0)}
                </div>
              </button>

              <button
                onClick={onLogout}
                className="hidden md:flex p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onNavigate('/how-it-works')}
                className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors hidden sm:block cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => onNavigate('/login')}
                className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('/register')}
                className="text-xs font-bold text-white lovable-glow-btn px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
