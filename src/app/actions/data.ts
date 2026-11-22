'use server';

import { getSessionUser } from '@/lib/auth';
import { getOrders, getOrderById, getStaff, getSettings, getPublicOrder } from '@/lib/queries';
import { SessionUser, PublicOrderInfo, ActionResult, Order, StaffMember, BusinessSettings } from '@/types';

type RateEntry = { count: number; resetAt: number };
const trackingRateLimit = new Map<string, RateEntry>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 20;

export async function loadDashboard(): Promise<
  ActionResult<{ orders: Order[]; settings: BusinessSettings; user: SessionUser }>
> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    const [orders, settings] = await Promise.all([
      getOrders(user.businessId),
      getSettings(user.businessId),
    ]);
    return { ok: true, data: { orders, settings, user } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal memuat dashboard.' };
  }
}

export async function loadOrders(): Promise<ActionResult<Order[]>> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    return { ok: true, data: await getOrders(user.businessId) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal memuat pesanan.' };
  }
}

export async function loadOrder(id: string): Promise<ActionResult<Order | null>> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    return { ok: true, data: await getOrderById(user.businessId, id) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal memuat pesanan.' };
  }
}

export async function loadPayments(): Promise<ActionResult<Order[]>> {
  return loadOrders();
}

export async function loadTeam(): Promise<ActionResult<{ staff: StaffMember[]; user: SessionUser }>> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    return { ok: true, data: { staff: await getStaff(user.businessId), user } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal memuat data tim.' };
  }
}

export async function loadSettings(): Promise<
  ActionResult<{ settings: BusinessSettings; user: SessionUser }>
> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    return { ok: true, data: { settings: await getSettings(user.businessId), user } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal memuat pengaturan.' };
  }
}

export async function loadTracking(token: string): Promise<ActionResult<PublicOrderInfo | null>> {
  const key = token || 'empty';
  const now = Date.now();
  const entry = trackingRateLimit.get(key);
  if (entry && now < entry.resetAt) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return { ok: false, error: 'Terlalu banyak percobaan. Silakan coba lagi dalam satu menit.' };
    }
    entry.count += 1;
  } else {
    trackingRateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  }

  try {
    return { ok: true, data: await getPublicOrder(token) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal memuat tracking.' };
  }
}
