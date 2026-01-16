'use client';

import { useSession, signOut } from 'next-auth/react';
import { useUI } from '@/contexts/UIContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings } from '@/lib/notifications';
import { Icon } from '@iconify/react';

export default function Navigation() {
  const { data: session } = useSession();
  const { settings } = useUI();
  const pathname = usePathname();
  const userRoles = (session?.user as any)?.roles || '';
  const rolesArray = userRoles.split(',').map((r: string) => r.trim());
  const isAdmin = rolesArray.includes('ADMIN');
  const hasAMLAccess = isAdmin || rolesArray.includes('AML');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customersDropdownOpen, setCustomersDropdownOpen] = useState(false);
  const [transactionsDropdownOpen, setTransactionsDropdownOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await getUserSettings();
    if (settings) {
      setSoundEnabled(settings.soundNotificationsEnabled);
    }
  };

  const handleToggleSound = async () => {
    setSavingSettings(true);
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await updateUserSettings({ soundNotificationsEnabled: newValue });
    setSavingSettings(false);
  };

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

  const getMenuIcon = (path: string) => {
    const iconClass = "w-5 h-5";
    switch (path) {
      case '/':
        return <Icon icon="material-symbols:dashboard" className={iconClass} />;
      case '/customers/list':
        return <Icon icon="material-symbols:group" className={iconClass} />;
      case '/customers/new':
        return <Icon icon="material-symbols:person-add" className={iconClass} />;
      case '/transactions/list':
        return <Icon icon="material-symbols:credit-card" className={iconClass} />;
      case '/transactions/new':
        return <Icon icon="material-symbols:payments" className={iconClass} />;
      case '/reports':
        return <Icon icon="material-symbols:assessment" className={iconClass} />;
      case '/aml':
        return <Icon icon="material-symbols:shield" className={iconClass} />;
      case '/settings':
        return <Icon icon="material-symbols:settings" className={iconClass} />;
      default:
        return null;
    }
  };

  const getBadgeStyles = () =>
    settings.navStyle === 'minimal'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-white/20 text-white backdrop-blur-sm';

  // Sidebar navigation
  if (settings.navPosition === 'left' || settings.navPosition === 'right') {
    return (
      <nav className={`fixed ${settings.navPosition === 'left' ? 'left-0' : 'right-0'} top-0 h-screen w-72 ${getNavStyles()} overflow-y-auto z-50 flex flex-col`}>
        <div className="p-6 border-b border-white/10">
          <h1 className={`text-xl font-bold ${getTextColor()}`}>TransferPoint</h1>
          <p className={`text-xs ${getTextOpacity()} mt-1`}>Money Transfer System</p>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          <a href="/" className={getLinkStyles('/')}>
            {getMenuIcon('/')}
            <span>Dashboard</span>
          </a>
          <a href="/customers/list" className={getLinkStyles('/customers/list')}>
            {getMenuIcon('/customers/list')}
            <span>All Customers</span>
          </a>
          <a href="/customers/new" className={getLinkStyles('/customers/new')}>
            {getMenuIcon('/customers/new')}
            <span>New Customer</span>
          </a>
          <a href="/transactions/list" className={getLinkStyles('/transactions/list')}>
            {getMenuIcon('/transactions/list')}
            <span>All Transactions</span>
          </a>
          <a href="/transactions/new" className={getLinkStyles('/transactions/new')}>
            {getMenuIcon('/transactions/new')}
            <span>New Transaction</span>
          </a>
          <a href="/reports" className={getLinkStyles('/reports')}>
            {getMenuIcon('/reports')}
            <span>Reports</span>
          </a>
          {hasAMLAccess && (
            <a href="/aml" className={getLinkStyles('/aml')}>
              {getMenuIcon('/aml')}
              <span>AML Compliance</span>
            </a>
          )}
          {isAdmin && (
            <a href="/settings" className={getLinkStyles('/settings')}>
              {getMenuIcon('/settings')}
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
                {rolesArray.map((role: string) => (
                  <span key={role} className={`text-xs ${getBadgeStyles()} px-2 py-1 rounded`}>
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              settings.navStyle === 'minimal'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-white/10 text-white/90 hover:bg-white/20'
            }`}
          >
            <Icon icon="material-symbols:logout" className="w-4 h-4" />
            Sign out
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
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Button - Only visible on mobile/tablet, hidden on desktop */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors"
              >
                <Icon icon="material-symbols:menu" className="w-6 h-6 text-gray-700" />
              </button>

              {/* Logo */}
              <h1 className="text-xl font-bold text-white whitespace-nowrap">TransferPoint</h1>

              {/* Main Navigation Links */}
              <div className="hidden lg:flex items-center gap-0.5">
                <a href="/" className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                }`}>
                  <Icon icon="material-symbols:dashboard" className="w-5 h-5" />
                  Dashboard
                </a>

                {/* Customers Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setCustomersDropdownOpen(true)}
                  onMouseLeave={() => setCustomersDropdownOpen(false)}
                >
                  <button
                    onClick={() => {
                      setCustomersDropdownOpen(!customersDropdownOpen);
                      setTransactionsDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-all"
                  >
                    <Icon icon="material-symbols:group" className="w-5 h-5" />
                    Customers
                    <Icon icon="material-symbols:keyboard-arrow-down" className="w-4 h-4" />
                  </button>
                  {customersDropdownOpen && (
                    <div
                      className="absolute left-0 mt-1 w-56 rounded-lg shadow-xl bg-white z-50"
                    >
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
                  )}
                </div>

                {/* Transactions Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setTransactionsDropdownOpen(true)}
                  onMouseLeave={() => setTransactionsDropdownOpen(false)}
                >
                  <button
                    onClick={() => {
                      setTransactionsDropdownOpen(!transactionsDropdownOpen);
                      setCustomersDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-all"
                  >
                    <Icon icon="material-symbols:credit-card" className="w-5 h-5" />
                    Transactions
                    <Icon icon="material-symbols:keyboard-arrow-down" className="w-4 h-4" />
                  </button>
                  {transactionsDropdownOpen && (
                    <div
                      className="absolute left-0 mt-1 w-56 rounded-lg shadow-xl bg-white z-50"
                    >
                      <a href="/transactions/list" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 rounded-t-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        All Transactions
                      </a>
                      <a href="/transactions/new" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg">
                        <Icon icon="material-symbols:payments" className="w-5 h-5 text-gray-700" />
                        New Transaction
                      </a>
                    </div>
                  )}
                </div>

                {/* Reports Link */}
                <a href="/reports" className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/reports' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Reports
                </a>

                {/* Agents Link */}
                <a href="/agents" className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/agents' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Agents
                </a>

                {/* EOD Link */}
                <a href="/eod" className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/eod' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  EOD
                </a>

                {/* AML Link */}
                {hasAMLAccess && (
                  <a href="/aml" className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
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
                    <a href="/users" className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      pathname === '/users' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Users
                    </a>
                    <a href="/settings" className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
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
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setNotificationSettingsOpen(true)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                title="Notification Settings"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <span className="hidden xl:block text-xs text-white/90">
                {session?.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition-all whitespace-nowrap flex-shrink-0"
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

            {/* Spacer to push logout button to bottom */}
            <div className="flex-1"></div>

            {/* Logout button at bottom of sidebar */}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-3 rounded-lg hover:bg-red-100 transition-colors border-t border-gray-300 w-full"
              title="Sign out"
            >
              <svg className="w-6 h-6 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {notificationSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setNotificationSettingsOpen(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-gray-900">Notification Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <h4 className="font-medium text-gray-900">Sound Notifications</h4>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Play sound when transactions are completed</p>
                </div>
                <button
                  onClick={handleToggleSound}
                  disabled={savingSettings}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  } ${savingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setNotificationSettingsOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
