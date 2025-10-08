import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isSettingsPage = req.nextUrl.pathname.startsWith('/settings');
    const isAmlPage = req.nextUrl.pathname.startsWith('/aml');
    const isUsersPage = req.nextUrl.pathname.startsWith('/users');
    const isAgentTransactionPage = req.nextUrl.pathname.startsWith('/agent/new-transaction');
    const isHomePage = req.nextUrl.pathname === '/';

    // Redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Get roles array from comma-separated string
    const roles = (token.roles as string || '').split(',').map((r: string) => r.trim());

    // AGENT role handling - redirect to their dedicated page
    if (roles.includes('AGENT') && !roles.includes('ADMIN') && !roles.includes('STAFF')) {
      // If agent tries to access anything other than their transaction page, redirect them
      if (!isAgentTransactionPage) {
        return NextResponse.redirect(new URL('/agent/new-transaction', req.url));
      }
      return NextResponse.next();
    }

    // Block agents from accessing regular pages if they somehow get there
    if (isAgentTransactionPage && !roles.includes('AGENT')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Block non-admin users from settings and user management pages
    if ((isSettingsPage || isUsersPage) && !roles.includes('ADMIN')) {
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
    '/aml/:path*',
    '/users/:path*',
    '/agent/:path*'
  ]
};
