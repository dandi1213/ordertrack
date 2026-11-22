import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import OrderDetailView from '@/features/orders/OrderDetailView';
import { can, getSessionUser } from '@/lib/auth';
import { getOrderById } from '@/lib/queries';

type Params = PageProps<'/orders/[id]'>['params'];

function DetailFallback() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-72 bg-white border border-[#E2E8F0] rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
        <div className="h-96 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

async function OrderDetail({ params }: { params: Params }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!can(user, 'view_orders')) redirect('/dashboard');

  const order = await getOrderById(user.businessId, id);
  if (!order) notFound();

  return (
    <OrderDetailView
      order={order}
      canUpdateStatus={can(user, 'update_order_status')}
      canRecordPayment={can(user, 'record_payments')}
      canEditOrder={can(user, 'edit_orders')}
      canViewOrders={can(user, 'view_orders')}
    />
  );
}

export default function OrderDetailPage(props: { params: Params }) {
  return (
    <Suspense fallback={<DetailFallback />}>
      <OrderDetail params={props.params} />
    </Suspense>
  );
}
