import { createClient } from '@supabase/supabase-js';

const getInitialUrl = () => {
  return (
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof window !== 'undefined' ? localStorage.getItem('findback_supabase_url') : '') ||
    ''
  );
};

let currentUrl = getInitialUrl();
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_tfHhYc32BMkInfiTucjB0A_9IigT1jP';

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

// Browser-safe Supabase client using publishable key
export const supabase = createClient(
  currentUrl || 'https://placeholder.supabase.co',
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
