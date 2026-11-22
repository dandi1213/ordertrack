import { cache } from 'react';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SessionUser } from '@/types';

/** Mengambil konteks pengguna + keanggotaan bisnis dari sesi Supabase Auth. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from('business_members')
    .select('business_id, role, permissions, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!membership) return null;

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const permissions =
    membership.permissions && typeof membership.permissions === 'object'
      ? (membership.permissions as Record<string, boolean>)
      : {};

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profile?.full_name || user.email?.split('@')[0] || 'Pengguna',
    role: membership.role === 'owner' ? 'owner' : 'staff',
    businessId: membership.business_id,
    permissions,
  };
});

export function can(user: SessionUser, permission: string): boolean {
  if (user.role === 'owner') return true;
  return user.permissions?.[permission] === true;
}

/** Helper untuk Server Action: mengembalikan error bila tidak berhak. */
export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error('Anda harus masuk terlebih dahulu.');
  if (!can(user, permission)) throw new Error('Anda tidak memiliki izin untuk melakukan aksi ini.');
  return user;
}
