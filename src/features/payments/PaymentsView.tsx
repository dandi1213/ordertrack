'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CreditCard, Search, ArrowUpRight } from 'lucide-react';
import DateRangeFilter from '@/components/DateRangeFilter';
import { formatIDR, getLastMonthRange, isWithinDateRange } from '@/lib/utils';
import { Order } from '@/types';

export default function PaymentsView({ orders }: { orders: Order[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [defaultRange] = useState(getLastMonthRange);
  const [dateRange, setDateRange] = useState(defaultRange);
  const dateFrom = dateRange.from;
  const dateTo = dateRange.to;

  const allPayments = orders
    .flatMap((order) =>
      order.payments.map((pay) => ({
        ...pay,
        order_id_display: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        product_name: order.product_name,
      }))
    )
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  const filteredPayments = allPayments.filter(
    (p) =>
      (p.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.payment_method.toLowerCase().includes(searchTerm.toLowerCase())) &&
      isWithinDateRange(p.payment_date, dateFrom, dateTo)
  );

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Pembayaran</h2>
          <p className="text-sm text-[#64748B]">
            Rekapitulasi seluruh transaksi DP, cicilan, dan pelunasan
          </p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] block">Total Pendapatan Tercatat</span>
            <span className="text-lg font-bold text-[#0F172A]">{formatIDR(totalCollected)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor pesanan, pelanggan, metode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
          label="Tanggal Transaksi (1 Bulan Terakhir)"
        />
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3.5 px-6">No. Pesanan</th>
                <th className="py-3.5 px-6">Pelanggan</th>
                <th className="py-3.5 px-6">Nominal Pembayaran</th>
                <th className="py-3.5 px-6">Metode</th>
                <th className="py-3.5 px-6">Waktu Transaksi</th>
                <th className="py-3.5 px-6">Pencatat</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {allPayments.length === 0
                      ? 'Belum ada pembayaran yang tercatat di database bisnis Anda.'
                      : 'Tidak ada pembayaran yang sesuai dengan kriteria pencarian.'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#2563EB]">
                      <Link href={`/orders/${pay.order_id_display}`} className="hover:underline">
                        {pay.order_number}
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-medium text-[#0F172A]">
                      {pay.customer_name}
                      <span className="block text-xs text-[#64748B] font-normal">{pay.product_name}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-green-600">{formatIDR(pay.amount)}</td>
                    <td className="py-4 px-6 text-[#0F172A]">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                        {pay.payment_method}
                      </span>
                      {pay.notes && <span className="block text-xs text-slate-400 mt-0.5">{pay.notes}</span>}
                    </td>
                    <td className="py-4 px-6 text-[#64748B]">
                      {new Date(pay.payment_date).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                      {pay.recorded_by_name}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/orders/${pay.order_id_display}`}
                        className="inline-flex items-center space-x-1 text-xs font-medium text-[#2563EB] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>Detail</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
