-- OrderTrack — Perbaikan: hak akses eksplisit untuk peran service_role.
-- Jalankan di Supabase Dashboard > SQL Editor.
--
-- Gejala: "Gagal membuat profil: permission denied for table profiles"
-- Penyebab: kunci SUPABASE_SERVICE_ROLE_KEY memetakan ke peran Postgres `service_role`,
--          tetapi peran tersebut tidak memiliki GRANT pada tabel public di proyek ini.
--          RLS dilewati oleh service_role, tetapi GRANT tabel tetap diperlukan.

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Agar tabel baru yang dibuat kemudian tetap bisa diakses service_role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- Verifikasi (opsional): harus menampilkan INSERT/SELECT/UPDATE/DELETE untuk profiles.
-- SELECT privilege_type FROM information_schema.role_table_grants
-- WHERE grantee = 'service_role' AND table_schema = 'public' AND table_name = 'profiles';
