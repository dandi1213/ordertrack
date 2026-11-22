-- OrderTrack — Tahap A: Grants, Row Level Security, triggers, dan RPC publik
-- Jalankan skrip ini di Supabase Dashboard > SQL Editor (proyek yang sama dengan .env).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Helper functions untuk authorization (dipakai RLS policy)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_business_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT business_id
  FROM public.business_members
  WHERE user_id = auth.uid()
    AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.user_id = auth.uid()
      AND bm.is_active = true
      AND (
        bm.role = 'owner'
        OR COALESCE((bm.permissions ->> p_permission)::boolean, false)
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Trigger: membuat profile otomatis saat akun Auth dibuat
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
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

-- ---------------------------------------------------------------------------
-- 3. Trigger: menjaga updated_at pada orders
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Constraint tambahan sesuai aturan bisnis PRD
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS one_active_owner_per_business
  ON public.business_members (business_id)
  WHERE role = 'owner' AND is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS unique_tracking_token_hash
  ON public.orders (tracking_token_hash);

-- ---------------------------------------------------------------------------
-- 5. Hak akses dasar. Anon TIDAK diberi akses tabel; tracking memakai RPC.
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- Server actions memakai service_role untuk operasi lintas tenant (registrasi, dll).
-- RLS dilewati, tetapi GRANT level tabel tetap wajib.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.current_business_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- businesses
DROP POLICY IF EXISTS "businesses_read_member" ON public.businesses;
CREATE POLICY "businesses_read_member" ON public.businesses
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.current_business_ids()));

DROP POLICY IF EXISTS "businesses_update_admin" ON public.businesses;
CREATE POLICY "businesses_update_admin" ON public.businesses
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT public.current_business_ids())
    AND public.has_permission('manage_business_settings')
  );

-- profiles
DROP POLICY IF EXISTS "profiles_read_self_or_coworker" ON public.profiles;
CREATE POLICY "profiles_read_self_or_coworker" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR id IN (
      SELECT user_id FROM public.business_members
      WHERE business_id IN (SELECT public.current_business_ids())
    )
  );

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- business_members
DROP POLICY IF EXISTS "members_read_same_business" ON public.business_members;
CREATE POLICY "members_read_same_business" ON public.business_members
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT public.current_business_ids()));

DROP POLICY IF EXISTS "members_owner_manage" ON public.business_members;
CREATE POLICY "members_owner_manage" ON public.business_members
  FOR ALL TO authenticated
  USING (
    business_id IN (SELECT public.current_business_ids())
    AND public.has_permission('manage_staff')
  )
  WITH CHECK (
    business_id IN (SELECT public.current_business_ids())
    AND public.has_permission('manage_staff')
  );

-- customers
DROP POLICY IF EXISTS "customers_all_scoped" ON public.customers;
CREATE POLICY "customers_all_scoped" ON public.customers
  FOR ALL TO authenticated
  USING (business_id IN (SELECT public.current_business_ids()))
  WITH CHECK (business_id IN (SELECT public.current_business_ids()));

-- orders
DROP POLICY IF EXISTS "orders_read_scoped" ON public.orders;
CREATE POLICY "orders_read_scoped" ON public.orders
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT public.current_business_ids()));

DROP POLICY IF EXISTS "orders_insert_scoped" ON public.orders;
CREATE POLICY "orders_insert_scoped" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id IN (SELECT public.current_business_ids())
    AND public.has_permission('create_orders')
  );

DROP POLICY IF EXISTS "orders_update_scoped" ON public.orders;
CREATE POLICY "orders_update_scoped" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    business_id IN (SELECT public.current_business_ids())
    AND (
      public.has_permission('edit_orders')
      OR public.has_permission('update_order_status')
    )
  );

-- payments
DROP POLICY IF EXISTS "payments_read_scoped" ON public.payments;
CREATE POLICY "payments_read_scoped" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
        AND o.business_id IN (SELECT public.current_business_ids())
    )
  );

DROP POLICY IF EXISTS "payments_insert_scoped" ON public.payments;
CREATE POLICY "payments_insert_scoped" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('record_payments')
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
        AND o.business_id IN (SELECT public.current_business_ids())
    )
  );

-- order_status_history
DROP POLICY IF EXISTS "history_read_scoped" ON public.order_status_history;
CREATE POLICY "history_read_scoped" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND o.business_id IN (SELECT public.current_business_ids())
    )
  );

DROP POLICY IF EXISTS "history_insert_scoped" ON public.order_status_history;
CREATE POLICY "history_insert_scoped" ON public.order_status_history
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('update_order_status')
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND o.business_id IN (SELECT public.current_business_ids())
    )
  );

-- notification_logs
DROP POLICY IF EXISTS "logs_read_scoped" ON public.notification_logs;
CREATE POLICY "logs_read_scoped" ON public.notification_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = notification_logs.order_id
        AND o.business_id IN (SELECT public.current_business_ids())
    )
  );

DROP POLICY IF EXISTS "logs_insert_scoped" ON public.notification_logs;
CREATE POLICY "logs_insert_scoped" ON public.notification_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = notification_logs.order_id
        AND o.business_id IN (SELECT public.current_business_ids())
    )
  );

-- ---------------------------------------------------------------------------
-- 7. RPC publik untuk tracking: hanya field yang diizinkan, tanpa login.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_order_by_token(p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'business_name', b.name,
    'order_number', o.order_number,
    'product_name', o.product_name,
    'status', o.status,
    'deadline', o.deadline,
    'is_paid', COALESCE(
      (SELECT SUM(p.amount) FROM public.payments p WHERE p.order_id = o.id) >= o.total_price,
      false
    )
  )
  INTO v_result
  FROM public.orders o
  JOIN public.businesses b ON b.id = o.business_id
  WHERE o.tracking_token_hash = p_token_hash
  LIMIT 1;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_order_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order_by_token(text) TO anon, authenticated;
