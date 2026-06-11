import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if default placeholders are being used
const isPlaceholder = 
  supabaseUrl.includes('your-project-id') || 
  supabaseAnonKey === 'your-anon-key' ||
  !supabaseUrl || 
  !supabaseAnonKey;

if (isPlaceholder) {
  console.warn(
    'Supabase environment variables are missing or using placeholders. ' +
    'Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

export const supabase = createClient(
  isPlaceholder ? 'https://placeholder-project.supabase.co' : supabaseUrl,
  isPlaceholder ? 'placeholder-anon-key' : supabaseAnonKey
);

export const hasValidSupabaseConfig = () => !isPlaceholder;
