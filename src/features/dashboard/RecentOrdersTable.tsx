import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatIDR, getStatusBadgeClass, getStatusLabel, isOverdue } from '@/lib/utils';
import { Order } from '@/types';

/** Tabel 5 pesanan terakhir pada dashboard. */
export default function RecentOrdersTable({ orders }: { orders: Order[] }) {
  const today = new Date();
  const visibleOrders = orders.slice(0, 5);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            <th className="py-3 px-6">No. Pesanan</th>
            <th className="py-3 px-6">Pelanggan</th>
            <th className="py-3 px-6">Produk</th>
            <th className="py-3 px-6">Deadline</th>
            <th className="py-3 px-6">Status</th>
            <th className="py-3 px-6">Total Harga</th>
            <th className="py-3 px-6 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-sm">
          {visibleOrders.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-slate-500">
                Belum ada pesanan. Klik <span className="font-semibold">Buat Pesanan Baru</span>{' '}
                untuk mulai mencatat.
              </td>
            </tr>
          ) : (
            visibleOrders.map((order) => {
              const totalPaid = (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
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
                    <span className="block text-xs text-[#64748B] font-normal">
                      {order.customer_phone}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-[#0F172A] max-w-xs truncate">
                    {order.product_name} <span className="text-slate-400">({order.quantity}x)</span>
                  </td>
                  <td className="py-4 px-6 text-[#64748B]">
                    <div className="flex items-center space-x-1.5">
                      <span>{order.deadline}</span>
                      {overdue && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded">
                          Terlambat
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#0F172A]">
                    {formatIDR(order.total_price)}
                    <span
                      className={`block text-[11px] font-normal ${isPaidFull ? 'text-green-600' : 'text-amber-600'}`}
                    >
                      {isPaidFull ? 'Lunas' : `Sisa ${formatIDR(order.total_price - totalPaid)}`}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center space-x-1 text-xs font-medium text-[#2563EB] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span>Detail</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
