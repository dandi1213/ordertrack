import { OrderStatus } from "@/types";

/** Urutan progres pengerjaan (dipakai stepper tracking). */
export const ORDER_STATUSES: OrderStatus[] = ["received", "in_progress", "ready", "completed"];

/** Semua status yang bisa dipilih, termasuk pembatalan. */
export const ALL_ORDER_STATUSES: OrderStatus[] = ["received", "in_progress", "ready", "completed", "cancelled"];

export const PAYMENT_METHODS: string[] = ["Transfer", "QRIS", "Tunai / Cash"];

export const PERMISSION_KEYS = ["view_dashboard", "view_orders", "create_orders", "edit_orders", "update_order_status", "view_payments", "record_payments", "manage_staff", "manage_business_settings"] as const;

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

export const WHATSAPP_TEMPLATES: Record<OrderStatus, { label: string; build: (p: { customer: string; product: string; orderNumber: string; trackingUrl: string }) => string }> = {
  received: {
    label: "Pesanan diterima",
    build: ({ customer, product, orderNumber, trackingUrl }) =>
      `Halo ${customer},

Terima kasih telah melakukan pemesanan kepada kami.

Berikut detail pesanan Anda:

• No. Pesanan: ${orderNumber}
• Produk: ${product}
• Status: *Pesanan diterima*

Pesanan Anda telah berhasil kami terima dan akan segera masuk ke proses pengerjaan.

Anda dapat melihat perkembangan pesanan melalui tautan berikut:
${trackingUrl}

Terima kasih telah mempercayakan pesanan Anda kepada kami.`,
  },
  in_progress: {
    label: "Pesanan sedang dikerjakan",
    build: ({ customer, product, orderNumber, trackingUrl }) =>
      `Halo ${customer},

Kami ingin menginformasikan bahwa pesanan Anda saat ini sudah memasuki tahap pengerjaan.

Berikut detail pesanan Anda:

• No. Pesanan: ${orderNumber}
• Produk: ${product}
• Status: Sedang dikerjakan

Tim kami sedang memproses pesanan Anda. Kami akan memberikan informasi kembali setelah pesanan selesai.

Lihat perkembangan terbaru pesanan Anda melalui tautan berikut:
${trackingUrl}

Terima kasih atas kepercayaan dan kesabaran Anda.`,
  },
  ready: {
    label: "Pesanan siap",
    build: ({ customer, product, orderNumber, trackingUrl }) =>
      `Halo ${customer},

Kami ingin menginformasikan bahwa pesanan Anda telah selesai diproses.

Berikut detail pesanan Anda:

• No. Pesanan: ${orderNumber}
• Produk: ${product}
• Status: Siap diambil/dikirim

Pesanan Anda sudah siap. Silakan lakukan pengambilan atau tunggu proses pengiriman sesuai kesepakatan.

Untuk melihat detail lebih lanjut, silakan kunjungi:
${trackingUrl}

Terima kasih telah melakukan pemesanan kepada kami.`,
  },
  completed: {
    label: "Pesanan selesai",
    build: ({ customer, product, orderNumber, trackingUrl }) =>
      `Halo ${customer},

Kami ingin menginformasikan bahwa pesanan Anda telah berhasil diselesaikan.

Berikut detail pesanan Anda:

• No. Pesanan: ${orderNumber}
• Produk: ${product}
• Status: Selesai

Terima kasih telah mempercayakan pesanan Anda kepada kami. Semoga Anda puas dengan hasil dan layanan yang kami berikan.

Anda dapat melihat detail dan riwayat pesanan melalui tautan berikut:
${trackingUrl}

Kami tunggu pesanan Anda berikutnya.`,
  },
  cancelled: {
    label: "Pesanan dibatalkan",
    build: ({ customer, product, orderNumber }) =>
      `Halo ${customer},

Kami ingin menginformasikan bahwa pesanan Anda telah dibatalkan.

Berikut detail pesanan Anda:

• No. Pesanan: ${orderNumber}
• Produk: ${product}
• Status: Dibatalkan

Mohon maaf atas ketidaknyamanan yang mungkin terjadi.

Jika Anda memiliki pertanyaan atau membutuhkan informasi lebih lanjut, silakan hubungi kami.

Terima kasih atas pengertian Anda.`,
  },
};
