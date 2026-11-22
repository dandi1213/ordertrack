import { headers } from 'next/headers';

/** Base URL absolut aplikasi, dipakai untuk redirect URL email Supabase Auth. */
export async function getAppOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configured) return configured;

  const headerList = await headers();
  const host =
    headerList.get('x-forwarded-host') ??
    headerList.get('host') ??
    'localhost:3000';
  const proto =
    headerList.get('x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');

  return `${proto}://${host}`;
}
