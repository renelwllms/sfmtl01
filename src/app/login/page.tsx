'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid email or password');
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  async function handleOffice365Login() {
    setError('');
    setLoading(true);

    try {
      await signIn('azure-ad', { callbackUrl: '/' });
    } catch (err) {
      setError('Failed to sign in with Office 365');
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
              🌴 Samoa Finance
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
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Office 365 SSO Option */}
        {ssoEnabled && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleOffice365Login}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0h10.931v10.931H0V0z" fill="#f25022"/>
                  <path d="M12.069 0H23v10.931H12.069V0z" fill="#7fba00"/>
                  <path d="M0 12.069h10.931V23H0V12.069z" fill="#00a4ef"/>
                  <path d="M12.069 12.069H23V23H12.069V12.069z" fill="#ffb900"/>
                </svg>
                Sign in with Office 365
              </button>
            </div>
          </>
        )}

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Test Credentials:</p>
          <p className="mt-1">Admin: admin@samoafinance.local / Admin@123</p>
          <p>Staff: staff@samoafinance.local / Staff@123</p>
        </div>
      </div>
    </div>
  );
}
