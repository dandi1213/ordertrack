export type OrderStatus = 'received' | 'in_progress' | 'ready' | 'completed';

export type Permission =
  | 'view_dashboard'
  | 'view_orders'
  | 'create_orders'
  | 'edit_orders'
  | 'update_order_status'
  | 'view_payments'
  | 'record_payments'
  | 'manage_staff'
  | 'manage_business_settings';

export type Permissions = Record<Permission, boolean>;

export const PERMISSION_KEYS: Permission[] = [
  'view_dashboard',
  'view_orders',
  'create_orders',
  'edit_orders',
  'update_order_status',
  'view_payments',
  'record_payments',
  'manage_staff',
  'manage_business_settings',
];

export interface Business {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
}

export interface Membership {
  id: string;
  business_id: string;
  user_id: string;
  role: 'owner' | 'staff';
  permissions: Partial<Permissions> | null;
  is_active: boolean;
  joined_at: string;
}

export interface AuthContext {
  user: { id: string; email: string };
  profile: Profile;
  business: Business;
  membership: Membership;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes?: string;
  recorded_by_name: string;
}

export type PaymentRecord = Payment;

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by_name: string;
  notes?: string;
  created_at: string;
}

export type StatusHistoryRecord = OrderStatusHistoryItem;

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  quantity: number;
  specifications: string;
  notes?: string;
  total_price: number;
  deadline: string;
  status: OrderStatus;
  tracking_token: string;
  created_at: string;
  updated_at: string;
  payments: Payment[];
  status_history: OrderStatusHistoryItem[];
}

export interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'owner' | 'staff';
  permissions: Permissions;
  is_active: boolean;
  joined_at: string;
}

export interface BusinessSettings {
  name: string;
  slug: string;
  phone: string;
  address: string;
  currency: string;
  tax_rate: number;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: 'owner' | 'staff';
  businessId: string;
  permissions: Record<string, boolean>;
}

export interface PublicOrderInfo {
  business_name: string;
  order_number: string;
  product_name: string;
  status: OrderStatus;
  deadline: string;
  is_paid: boolean;
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> };

export interface PublicTrackingData {
  business_name: string;
  order_number: string;
  product_name: string;
  status: OrderStatus;
  deadline: string;
  is_paid: boolean;
  updated_at: string;
}

export interface ActionState {
  error?: string;
  success?: string;
}
