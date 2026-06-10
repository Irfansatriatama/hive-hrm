import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const session = await getSession(request.headers);
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
