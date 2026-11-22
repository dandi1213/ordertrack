import { redirect } from 'next/navigation';
import SettingsView from '@/features/settings/SettingsView';
import { can, getSessionUser } from '@/lib/auth';
import { getSettings } from '@/lib/queries';

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!can(user, 'manage_business_settings')) redirect('/dashboard');

  const settings = await getSettings(user.businessId);
  return <SettingsView settings={settings} user={user} />;
}
