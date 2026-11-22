'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Search,
  Plus,
  ArrowUpRight,
  Calendar,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import DateRangeFilter from '@/components/DateRangeFilter';
import { prepareWhatsAppAction } from '@/app/actions/orders';
import {
  formatIDR,
  getLastMonthRange,
  getStatusLabel,
  getStatusBadgeClass,
  isOverdue,
  isWithinDateRange,
} from '@/lib/utils';
import { Order } from '@/types';

interface OrdersListProps {
  orders: Order[];
  canCreate: boolean;
}

export default function OrdersList({ orders, canCreate }: OrdersListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [defaultRange] = useState(getLastMonthRange);
  const [dateRange, setDateRange] = useState(defaultRange);
  const dateFrom = dateRange.from;
  const dateTo = dateRange.to;
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; message: string } | null>(null);

  const today = new Date();

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      order.order_number.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.product_name.toLowerCase().includes(query) ||
      order.customer_phone.includes(query);
    return (
      matchesSearch &&
      (statusFilter === 'all' || order.status === statusFilter) &&
      isWithinDateRange(order.created_at, dateFrom, dateTo)
    );
  });

  const handleWhatsApp = async (order: Order) => {
    setPreparingId(order.id);
    setToast(null);
    try {
      const formData = new FormData();
      formData.set('orderId', order.id);
      formData.set('template', order.status);
      const result = await prepareWhatsAppAction(formData);
      if (!result.ok) {
        setToast({ ok: false, message: result.error });
        return;
      }
      window.open(result.data.url, '_blank', 'noopener,noreferrer');
      setToast({
        ok: true,
        message: 'Pesan disiapkan. Periksa dan tekan Kirim sendiri di WhatsApp.',
      });
    } catch {
      setToast({ ok: false, message: 'Gagal menyiapkan pesan WhatsApp.' });
    } finally {
      setPreparingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Daftar Pesanan</h2>
          <p className="text-sm text-[#64748B]">Kelola seluruh pesanan khusus pelanggan di sini</p>
        </div>
        {canCreate && (
          <Link
            href="/orders/create"
            className="inline-flex items-center space-x-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pesanan Baru</span>
          </Link>
        )}
      </div>

      {toast && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            toast.ok
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor, nama, atau produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            />
          </div>

          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFromChange={(from) => setDateRange((prev) => ({ ...prev, from }))}
            onToChange={(to) => setDateRange((prev) => ({ ...prev, to }))}
            min={defaultRange.from}
            max={defaultRange.to}
            defaultFrom={defaultRange.from}
            defaultTo={defaultRange.to}
            label="Tanggal Pesanan (1 Bulan Terakhir)"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full pb-2">
          {[
            { label: 'Semua', value: 'all' },
            { label: 'Diterima', value: 'received' },
            { label: 'Dikerjakan', value: 'in_progress' },
            { label: 'Siap', value: 'ready' },
            { label: 'Selesai', value: 'completed' },
            { label: 'Dibatalkan', value: 'cancelled' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:bg-slate-100 border border-[#E2E8F0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3.5 px-6">No. Pesanan</th>
                <th className="py-3.5 px-6">Pelanggan</th>
                <th className="py-3.5 px-6">Nama Produk</th>
                <th className="py-3.5 px-6">Deadline</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Total Harga</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {orders.length === 0
                      ? 'Belum ada pesanan di database bisnis Anda.'
                      : 'Tidak ada pesanan yang sesuai dengan kriteria pencarian.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
                  const isPaidFull = totalPaid >= order.total_price;
                  const overdue = isOverdue(order.deadline, order.status, today);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-semibold text-[#2563EB]">
                        <Link href={`/orders/${order.id}`} className="hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-4 px-6 font-medium text-[#0F172A]">
                        {order.customer_name}
                        <span className="block text-xs text-[#64748B] font-normal">{order.customer_phone}</span>
                      </td>
                      <td className="py-4 px-6 text-[#0F172A] max-w-xs truncate">
                        {order.product_name} <span className="text-slate-400 font-normal">({order.quantity}x)</span>
                      </td>
                      <td className="py-4 px-6 text-[#64748B]">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.deadline}</span>
                          {overdue && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded">
                              Terlambat
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-[#0F172A]">
                        {formatIDR(order.total_price)}
                        <span className={`block text-[11px] font-normal ${isPaidFull ? 'text-green-600' : 'text-amber-600'}`}>
                          {isPaidFull ? 'Lunas' : `Sisa ${formatIDR(order.total_price - totalPaid)}`}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleWhatsApp(order)}
                            disabled={preparingId === order.id}
                            className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-60"
                            title="Siapkan pesan WhatsApp"
                          >
                            {preparingId === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                          </button>
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center space-x-1 text-xs font-medium text-[#2563EB] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <span>Detail</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
