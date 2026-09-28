import React, { useState, useEffect } from 'react';
import { User } from './types';
import { supabase } from './lib/supabase';
import { authService } from './services/authService';
import { notificationService } from './services/notificationService';
import { Navbar } from './components/Navbar';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { MobileReportSheet } from './components/MobileReportSheet';
import { Sparkles } from 'lucide-react';
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportLostPage } from './pages/ReportLostPage';
import { ReportFoundPage } from './pages/ReportFoundPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { SearchPage } from './pages/SearchPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { GeminiChatbotModal } from './components/GeminiChatbotModal';
import { CinematicWavesBackground } from './components/3d/CinematicWavesBackground';

const LAST_PATH_KEY = 'findback_active_route';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCachedUser());
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const browserPath = window.location.pathname;
    const savedPath = localStorage.getItem(LAST_PATH_KEY);
    const user = authService.getCachedUser();

    if (browserPath && browserPath !== '/') {
      return browserPath;
    }
    if (user && savedPath && savedPath !== '/') {
      return savedPath;
    }
    if (user) {
      if (savedPath && savedPath !== '/login' && savedPath !== '/register') {
        return savedPath;
      }
      return '/home';
    }
    return savedPath || '/';
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);

  const refreshUnread = async () => {
    if (currentUser) {
      const count = await notificationService.getUnreadCount(currentUser.id);
      setUnreadCount(count);
    } else {
      setUnreadCount(0);
    }
  };

  // Restore live Supabase session on app mount & listen to auth changes
  useEffect(() => {
    let isMounted = true;

    authService.getCurrentUserAsync().then((user) => {
      if (isMounted && user) {
        setCurrentUser(user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await authService.getCurrentUserAsync();
        if (isMounted) setCurrentUser(user);
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) setCurrentUser(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Real-time notifications subscription
  useEffect(() => {
    refreshUnread();

    if (currentUser?.id) {
      const unsubscribe = notificationService.subscribeToUserNotifications(
        currentUser.id,
        (_newNotif) => {
          refreshUnread();
        }
      );
      return () => unsubscribe();
    }
  }, [currentUser?.id]);

  // Synchronize browser history and back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname || '/';
      setCurrentPath(p);
      localStorage.setItem(LAST_PATH_KEY, p);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    try {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    } catch (e) {
      // Safe fallback in restricted iframes
    }
    localStorage.setItem(LAST_PATH_KEY, path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshUnread();
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    localStorage.removeItem(LAST_PATH_KEY);
    navigate('/');
  };

  const handleLoginSuccess = (user: User) => {
    const directUser: User = {
      ...user,
      profile_confirmed: true,
      onboarding_completed: true,
    };
    setCurrentUser(directUser);
    authService.setCachedUser(directUser);
    navigate('/home');
  };

  const handleRegistrationSuccess = async () => {
    const freshUser = await authService.getCurrentUserAsync();
    if (freshUser) {
      const verifiedUser: User = {
        ...freshUser,
        profile_confirmed: true,
        onboarding_completed: true,
      };
      setCurrentUser(verifiedUser);
      authService.setCachedUser(verifiedUser);
      navigate('/home');
    } else {
      navigate('/home');
    }
  };

  const handleProfileSetupComplete = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    if (!updatedUser.onboarding_completed) {
      navigate('/onboarding');
    } else {
      navigate('/home');
    }
  };

  const handleOnboardingFinish = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    navigate('/home');
  };

  // Route Protection Guard
  const isProtectedPath = [
    '/home',
    '/lost',
    '/found',
    '/reports',
    '/notifications',
    '/profile',
    '/profile-setup',
    '/onboarding',
  ].some((prefix) => currentPath.startsWith(prefix));

  // If user is not authenticated and tries to access a protected route, redirect to login
  useEffect(() => {
    if (!currentUser && isProtectedPath) {
      navigate('/login');
    }
  }, [currentUser, isProtectedPath]);

  // Determine which page component to render
  const renderCurrentView = () => {
    // Admin route
    if (currentPath === '/admin') {
      return <AdminPage onNavigate={navigate} />;
    }

    // Public How It Works
    if (currentPath === '/how-it-works') {
      return (
        <HowItWorksPage
          onNavigate={navigate}
          isAuthenticated={!!currentUser}
        />
      );
    }

    // Unauthenticated views
    if (!currentUser) {
      if (currentPath === '/login') {
        return <LoginPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
      }
      if (currentPath === '/register') {
        return <RegisterPage onNavigate={navigate} onRegistered={handleRegistrationSuccess} />;
      }
      return <LandingPage onNavigate={navigate} />;
    }

    // Authenticated user flows:
    if (currentPath === '/profile-setup') {
      return <ProfileSetupPage user={currentUser} onComplete={handleProfileSetupComplete} />;
    }

    if (currentPath === '/onboarding') {
      return <OnboardingPage user={currentUser} onFinish={handleOnboardingFinish} />;
    }

    // Protected App Pages
    switch (currentPath) {
      case '/lost':
        return (
          <ReportLostPage
            user={currentUser}
            onNavigate={navigate}
            onSuccess={() => navigate('/reports')}
          />
        );
      case '/found':
        return (
          <ReportFoundPage
            user={currentUser}
            onNavigate={navigate}
            onSuccess={() => navigate('/reports')}
          />
        );
      case '/reports':
        return <MyReportsPage user={currentUser} onNavigate={navigate} />;
      case '/search':
        return <SearchPage user={currentUser} onNavigate={navigate} />;
      case '/notifications':
        return (
          <NotificationsPage
            user={currentUser}
            onNavigate={navigate}
            onRefreshUnread={refreshUnread}
          />
        );
      case '/profile':
        return (
          <ProfilePage
            user={currentUser}
            onUpdateUser={(u) => setCurrentUser(u)}
            onLogout={handleLogout}
          />
        );
      case '/home':
      default:
        return (
          <DashboardPage
            user={currentUser}
            onNavigate={navigate}
          />
        );
    }
  };

  const showNavbar = currentPath !== '/admin';
  const showBottomNav =
    currentUser &&
    currentUser.profile_confirmed &&
    currentPath !== '/admin' &&
    currentPath !== '/onboarding' &&
    currentPath !== '/profile-setup';

  // Dynamic 3D background intensity calculation based on page context
  const getBackgroundIntensity = (path: string): 'full' | 'medium' | 'subtle' => {
    if (path === '/' || path === '/login' || path === '/register') {
      return 'full';
    }
    if (path === '/how-it-works') {
      return 'medium';
    }
    // For internal dashboard and report pages, reduce intensity so data remains primary focus
    return 'subtle';
  };

  const bgIntensity = getBackgroundIntensity(currentPath);

  return (
    <div className="min-h-screen flex flex-col lovable-dark-bg text-slate-100 font-sans selection:bg-indigo-600 selection:text-white relative bg-[#07090e]">
      {/* 0. Cinematic 3D Flowing Waves Background (Lovable AI aesthetic) */}
      <CinematicWavesBackground intensity={bgIntensity} />

      {/* 1. Desktop & Laptop Top Header (Navbar - visible on md+ laptop/desktop screens) */}
      {showNavbar && (
        <div className="hidden md:block relative z-40">
          <Navbar
            user={currentUser}
            currentPath={currentPath}
            onNavigate={navigate}
            unreadCount={unreadCount}
            onLogout={handleLogout}
            onOpenAiChat={() => setIsAiModalOpen(true)}
          />
        </div>
      )}

      {/* 2. Mobile Top App Header (MobileHeader - visible only on mobile screens <md) */}
      {showNavbar && (
        <div className="md:hidden relative z-40">
          <MobileHeader
            user={currentUser}
            currentPath={currentPath}
            onNavigate={navigate}
            unreadCount={unreadCount}
            onOpenAiChat={() => setIsAiModalOpen(true)}
          />
        </div>
      )}

      {/* 3. Main Content Viewport (Responsive across both laptop and mobile) */}
      <main className="flex-1 w-full pb-20 md:pb-12 relative z-10">
        {renderCurrentView()}
      </main>

      {/* 4. Desktop Floating Ask Campus AI Button (md+ screens) */}
      {currentPath !== '/admin' && (
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="hidden md:flex fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-xl hover:bg-slate-800 transition-all items-center gap-2 active:scale-95 group border border-slate-700"
          title="Campus AI Assistant & Google Maps"
        >
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          </div>
          <span>Ask Campus AI</span>
        </button>
      )}

      {/* 5. Mobile Bottom Tab Navigation Bar (Visible only on mobile devices) */}
      {showBottomNav && (
        <div className="md:hidden">
          <BottomNav
            currentPath={currentPath}
            onNavigate={navigate}
            unreadCount={unreadCount}
            onOpenReportSheet={() => setIsReportSheetOpen(true)}
          />
        </div>
      )}

      {/* 6. Mobile Bottom Report Action Drawer (for mobile + button) */}
      <MobileReportSheet
        isOpen={isReportSheetOpen}
        onClose={() => setIsReportSheetOpen(false)}
        onSelectAction={navigate}
        onOpenAi={() => {
          setIsReportSheetOpen(false);
          setIsAiModalOpen(true);
        }}
      />

      {/* 7. Gemini Chatbot & Google Maps Grounding Modal */}
      <GeminiChatbotModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        studentName={currentUser?.full_name}
      />
    </div>
  );
}
