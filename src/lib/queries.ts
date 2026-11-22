import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { deriveTrackingToken } from '@/lib/trackingToken';
import { DEFAULT_STAFF_PERMISSIONS } from '@/lib/constants';
import {
  BusinessSettings,
  Order,
  OrderStatus,
  Payment,
  OrderStatusHistoryItem,
  PublicOrderInfo,
  StaffMember,
} from '@/types';

type Row = Record<string, unknown>;

const rows = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);
const str = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const num = (value: unknown): number => Number(value ?? 0);

function mapOrder(row: Row): Order {
  const payments: Payment[] = rows(row.payments).map((p) => ({
    id: str(p.id),
    order_id: str(p.order_id),
    amount: num(p.amount),
    payment_method: str(p.payment_method),
    payment_date: str(p.payment_date),
    notes: str(p.notes),
    recorded_by_name: str((p.recorder as Row | undefined)?.full_name, 'Staf / Owner'),
  }));

  const status_history: OrderStatusHistoryItem[] = rows(row.status_history).map((h) => ({
    id: str(h.id),
    order_id: str(h.order_id),
    old_status: (h.old_status as OrderStatus | null) ?? null,
    new_status: h.new_status as OrderStatus,
    changed_by_name: str((h.editor as Row | undefined)?.full_name, 'Sistem'),
    notes: str(h.notes),
    created_at: str(h.created_at),
  }));

  const customer = row.customer as Row | undefined;

  return {
    id: str(row.id),
    order_number: str(row.order_number),
    customer_id: str(row.customer_id),
    customer_name: str(customer?.name, 'Pelanggan'),
    customer_phone: str(customer?.phone),
    product_name: str(row.product_name),
    quantity: num(row.quantity),
    specifications: str(row.specifications),
    notes: str(row.notes),
    total_price: num(row.total_price),
    deadline: str(row.deadline),
    status: row.status as OrderStatus,
    tracking_token: deriveTrackingToken(str(row.id)),
    created_at: str(row.created_at),
    updated_at: str(row.updated_at, str(row.created_at)),
    payments,
    status_history,
  };
}

const ORDER_SELECT = `
  id, customer_id, order_number, product_name, quantity, specifications, notes,
  total_price, deadline, status, created_at, updated_at,
  customer:customers(name, phone),
  payments(id, order_id, amount, payment_method, payment_date, notes, recorded_by, recorder:profiles!payments_recorded_by_fkey(full_name)),
  status_history:order_status_history(id, order_id, old_status, new_status, notes, created_at, changed_by, editor:profiles!order_status_history_changed_by_fkey(full_name))
`;

export async function getOrders(businessId: string): Promise<Order[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select(ORDER_SELECT)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return rows(data).map(mapOrder);
}

export async function getOrderById(businessId: string, id: string): Promise<Order | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select(ORDER_SELECT)
    .eq('business_id', businessId)
    .or(`id.eq.${id},order_number.eq.${id}`)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapOrder(data as Row) : null;
}

export async function getStaff(businessId: string): Promise<StaffMember[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('business_members')
    .select('id, user_id, role, permissions, is_active, joined_at, profile:profiles(full_name)')
    .eq('business_id', businessId)
    .order('joined_at', { ascending: true });

  if (error) throw new Error(error.message);

  return Promise.all(
    rows(data).map(async (m) => {
      const profile = m.profile as Row | undefined;
      let email = '';
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(str(m.user_id));
        email = authUser.user?.email ?? '';
      } catch {
        email = '';
      }

      const permissions = { ...DEFAULT_STAFF_PERMISSIONS };
      if (m.permissions && typeof m.permissions === 'object') {
        Object.assign(permissions, m.permissions as Record<string, boolean>);
      }

      return {
        id: str(m.id),
        user_id: str(m.user_id),
        full_name: str(profile?.full_name, 'Pengguna'),
        email,
        role: m.role === 'owner' ? ('owner' as const) : ('staff' as const),
        permissions,
        is_active: m.is_active === true,
        joined_at: str(m.joined_at).slice(0, 10),
      };
    })
  );
}

export async function getSettings(businessId: string): Promise<BusinessSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('businesses')
    .select('name, slug, phone, address')
    .eq('id', businessId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    name: str(data?.name, 'OrderTrack'),
    slug: str(data?.slug),
    phone: str(data?.phone),
    address: str(data?.address),
    currency: 'IDR',
    tax_rate: 0,
  };
}

export async function getPublicOrder(token: string): Promise<PublicOrderInfo | null> {
  const admin = createAdminClient();
  const hash = createHash('sha256').update(token).digest('hex');
  const { data, error } = await admin.rpc('get_public_order_by_token', { p_token_hash: hash });

  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object' || Object.keys(data as object).length === 0) return null;
  return data as PublicOrderInfo;
}
