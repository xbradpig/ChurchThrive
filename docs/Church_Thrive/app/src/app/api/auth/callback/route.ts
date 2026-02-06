import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Roles that have admin access
const ADMIN_ROLES = ['admin', 'pastor', 'staff'];

// Get redirect destination based on role
function getRoleBasedRedirect(role: string | null): string {
  if (role && ADMIN_ROLES.includes(role)) {
    return '/dashboard';
  }
  return '/home';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectParam = searchParams.get('redirect');

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has a member record
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('status, role')
          .eq('user_id', user.id)
          .single();

        if (!member) {
          return NextResponse.redirect(`${origin}/register/church-search`);
        }
        if (member.status === 'pending') {
          return NextResponse.redirect(`${origin}/register/pending`);
        }

        // Determine redirect: use explicit redirect if provided, otherwise role-based
        const redirect = (redirectParam && redirectParam !== 'role-based')
          ? redirectParam
          : getRoleBasedRedirect(member.role);

        return NextResponse.redirect(`${origin}${redirect}`);
      }
      // Fallback if no user (shouldn't happen)
      const fallbackRedirect = (redirectParam && redirectParam !== 'role-based')
        ? redirectParam
        : '/home';
      return NextResponse.redirect(`${origin}${fallbackRedirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
