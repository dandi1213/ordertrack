'use server';

import { randomUUID } from 'crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { can, getSessionUser } from '@/lib/auth';
import { deriveTrackingToken, hashTrackingToken } from '@/lib/trackingToken';
import { normalizePhone, numberValue, text, validateOrder } from '@/lib/validation';
import { WHATSAPP_TEMPLATES } from '@/lib/constants';
import { formatIDR } from '@/lib/utils';
import { ActionResult, OrderStatus } from '@/types';

type CreateOrderResult = ActionResult<{ id: string; trackingToken: string }>;

function revalidateOrderPaths(id?: string) {
  revalidatePath('/dashboard');
  revalidatePath('/orders');
  revalidatePath('/payments');
  if (id) revalidatePath(`/orders/${id}`);
}

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
}

async function generateOrderNumber(
  admin: ReturnType<typeof createAdminClient>,
  businessId: string
): Promise<string> {
  const { data } = await admin
    .from('orders')
    .select('order_number')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(500);

  const used = new Set((data ?? []).map((row) => row.order_number));
  const year = new Date().getFullYear();
  let sequence = used.size + 1;

  while (used.has(`ORD-${year}-${String(sequence).padStart(3, '0')}`)) {
    sequence += 1;
  }
  return `ORD-${year}-${String(sequence).padStart(3, '0')}`;
}

export async function createOrderAction(
  _prev: CreateOrderResult,
  formData: FormData
): Promise<CreateOrderResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    if (!can(user, 'create_orders')) {
      return { ok: false, error: 'Anda tidak memiliki izin untuk membuat pesanan.' };
    }

    const fields = validateOrder(formData);
    if (Object.keys(fields).length > 0) {
      return { ok: false, error: 'Periksa kembali data pesanan.', fields };
    }

    const admin = createAdminClient();
    const customerName = text(formData, 'customerName');
    const phone = normalizePhone(text(formData, 'customerPhone'));

    const { data: existingCustomer } = await admin
      .from('customers')
      .select('id, name')
      .eq('business_id', user.businessId)
      .eq('phone', phone)
      .maybeSingle();

    let customerId = existingCustomer?.id;
    if (!customerId) {
      const { data: newCustomer, error: customerError } = await admin
        .from('customers')
        .insert({ business_id: user.businessId, name: customerName, phone })
        .select('id')
        .single();
      if (customerError || !newCustomer) {
        return { ok: false, error: customerError?.message ?? 'Gagal menyimpan pelanggan.' };
      }
      customerId = newCustomer.id;
    }

    const orderId = randomUUID();
    const trackingToken = deriveTrackingToken(orderId);
    const orderNumber = await generateOrderNumber(admin, user.businessId);
    const totalPrice = numberValue(formData, 'totalPrice');
    const initialPayment = numberValue(formData, 'initialPayment');

    const { error: orderError } = await admin.from('orders').insert({
      id: orderId,
      business_id: user.businessId,
      customer_id: customerId,
      order_number: orderNumber,
      product_name: text(formData, 'productName'),
      quantity: numberValue(formData, 'quantity'),
      specifications: text(formData, 'specifications'),
      notes: text(formData, 'notes'),
      total_price: totalPrice,
      deadline: text(formData, 'deadline'),
      status: 'received',
      tracking_token_hash: hashTrackingToken(trackingToken),
      created_by: user.id,
    });

    if (orderError) return { ok: false, error: orderError.message };

    await admin.from('order_status_history').insert({
      order_id: orderId,
      old_status: null,
      new_status: 'received',
      changed_by: user.id,
      notes: 'Pesanan baru dibuat',
    });

    if (initialPayment > 0) {
      const { error: paymentError } = await admin.from('payments').insert({
        order_id: orderId,
        amount: initialPayment,
        payment_method: text(formData, 'paymentMethod') || 'Transfer',
        payment_date: new Date().toISOString(),
        notes: 'DP / Pembayaran awal',
        recorded_by: user.id,
      });
      if (paymentError) {
        return {
          ok: false,
          error: `Pesanan dibuat, tetapi DP gagal dicatat: ${paymentError.message}`,
        };
      }
    }

    revalidateOrderPaths(orderId);
    return { ok: true, data: { id: orderId, trackingToken } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal membuat pesanan.' };
  }
}

