import { createClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://jpqwzeqvahvodbwkngju.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcXd6ZXF2YWh2b2Rid2tuZ2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MTE3MzgsImV4cCI6MjA5ODA4NzczOH0.54PUkb1W8xRRA35X0eRBTvxOlBtWp8UPbqOY01ykkAk';

const getInitialUrl = () => {
  return (
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof window !== 'undefined' ? localStorage.getItem('findback_supabase_url') : '') ||
    DEFAULT_SUPABASE_URL
  );
};

let currentUrl = getInitialUrl();
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    currentUrl &&
    supabaseAnonKey &&
    currentUrl.startsWith('https://') &&
    currentUrl.includes('.supabase.co') &&
    currentUrl !== 'https://your-project.supabase.co'
  );
};

export const getSupabaseUrl = (): string => currentUrl;

export const setSupabaseUrl = (url: string): void => {
  const clean = url.trim();
  if (typeof window !== 'undefined') {
    localStorage.setItem('findback_supabase_url', clean);
  }
  currentUrl = clean;
};

// Browser-safe Supabase client using publishable anon key
export const supabase = createClient(
  currentUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
