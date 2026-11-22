import { redirect } from 'next/navigation';
import OrdersList from '@/features/orders/OrdersList';
import { can, getSessionUser } from '@/lib/auth';
import { getOrders } from '@/lib/queries';

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!can(user, 'view_orders')) redirect('/dashboard');

  const orders = await getOrders(user.businessId);

  return <OrdersList orders={orders} canCreate={can(user, 'create_orders')} />;
}
