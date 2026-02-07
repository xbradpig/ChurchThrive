import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@churchthrive/shared';
import { hasPermission, type Permission } from '@churchthrive/shared';
import type { UserRole } from '@churchthrive/shared';

// Roles that have admin access
const ADMIN_ROLES = ['admin', 'pastor', 'staff'];
// Roles that use member homepage
const MEMBER_ROLES = ['leader', 'member'];

// 경로별 필요 권한 매핑
const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/admin/organizations': 'organization:read',
  '/admin/cell-groups': 'cells:read',
  '/admin/attendance': 'attendance:read',
  '/admin/roles': 'organization:manage',
  '/members/approvals': 'members:approve',
  '/members/import': 'members:import',
};

// Get redirect destination based on role
function getRoleBasedRedirect(role: string | null): string {
  if (role && ADMIN_ROLES.includes(role)) {
    return '/dashboard';
  }
  return '/home';
}

// 특정 경로에 대한 권한 검사
function getRequiredPermission(pathname: string): Permission | null {
  // 정확한 경로 매칭 먼저
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }
  // prefix 매칭
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route + '/') || pathname === route) {
      return permission;
    }
  }
  return null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Check if Supabase environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables not configured');
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
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

  // Public routes that don't require auth (landing page included)
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/church/new', '/api/auth/callback', '/about', '/mission', '/services', '/join'];
  const isPublicRoute = publicRoutes.some(route =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );
  const isQrRoute = pathname.startsWith('/qr/');

  // Allow public routes without auth
  if (isQrRoute) {
    return supabaseResponse;
  }

  // Landing page: allow public access, but redirect logged-in users
  if (pathname === '/') {
    if (user) {
      const { data: member } = await supabase
        .from('members')
        .select('status, role')
        .eq('user_id', user.id)
        .single();

      if (member?.status === 'active') {
        const url = request.nextUrl.clone();
        url.pathname = getRoleBasedRedirect(member.role);
        return NextResponse.redirect(url);
      }
    }
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Handle authenticated users on public routes
  if (user && isPublicRoute && pathname !== '/api/auth/callback') {
    const { data: member } = await supabase
      .from('members')
      .select('status, role')
      .eq('user_id', user.id)
      .single();

    // 교회 등록 페이지는 로그인했지만 교회가 없는 사용자가 접근 가능
    const isChurchNewRoute = pathname.startsWith('/church/new');
    // 교회 검색 페이지도 로그인했지만 교회가 없는 사용자가 접근 가능
    const isChurchSearchRoute = pathname.startsWith('/register/church-search');

    if (member?.status === 'pending') {
      if (!pathname.startsWith('/register/pending')) {
        const url = request.nextUrl.clone();
        url.pathname = '/register/pending';
        return NextResponse.redirect(url);
      }
    } else if (member?.status === 'active') {
      const url = request.nextUrl.clone();
      url.pathname = getRoleBasedRedirect(member.role);
      return NextResponse.redirect(url);
    } else if (!member && !isChurchNewRoute && !isChurchSearchRoute && !pathname.startsWith('/register')) {
      // 멤버 레코드가 없고, 교회 등록/검색 관련 페이지가 아닌 경우
      // 교회 검색 페이지로 리디렉트
      const url = request.nextUrl.clone();
      url.pathname = '/register/church-search';
      return NextResponse.redirect(url);
    }
    // member가 없고 isChurchNewRoute 또는 isChurchSearchRoute면 접근 허용
  }

  // Role-based route protection for authenticated users
  if (user && !isPublicRoute) {
    const { data: member } = await supabase
      .from('members')
      .select('status, role')
      .eq('user_id', user.id)
      .single();

    if (member?.status === 'active') {
      const isAdminRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/members');
      const isMemberRoute = pathname.startsWith('/home');
      const role = member.role as UserRole;

      // Admin trying to access member-only routes: redirect to dashboard
      if (isMemberRoute && role && ADMIN_ROLES.includes(role)) {
        // Allow admins to view member pages too (optional)
        // Uncomment below to restrict:
        // const url = request.nextUrl.clone();
        // url.pathname = '/dashboard';
        // return NextResponse.redirect(url);
      }

      // Member trying to access admin routes: redirect to home
      if (isAdminRoute && role && MEMBER_ROLES.includes(role)) {
        const url = request.nextUrl.clone();
        url.pathname = '/home';
        return NextResponse.redirect(url);
      }

      // 세부 권한 검사: 특정 경로에 필요한 권한이 있는지 확인
      const requiredPermission = getRequiredPermission(pathname);
      if (requiredPermission && !hasPermission(role, requiredPermission)) {
        const url = request.nextUrl.clone();
        url.pathname = ADMIN_ROLES.includes(role) ? '/dashboard' : '/home';
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
