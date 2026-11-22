'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import CurrencyInput from '@/components/CurrencyInput';
import Select from '@/components/Select';
import { createOrderAction } from '@/app/actions/orders';
import { PAYMENT_METHODS } from '@/lib/constants';
import { ActionResult } from '@/types';

type CreateState = ActionResult<{ id: string; trackingToken: string }>;
const initialState: CreateState = { ok: false, error: '' };

const inputClass =
  'w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]';

export default function CreateOrderPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateState, FormData>(
    createOrderAction,
    initialState
  );
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);

  useEffect(() => {
    if (state.ok && state.data?.id) {
      router.push(`/orders/${state.data.id}`);
    }
  }, [state, router]);

  const fieldError = (key: string) => (!state.ok ? state.fields?.[key] : undefined);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center space-x-4">
        <Link
          href="/orders"
          className="p-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Buat Pesanan Baru</h2>
          <p className="text-sm text-[#64748B]">Catat pesanan custom baru dari pelanggan</p>
        </div>
      </div>

      {!state.ok && state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm space-y-6">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
            1. Informasi Pelanggan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Nama Pelanggan</label>
              <input name="customerName" type="text" placeholder="Contoh: Budi Santoso" className={inputClass} />
              {fieldError('customerName') && (
                <p className="text-xs text-red-600 mt-1">{fieldError('customerName')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">No. WhatsApp</label>
              <input name="customerPhone" type="text" placeholder="Contoh: 081234567890" className={inputClass} />
              {fieldError('customerPhone') && (
                <p className="text-xs text-red-600 mt-1">{fieldError('customerPhone')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
            2. Detail Produk &amp; Spesifikasi
          </h3>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Nama Produk / Layanan</label>
            <input name="productName" type="text" placeholder="Contoh: Neon Sign Custom Akrilik" className={inputClass} />
            {fieldError('productName') && (
              <p className="text-xs text-red-600 mt-1">{fieldError('productName')}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Jumlah (Quantity)</label>
              <input name="quantity" type="number" min={1} defaultValue={1} className={inputClass} />
              {fieldError('quantity') && <p className="text-xs text-red-600 mt-1">{fieldError('quantity')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Deadline / Tenggat</label>
              <input name="deadline" type="date" className={inputClass} />
              {fieldError('deadline') && <p className="text-xs text-red-600 mt-1">{fieldError('deadline')}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Spesifikasi Detail</label>
            <textarea
              name="specifications"
              rows={3}
              placeholder="Ukuran, warna, bahan, desain khusus..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Catatan Internal (Opsional)</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Catatan untuk staf pengerjaan..."
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
            3. Harga &amp; Pembayaran Awal (DP)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Total Harga (Rp)</label>
              <CurrencyInput name="totalPrice" placeholder="Contoh: 1.500.000" className={inputClass} />
              {fieldError('totalPrice') && <p className="text-xs text-red-600 mt-1">{fieldError('totalPrice')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Pembayaran Awal / DP (Rp)</label>
              <CurrencyInput name="initialPayment" placeholder="Contoh: 500.000" className={inputClass} />
              {fieldError('initialPayment') && (
                <p className="text-xs text-red-600 mt-1">{fieldError('initialPayment')}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Metode Pembayaran DP</label>
            <Select
              name="paymentMethod"
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
              ariaLabel="Metode Pembayaran DP"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-[#E2E8F0]">
          <Link
            href="/orders"
            className="px-5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-70 text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center space-x-2"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{pending ? 'Menyimpan...' : 'Simpan Pesanan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
