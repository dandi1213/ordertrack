-- OrderTrack — Menambahkan status pesanan "Dibatalkan" (cancelled).
-- Jalankan di Supabase Dashboard > SQL Editor.
--
-- Tanpa migrasi ini, UPDATE status menjadi 'cancelled' akan gagal karena
-- constraint lama hanya mengizinkan received/in_progress/ready/completed.

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('received', 'in_progress', 'ready', 'completed', 'cancelled'));

-- Verifikasi (opsional):
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.orders'::regclass AND conname = 'orders_status_check';
