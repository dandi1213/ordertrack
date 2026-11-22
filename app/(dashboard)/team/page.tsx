import { redirect } from 'next/navigation';
import TeamView from '@/features/team/TeamView';
import { can, getSessionUser } from '@/lib/auth';
import { getStaff } from '@/lib/queries';

export default async function TeamPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!can(user, 'manage_staff')) redirect('/dashboard');

  const staff = await getStaff(user.businessId);
  return <TeamView staff={staff} />;
}
