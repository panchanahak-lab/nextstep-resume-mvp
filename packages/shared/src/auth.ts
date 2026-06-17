import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

export const INTENDED_DESTINATION_KEY = 'nextstep_intended_destination';

export const APP_ROUTES = {
  dashboard: '/app/dashboard',
  builder: '/app/builder',
  scanner: '/app/scanner',
  interview: '/app/interview',
} as const;

type ViteImportMeta = ImportMeta & {
  env?: Record<string, string | undefined>;
};

const env = (import.meta as ViteImportMeta).env ?? {};
const supabaseUrl = env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY ?? '';

let client: SupabaseClient | null = null;

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) return null;

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
};

export const storeIntendedDestination = (destination: string) => {
  window.localStorage.setItem(INTENDED_DESTINATION_KEY, destination);
};

export const getStoredIntendedDestination = () => {
  return window.localStorage.getItem(INTENDED_DESTINATION_KEY);
};

export const consumeIntendedDestination = () => {
  const destination = getStoredIntendedDestination();
  window.localStorage.removeItem(INTENDED_DESTINATION_KEY);
  return destination;
};

export const absoluteUrlFor = (path: string) => {
  return new URL(path, window.location.origin).toString();
};

export const redirectToDestination = (destination: string) => {
  window.location.assign(destination);
};
