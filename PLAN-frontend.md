# PLAN-frontend.md — Fase 2 (Frontend Murni, Data Dummy)

Status: **Selesai** (dikerjakan dalam satu giliran atas permintaan pengguna).

## Prinsip

- Semua data berasal dari mock lokal (`src/lib/mockData.ts`) melalui state Jotai (`src/lib/store.ts`).
- Tidak ada query database, API route, atau server action pada fase ini.
- Token visual mengikuti `design.md` (warna hex, radius, tipografi Inter).

## Checklist Tahap

### Tahap 1 — Komponen Dasar & Navigasi
- [x] `src/components/Sidebar.tsx` — navigasi utama, active state, profil pengguna
- [x] `src/components/Header.tsx` — judul halaman, pencarian, notifikasi, dropdown profil
- [x] `src/components/DashboardShell.tsx` — shell layout desktop/mobile drawer
- [x] `app/(dashboard)/layout.tsx` — layout internal + Suspense skeleton
- [x] `src/lib/utils.ts` — format Rupiah, format tanggal, label & warna status, overdue
- [x] `src/lib/store.ts` + `src/types/index.ts` — state mock & tipe data

### Tahap 2 — Autentikasi (UI)
- [x] `app/(auth)/login/page.tsx` — Login (`design-ref/01-login.html`)
- [x] `app/(auth)/register/page.tsx` — Registrasi Owner / Daftar Bisnis (`design-ref/01-login.html`, tab "Daftar Bisnis"): validasi inline, indikator kekuatan kata sandi, loading state, dan pengisian nama bisnis ke state global

### Tahap 3 — Layar Jangkar & Pesanan
- [x] `app/(dashboard)/dashboard/page.tsx` — Dashboard (`02-dashboard.html`)
- [x] `app/(dashboard)/orders/page.tsx` — Daftar Pesanan (`03-orders.html`)
- [x] `app/(dashboard)/orders/[id]/page.tsx` + `src/features/orders/OrderDetailView.tsx` — Detail Pesanan / Anchor Screen (`04-order-detail.html`)
- [x] `app/(dashboard)/orders/create/page.tsx` — Buat Pesanan (`05-create-order.html`)

### Tahap 4 — Pembayaran, Tim, Pengaturan
- [x] `app/(dashboard)/payments/page.tsx` — Pembayaran (`06-payments.html`)
- [x] `app/(dashboard)/team/page.tsx` — Tim / Staff (`07-team.html`): undang staf, aktif/nonaktif, dan modal **Kelola Izin** (9 permission PRD 2.4 dengan toggle per fitur, grup Operasional/Keuangan/Administrasi, reset default, owner read-only)
- [x] `app/(dashboard)/settings/page.tsx` — Pengaturan Bisnis (`08-settings.html`): tab Informasi Bisnis + tab Akun, dengan modal fungsional **Ganti Email**, **Ganti Kata Sandi**, dan **Hapus Akun** (validasi + konfirmasi ketik "HAPUS" + toast sukses/gagal)

### Tahap 5 — Public Tracking & Verifikasi
- [x] `app/track/[token]/page.tsx` + `src/features/tracking/TrackingView.tsx` — Public Tracking (`09-public-tracking.html`)
- [x] Branding: `app/icon.svg` sebagai favicon (logo paket biru), `favicon.ico` bawaan Next.js dihapus, dan `devIndicators: false` agar badge "N" dev server tidak tampil
- [x] Redirect `/` → `/dashboard`
- [x] Interaksi UI: modal tambah pembayaran, modal ubah status, modal undang staf, filter tab status, pencarian, salin tautan tracking, tombol WhatsApp `wa.me`
- [x] `npm run lint` bersih tanpa error
- [x] `npm run build` sukses (14 halaman ter-generate)

## Catatan Teknis

- Next.js 16 dengan `cacheComponents` + `partialPrefetching`: hook `usePathname`/`useParams`
  dibungkus `<Suspense>` (layout shell dan route dinamis) agar lolos prerender.
- Perhitungan "terlambat" memakai tanggal acuan tetap `MOCK_TODAY` supaya deterministik
  antara render server dan browser (menghindari hydration mismatch).
