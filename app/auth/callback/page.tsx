import { Suspense } from 'react';
import AuthCallback from '@/features/auth/AuthCallback';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <AuthCallback />
    </Suspense>
  );
}
