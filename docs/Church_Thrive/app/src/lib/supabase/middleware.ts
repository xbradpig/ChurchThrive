import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@churchthrive/shared';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/register', '/forgot-password', '/church/new', '/api/auth/callback'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isQrRoute = pathname.startsWith('/qr/');

  if (isQrRoute) {
    return supabaseResponse;
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (user && isPublicRoute && pathname !== '/api/auth/callback') {
    // Check member status
    const { data: member } = await supabase
      .from('members')
      .select('status')
      .eq('user_id', user.id)
      .single();

    if (member?.status === 'pending') {
      if (!pathname.startsWith('/register/pending')) {
        const url = request.nextUrl.clone();
        url.pathname = '/register/pending';
        return NextResponse.redirect(url);
      }
    } else if (member?.status === 'active') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
