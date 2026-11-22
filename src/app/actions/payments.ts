'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { can, getSessionUser } from '@/lib/auth';
import { numberValue, text, validatePayment } from '@/lib/validation';
import { ActionResult } from '@/types';

export async function recordPaymentAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    if (!can(user, 'record_payments')) {
      return { ok: false, error: 'Anda tidak memiliki izin untuk mencatat pembayaran.' };
    }

    const fields = validatePayment(formData);
    if (Object.keys(fields).length > 0) {
      return { ok: false, error: 'Periksa kembali nominal pembayaran.', fields };
    }

    const orderId = text(formData, 'orderId');
    const amount = numberValue(formData, 'amount');

    const admin = createAdminClient();
    const { data: order } = await admin
      .from('orders')
      .select('id, total_price')
      .eq('id', orderId)
      .eq('business_id', user.businessId)
      .maybeSingle();

    if (!order) return { ok: false, error: 'Pesanan tidak ditemukan.' };

    const { data: existingPayments } = await admin
      .from('payments')
      .select('amount')
      .eq('order_id', orderId);

    const totalPaid = (existingPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPrice = Number(order.total_price);

    if (totalPaid + amount > totalPrice) {
      const remaining = Math.max(totalPrice - totalPaid, 0);
      return {
        ok: false,
        error: `Pembayaran melebihi sisa tagihan (${remaining.toLocaleString('id-ID')}).`,
      };
    }

    const { error } = await admin.from('payments').insert({
      order_id: orderId,
      amount,
      payment_method: text(formData, 'paymentMethod'),
      payment_date: new Date().toISOString(),
      notes: text(formData, 'notes'),
      recorded_by: user.id,
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath('/payments');
    revalidatePath('/dashboard');
    revalidatePath(`/orders/${orderId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal mencatat pembayaran.' };
  }
}
