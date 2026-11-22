import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import SetPasswordForm from '@/features/auth/SetPasswordForm';
import { createClient } from '@/lib/supabase/server';

function SetPasswordFallback() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md h-96 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
    </div>
  );
}

async function SetPasswordContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?notice=invite_expired');

  return <SetPasswordForm email={user.email ?? ''} />;
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<SetPasswordFallback />}>
      <SetPasswordContent />
    </Suspense>
  );
}
