import { createClient } from '@supabase/supabase-js';

const url = import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
const key = import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;

export const configured = Boolean(url && key && !url.includes('YOUR_PROJECT_ID'));
export const supabase = configured
  ? createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;