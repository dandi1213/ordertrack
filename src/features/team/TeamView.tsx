'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  UserPlus,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  ShieldCheck,
  Lock,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  inviteStaffAction,
  resendStaffInviteAction,
  toggleStaffActiveAction,
  updateStaffPermissionsAction,
} from '@/app/actions/team';
import { DEFAULT_STAFF_PERMISSIONS, PERMISSION_KEYS, type PermissionKey } from '@/lib/constants';
import { StaffMember } from '@/types';

const PERMISSION_ITEMS: {
  key: PermissionKey;
  label: string;
  description: string;
  group: 'Operasional' | 'Keuangan' | 'Administrasi';
}[] = [
  { key: 'view_dashboard', label: 'Lihat Dashboard', description: 'Melihat ringkasan KPI dan pesanan terbaru.', group: 'Operasional' },
  { key: 'view_orders', label: 'Lihat Pesanan', description: 'Membuka daftar dan detail pesanan.', group: 'Operasional' },
  { key: 'create_orders', label: 'Buat Pesanan', description: 'Menambahkan pesanan baru dari pelanggan.', group: 'Operasional' },
  { key: 'edit_orders', label: 'Ubah Pesanan', description: 'Mengubah produk, spesifikasi, harga, dan deadline.', group: 'Operasional' },
  { key: 'update_order_status', label: 'Ubah Status Pesanan', description: 'Memperbarui progres pesanan dan riwayat status.', group: 'Operasional' },
  { key: 'view_payments', label: 'Lihat Pembayaran', description: 'Melihat riwayat DP, cicilan, dan pelunasan.', group: 'Keuangan' },
  { key: 'record_payments', label: 'Catat Pembayaran', description: 'Mencatat pembayaran baru pada pesanan.', group: 'Keuangan' },
  { key: 'manage_staff', label: 'Kelola Staf', description: 'Mengundang staf dan mengatur izin akses.', group: 'Administrasi' },
  { key: 'manage_business_settings', label: 'Kelola Pengaturan Bisnis', description: 'Mengubah profil bisnis dan preferensi sistem.', group: 'Administrasi' },
];

const GROUPS: Array<'Operasional' | 'Keuangan' | 'Administrasi'> = [
  'Operasional',
  'Keuangan',
  'Administrasi',
];

type Toast = { ok: boolean; message: string } | null;

