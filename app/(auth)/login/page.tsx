import { Suspense } from 'react';
import LoginForm from '@/features/auth/LoginForm';

type SearchParams = PageProps<'/login'>['searchParams'];

function LoginFallback() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md h-96 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
    </div>
  );
}

async function LoginContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const notice = typeof params.notice === 'string' ? params.notice : undefined;
  const next = typeof params.next === 'string' ? params.next : undefined;
  return <LoginForm notice={notice} next={next} />;
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
