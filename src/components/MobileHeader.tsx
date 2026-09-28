import React from 'react';
import { User } from '../types';
import { ChevronLeft, Bell, Sparkles } from 'lucide-react';

interface MobileHeaderProps {
  user: User | null;
  currentPath: string;
  onNavigate: (path: string) => void;
  unreadCount: number;
  onOpenAiChat?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  user,
  currentPath,
  onNavigate,
  unreadCount,
  onOpenAiChat,
}) => {
  const getHeaderMeta = () => {
    switch (currentPath) {
      case '/lost':
        return { title: 'Report Lost Item', canBack: true, parent: '/home' };
      case '/found':
        return { title: 'Report Found Item', canBack: true, parent: '/home' };
      case '/reports':
        return { title: 'My Reports', canBack: false, parent: '/home' };
      case '/search':
        return { title: 'Search & Match', canBack: false, parent: '/home' };
      case '/notifications':
        return { title: 'Alerts & Activity', canBack: true, parent: '/home' };
      case '/profile':
        return { title: 'Student Profile', canBack: false, parent: '/home' };
      case '/how-it-works':
        return { title: 'How It Works', canBack: true, parent: user ? '/home' : '/' };
      case '/login':
        return { title: 'Student Login', canBack: true, parent: '/' };
      case '/register':
        return { title: 'Create Account', canBack: true, parent: '/' };
      case '/profile-setup':
        return { title: 'Profile Setup', canBack: false, parent: '/' };
      case '/onboarding':
        return { title: 'Campus Welcome', canBack: false, parent: '/home' };
      case '/admin':
        return { title: 'Campus Admin', canBack: true, parent: '/home' };
      case '/':
        return { title: 'FIND BACK', canBack: false, parent: '/' };
      case '/home':
      default:
        return { title: 'FIND BACK', canBack: false, parent: '/' };
    }
  };

  const meta = getHeaderMeta();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-[#080b14]/85 backdrop-blur-xl border-b border-slate-800/80 transition-colors">
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        {/* Left Slot: Back Button or Brand Icon */}
        <div className="flex items-center min-w-[70px]">
          {meta.canBack ? (
            <button
              onClick={() => onNavigate(meta.parent)}
              className="flex items-center gap-1 text-slate-300 hover:text-white font-semibold text-xs py-1.5 pr-2.5 rounded-lg active:scale-95 transition-all -ml-1 min-h-[44px]"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate(user ? '/home' : '/')}
              className="flex items-center gap-2 text-left active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-indigo-500/20 border border-indigo-400/30">
                FB
              </div>
              <div className="hidden min-[380px]:block">
                <span className="text-xs font-black tracking-tight text-white block leading-none">
                  FIND BACK
                </span>
                <span className="text-[9px] font-medium text-slate-400 block leading-none mt-0.5">
                  NRI University
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Center Slot: Screen Title */}
        <div className="flex-1 text-center truncate px-1">
          <h1 className="text-sm font-bold text-white truncate tracking-tight">
            {meta.title}
          </h1>
        </div>

        {/* Right Slot: AI & Notifications Actions */}
        <div className="flex items-center justify-end gap-1.5 min-w-[70px]">
          {onOpenAiChat && (
            <button
              onClick={onOpenAiChat}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 flex items-center justify-center min-h-[40px] min-w-[40px] active:scale-95 transition-all relative"
              title="Campus AI"
              aria-label="Campus AI Assistant"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {user ? (
            <button
              onClick={() => onNavigate('/notifications')}
              className="relative p-2 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center min-h-[40px] min-w-[40px] active:scale-95 transition-all"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/login')}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-white text-[11px] font-bold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
