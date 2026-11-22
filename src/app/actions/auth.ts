'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAppOrigin } from '@/lib/appOrigin';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { isEmail, text, validateRegistration } from '@/lib/validation';

export type AuthState = { error?: string; fields?: Record<string, string>; success?: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = text(formData, 'email').toLowerCase();
  const password = text(formData, 'password');

  if (!isEmail(email)) return { error: 'Format email tidak valid.' };
  if (password.length < 8) return { error: 'Kata sandi minimal 8 karakter.' };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes('email not confirmed')) {
      return { error: 'Email belum dikonfirmasi. Cek kotak masuk Anda.' };
    }
    if (message.includes('rate limit')) {
      return { error: 'Terlalu banyak percobaan. Coba lagi beberapa saat.' };
    }

    // Staf yang baru diundang belum punya kata sandi sampai tautan undangan diklik.
    if (message.includes('invalid login credentials')) {
      return {
        error:
          'Email atau kata sandi salah. Jika akun Anda baru diundang, buka email undangan untuk membuat kata sandi.',
      };
    }

    return { error: 'Email atau kata sandi salah. Periksa kembali kredensial Anda.' };
  }

  revalidatePath('/', 'layout');
  const next = text(formData, 'next');
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fields = validateRegistration(formData);
  if (Object.keys(fields).length > 0) return { error: 'Periksa kembali data yang diisi.', fields };

  const fullName = text(formData, 'fullName');
  const businessName = text(formData, 'businessName');
  const phone = `0${text(formData, 'phone').replace(/^62/, '').replace(/[\s-]/g, '')}`;
  const email = text(formData, 'email').toLowerCase();
  const password = text(formData, 'password');

  const admin = createAdminClient();
  const origin = await getAppOrigin();
  const supabase = await createServerSupabase();

  // Pakai signUp (bukan createUser dengan email_confirm: true) agar Supabase
  // mengirim email konfirmasi. Email yang salah/fake tidak bisa langsung masuk.
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { full_name: fullName },
    },
  });

  if (signUpError) {
    const message = signUpError.message.toLowerCase();
    if (message.includes('already') || message.includes('registered')) {
      return { error: 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.' };
    }
    return { error: signUpError.message };
  }

  // Untuk email yang sudah terdaftar, Supabase mengembalikan user dengan identities kosong.
  if (data.user?.identities && data.user.identities.length === 0) {
    return { error: 'Email ini sudah terdaftar. Silakan masuk atau cek email konfirmasi Anda.' };
  }

  const userId = data.user?.id;
  if (!userId) return { error: 'Gagal membuat akun. Silakan coba lagi.' };

  // Jika "Confirm email" nonaktif, signUp langsung memberi session dan tidak ada email dikirim.
  // Akun yang baru dibuat dihapus supaya tidak ada akun yatim yang tidak bisa diverifikasi.
  if (data.session) {
    await supabase.auth.signOut();
    await admin.auth.admin.deleteUser(userId);
    return {
      error:
        'Konfirmasi email belum aktif di Supabase. Aktifkan Email confirmation di Authentication → Providers → Email, lalu daftar lagi.',
    };
  }

  // Trigger handle_new_user sudah membuat profile saat akun dibuat.
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existingProfile) {
    const { error: profileError } = await admin
      .from('profiles')
      .insert({ id: userId, full_name: fullName });
    if (profileError) return { error: `Gagal membuat profil: ${profileError.message}` };
  }

  const baseSlug = slugify(businessName) || 'bisnis';
  let businessId: string | null = null;

  for (let attempt = 0; attempt < 5 && !businessId; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomBytes(3).toString('hex')}`;
    const { data: business, error: businessError } = await admin
      .from('businesses')
      .insert({ name: businessName, slug, phone, address: '' })
      .select('id')
      .single();

    if (businessError) {
      if (businessError.code === '23505') continue;
      return { error: `Gagal membuat data bisnis: ${businessError.message}` };
    }
    businessId = business.id;
  }

  if (!businessId) return { error: 'Gagal membuat slug bisnis yang unik. Coba nama lain.' };

  const { error: memberError } = await admin.from('business_members').insert({
    business_id: businessId,
    user_id: userId,
    role: 'owner',
    permissions: {},
    is_active: true,
  });

  if (memberError) {
    await admin.from('businesses').delete().eq('id', businessId);
    await admin.auth.admin.deleteUser(userId);
    return { error: `Gagal membuat keanggotaan bisnis: ${memberError.message}` };
  }

  return {
    success: `Akun berhasil dibuat. Kami mengirim email konfirmasi ke ${email}. Klik tautan di email tersebut untuk mengaktifkan akun dan masuk ke dashboard.`,
  };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function setInitialPasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = text(formData, 'password');
  const confirmPassword = text(formData, 'confirmPassword');

  if (password.length < 8) return { error: 'Kata sandi minimal 8 karakter.' };
  if (password !== confirmPassword) return { error: 'Konfirmasi kata sandi tidak cocok.' };

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesi berakhir. Minta owner mengirim ulang undangan.' };

  const { error } = await supabase.auth.updateUser({
    password,
    data: { must_set_password: false },
  });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function changePasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const currentPassword = text(formData, 'currentPassword');
  const newPassword = text(formData, 'newPassword');
  const confirmPassword = text(formData, 'confirmPassword');

  if (currentPassword.length < 8) return { error: 'Kata sandi saat ini minimal 8 karakter.' };
  if (newPassword.length < 8) return { error: 'Kata sandi baru minimal 8 karakter.' };
  if (newPassword === currentPassword) {
    return { error: 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.' };
  }
  if (newPassword !== confirmPassword) return { error: 'Konfirmasi kata sandi tidak cocok.' };

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: 'Sesi berakhir. Silakan masuk kembali.' };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { error: 'Kata sandi saat ini tidak benar.' };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) return { error: error.message };

  return { success: 'Kata sandi berhasil diperbarui.' };
}

export async function changeEmailAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const newEmail = text(formData, 'newEmail').toLowerCase();
  const password = text(formData, 'password');

  if (!isEmail(newEmail)) return { error: 'Format email tidak valid.' };
  if (password.length < 8) return { error: 'Masukkan kata sandi untuk konfirmasi.' };

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: 'Sesi berakhir. Silakan masuk kembali.' };
  if (user.email.toLowerCase() === newEmail) {
    return { error: 'Email baru harus berbeda dari email saat ini.' };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (signInError) return { error: 'Kata sandi tidak benar.' };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { email: newEmail });
  if (error) return { error: error.message };

  // Email berubah -> paksa login ulang agar klaim sesi tidak basi.
  await supabase.auth.signOut();
  redirect('/login?notice=email_changed');
}

export async function deleteAccountAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (text(formData, 'confirmation') !== 'HAPUS') {
    return { error: 'Ketik HAPUS (huruf besar) untuk mengonfirmasi.' };
  }
  const password = text(formData, 'password');
  if (password.length < 8) return { error: 'Masukkan kata sandi akun.' };

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: 'Sesi berakhir. Silakan masuk kembali.' };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (signInError) return { error: 'Kata sandi tidak benar.' };

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from('business_members')
    .select('id, business_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (membership?.role === 'owner') {
    // Hapus bisnisowner; cascade menghapus orders, payments, history, dll.
    await admin.from('businesses').delete().eq('id', membership.business_id);
  } else if (membership) {
    await admin.from('business_members').delete().eq('id', membership.id);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect('/login?notice=account_deleted');
}
