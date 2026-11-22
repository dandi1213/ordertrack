import { redirect } from 'next/navigation';
import PaymentsView from '@/features/payments/PaymentsView';
import { can, getSessionUser } from '@/lib/auth';
import { getOrders } from '@/lib/queries';

export default async function PaymentsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!can(user, 'view_payments')) redirect('/dashboard');

  const orders = await getOrders(user.businessId);
  return <PaymentsView orders={orders} />;
}
