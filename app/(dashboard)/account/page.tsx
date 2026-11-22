import { redirect } from 'next/navigation';
import AccountView from '@/features/account/AccountView';
import { getSessionUser } from '@/lib/auth';

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return <AccountView user={user} />;
}
