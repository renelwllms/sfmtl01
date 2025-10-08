'use client';

import { useSession, signOut } from 'next-auth/react';
import { useUI } from '@/contexts/UIContext';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const { data: session } = useSession();
  const { settings } = useUI();
  const pathname = usePathname();
  const userRoles = (session?.user as any)?.roles || '';
  const rolesArray = userRoles.split(',').map((r: string) => r.trim());
  const isAdmin = rolesArray.includes('ADMIN');
  const hasAMLAccess = isAdmin || rolesArray.includes('AML');

  const getNavStyles = () => {
    const baseClasses = 'shadow-lg';
    switch (settings.navStyle) {
      case 'gradient':
        return `${baseClasses} bg-gradient-to-r from-emerald-600 to-teal-600`;
      case 'solid':
        return `${baseClasses} bg-emerald-600`;
      case 'glass':
        return `${baseClasses} bg-emerald-600/90 backdrop-blur-md`;
      case 'minimal':
        return `${baseClasses} bg-white border-b border-gray-200`;
      default:
        return `${baseClasses} bg-gradient-to-r from-emerald-600 to-teal-600`;
    }
  };

  const getTextColor = () => settings.navStyle === 'minimal' ? 'text-gray-900' : 'text-white';
  const getTextOpacity = () => settings.navStyle === 'minimal' ? 'text-gray-600' : 'text-white/90';

  const getLinkStyles = (path: string) => {
    const isActive = pathname === path;
    if (settings.navStyle === 'minimal') {
      return `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'bg-emerald-100 text-emerald-600 shadow-sm'
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
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-white/20 text-white backdrop-blur-sm';

  // Sidebar navigation
  if (settings.navPosition === 'left' || settings.navPosition === 'right') {
    return (
      <nav className={`fixed ${settings.navPosition === 'left' ? 'left-0' : 'right-0'} top-0 h-screen w-72 ${getNavStyles()} overflow-y-auto z-50 flex flex-col`}>
        <div className="p-6 border-b border-white/10">
          <h1 className={`text-xl font-bold ${getTextColor()}`}>🌴 Samoa Finance</h1>
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

  // Top navigation
  return (
    <nav className={getNavStyles()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className={`text-xl font-bold ${getTextColor()}`}>🌴 Samoa Finance</h1>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
              <a href="/" className={getLinkStyles('/')}>Dashboard</a>
              <a href="/customers/list" className={getLinkStyles('/customers/list')}>All Customers</a>
              <a href="/customers/new" className={getLinkStyles('/customers/new')}>New Customer</a>
              <a href="/transactions/list" className={getLinkStyles('/transactions/list')}>All Transactions</a>
              <a href="/transactions/new" className={getLinkStyles('/transactions/new')}>New Transaction</a>
              <a href="/reports" className={getLinkStyles('/reports')}>Reports</a>
              {hasAMLAccess && <a href="/aml" className={getLinkStyles('/aml')}>AML</a>}
              {isAdmin && <a href="/settings" className={getLinkStyles('/settings')}>Settings</a>}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${getTextOpacity()}`}>
              {session?.user?.email}
              {rolesArray.length > 0 && rolesArray[0] !== '' && (
                <span className="ml-2">
                  {rolesArray.map((role) => (
                    <span key={role} className={`ml-1 text-xs ${getBadgeStyles()} px-2 py-1 rounded`}>
                      {role}
                    </span>
                  ))}
                </span>
              )}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`text-sm ${getTextOpacity()} hover:${getTextColor()} transition-colors`}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
