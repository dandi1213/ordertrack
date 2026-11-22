'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import {
  PackageCheck, Store, User, Mail, Lock,
  Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { registerAction, type AuthState } from '@/app/actions/auth';

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(registerAction, {});
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const strengthLabel = ['Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'][strength];
  const strengthColor = ['bg-red-500', 'bg-amber-500', 'bg-green-500', 'bg-green-600'][strength];

  const inputClass = (hasError?: boolean) =>
    `w-full h-11 pl-10 pr-3 rounded-lg border text-sm bg-white text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? 'border-red-400 focus:ring-red-200'
        : 'border-[#CBD5E1] focus:ring-[#2563EB]/25 focus:border-[#2563EB]'
    }`;

  const errorFor = (key: string) => state.fields?.[key];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            <PackageCheck className="w-8 h-8" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-3xl font-extrabold text-[#0F172A]">OrderTrack</h1>
        <p className="mt-2 text-center text-sm text-[#64748B]">
          Sistem Manajemen Pesanan Khusus &amp; Pelanggan SaaS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 shadow-sm border border-[#E2E8F0] rounded-xl sm:px-8">
          <div className="space-y-1 mb-5">
            <h2 className="text-lg font-semibold text-[#0F172A] tracking-tight">Mulai Uji Coba OrderTrack</h2>
            <p className="text-sm text-[#64748B]">
              Daftarkan workshop atau usaha kustom Anda. Nikmati manajemen pesanan yang rapi tanpa kertas tercecer.
            </p>
          </div>

          {state.success ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-green-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-green-900">Cek Email Anda</h3>
                    <p className="text-xs text-green-800 mt-0.5">
                      Konfirmasi diperlukan sebelum akun bisa digunakan.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-green-800 leading-relaxed">{state.success}</p>
                <p className="text-[11px] text-green-700">
                  Tidak menerima email? Periksa folder Spam/Promosi, lalu daftar lagi dengan email
                  yang sama jika perlu mengirim ulang.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg flex items-center justify-center"
              >
                Ke Halaman Masuk
              </Link>
            </div>
          ) : (
            <>
              {state.error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}

              <form action={formAction} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-fullname" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
                Nama Lengkap Penanggung Jawab
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  id="reg-fullname"
                  name="fullName"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  className={inputClass(Boolean(errorFor('fullName')))}
                />
              </div>
              {errorFor('fullName') && <p className="text-xs text-red-600 mt-1">{errorFor('fullName')}</p>}
            </div>

            <div>
              <label htmlFor="reg-company" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
                Nama Bisnis / Usaha
              </label>
              <div className="relative flex items-center">
                <Store className="absolute left-3 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  id="reg-company"
                  name="businessName"
                  type="text"
                  placeholder="Contoh: Mandiri Kreasi Garment"
                  className={inputClass(Boolean(errorFor('businessName')))}
                />
              </div>
              {errorFor('businessName') && <p className="text-xs text-red-600 mt-1">{errorFor('businessName')}</p>}
            </div>

            <div>
              <label htmlFor="reg-whatsapp" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
                Nomor WhatsApp Bisnis
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm font-semibold text-[#64748B] select-none">+62</span>
                <input
                  id="reg-whatsapp"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="812-3456-7890"
                  className={`${inputClass(Boolean(errorFor('phone')))} pl-12`}
                />
              </div>
              {errorFor('phone') ? (
                <p className="text-xs text-red-600 mt-1">{errorFor('phone')}</p>
              ) : (
                <p className="text-xs text-[#64748B] mt-1">
                  Digunakan untuk integrasi template WhatsApp dan aktivasi sistem.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
                Email Bisnis
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="budi@mandirikreasi.com"
                  className={inputClass(Boolean(errorFor('email')))}
                />
              </div>
              {errorFor('email') && <p className="text-xs text-red-600 mt-1">{errorFor('email')}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-[13px] font-medium text-[#0F172A] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter kombinasi"
                  className={`${inputClass(Boolean(errorFor('password')))} pr-10`}
                />
                <button
                  type="button"
                  aria-label="Tampilkan atau sembunyikan kata sandi"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-[#0F172A] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 pt-2">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full ${index < strength ? strengthColor : 'bg-[#E2E8F0]'}`}
                  />
                ))}
                <span className="text-[11px] text-[#64748B] pl-1 whitespace-nowrap">
                  {password ? strengthLabel : 'Keamanan'}
                </span>
              </div>
              {errorFor('password') && <p className="text-xs text-red-600 mt-1">{errorFor('password')}</p>}
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  name="terms"
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB]/30 border-[#CBD5E1] shrink-0"
                />
                <span className="text-sm text-[#64748B] leading-snug">
                  Saya menyetujui{' '}
                  <a href="#" className="text-[#2563EB] hover:underline">Ketentuan Layanan</a> dan{' '}
                  <a href="#" className="text-[#2563EB] hover:underline">Kebijakan Privasi</a>{' '}
                  OrderTrack.
                </span>
              </label>
              {errorFor('terms') && <p className="text-xs text-red-600 mt-1">{errorFor('terms')}</p>}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={pending}
                className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mendaftarkan Usaha...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Buat Akun Bisnis Baru</span>
                  </>
                )}
              </button>
            </div>
              </form>
            </>
          )}

          <div className="pt-4 text-center">
            <p className="text-sm text-[#64748B]">
              Sudah memiliki akun OrderTrack?{' '}
              <Link href="/login" className="text-[#2563EB] font-semibold hover:underline ml-1">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
