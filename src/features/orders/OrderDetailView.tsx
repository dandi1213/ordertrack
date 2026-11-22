'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  ExternalLink,
  User,
  Phone,
  Calendar,
  ShieldCheck,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import CurrencyInput from '@/components/CurrencyInput';
import Select from '@/components/Select';
import {
  prepareWhatsAppAction,
  updateOrderDeadlineAction,
  updateOrderStatusAction,
} from '@/app/actions/orders';
import { recordPaymentAction } from '@/app/actions/payments';
import { formatIDR, getStatusLabel, getStatusBadgeClass } from '@/lib/utils';
import { ORDER_STATUSES, PAYMENT_METHODS } from '@/lib/constants';
import { Order, OrderStatus } from '@/types';

const STATUS_HINTS: Record<OrderStatus, string> = {
  received: 'Pesanan baru masuk',
  in_progress: 'Sedang dikerjakan',
  ready: 'Siap diambil / dikirim',
  completed: 'Selesai dan tercatat',
};

interface OrderDetailViewProps {
  order: Order;
  canUpdateStatus: boolean;
  canRecordPayment: boolean;
  canEditOrder: boolean;
  canViewOrders: boolean;
}

export default function OrderDetailView({
  order,
  canUpdateStatus,
  canRecordPayment,
  canEditOrder,
  canViewOrders,
}: OrderDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [copied, setCopied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);
  const [statusNotes, setStatusNotes] = useState('');

  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState(order.deadline);

  const [toast, setToast] = useState<{ ok: boolean; message: string } | null>(null);

  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = Math.max(order.total_price - totalPaid, 0);
  const isPaidFull = remainingBalance <= 0;
  const trackingPath = `/track/${order.tracking_token}`;
  const trackingUrl =
    typeof window === 'undefined' ? trackingPath : `${window.location.origin}${trackingPath}`;

  const notify = (ok: boolean, message: string) => {
    setToast({ ok, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify(false, 'Gagal menyalin tautan.');
    }
  };

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await recordPaymentAction(formData);
      if (!result.ok) {
        notify(false, result.error);
        return;
      }
      setShowPaymentModal(false);
      setPaymentNotes('');
      notify(true, 'Pembayaran berhasil dicatat.');
      router.refresh();
    });
  };

  const handleUpdateStatus = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (formData.get('status') === 'completed' && !isPaidFull) {
      notify(false, `Lunasi pembayaran dulu. Sisa tagihan ${formatIDR(remainingBalance)}.`);
      return;
    }
    startTransition(async () => {
      const result = await updateOrderStatusAction(formData);
      if (!result.ok) {
        notify(false, result.error);
        return;
      }
      setShowStatusModal(false);
      setStatusNotes('');
      notify(true, 'Status pesanan diperbarui dan riwayat dicatat.');
      router.refresh();
    });
  };

  const handleUpdateDeadline = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('orderId', order.id);
    startTransition(async () => {
      const result = await updateOrderDeadlineAction(formData);
      if (!result.ok) {
        notify(false, result.error);
        return;
      }
      setShowDeadlineModal(false);
      notify(true, 'Deadline pesanan berhasil diperbarui.');
      router.refresh();
    });
  };

  const handleWhatsApp = (template: OrderStatus) => {
    if (!canViewOrders) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set('orderId', order.id);
      formData.set('template', template);
      const result = await prepareWhatsAppAction(formData);
      if (!result.ok) {
        notify(false, result.error);
        return;
      }
      window.open(result.data.url, '_blank', 'noopener,noreferrer');
      notify(true, 'Pesan disiapkan. Silakan tekan Kirim secara manual di WhatsApp.');
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/orders"
            className="p-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <h2 className="text-2xl font-bold text-[#0F172A]">{order.order_number}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-sm text-[#64748B] mt-0.5">
              Dibuat pada {new Date(order.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap">
          {canUpdateStatus && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-4 py-2.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] rounded-xl font-semibold text-sm shadow-sm transition-all"
            >
              Ubah Status
            </button>
          )}
          {canViewOrders && (
            <button
              onClick={() => handleWhatsApp(order.status)}
              disabled={isPending}
              title="Siapkan pesan WhatsApp"
              className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Kirim WhatsApp</span>
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            toast.ok
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-4">
              Informasi Produk &amp; Spesifikasi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Nama Produk</label>
                <p className="text-base font-semibold text-[#0F172A] mt-1">{order.product_name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Jumlah (Quantity)</label>
                <p className="text-base font-semibold text-[#0F172A] mt-1">{order.quantity} pcs</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Spesifikasi Detail</label>
              <div className="mt-1 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] whitespace-pre-wrap">
                {order.specifications || '-'}
              </div>
            </div>
            {order.notes && (
              <div>
                <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Catatan Internal</label>
                <div className="mt-1 p-4 bg-amber-50/50 rounded-xl border border-amber-200 text-sm text-amber-900 whitespace-pre-wrap">
                  {order.notes}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Riwayat Pembayaran</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Catatan DP, cicilan, dan pelunasan</p>
              </div>
              {canRecordPayment && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pembayaran</span>
                </button>
              )}
            </div>
            <div className="space-y-4">
              {order.payments.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">Belum ada pembayaran tercatat.</div>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {order.payments.map((pay) => (
                    <div key={pay.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{formatIDR(pay.amount)}</p>
                        <p className="text-xs text-[#64748B]">
                          {pay.payment_method} • {new Date(pay.payment_date).toLocaleDateString('id-ID')}
                          {pay.notes ? ` • ${pay.notes}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{pay.recorded_by_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-4">
              Riwayat Status Pesanan
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
              {order.status_history.map((his, idx) => (
                <div key={his.id || idx} className="relative flex items-start space-x-4">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#2563EB] ring-4 ring-white" />
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#0F172A]">{getStatusLabel(his.new_status)}</span>
                      {his.old_status && (
                        <span className="text-xs text-[#64748B]">(dari {getStatusLabel(his.old_status)})</span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {new Date(his.created_at).toLocaleString('id-ID')}
                    </p>
                    {his.notes && (
                      <p className="text-xs text-slate-700 mt-1 italic">&ldquo;{his.notes}&rdquo;</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-4">Ringkasan Finansial</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#64748B]">Total Harga</span>
                <span className="font-bold text-[#0F172A] text-base">{formatIDR(order.total_price)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#64748B]">Sudah Dibayar</span>
                <span className="font-bold text-green-600">{formatIDR(totalPaid)}</span>
              </div>
              <div className="border-t border-[#E2E8F0] pt-4 flex justify-between items-center text-sm">
                <span className="font-semibold text-[#0F172A]">Sisa Tagihan</span>
                <span className={`font-bold text-base ${isPaidFull ? 'text-green-600' : 'text-amber-600'}`}>
                  {formatIDR(remainingBalance)}
                </span>
              </div>
            </div>
            <div className={`p-4 rounded-xl text-center text-xs font-semibold ${isPaidFull ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {isPaidFull ? 'Pembayaran Lunas' : 'Belum Lunas (Menunggu Pelunasan)'}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-4">Informasi Pelanggan</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-[#64748B] block">Nama Pelanggan</span>
                  <span className="font-semibold text-[#0F172A]">{order.customer_name}</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-[#64748B] block">No. WhatsApp</span>
                  <span className="font-semibold text-[#0F172A]">{order.customer_phone}</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#64748B] block">Deadline / Tenggat</span>
                    {canEditOrder && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeadlineValue(order.deadline);
                          setShowDeadlineModal(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
                        title="Ubah deadline"
                      >
                        <Pencil className="w-3 h-3" />
                        Ubah
                      </button>
                    )}
                  </div>
                  <span className="font-semibold text-[#0F172A]">{order.deadline}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 rounded-2xl border border-blue-200 p-6 space-y-4">
            <div className="flex items-center space-x-2 text-[#2563EB]">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-bold text-sm">Tautan Tracking Publik</h4>
            </div>
            <p className="text-xs text-slate-600">
              Pelanggan dapat memantau progres pesanan tanpa login menggunakan tautan berikut.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={trackingUrl}
                className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg text-slate-600 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors shrink-0"
                title="Salin Tautan"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="pt-2">
              <Link
                href={trackingPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
              >
                <span>Buka Halaman Tracking Pelanggan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <h3 className="text-lg font-bold text-[#0F172A]">Catat Pembayaran Baru</h3>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <input type="hidden" name="orderId" value={order.id} />
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Nominal Pembayaran (Rp)</label>
                <CurrencyInput
                  name="amount"
                  required
                  placeholder="Contoh: 500.000"
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Metode Pembayaran</label>
                <Select
                  name="paymentMethod"
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
                  ariaLabel="Metode Pembayaran"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Catatan (Opsional)</label>
                <input
                  name="notes"
                  type="text"
                  placeholder="Contoh: DP 50%"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-[#CBD5E1] text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeadlineModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-[#0F172A]">Ubah Deadline Pesanan</h3>
            <form onSubmit={handleUpdateDeadline} className="space-y-4">
              <p className="text-xs text-[#64748B] leading-relaxed">
                Deadline saat ini: <strong className="text-[#0F172A]">{order.deadline}</strong>.
                Gunakan ini jika pelanggan memberikan kelonggaran waktu.
              </p>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  Tanggal Deadline Baru
                </label>
                <input
                  type="date"
                  name="deadline"
                  required
                  value={deadlineValue}
                  onChange={(e) => setDeadlineValue(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowDeadlineModal(false)}
                  className="px-4 py-2 border border-[#CBD5E1] text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  Simpan Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <h3 className="text-lg font-bold text-[#0F172A]">Ubah Status Pesanan</h3>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <input type="hidden" name="orderId" value={order.id} />
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Status Baru</label>
                <Select
                  name="status"
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as OrderStatus)}
                  options={ORDER_STATUSES.map((status) => {
                    const locked = status === 'completed' && !isPaidFull;
                    return {
                      value: status,
                      label: getStatusLabel(status),
                      hint: locked ? 'Lunasi pembayaran dulu' : STATUS_HINTS[status],
                      disabled: locked,
                    };
                  })}
                  ariaLabel="Status Baru"
                />
                {!isPaidFull && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      Status <strong>Selesai</strong> hanya bisa dipilih setelah pembayaran lunas.
                      Sisa tagihan {formatIDR(remainingBalance)}.
                    </span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Catatan Perubahan (Opsional)</label>
                <textarea
                  name="notes"
                  placeholder="Keterangan singkat progres..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-[#CBD5E1] text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  Perbarui Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
