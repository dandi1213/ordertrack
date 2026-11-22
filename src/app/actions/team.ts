'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { can, getSessionUser } from '@/lib/auth';
import { DEFAULT_STAFF_PERMISSIONS, PERMISSION_KEYS } from '@/lib/constants';
import { isEmail, text } from '@/lib/validation';
import { ActionResult } from '@/types';

type InviteResult = ActionResult<{ temporaryPassword: string; email: string }>;

function parsePermissions(formData: FormData): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const key of PERMISSION_KEYS) {
    result[key] = formData.get(`permission_${key}`) === 'on';
  }
  return result;
}

export async function inviteStaffAction(formData: FormData): Promise<InviteResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    if (!can(user, 'manage_staff')) {
      return { ok: false, error: 'Anda tidak memiliki izin mengelola staf.' };
    }

    const fullName = text(formData, 'fullName');
    const email = text(formData, 'email').toLowerCase();

    if (fullName.length < 3) return { ok: false, error: 'Nama lengkap minimal 3 karakter.' };
    if (!isEmail(email)) return { ok: false, error: 'Format email staf tidak valid.' };

    const role = text(formData, 'role') === 'owner' ? 'owner' : 'staff';
    if (role === 'owner') {
      return { ok: false, error: 'Owner hanya bisa dibuat saat registrasi bisnis.' };
    }

    const admin = createAdminClient();
    const temporaryPassword = `Stf-${randomBytes(9).toString('base64url').slice(0, 14)}Aa1!`;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    const userId = created.user?.id;
    if (createError || !userId) {
      if (createError?.message.toLowerCase().includes('already')) {
        return { ok: false, error: 'Email ini sudah terdaftar pada sistem.' };
      }
      return { ok: false, error: createError?.message ?? 'Gagal membuat akun staf.' };
    }

    const { error: profileError } = await admin
      .from('profiles')
      .upsert({ id: userId, full_name: fullName }, { onConflict: 'id', ignoreDuplicates: true });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return { ok: false, error: `Gagal membuat profil staf: ${profileError.message}` };
    }

    const { error: memberError } = await admin.from('business_members').insert({
      business_id: user.businessId,
      user_id: userId,
      role: 'staff',
      permissions: DEFAULT_STAFF_PERMISSIONS,
      is_active: true,
    });

    if (memberError) {
      await admin.auth.admin.deleteUser(userId);
      return { ok: false, error: `Gagal menambahkan staf ke bisnis: ${memberError.message}` };
    }

    revalidatePath('/team');
    return { ok: true, data: { temporaryPassword, email } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal mengundang staf.' };
  }
}

export async function updateStaffPermissionsAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    if (!can(user, 'manage_staff')) {
      return { ok: false, error: 'Anda tidak memiliki izin mengelola staf.' };
    }

    const memberId = text(formData, 'memberId');
    if (!memberId) return { ok: false, error: 'Staf tidak ditemukan.' };

    const permissions = parsePermissions(formData);
    const admin = createAdminClient();

    const { data: member } = await admin
      .from('business_members')
      .select('id, role')
      .eq('id', memberId)
      .eq('business_id', user.businessId)
      .maybeSingle();

    if (!member) return { ok: false, error: 'Staf tidak ditemukan pada bisnis ini.' };
    if (member.role === 'owner') {
      return { ok: false, error: 'Izin owner tidak dapat diubah.' };
    }

    const { error } = await admin
      .from('business_members')
      .update({ permissions })
      .eq('id', memberId)
      .eq('business_id', user.businessId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/team');
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal menyimpan izin.' };
  }
}

export async function toggleStaffActiveAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    if (!can(user, 'manage_staff')) {
      return { ok: false, error: 'Anda tidak memiliki izin mengelola staf.' };
    }

    const memberId = text(formData, 'memberId');
    if (!memberId) return { ok: false, error: 'Staf tidak ditemukan.' };

    const admin = createAdminClient();
    const { data: member } = await admin
      .from('business_members')
      .select('id, role, is_active, user_id')
      .eq('id', memberId)
      .eq('business_id', user.businessId)
      .maybeSingle();

    if (!member) return { ok: false, error: 'Staf tidak ditemukan pada bisnis ini.' };
    if (member.role === 'owner') {
      return { ok: false, error: 'Status owner tidak dapat dinonaktifkan.' };
    }
    if (member.user_id === user.id) {
      return { ok: false, error: 'Anda tidak dapat menonaktifkan akun sendiri.' };
    }

    const { error } = await admin
      .from('business_members')
      .update({ is_active: !member.is_active })
      .eq('id', memberId)
      .eq('business_id', user.businessId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/team');
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal mengubah status staf.' };
  }
}
