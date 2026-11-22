# OrderTrack — Rencana Integrasi Backend & Data Nyata (Fase 3)

Skope: seluruh fitur MVP, dikerjakan menyeluruh sesuai permintaan pengguna.

## Tahap A — Perbaikan database
- [x] Skrip `supabase/migrations/002_rls_grants_and_functions.sql`
  - GRANT schema/tabel untuk `authenticated`, RPC untuk `anon`
  - RLS policy per tabel berdasarkan `business_members`
  - Helper `current_business_ids()`, `has_permission(text)`
  - Trigger profile otomatis saat daftar, trigger `updated_at`
  - Index unik owner aktif dan hash token tracking
  - RPC `get_public_order_by_token(text)` yang hanya mengembalikan field publik
- [x] Skrip 002 sudah dieksekusi di SQL Editor (RPC terverifikasi ada di schema cache)
- [x] Perbaikan `permission denied for table profiles`:
  - `003_service_role_grants.sql` — GRANT eksplisit `service_role` + `ALTER DEFAULT PRIVILEGES`
  - `002` juga diperbarui untuk instalasi bersih
  - `registerAction` tahan retry: pulihkan akun yatim & cek profil sebelum INSERT
- [ ] **Eksekusi skrip 003 di Supabase SQL Editor (langkah manual, butuh akses Dashboard)**
  - SQL Editor: https://supabase.com/dashboard/project/lmocczpcvkedxcgppagt/sql

## Tahap B — Autentikasi & proteksi rute
- [x] Supabase Auth via Server Action (login, register owner, logout)
- [x] Registrasi membuat `profiles`, `businesses`, `business_members` (role owner)
- [x] `proxy.ts` (Next.js 16, pengganti `middleware.ts`) untuk refresh sesi & proteksi rute
- [x] Profil user asli di Header/Sidebar, tombol keluar
- [x] Error state + loading state pada form
- [x] Suspense boundary untuk sessi & searchParams (Cache Components)

## Tahap C — CRUD & aturan bisnis
- [x] Query service server-side (admin client, selalu dibatasi `business_id`)
- [x] Pesanan: buat dengan nomor unik per bisnis + hash token tracking + status awal `received`
- [x] Status: update + catat `order_status_history`, cek izin `update_order_status`
- [x] Pembayaran: validasi nominal > 0 dan total tidak melebihi `total_price`
- [x] Tim: undang staf, ubah izin JSONB, aktif/nonaktifkan (cek `manage_staff`)
- [x] Pengaturan bisnis: update data `businesses` (cek `manage_business_settings`)
- [x] Akun: ganti email, ganti kata sandi, hapus akun (dengan konfirmasi password)
- [x] WhatsApp manual: 4 template, simpan `notification_logs` sebagai "pesan disiapkan"
- [x] Tracking publik: hash token, RPC, hanya field publik, rate limiting

## Tahap D — Integrasi frontend
- [x] Hapus seluruh `mockData` / Jotai atom / `dbService` dari proyek
- [x] Dashboard, Orders, Create Order, Detail Order, Payments, Team, Settings, Tracking
- [x] Loading state, empty state, error state, notifikasi sukses/gagal
- [x] Guard izin per halaman (selain guard pada Server Action & RLS)

## Tahap E — Verifikasi
- [x] `npm run lint` — lolos (0 error)
- [x] `npm run build` — lolos (Next.js 16.4.6, Cache Components + Partial Prerender)
- [ ] Uji end-to-end di browser setelah skrip 002 dijalankan
