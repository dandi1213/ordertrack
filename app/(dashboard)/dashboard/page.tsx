import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, CheckCircle2, CreditCard, Plus, AlertTriangle, ChevronRight } from "lucide-react";
import RecentOrdersTable from "@/features/dashboard/RecentOrdersTable";
import { can, getSessionUser } from "@/lib/auth";
import { getOrders, getSettings } from "@/lib/queries";
import { formatIDR, isOverdue } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can(user, "view_dashboard")) redirect("/orders");

  const [orders, settings] = await Promise.all([getOrders(user.businessId), getSettings(user.businessId)]);

  const today = new Date();
  const activeOrders = orders.filter((o) => o.status !== "completed");
  const overdueOrders = orders.filter((o) => isOverdue(o.deadline, o.status, today));
  const readyOrders = orders.filter((o) => o.status === "ready");

  const totalPaidAll = orders.reduce((sum, o) => sum + (o.payments || []).reduce((pSum, p) => pSum + p.amount, 0), 0);
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-2xl p-6 lg:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold">Selamat Datang, {user.fullName}</h2>
          <p className="text-slate-400 text-sm mt-2">
            Ringkasan operasional <span className="text-white font-semibold">{settings.name}</span> — informasi operasional terbaru.
          </p>
        </div>
        <Link href="/orders/create" className="inline-flex items-center space-x-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 transition-all shrink-0">
          <Plus className="w-5 h-5" />
          <span>Buat Pesanan Baru</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748B]">Pesanan Aktif</p>
            <p className="text-3xl font-bold text-[#0F172A] mt-2">{activeOrders.length}</p>
            <p className="text-xs text-slate-500 mt-1">Belum selesai</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748B]">Pesanan Terlambat</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{overdueOrders.length}</p>
            <p className="text-xs text-red-500 mt-1">Melewati deadline</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748B]">Siap Diambil / Kirim</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{readyOrders.length}</p>
            <p className="text-xs text-green-500 mt-1">Menunggu penyerahan</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748B]">Pembayaran Masuk</p>
            <p className="text-2xl font-bold text-[#0F172A] mt-2">{formatIDR(totalPaidAll)}</p>
            <p className="text-xs text-slate-500 mt-1">Dari total {formatIDR(totalRevenue)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Pesanan Terbaru</h3>
            <p className="text-xs text-[#64748B] mt-0.5">5 pesanan terakhir pada bisnis Anda</p>
          </div>
          <Link href="/orders" className="inline-flex items-center space-x-1 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
            <span>Lihat Semua</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <RecentOrdersTable orders={orders} />
      </div>
    </div>
  );
}
