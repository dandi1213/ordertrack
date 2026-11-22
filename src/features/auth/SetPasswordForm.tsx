'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2, Lock, PackageCheck } from 'lucide-react';
import { setInitialPasswordAction, type AuthState } from '@/app/actions/auth';

export default function SetPasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    setInitialPasswordAction,
    {}
  );
  const [showPassword, setShowPassword] = useState(false);

  const inputClass =
    'w-full h-11 pl-10 pr-3 rounded-lg border border-[#CBD5E1] text-sm bg-white text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            <PackageCheck className="w-8 h-8" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-3xl font-extrabold text-[#0F172A]">OrderTrack</h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 shadow-sm border border-[#E2E8F0] rounded-xl sm:px-8">
          <div className="space-y-1 mb-5">
            <h2 className="text-lg font-semibold text-[#0F172A] tracking-tight">Buat Kata Sandi</h2>
            <p className="text-sm text-[#64748B]">
              Undangan sudah dikonfirmasi. Buat kata sandi sendiri untuk mulai menggunakan
              OrderTrack.
            </p>
          </div>

          {email && (
            <p className="mb-4 rounded-lg bg-slate-50 border border-[#E2E8F0] px-3 py-2 text-xs text-[#64748B]">
              Akun: <span className="font-semibold text-[#0F172A]">{email}</span>
            </p>
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

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  id="new-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  aria-label="Tampilkan kata sandi"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-[#0F172A] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
                Ulangi Kata Sandi
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Masukkan ulang kata sandi"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Kata Sandi &amp; Masuk</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
