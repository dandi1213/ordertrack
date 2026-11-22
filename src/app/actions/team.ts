'use server';

import { revalidatePath } from 'next/cache';
import { getAppOrigin } from '@/lib/appOrigin';
import { createAdminClient } from '@/lib/supabase/admin';
import { can, getSessionUser } from '@/lib/auth';
import { DEFAULT_STAFF_PERMISSIONS, PERMISSION_KEYS } from '@/lib/constants';
import { isEmail, text } from '@/lib/validation';
import { ActionResult } from '@/types';

type InviteResult = ActionResult<{ email: string }>;

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
    const origin = await getAppOrigin();

    // Undangan Supabase: staf menerima email dan membuat kata sandinya sendiri.
    // Tidak ada kata sandi sementara yang perlu disalin atau bisa "kedaluwarsa".
    const { data: created, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/callback`,
      data: { full_name: fullName, must_set_password: true },
    });

    const userId = created.user?.id;
    if (inviteError || !userId) {
      const message = inviteError?.message.toLowerCase() ?? '';
      if (message.includes('already') || message.includes('registered')) {
        return { ok: false, error: 'Email ini sudah terdaftar pada sistem.' };
      }
      if (message.includes('rate limit')) {
        return {
          ok: false,
          error:
            'Kuota email bawaan Supabase habis (maks. 2 email/jam). Tunggu sekitar 1 jam atau pasang SMTP custom, lalu coba lagi.',
        };
      }
      return { ok: false, error: inviteError?.message ?? 'Gagal mengirim undangan staf.' };
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
    return { ok: true, data: { email } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal mengundang staf.' };
  }
}

export async function resendStaffInviteAction(formData: FormData): Promise<ActionResult> {
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
      .select('id, role, user_id')
      .eq('id', memberId)
      .eq('business_id', user.businessId)
      .maybeSingle();

    if (!member || member.role !== 'staff') {
      return { ok: false, error: 'Staf tidak ditemukan pada bisnis ini.' };
    }

    const { data: authUser } = await admin.auth.admin.getUserById(member.user_id);
    const email = authUser.user?.email;
    if (!email) return { ok: false, error: 'Email staf tidak ditemukan.' };

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', member.user_id)
      .maybeSingle();

    const origin = await getAppOrigin();
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/callback`,
      data: { full_name: profile?.full_name ?? '', must_set_password: true },
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('rate limit')) {
        return {
          ok: false,
          error:
            'Kuota email bawaan Supabase habis (maks. 2 email/jam). Tunggu sekitar 1 jam atau pasang SMTP custom, lalu coba lagi.',
        };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath('/team');
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Gagal mengirim ulang undangan.',
    };
  }
}

export async function deleteStaffAction(formData: FormData): Promise<ActionResult> {
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
      .select('id, role, user_id')
      .eq('id', memberId)
      .eq('business_id', user.businessId)
      .maybeSingle();

    if (!member) return { ok: false, error: 'Staf tidak ditemukan pada bisnis ini.' };
    if (member.role !== 'staff') return { ok: false, error: 'Owner tidak dapat dihapus.' };
    if (member.user_id === user.id) return { ok: false, error: 'Anda tidak dapat menghapus akun sendiri.' };

    const { error: memberError } = await admin
      .from('business_members')
      .delete()
      .eq('id', memberId)
      .eq('business_id', user.businessId);

    if (memberError) return { ok: false, error: memberError.message };

    const { error: authError } = await admin.auth.admin.deleteUser(member.user_id);
    if (authError) return { ok: false, error: authError.message };

    revalidatePath('/team');
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal menghapus staf.' };
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
