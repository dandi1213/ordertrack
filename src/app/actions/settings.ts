'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { can, getSessionUser } from '@/lib/auth';
import { text } from '@/lib/validation';
import { ActionResult } from '@/types';

export async function updateBusinessSettingsAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
    if (!can(user, 'manage_business_settings')) {
      return { ok: false, error: 'Anda tidak memiliki izin mengubah pengaturan bisnis.' };
    }

    const name = text(formData, 'name');
    const slug = text(formData, 'slug')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
    const phone = text(formData, 'phone');
    const address = text(formData, 'address');

    if (name.length < 3) return { ok: false, error: 'Nama bisnis minimal 3 karakter.' };
    if (slug.length < 3) return { ok: false, error: 'Slug minimal 3 karakter.' };

    const admin = createAdminClient();
    const { error } = await admin
      .from('businesses')
      .update({ name, slug, phone, address })
      .eq('id', user.businessId);

    if (error) {
      if (error.code === '23505') {
        return { ok: false, error: 'Slug sudah digunakan bisnis lain. Gunakan slug berbeda.' };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath('/settings');
    revalidatePath('/', 'layout');
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Gagal menyimpan pengaturan.' };
  }
}
