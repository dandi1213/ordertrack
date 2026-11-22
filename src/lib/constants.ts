import { OrderStatus } from '@/types';

export const ORDER_STATUSES: OrderStatus[] = ['received', 'in_progress', 'ready', 'completed'];

export const PAYMENT_METHODS: string[] = ['Transfer', 'QRIS', 'Tunai / Cash'];

export const PERMISSION_KEYS = [
  'view_dashboard',
  'view_orders',
  'create_orders',
  'edit_orders',
  'update_order_status',
  'view_payments',
  'record_payments',
  'manage_staff',
  'manage_business_settings',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const DEFAULT_STAFF_PERMISSIONS: Record<PermissionKey, boolean> = {
  view_dashboard: true,
  view_orders: true,
  create_orders: true,
  edit_orders: false,
  update_order_status: true,
  view_payments: true,
  record_payments: true,
  manage_staff: false,
  manage_business_settings: false,
};

export const WHATSAPP_TEMPLATES: Record<
  OrderStatus,
  { label: string; build: (p: { customer: string; product: string; orderNumber: string; trackingUrl: string }) => string }
> = {
  received: {
    label: 'Pesanan diterima',
    build: ({ customer, product, orderNumber, trackingUrl }) =>
      `Halo ${customer}, pesanan Anda ${orderNumber} (${product}) telah kami terima. Pantau progresnya di: ${trackingUrl}`,
  },
  in_progress: {
    label: 'Pesanan sedang dikerjakan',
    build: ({ customer, product, orderNumber, trackingUrl }) =>
      `Halo ${customer}, pesanan Anda ${orderNumber} (${product}) sedang kami kerjakan. Cek progres terbaru: ${trackingUrl}`,
  },
  ready: {
    label: 'Pesanan siap',
    build: ({ customer, product, orderNumber, trackingUrl }) =>
      `Halo ${customer}, pesanan Anda ${orderNumber} (${product}) sudah siap diambil/dikirim. Detail: ${trackingUrl}`,
  },
  completed: {
    label: 'Pesanan selesai',
    build: ({ customer, product, orderNumber, trackingUrl }) =>
      `Halo ${customer}, pesanan Anda ${orderNumber} (${product}) telah selesai. Terima kasih! Riwayat: ${trackingUrl}`,
  },
};
