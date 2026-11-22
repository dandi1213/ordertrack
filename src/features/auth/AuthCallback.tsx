'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import { AlertTriangle, Loader2, PackageCheck } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Menyelesaikan semua variasi tautan email Supabase:
 * - token implicit (#access_token=...&refresh_token=...) dipakai invite staf;
 * - ?token_hash=...&type=... dipakai konfirmasi email PKCE;
 * - ?code=... dipakai OAuth / flow PKCE berbasis code.
 */
export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Memverifikasi tautan...');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hash.get('access_token') ?? searchParams.get('access_token');
      const refreshToken = hash.get('refresh_token') ?? searchParams.get('refresh_token');
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const type =
        searchParams.get('type') ?? hash.get('type') ?? '';
      const errorDescription =
        searchParams.get('error_description') ?? hash.get('error_description');

      if (errorDescription) {
        setMessage(`Tautan tidak dapat diproses: ${errorDescription}`);
        setFailed(true);
        return;
      }

      // Matikan deteksi otomatis agar kita bisa menangani token implicit manual.
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
      });

      let errorMessage: string | null = null;

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        errorMessage = error?.message ?? null;
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        errorMessage = error?.message ?? null;
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        errorMessage = error?.message ?? null;
      } else {
        errorMessage = 'Tautan tidak lengkap atau sudah tidak berlaku.';
      }

      if (cancelled) return;

      if (errorMessage) {
        setMessage(`${errorMessage}. Minta tautan baru dari owner / coba daftar lagi.`);
        setFailed(true);
        return;
      }

      // Penentu tujuan: metadata undangan lebih andal daripada parameter `type`
      // karena link invite Supabase memakai flow implicit (token di hash).
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const isInvite =
        user?.user_metadata?.must_set_password === true || type === 'invite';

      // Bersihkan token dari address bar agar tidak terekspos.
      window.history.replaceState(null, '', window.location.pathname);
      router.replace(isInvite ? '/auth/set-password' : '/dashboard');
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center px-4 sm:px-6 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-sm border border-[#E2E8F0] rounded-xl text-center space-y-4">
          <div
            className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${
              failed ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#2563EB]'
            }`}
          >
            {failed ? <AlertTriangle className="w-6 h-6" /> : <PackageCheck className="w-6 h-6" />}
          </div>
          <h1 className="text-lg font-bold text-[#0F172A]">
            {failed ? 'Tautan Tidak Valid' : 'Memproses Tautan'}
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            {failed ? message : 'Mohon tunggu, kami sedang mengaktifkan akun Anda...'}
          </p>
          {!failed && <Loader2 className="w-5 h-5 mx-auto animate-spin text-[#2563EB]" />}
          {failed && (
            <a
              href="/login"
              className="inline-block mt-2 text-sm font-semibold text-[#2563EB] hover:underline"
            >
              Kembali ke halaman masuk
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
