import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isSettingsPage = req.nextUrl.pathname.startsWith('/settings');
    const isAmlPage = req.nextUrl.pathname.startsWith('/aml');

    // Redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Get roles array from comma-separated string
    const roles = (token.roles as string || '').split(',').map((r: string) => r.trim());

    // Block non-admin users from settings page
    if (isSettingsPage && !roles.includes('ADMIN')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Block users without ADMIN or AML role from AML page
    if (isAmlPage && !roles.includes('ADMIN') && !roles.includes('AML')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: [
    '/',
    '/customers/:path*',
    '/transactions/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/aml/:path*'
  ]
};
