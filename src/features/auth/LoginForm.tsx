'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { PackageCheck, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { loginAction, type AuthState } from '@/app/actions/auth';

const NOTICE: Record<string, string> = {
  email_changed: 'Email berhasil diperbarui. Silakan masuk dengan email baru Anda.',
  account_deleted: 'Akun berhasil dihapus.',
};

export default function LoginForm({ notice, next }: { notice?: string; next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginAction, {});
  const noticeMessage = notice ? NOTICE[notice] : undefined;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            <PackageCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#0F172A]">OrderTrack</h2>
        <p className="mt-2 text-center text-sm text-[#64748B]">
          Sistem Manajemen Pesanan Khusus &amp; Pelanggan SaaS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-[#E2E8F0] sm:rounded-xl sm:px-8">
          <div className="space-y-1 mb-5">
            <h2 className="text-lg font-semibold text-[#0F172A] tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-sm text-[#64748B]">
              Masuk ke akun OrderTrack Anda untuk melanjutkan pengelolaan operasional hari ini.
            </p>
          </div>

          {noticeMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
              <PackageCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{noticeMessage}</span>
            </div>
          )}

          {state.error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-5">
            {next && <input type="hidden" name="next" value={next} />}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#0F172A]">
                Email Bisnis / Akun
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@bisnisanda.com"
                className="mt-1 appearance-none block w-full px-3 py-2 border border-[#CBD5E1] rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#0F172A]">
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 appearance-none block w-full px-3 py-2 border border-[#CBD5E1] rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent sm:text-sm"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={pending}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-[#E2E8F0] pt-6 text-center text-sm">
            <span className="text-[#64748B]">Belum punya akun bisnis? </span>
            <Link href="/register" className="font-medium text-[#2563EB] hover:text-[#1D4ED8]">
              Daftar Owner Baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
