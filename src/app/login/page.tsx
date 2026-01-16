'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [branding, setBranding] = useState<{
    businessName: string;
    fontSize: string;
    fontColor: string;
    fontFamily: string;
  } | null>(null);

  useEffect(() => {
    // Check if SSO is enabled by checking if config endpoint returns SSO status
    fetch('/api/auth/sso-status')
      .then(res => res.json())
      .then(data => setSsoEnabled(data.enabled))
      .catch(() => setSsoEnabled(false));

    // Fetch branding settings
    fetch('/api/public/branding')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setBranding({
            businessName: data.settings.businessName,
            fontSize: data.settings.fontSize,
            fontColor: data.settings.fontColor,
            fontFamily: data.settings.fontFamily
          });
        }
      })
      .catch(err => console.error('Failed to fetch branding:', err));
  }, []);

  async function handleOffice365Login() {
    setError('');
    setLoading(true);

    try {
      await signIn('azure-ad', { callbackUrl: '/' });
    } catch (err) {
      setError('Failed to sign in with Microsoft');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-xl">
        <div>
          {branding ? (
            <h2
              className="text-center font-bold"
              style={{
                fontSize: `${Math.max(24, Math.min(parseInt(branding.fontSize), 48))}px`,
                color: branding.fontColor,
                fontFamily: branding.fontFamily
              }}
            >
              {branding.businessName}
            </h2>
          ) : (
            <h2 className="text-center text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              TransferPoint
            </h2>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            Developed and Hosted by{' '}
            <a
              href="https://edgepoint.co.nz/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              Edgepoint
            </a>
          </p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800 text-center">
              <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Only @samofinance.co.nz email addresses are allowed
            </p>
          </div>
        </div>
        <div className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleOffice365Login}
              disabled={loading || !ssoEnabled}
              className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h10.931v10.931H0V0z" fill="#f25022"/>
                <path d="M12.069 0H23v10.931H12.069V0z" fill="#7fba00"/>
                <path d="M0 12.069h10.931V23H0V12.069z" fill="#00a4ef"/>
                <path d="M12.069 12.069H23V23H12.069V12.069z" fill="#ffb900"/>
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Microsoft'}
            </button>
          </div>

          {!ssoEnabled && (
            <div className="rounded-md bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                Microsoft SSO is not configured. Set the Azure AD environment variables to enable login.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Only authorized @samofinance.co.nz users can access this system</p>
        </div>
      </div>
    </div>
  );
}
