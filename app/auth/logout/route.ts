import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const notice = request.nextUrl.searchParams.get('notice') ?? 'logged_out';
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?notice=${encodeURIComponent(notice)}`;
  return NextResponse.redirect(url);
}
