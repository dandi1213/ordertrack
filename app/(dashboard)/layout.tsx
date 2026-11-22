import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { getSessionUser } from '@/lib/auth';

function ShellFallback() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <div className="hidden lg:block w-64 bg-[#0F172A] animate-pulse" />
      <div className="flex-1 p-8 space-y-6">
        <div className="h-16 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
        <div className="h-96 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return <DashboardShell user={user}>{children}</DashboardShell>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