export async function updateOrderStatusAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    if (!can(user, 'update_order_status')) {
      return { ok: false, error: 'Anda tidak memiliki izin untuk mengubah status.' };
    }

    const orderId = text(formData, 'orderId');
    const status = text(formData, 'status') as OrderStatus;
    if (!orderId) return { ok: false, error: 'ID pesanan tidak ditemukan.' };
    if (!['received', 'in_progress', 'ready', 'completed'].includes(status)) {
      return { ok: false, error: 'Status tidak valid.' };
    }

    const admin = createAdminClient();
    const { data: order } = await admin
      .from('orders')
      .select('id, status, total_price')
      .eq('id', orderId)
      .eq('business_id', user.businessId)
      .maybeSingle();

    if (!order) return { ok: false, error: 'Pesanan tidak ditemukan.' };
    if (order.status === status) return { ok: true, data: undefined };

    // Aturan bisnis: pesanan belum lunas tidak boleh ditandai selesai.
    if (status === 'completed') {
      const totalPrice = Number(order.total_price ?? 0);
      const { data: payments } = await admin
        .from('payments')
        .select('amount')
        .eq('order_id', orderId);
      const totalPaid = (payments ?? []).reduce(
        (sum, payment) => sum + Number(payment.amount ?? 0),
        0
      );
      const remaining = Math.max(totalPrice - totalPaid, 0);

      if (remaining > 0) {
        return {
          ok: false,
          error: `Pesanan belum lunas. Sisa tagihan ${formatIDR(remaining)}. Catat pelunasan terlebih dahulu sebelum menandai selesai.`,
        };
      }
    }

    const { error } = await admin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('business_id', user.businessId);
    if (error) return { ok: false, error: error.message };

    await admin.from('order_status_history').insert({
      order_id: orderId,
      old_status: order.status,
      new_status: status,
      changed_by: user.id,
      notes: text(formData, 'notes'),
    });

    revalidateOrderPaths(orderId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal memperbarui status.' };
  }
}

export async function updateOrderDeadlineAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    if (!can(user, 'edit_orders')) {
      return { ok: false, error: 'Anda tidak memiliki izin mengubah pesanan.' };
    }

    const orderId = text(formData, 'orderId');
    const deadline = text(formData, 'deadline');
    if (!orderId) return { ok: false, error: 'ID pesanan tidak ditemukan.' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      return { ok: false, error: 'Format tanggal deadline tidak valid.' };
    }
    if (Number.isNaN(new Date(`${deadline}T00:00:00`).getTime())) {
      return { ok: false, error: 'Tanggal deadline tidak valid.' };
    }

    const admin = createAdminClient();
    const { data: order } = await admin
      .from('orders')
      .select('id, deadline')
      .eq('id', orderId)
      .eq('business_id', user.businessId)
      .maybeSingle();

    if (!order) return { ok: false, error: 'Pesanan tidak ditemukan.' };
    if (order.deadline === deadline) return { ok: true, data: undefined };

    const { error } = await admin
      .from('orders')
      .update({ deadline, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('business_id', user.businessId);
    if (error) return { ok: false, error: error.message };

    revalidateOrderPaths(orderId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal memperbarui deadline.' };
  }
}

export async function prepareWhatsAppAction(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    if (!can(user, 'view_orders')) {
      return { ok: false, error: 'Anda tidak memiliki izin untuk melihat pesanan.' };
    }

    const orderId = text(formData, 'orderId');
    const templateKey = text(formData, 'template') as OrderStatus;
    const template = WHATSAPP_TEMPLATES[templateKey];
    if (!template) return { ok: false, error: 'Template pesanan tidak valid.' };

    const admin = createAdminClient();
    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, product_name, status, customer_id')
      .eq('id', orderId)
      .eq('business_id', user.businessId)
      .maybeSingle();

    if (!order) return { ok: false, error: 'Pesanan tidak ditemukan.' };

    const { data: customer } = await admin
      .from('customers')
      .select('name, phone')
      .eq('id', order.customer_id)
      .maybeSingle();

    const storedPhone = String(customer?.phone ?? '');
    const waPhone = storedPhone.replace(/\D/g, '').replace(/^0/, '62');
    if (!waPhone) return { ok: false, error: 'Nomor pelanggan tidak tersedia.' };

    const trackingToken = deriveTrackingToken(order.id);
    const trackingUrl = `${await getBaseUrl()}/track/${trackingToken}`;

    const message = template.build({
      customer: String(customer?.name ?? 'Pelanggan'),
      product: String(order.product_name),
      orderNumber: String(order.order_number),
      trackingUrl,
    });

    // Catatan: ini hanya persiapan pesan. Pengiriman dilakukan manual di WhatsApp.
    const { error: logError } = await admin.from('notification_logs').insert({
      order_id: order.id,
      message_type: templateKey,
      recipient_phone: storedPhone,
      message_content: message,
      triggered_by: user.id,
    });
    if (logError) return { ok: false, error: `Gagal mencatat log pesan: ${logError.message}` };

    return {
      ok: true,
      data: { url: `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}` },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal menyiapkan pesan.' };
  }
}
