import { createClient } from '@supabase/supabase-js';

/**
 * Klien Supabase publik (anon key, tanpa cookie sesi).
 * Dipakai untuk endpoint tracking publik yang tidak membutuhkan login.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Konfigurasi Supabase belum lengkap di .env');
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
