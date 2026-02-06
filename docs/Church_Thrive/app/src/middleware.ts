import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    console.error('Middleware error:', error);
    // If middleware fails, allow the request to proceed
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Exclude static files and auth routes from middleware
    '/((?!_next/static|_next/image|favicon.ico|login|register|church/new|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
