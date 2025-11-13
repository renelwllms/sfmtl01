'use client';

import { useSession, signOut } from 'next-auth/react';
import { useUI } from '@/contexts/UIContext';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const { data: session } = useSession();
  const { settings } = useUI();
  const pathname = usePathname();
  const userRoles = (session?.user as any)?.roles || '';
  const rolesArray = userRoles.split(',').map((r: string) => r.trim());
  const isAdmin = rolesArray.includes('ADMIN');
  const hasAMLAccess = isAdmin || rolesArray.includes('AML');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getNavStyles = () => {
    const baseClasses = 'shadow-lg';
    switch (settings.navStyle) {
      case 'gradient':
        return `${baseClasses} bg-gradient-to-r from-blue-600 to-indigo-600`;
      case 'solid':
        return `${baseClasses} bg-blue-600`;
      case 'glass':
        return `${baseClasses} bg-blue-600/90 backdrop-blur-md`;
      case 'minimal':
        return `${baseClasses} bg-white border-b border-gray-200`;
      default:
        return `${baseClasses} bg-gradient-to-r from-blue-600 to-indigo-600`;
    }
  };

  const getTextColor = () => settings.navStyle === 'minimal' ? 'text-gray-900' : 'text-white';
  const getTextOpacity = () => settings.navStyle === 'minimal' ? 'text-gray-600' : 'text-white/90';

  const getLinkStyles = (path: string) => {
    const isActive = pathname === path;
    if (settings.navStyle === 'minimal') {
      return `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'bg-blue-100 text-blue-600 shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:shadow-sm'
      }`;
    }
    return `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-white/20 text-white shadow-lg'
        : 'text-white/90 hover:bg-white/10 hover:shadow-md'
    }`;
  };

  const getMenuIcons = () => {
    return {
      '/': '📊',
      '/customers/list': '👥',
      '/customers/new': '➕',
      '/transactions/list': '💳',
      '/transactions/new': '💸',
      '/reports': '📈',
      '/aml': '🔍',
      '/settings': '⚙️'
    };
  };

  const icons = getMenuIcons();

  const getBadgeStyles = () =>
    settings.navStyle === 'minimal'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-white/20 text-white backdrop-blur-sm';

  // Sidebar navigation
  if (settings.navPosition === 'left' || settings.navPosition === 'right') {
    return (
      <nav className={`fixed ${settings.navPosition === 'left' ? 'left-0' : 'right-0'} top-0 h-screen w-72 ${getNavStyles()} overflow-y-auto z-50 flex flex-col`}>
        <div className="p-6 border-b border-white/10">
          <h1 className={`text-xl font-bold ${getTextColor()}`}>SFMTL</h1>
          <p className={`text-xs ${getTextOpacity()} mt-1`}>Money Transfer System</p>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          <a href="/" className={getLinkStyles('/')}>
            <span className="text-xl">{icons['/']}</span>
            <span>Dashboard</span>
          </a>
          <a href="/customers/list" className={getLinkStyles('/customers/list')}>
            <span className="text-xl">{icons['/customers/list']}</span>
            <span>All Customers</span>
          </a>
          <a href="/customers/new" className={getLinkStyles('/customers/new')}>
            <span className="text-xl">{icons['/customers/new']}</span>
            <span>New Customer</span>
          </a>
          <a href="/transactions/list" className={getLinkStyles('/transactions/list')}>
            <span className="text-xl">{icons['/transactions/list']}</span>
            <span>All Transactions</span>
          </a>
          <a href="/transactions/new" className={getLinkStyles('/transactions/new')}>
            <span className="text-xl">{icons['/transactions/new']}</span>
            <span>New Transaction</span>
          </a>
          <a href="/reports" className={getLinkStyles('/reports')}>
            <span className="text-xl">{icons['/reports']}</span>
            <span>Reports</span>
          </a>
          {hasAMLAccess && (
            <a href="/aml" className={getLinkStyles('/aml')}>
              <span className="text-xl">{icons['/aml']}</span>
              <span>AML Compliance</span>
            </a>
          )}
          {isAdmin && (
            <a href="/settings" className={getLinkStyles('/settings')}>
              <span className="text-xl">{icons['/settings']}</span>
              <span>Settings</span>
            </a>
          )}
        </div>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className={`px-3 py-2 rounded-lg ${settings.navStyle === 'minimal' ? 'bg-gray-50' : 'bg-white/5'}`}>
            <div className={`text-xs ${getTextOpacity()} mb-1`}>Signed in as</div>
            <div className={`text-sm font-medium ${getTextColor()} truncate`}>
              {session?.user?.email}
            </div>
            {rolesArray.length > 0 && rolesArray[0] !== '' && (
              <div className="flex flex-wrap gap-1 mt-2">
                {rolesArray.map((role) => (
                  <span key={role} className={`text-xs ${getBadgeStyles()} px-2 py-1 rounded`}>
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              settings.navStyle === 'minimal'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-white/10 text-white/90 hover:bg-white/20'
            }`}
          >
            🚪 Sign out
          </button>
        </div>
      </nav>
    );
  }

  // Top navigation - Modern style like in the image
  return (
    <>
      <nav className="bg-blue-700 shadow-md">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            {/* Left side - Hamburger + Logo + Main Nav */}
            <div className="flex items-center gap-6">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <h1 className="text-xl font-bold text-white whitespace-nowrap">SFMTL</h1>

              {/* Main Navigation Links */}
              <div className="hidden lg:flex items-center gap-1">
                <a href="/" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </a>

                {/* Customers Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Customers
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-1 w-56 rounded-lg shadow-xl bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <a href="/customers/list" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 rounded-t-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      All Customers
                    </a>
                    <a href="/customers/new" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      New Customer
                    </a>
                    <a href="/customers/import" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Import Customers
                    </a>
                  </div>
                </div>

                {/* Transactions Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Transactions
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-1 w-56 rounded-lg shadow-xl bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <a href="/transactions/list" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 rounded-t-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      All Transactions
                    </a>
                    <a href="/transactions/new" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      New Transaction
                    </a>
                  </div>
                </div>

                {/* Reports Link */}
                <a href="/reports" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/reports' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Reports
                </a>

                {/* Agents Link */}
                <a href="/agents" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/agents' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Agents
                </a>

                {/* EOD Link */}
                <a href="/eod" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/eod' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  EOD
                </a>

                {/* AML Link */}
                {hasAMLAccess && (
                  <a href="/aml" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === '/aml' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    AML
                  </a>
                )}

                {/* Settings and Users Links - Admin only */}
                {isAdmin && (
                  <>
                    <a href="/users" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      pathname === '/users' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Users
                    </a>
                    <a href="/settings" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      pathname === '/settings' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Right side - User info */}
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-xs text-white/90">
                {session?.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile/Icon-only Sidebar - Slides in from left */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 h-full w-20 bg-blue-100 shadow-xl flex flex-col items-center py-6 gap-4">
            <a href="/" className="p-3 rounded-lg hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </a>
            <a href="/customers/list" className="p-3 rounded-lg hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </a>
            <a href="/transactions/list" className="p-3 rounded-lg hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </a>
            <a href="/aml" className="p-3 rounded-lg hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </a>
            {isAdmin && (
              <a href="/settings" className="p-3 rounded-lg hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
