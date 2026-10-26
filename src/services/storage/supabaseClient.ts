import type { SupabaseClient } from '@supabase/supabase-js';
export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);
// Pilot guard: credentials alone must never activate unverified cloud tenancy policies.
export const isSupabaseEnabled = false;
export const supabase: SupabaseClient | null = null;
