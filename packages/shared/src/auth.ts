import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type ViteImportMeta = ImportMeta & {
  env?: Record<string, string | undefined>;
};

/**
 * The supabase-js client expects only the project base URL (e.g.
 * `https://<ref>.supabase.co`) and appends `/auth/v1`, `/functions/v1`,
 * `/rest/v1`, etc. itself. Some environments configure `VITE_SUPABASE_URL`
 * with a trailing service path or slash (e.g. `.../rest/v1/`), which would
 * otherwise produce broken endpoints like `.../rest/v1//functions/v1/...`
 * and silently break auth and edge-function calls (the live scan). Strip any
 * trailing service path and slashes so the client always targets the base URL.
 */
export const normalizeSupabaseUrl = (rawUrl: string): string => {
  const trimmed = (rawUrl ?? '').trim();
  if (!trimmed) return '';

  return trimmed
    .replace(/\/+$/, '')
    .replace(/\/(rest|auth|functions|storage|realtime)\/v\d+$/i, '')
    .replace(/\/+$/, '');
};

const env = (import.meta as ViteImportMeta).env ?? {};
const supabaseUrl = normalizeSupabaseUrl(env.VITE_SUPABASE_URL ?? '');
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY ?? '').trim();

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

export const absoluteUrlFor = (path: string) => {
  return new URL(path, window.location.origin).toString();
};

export const signInWithGoogle = async (redirectPath = '/app/dashboard') => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error: new Error('Google login is not configured yet. Please try again later.'),
    };
  }

  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: absoluteUrlFor(redirectPath),
    },
  });
};
