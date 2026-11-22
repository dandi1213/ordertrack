-- OrderTrack — Security, RLS, dan Helper Functions
-- Jalankan file ini SETELAH 001_initial_schema.sql

-- ============================================================
-- 1. Helper Functions (SECURITY DEFINER agar tidak rekursif RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_owner(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.is_active
      AND bm.role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_business_permission(p_business_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members bm
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.is_active
      AND (
        bm.role = 'owner'
        OR COALESCE((bm.permissions ->> p_permission)::BOOLEAN, FALSE)
      )
  );
$$;

-- ============================================================
-- 2. Trigger: profil otomatis saat user Supabase Auth dibuat
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      split_part(COALESCE(NEW.email, 'pengguna'), '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profil untuk akun yang sudah terdaftar sebelum trigger dibuat
INSERT INTO public.profiles (id, full_name)
SELECT
  u.id,
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
    split_part(COALESCE(u.email, 'pengguna'), '@', 1)
  )
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Trigger updated_at pada orders
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. Aktifkan Row Level Security
-- ============================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Grants (role aplikasi)
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.is_business_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_business_permission(UUID, TEXT) TO authenticated;

-- ============================================================
-- 6. Policies
-- ============================================================

-- ---------- profiles ----------
DROP POLICY IF EXISTS "profiles_select_self_or_colleague" ON profiles;
CREATE POLICY "profiles_select_self_or_colleague" ON profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM business_members me
      JOIN business_members other ON other.business_id = me.business_id
      WHERE me.user_id = auth.uid() AND me.is_active
        AND other.user_id = profiles.id
    )
  );

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------- businesses ----------
DROP POLICY IF EXISTS "businesses_select_member" ON businesses;
CREATE POLICY "businesses_select_member" ON businesses
  FOR SELECT TO authenticated
  USING (public.is_business_member(id));

DROP POLICY IF EXISTS "businesses_insert_authenticated" ON businesses;
CREATE POLICY "businesses_insert_authenticated" ON businesses
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "businesses_update_owner" ON businesses;
CREATE POLICY "businesses_update_owner" ON businesses
  FOR UPDATE TO authenticated
  USING (public.is_business_owner(id))
  WITH CHECK (public.is_business_owner(id));

-- ---------- business_members ----------
DROP POLICY IF EXISTS "business_members_select_same_business" ON business_members;
CREATE POLICY "business_members_select_same_business" ON business_members
  FOR SELECT TO authenticated
  USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "business_members_insert_owner" ON business_members;
CREATE POLICY "business_members_insert_owner" ON business_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_business_owner(business_id));

DROP POLICY IF EXISTS "business_members_update_owner" ON business_members;
CREATE POLICY "business_members_update_owner" ON business_members
  FOR UPDATE TO authenticated
  USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

DROP POLICY IF EXISTS "business_members_delete_owner" ON business_members;
CREATE POLICY "business_members_delete_owner" ON business_members
  FOR DELETE TO authenticated
  USING (public.is_business_owner(business_id));

-- ---------- customers ----------
DROP POLICY IF EXISTS "customers_select_member" ON customers;
CREATE POLICY "customers_select_member" ON customers
  FOR SELECT TO authenticated
  USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "customers_insert_perm" ON customers;
CREATE POLICY "customers_insert_perm" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_business_permission(business_id, 'create_orders'));

DROP POLICY IF EXISTS "customers_update_perm" ON customers;
CREATE POLICY "customers_update_perm" ON customers
  FOR UPDATE TO authenticated
  USING (public.has_business_permission(business_id, 'edit_orders'))
  WITH CHECK (public.has_business_permission(business_id, 'edit_orders'));

-- ---------- orders ----------
DROP POLICY IF EXISTS "orders_select_member" ON orders;
CREATE POLICY "orders_select_member" ON orders
  FOR SELECT TO authenticated
  USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "orders_insert_perm" ON orders;
CREATE POLICY "orders_insert_perm" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (public.has_business_permission(business_id, 'create_orders'));

DROP POLICY IF EXISTS "orders_update_perm" ON orders;
CREATE POLICY "orders_update_perm" ON orders
  FOR UPDATE TO authenticated
  USING (
    public.has_business_permission(business_id, 'edit_orders')
    OR public.has_business_permission(business_id, 'update_order_status')
  )
  WITH CHECK (
    public.has_business_permission(business_id, 'edit_orders')
    OR public.has_business_permission(business_id, 'update_order_status')
  );

-- ---------- payments (tanpa DELETE: koreksi harus diaudit) ----------
DROP POLICY IF EXISTS "payments_select_member" ON payments;
CREATE POLICY "payments_select_member" ON payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = payments.order_id
        AND public.has_business_permission(o.business_id, 'view_payments')
    )
  );

DROP POLICY IF EXISTS "payments_insert_perm" ON payments;
CREATE POLICY "payments_insert_perm" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = payments.order_id
        AND public.has_business_permission(o.business_id, 'record_payments')
    )
  );

-- ---------- order_status_history ----------
DROP POLICY IF EXISTS "order_status_history_select_member" ON order_status_history;
CREATE POLICY "order_status_history_select_member" ON order_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_status_history.order_id
        AND public.is_business_member(o.business_id)
    )
  );

DROP POLICY IF EXISTS "order_status_history_insert_perm" ON order_status_history;
CREATE POLICY "order_status_history_insert_perm" ON order_status_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_status_history.order_id
        AND public.has_business_permission(o.business_id, 'update_order_status')
    )
  );

-- ---------- notification_logs ----------
DROP POLICY IF EXISTS "notification_logs_select_member" ON notification_logs;
CREATE POLICY "notification_logs_select_member" ON notification_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = notification_logs.order_id
        AND public.is_business_member(o.business_id)
    )
  );

DROP POLICY IF EXISTS "notification_logs_insert_perm" ON notification_logs;
CREATE POLICY "notification_logs_insert_perm" ON notification_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = notification_logs.order_id
        AND public.has_business_permission(o.business_id, 'view_orders')
    )
  );

-- ============================================================
-- 7. Public Tracking (tanpa login, hanya field aman)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_tracking(p_token_hash TEXT)
RETURNS TABLE (
  business_name TEXT,
  order_number TEXT,
  product_name TEXT,
  quantity INTEGER,
  status TEXT,
  deadline DATE,
  is_paid BOOLEAN,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    b.name,
    o.order_number,
    o.product_name,
    o.quantity,
    o.status,
    o.deadline,
    COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.order_id = o.id), 0) >= o.total_price AS is_paid,
    o.updated_at
  FROM orders o
  JOIN businesses b ON b.id = o.business_id
  WHERE o.tracking_token_hash = p_token_hash
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_tracking(TEXT) TO anon, authenticated;
