import {
  ShieldCheck,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { getStatusLabel, getStatusBadgeClass } from '@/lib/utils';
import { ORDER_STATUSES } from '@/lib/constants';
import TrackingAutoRefresh from './TrackingAutoRefresh';
import { PublicOrderInfo } from '@/types';

function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 max-w-md w-full text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Pesanan Tidak Ditemukan</h2>
        <p className="text-sm text-[#64748B]">
          Tautan tracking tidak valid atau pesanan sudah kadaluarsa. Pastikan tautan yang Anda
          buka sudah benar.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 max-w-md w-full text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <RotateCcw className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Gagal Memuat Tracking</h2>
        <p className="text-sm text-[#64748B]">{message}</p>
      </div>
    </div>
  );
}

export { NotFound as TrackingNotFound, ErrorState as TrackingError };

export default function TrackingView({ info }: { info: PublicOrderInfo }) {
  const currentIndex = ORDER_STATUSES.indexOf(info.status);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2563EB] text-white font-bold shadow-md shadow-blue-600/20 mb-1">
            <Package className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A]">{info.business_name}</h1>
          <p className="text-xs text-[#64748B] flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span>Secure Public Order Tracking</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Nomor Pesanan
              </span>
              <h2 className="text-2xl font-extrabold text-[#0F172A] mt-1">{info.order_number}</h2>
            </div>
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(info.status)}`}
            >
              {getStatusLabel(info.status)}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Produk Pesanan
              </span>
              <p className="text-base font-bold text-[#0F172A] mt-1">{info.product_name}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Estimasi Selesai
                </span>
                <p className="text-sm font-semibold text-[#0F172A] mt-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {info.deadline}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Status Pembayaran
                </span>
                <p className="mt-1">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      info.is_paid
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {info.is_paid ? 'Lunas' : 'Belum Lunas'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
            <h3 className="font-bold text-sm text-[#0F172A]">Progres Pengerjaan</h3>
            <div className="grid grid-cols-4 gap-2">
              {ORDER_STATUSES.map((status, index) => {
                const reached = currentIndex >= index;
                return (
                  <div key={status} className="text-center space-y-2">
                    <div
                      className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center ${
                        reached ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {index < currentIndex ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] font-semibold leading-tight ${
                        reached ? 'text-[#2563EB]' : 'text-slate-400'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center text-xs text-[#64748B] space-y-3">
          <p className="font-semibold text-[#0F172A]">{info.business_name}</p>
          <div className="border-t border-[#E2E8F0] pt-3">
            <TrackingAutoRefresh />
          </div>
          <p className="border-t border-[#E2E8F0] pt-3">Powered by OrderTrack SaaS</p>
        </div>
      </div>
    </div>
  );
}
