'use client';

import { useState, useActionState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Key, Loader2, User } from 'lucide-react';
import {
  changePasswordAction,
  updateProfileNameAction,
  type AuthState,
} from '@/app/actions/auth';
import { SessionUser } from '@/types';

const initialState: AuthState = {};

function Feedback({ state }: { state: AuthState }) {
  return (
    <>
      {state.error && (
        <p className="flex items-start gap-1.5 text-xs text-red-600">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {state.success}
        </p>
      )}
    </>
  );
}

export default function AccountView({ user }: { user: SessionUser }) {
  const [showPasswords, setShowPasswords] = useState(false);
  const [nameState, nameAction, namePending] = useActionState<AuthState, FormData>(
    updateProfileNameAction,
    initialState
  );
  const [passwordState, passwordAction, passwordPending] = useActionState<AuthState, FormData>(
    changePasswordAction,
    initialState
  );

  const inputClass =
    'w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] text-sm bg-white text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]';

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">Akun Saya</h2>
        <p className="text-sm text-[#64748B] mt-1">
          Kelola nama dan kata sandi akun OrderTrack Anda. Email akun ditetapkan saat pendaftaran/undangan dan tidak bisa diubah di sini.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xl font-bold shrink-0">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#0F172A] truncate">{user.fullName}</p>
            <p className="text-xs text-[#64748B] break-all">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold uppercase text-slate-600">
              {user.role}
            </span>
          </div>
        </div>

        <form action={nameAction} className="p-5 border border-[#E2E8F0] rounded-xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <User className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A] text-sm">Ubah Nama</h3>
              <p className="text-[11px] text-[#64748B]">Nama yang tampil di aplikasi</p>
            </div>
          </div>
          <div>
            <label htmlFor="account-name" className="block text-xs font-medium text-[#0F172A] mb-1.5">
              Nama Lengkap
            </label>
            <input
              id="account-name"
              name="fullName"
              type="text"
              required
              defaultValue={user.fullName}
              className={inputClass}
            />
          </div>
          <Feedback state={nameState} />
          <button
            type="submit"
            disabled={namePending}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            {namePending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Simpan Nama</span>
          </button>
        </form>

        <form action={passwordAction} className="mt-6 p-5 border border-[#E2E8F0] rounded-xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Key className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A] text-sm">Ganti Kata Sandi</h3>
              <p className="text-[11px] text-[#64748B]">Minimal 8 karakter</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="account-current-password" className="block text-xs font-medium text-[#0F172A] mb-1.5">
                Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <input
                  id="account-current-password"
                  name="currentPassword"
                  type={showPasswords ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  aria-label="Tampilkan kata sandi"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A]"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="account-new-password" className="block text-xs font-medium text-[#0F172A] mb-1.5">
                Kata Sandi Baru
              </label>
              <input
                id="account-new-password"
                name="newPassword"
                type={showPasswords ? 'text' : 'password'}
                required
                placeholder="Minimal 8 karakter"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="account-confirm-password" className="block text-xs font-medium text-[#0F172A] mb-1.5">
                Ulangi Kata Sandi Baru
              </label>
              <input
                id="account-confirm-password"
                name="confirmPassword"
                type={showPasswords ? 'text' : 'password'}
                required
                placeholder="Ulangi kata sandi baru"
                className={inputClass}
              />
            </div>
          </div>
          <Feedback state={passwordState} />
          <button
            type="submit"
            disabled={passwordPending}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            {passwordPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Perbarui Kata Sandi</span>
          </button>
        </form>
      </div>
    </div>
  );
}
