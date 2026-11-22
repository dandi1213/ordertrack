'use client';

import { useActionState, useState } from 'react';
import {
  Save,
  Building2,
  Mail,
  Key,
  Trash2,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  User,
} from 'lucide-react';
import {
  changeEmailAction,
  changePasswordAction,
  deleteAccountAction,
  updateProfileNameAction,
  type AuthState,
} from '@/app/actions/auth';
import { updateBusinessSettingsAction } from '@/app/actions/settings';
import { ActionResult, BusinessSettings, SessionUser } from '@/types';

type DialogType = 'name' | 'email' | 'password' | 'delete' | null;
const initialAuthState: AuthState = {};
const initialSettingsState: ActionResult = { ok: false, error: '' };

export default function SettingsView({
  settings,
  user,
}: {
  settings: BusinessSettings;
  user: SessionUser;
}) {
  const [activeTab, setActiveTab] = useState<'business' | 'account'>('business');
  const [dialog, setDialog] = useState<DialogType>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const [settingsState, settingsAction, settingsPending] = useActionState<
    ActionResult,
    FormData
  >(updateBusinessSettingsAction, initialSettingsState);
  const [nameState, nameAction, namePending] = useActionState<AuthState, FormData>(
    updateProfileNameAction,
    initialAuthState
  );
  const [emailState, emailAction, emailPending] = useActionState<AuthState, FormData>(
    changeEmailAction,
    initialAuthState
  );
  const [passwordState, passwordAction, passwordPending] = useActionState<AuthState, FormData>(
    changePasswordAction,
    initialAuthState
  );
  const [deleteState, deleteAction, deletePending] = useActionState<AuthState, FormData>(
    deleteAccountAction,
    initialAuthState
  );

  const inputClass = (hasError?: boolean) =>
    `w-full h-11 px-3.5 rounded-xl border text-sm bg-white text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? 'border-red-400 focus:ring-red-200'
        : 'border-[#CBD5E1] focus:ring-[#2563EB]/25 focus:border-[#2563EB]'
    }`;

  const resetDialogs = () => {
    setDialog(null);
    setShowPasswords(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Pengaturan</h2>
          <p className="text-sm text-[#64748B]">
            Kelola informasi bisnis, akun, dan preferensi sistem
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-1 shadow-sm flex items-center space-x-1 w-fit">
        <button
          onClick={() => setActiveTab('business')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'business'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-1.5" />
          Informasi Bisnis
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'account'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Key className="w-4 h-4 inline mr-1.5" />
          Akun &amp; Profil
        </button>
      </div>

      {activeTab === 'business' && (
        <form
          action={settingsAction}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm space-y-8"
        >
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-[#2563EB]" />
              <span>Profil Bisnis</span>
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Informasi yang akan ditampilkan pada tautan tracking publik
            </p>
          </div>

          {!settingsState.ok && settingsState.error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{settingsState.error}</span>
            </div>
          )}
          {settingsState.ok && (
            <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Perubahan informasi bisnis berhasil disimpan.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Nama Bisnis</label>
              <input
                type="text"
                name="name"
                defaultValue={settings.name}
                required
                className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Slug / URL Unik</label>
              <input
                type="text"
                name="slug"
                defaultValue={settings.slug}
                required
                className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Alamat Lengkap</label>
            <textarea
              name="address"
              rows={2}
              defaultValue={settings.address}
              className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">No. Telepon Bisnis</label>
              <input
                type="text"
                name="phone"
                defaultValue={settings.phone}
                className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Mata Uang</label>
              <input
                type="text"
                value={settings.currency}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm text-slate-500"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Mata uang layanan ditetapkan sebagai Rupiah Indonesia (IDR).
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
            <button
              type="submit"
              disabled={settingsPending}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-70 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              {settingsPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{settingsPending ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      )}

      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[#0F172A] mb-6 border-b border-[#E2E8F0] pb-4">
              Profil Pengguna Saat Ini
            </h3>
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-2xl">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xl font-bold text-[#0F172A]">{user.fullName}</h4>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'owner' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-1">{user.email}</p>
                <p className="text-slate-400 text-xs mt-2">Pengelola bisnis: {settings.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">Aksi Akun</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Perubahan pada bagian ini langsung diterapkan pada sesi akun Anda.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                type="button"
                onClick={() => setDialog('name')}
                className="p-5 border border-[#E2E8F0] rounded-xl hover:border-[#2563EB] hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-3">
                  <User className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-[#0F172A]">Ubah Nama</h4>
                <p className="text-xs text-slate-500 mt-1">Nama yang tampil di aplikasi</p>
              </button>

              <button
                type="button"
                onClick={() => setDialog('email')}
                className="p-5 border border-[#E2E8F0] rounded-xl hover:border-[#2563EB] hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
                  <Mail className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-[#0F172A]">Ganti Email</h4>
                <p className="text-xs text-slate-500 mt-1">Perbarui alamat email login</p>
              </button>

              <button
                type="button"
                onClick={() => setDialog('password')}
                className="p-5 border border-[#E2E8F0] rounded-xl hover:border-[#2563EB] hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                  <Key className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-[#0F172A]">Ganti Kata Sandi</h4>
                <p className="text-xs text-slate-500 mt-1">Perbarui keamanan akun</p>
              </button>

              <button
                type="button"
                onClick={() => setDialog('delete')}
                className="p-5 border border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-red-700">Hapus Akun</h4>
                <p className="text-xs text-red-500 mt-1">Tindakan tidak dapat dibatalkan</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'name' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-[#E2E8F0] flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Ubah Nama Lengkap</h3>
                  <p className="text-xs text-[#64748B]">Nama yang tampil di aplikasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetDialogs}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form action={nameAction} className="p-6 space-y-4">
              <div>
                <label htmlFor="settings-name" className="block text-sm font-medium text-[#0F172A] mb-1">
                  Nama Lengkap
                </label>
                <input
                  id="settings-name"
                  name="fullName"
                  type="text"
                  required
                  defaultValue={user.fullName}
                  className={inputClass()}
                />
              </div>
              {nameState.error && (
                <p className="flex items-start gap-1.5 text-xs text-red-600">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {nameState.error}
                </p>
              )}
              {nameState.success && (
                <p className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {nameState.success}
                </p>
              )}
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={resetDialogs}
                  className="px-4 py-2 border border-[#CBD5E1] text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={namePending}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  {namePending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Nama</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dialog === 'email' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-[#E2E8F0] flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Ganti Email Login</h3>
                  <p className="text-xs text-[#64748B]">Email saat ini: {user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetDialogs}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={emailAction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Email Baru</label>
                <input
                  name="newEmail"
                  type="email"
                  required
                  placeholder="nama@bisnisanda.com"
                  className={inputClass(Boolean(emailState.error))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Konfirmasi Kata Sandi</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Masukkan kata sandi akun"
                  className={inputClass(Boolean(emailState.error))}
                />
              </div>
              {emailState.error && <p className="text-xs text-red-600">{emailState.error}</p>}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetDialogs}
                  className="px-4 py-2 border border-[#CBD5E1] text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={emailPending}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  {emailPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dialog === 'password' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-[#E2E8F0] flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Ganti Kata Sandi</h3>
                  <p className="text-xs text-[#64748B]">Gunakan minimal 8 karakter</p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetDialogs}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={passwordAction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Kata Sandi Saat Ini</label>
                <div className="relative">
                  <input
                    name="currentPassword"
                    type={showPasswords ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className={`${inputClass(Boolean(passwordState.error))} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A]"
                    aria-label="Tampilkan kata sandi"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Kata Sandi Baru</label>
                <input
                  name="newPassword"
                  type={showPasswords ? 'text' : 'password'}
                  required
                  placeholder="Minimal 8 karakter"
                  className={inputClass(Boolean(passwordState.error))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Konfirmasi Kata Sandi Baru</label>
                <input
                  name="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  required
                  placeholder="Ulangi kata sandi baru"
                  className={inputClass(Boolean(passwordState.error))}
                />
              </div>
              {passwordState.error && <p className="text-xs text-red-600">{passwordState.error}</p>}
              {passwordState.success && (
                <p className="text-xs text-green-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {passwordState.success}
                </p>
              )}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetDialogs}
                  className="px-4 py-2 border border-[#CBD5E1] text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordPending}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  {passwordPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Perbarui Kata Sandi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dialog === 'delete' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-[#E2E8F0] flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Hapus Akun</h3>
                  <p className="text-xs text-[#64748B]">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetDialogs}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={deleteAction} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed">
                Seluruh data pesanan, pelanggan, pembayaran, dan staf pada bisnis{' '}
                <span className="font-semibold">{settings.name}</span> akan dihapus permanen.
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  Ketik <span className="font-bold">HAPUS</span> untuk konfirmasi
                </label>
                <input
                  name="confirmation"
                  type="text"
                  placeholder="HAPUS"
                  className={inputClass(Boolean(deleteState.error))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Kata Sandi Akun</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Masukkan kata sandi"
                  className={inputClass(Boolean(deleteState.error))}
                />
              </div>
              {deleteState.error && <p className="text-xs text-red-600">{deleteState.error}</p>}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetDialogs}
                  className="px-4 py-2 border border-[#CBD5E1] text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={deletePending}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {deletePending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Hapus Akun Permanen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