export default function TeamView({ staff }: { staff: StaffMember[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<Toast>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState<{ email: string } | null>(null);

  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<StaffMember['permissions'] | null>(null);

  const notify = (ok: boolean, message: string) => {
    setToast({ ok, message });
    setTimeout(() => setToast(null), 4500);
  };

  const openPermissionModal = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setDraftPermissions({ ...staffMember.permissions });
  };

  const closePermissionModal = () => {
    setEditingStaff(null);
    setDraftPermissions(null);
  };

  const togglePermission = (key: PermissionKey) => {
    setDraftPermissions((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  };

  const savePermissions = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStaff || !draftPermissions) return;

    const formData = new FormData(e.currentTarget);
    formData.set('memberId', editingStaff.id);
    for (const key of PERMISSION_KEYS) {
      if (draftPermissions[key]) formData.set(`permission_${key}`, 'on');
      else formData.delete(`permission_${key}`);
    }

    startTransition(async () => {
      const result = await updateStaffPermissionsAction(formData);
      if (!result.ok) {
        notify(false, result.error);
        return;
      }
      closePermissionModal();
      notify(true, 'Izin akses staf berhasil disimpan.');
      router.refresh();
    });
  };

  const handleInvite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteError('');

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await inviteStaffAction(formData);
      if (!result.ok) {
        setInviteError(result.error);
        return;
      }
      setInviteSuccess({ email: result.data.email });
      setFullName('');
      setEmail('');
      router.refresh();
    });
  };

  const closeInvite = () => {
    setShowInviteModal(false);
    setInviteSuccess(null);
    setInviteError('');
  };

  const handleResendInvite = (member: StaffMember) => {
    const formData = new FormData();
    formData.set('memberId', member.id);
    startTransition(async () => {
      const result = await resendStaffInviteAction(formData);
      if (!result.ok) {
        notify(false, result.error);
        return;
      }
      notify(true, `Undangan dikirim ulang ke ${member.email}.`);
    });
  };

  const handleToggleActive = (member: StaffMember) => {
    const formData = new FormData();
    formData.set('memberId', member.id);
    startTransition(async () => {
      const result = await toggleStaffActiveAction(formData);
      if (!result.ok) {
        notify(false, result.error);
        return;
      }
      notify(true, member.is_active ? 'Staf berhasil dinonaktifkan.' : 'Staf berhasil diaktifkan.');
      router.refresh();
    });
  };

  const activePermissionCount = (staffMember: StaffMember) =>
    staffMember.role === 'owner'
      ? PERMISSION_ITEMS.length
      : Object.values(staffMember.permissions).filter(Boolean).length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Tim / Staff</h2>
          <p className="text-sm text-[#64748B]">Kelola anggota tim, role, dan hak akses permissions</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center space-x-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Undang Staf Baru</span>
        </button>
      </div>

      {toast && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            toast.ok
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          Owner selalu memiliki akses penuh dan tidak dapat dikurangi. Untuk staf, klik{' '}
          <span className="font-semibold text-[#0F172A]">Kelola Izin</span> pada baris staf untuk
          mengatur akses per fitur. Perubahan berlaku pada sesi berikutnya staf tersebut.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3.5 px-6">Nama &amp; Email</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Izin Akses</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Bergabung</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Belum ada anggota tim pada bisnis ini.
                  </td>
                </tr>
              ) : (
                staff.map((staffMember) => (
                  <tr key={staffMember.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                          {staffMember.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0F172A]">{staffMember.full_name}</p>
                          <p className="text-xs text-[#64748B]">{staffMember.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          staffMember.role === 'owner'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {staffMember.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {staffMember.role === 'owner' ? (
                        <span className="text-xs font-semibold text-purple-700">
                          Akses Penuh (Full Permissions)
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700">
                            {activePermissionCount(staffMember)} / {PERMISSION_ITEMS.length} izin aktif
                          </span>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {PERMISSION_ITEMS.filter((item) => staffMember.permissions[item.key]).map((item) => (
                              <span
                                key={item.key}
                                className="px-2 py-0.5 bg-slate-50 border border-[#E2E8F0] rounded text-[11px] text-slate-600"
                              >
                                {item.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(staffMember)}
                        disabled={isPending || staffMember.role === 'owner'}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold disabled:opacity-60 ${
                          staffMember.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {staffMember.is_active ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{staffMember.is_active ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-[#64748B] text-xs">
                      {staffMember.joined_at
                        ? new Date(staffMember.joined_at).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openPermissionModal(staffMember)}
                          disabled={staffMember.role === 'owner'}
                          className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            staffMember.role === 'owner'
                              ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                              : 'text-[#2563EB] bg-blue-50 hover:bg-blue-100'
                          }`}
                          title={
                            staffMember.role === 'owner'
                              ? 'Owner selalu memiliki akses penuh'
                              : 'Atur izin akses staf'
                          }
                        >
                          {staffMember.role === 'owner' ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          )}
                          <span>Kelola Izin</span>
                        </button>
                        {staffMember.role === 'staff' && (
                          <button
                            onClick={() => handleResendInvite(staffMember)}
                            disabled={isPending}
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-60"
                            title="Kirim ulang email undangan agar staf bisa membuat kata sandi"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Kirim Ulang Undangan</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleActive(staffMember)}
                          disabled={isPending || staffMember.role === 'owner'}
                          className="text-xs font-medium text-[#2563EB] hover:underline px-1 disabled:text-slate-400"
                        >
                          {staffMember.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingStaff && draftPermissions && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[#E2E8F0]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold">
                    {editingStaff.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">
                      Kelola Izin — {editingStaff.full_name}
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      {editingStaff.email} • Role:{' '}
                      <span className="capitalize font-semibold">{editingStaff.role}</span>
                    </p>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                  {Object.values(draftPermissions).filter(Boolean).length} / {PERMISSION_ITEMS.length} aktif
                </span>
              </div>
            </div>

            <form onSubmit={savePermissions} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {GROUPS.map((group) => {
                  const items = PERMISSION_ITEMS.filter((item) => item.group === group);
                  return (
                    <div key={group} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">{group}</h4>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            setDraftPermissions((prev) => {
                              if (!prev) return prev;
                              const next = { ...prev };
                              items.forEach((item) => {
                                next[item.key] = true;
                              });
                              return next;
                            })
                          }
                          className="text-[11px] font-semibold text-[#2563EB] hover:underline disabled:text-slate-300"
                        >
                          Pilih semua
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map((item) => {
                          const checked = draftPermissions[item.key];
                          return (
                            <button
                              key={item.key}
                              type="button"
                              role="switch"
                              aria-checked={checked}
                              disabled={isPending}
                              onClick={() => togglePermission(item.key)}
                              className={`text-left p-3.5 rounded-xl border transition-all ${
                                checked ? 'border-[#2563EB] bg-blue-50/50' : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                              } ${isPending ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-[#0F172A]">{item.label}</p>
                                  <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                                    {item.description}
                                  </p>
                                </div>
                                <span
                                  className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                                    checked ? 'bg-[#2563EB]' : 'bg-slate-300'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                      checked ? 'translate-x-4.5' : 'translate-x-1'
                                    }`}
                                  />
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setDraftPermissions({ ...DEFAULT_STAFF_PERMISSIONS })}
                  className="text-xs font-semibold text-slate-600 hover:text-[#0F172A] disabled:text-slate-300"
                >
                  Reset ke default staf
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={closePermissionModal}
                    className="px-4 py-2 border border-[#CBD5E1] text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Simpan Izin</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            {inviteSuccess ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">Undangan Terkirim</h3>
                    <p className="text-xs text-[#64748B]">Staf akan membuat kata sandinya sendiri.</p>
                  </div>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB]">
                    Email tujuan
                  </span>
                  <p className="text-sm font-semibold text-[#0F172A] break-all">{inviteSuccess.email}</p>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Email berisi tautan aktifasi sudah dikirim. Staf cukup membuka tautan tersebut,
                  lalu membuat kata sandi sendiri. Tidak ada kata sandi sementara yang perlu Anda
                  salin atau simpan.
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Jika tidak sampai dalam beberapa menit, cek folder Spam atau gunakan tombol
                  <span className="font-semibold text-[#2563EB]"> Kirim Ulang Undangan</span> pada baris staf.
                </p>
                <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
                  <button
                    onClick={closeInvite}
                    className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8]"
                  >
                    Selesai
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-[#0F172A]">Undang Staf Baru</h3>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Nama Lengkap</label>
                    <input
                      name="fullName"
                      type="text"
                      required
                      placeholder="Contoh: Rina Melati"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Email Staf</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="Contoh: rina@ordertrack.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Sistem akan mengirim email undangan berisi tautan untuk membuat kata sandi.
                    Staf dibuat dengan izin default dan dapat diatur setelahnya.
                  </p>

                  {inviteError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{inviteError}</span>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={closeInvite}
                      className="px-4 py-2 border border-[#CBD5E1] text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60"
                    >
                      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Tambahkan Staf</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
