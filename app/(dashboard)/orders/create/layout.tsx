import { redirect } from 'next/navigation';
import { can, getSessionUser } from '@/lib/auth';

export default async function CreateOrderLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!can(user, 'create_orders')) redirect('/orders');
  return children;
}
