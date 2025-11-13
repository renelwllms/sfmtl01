'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlusIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import Footer from '@/components/Footer';

interface Agent {
  id: string;
  agentCode: string;
  name: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  isHeadOffice: boolean;
}

export default function AgentPortalPage({ params }: { params: Promise<{ agentCode: string }> }) {
  const resolvedParams = use(params);
  const { agentCode } = resolvedParams;
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branding, setBranding] = useState<{
    businessName: string;
    fontSize: string;
    fontColor: string;
    fontFamily: string;
  } | null>(null);

  useEffect(() => {
    fetchAgent();
    fetchBranding();
  }, [agentCode]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/by-code/${agentCode}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Agent not found. Please check the QR code and try again.');
        } else {
          setError('Failed to load agent information.');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.status !== 'ACTIVE') {
        setError('This agent is currently inactive. Please contact support.');
        setLoading(false);
        return;
      }

      setAgent(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching agent:', err);
      setError('Failed to load agent information.');
      setLoading(false);
    }
  };

  const fetchBranding = async () => {
    try {
      const response = await fetch('/api/public/branding');
      if (response.ok) {
        const data = await response.json();
        setBranding({
          businessName: data.settings.businessName,
          fontSize: data.settings.fontSize,
          fontColor: data.settings.fontColor,
          fontFamily: data.settings.fontFamily
        });
      }
    } catch (err) {
      console.error('Error fetching branding:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent portal...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Business Name Header */}
        {branding && (
          <div className="text-center mb-6">
            <h1
              style={{
                fontSize: `${branding.fontSize}px`,
                color: branding.fontColor,
                fontFamily: branding.fontFamily,
                fontWeight: 'bold'
              }}
            >
              {branding.businessName}
            </h1>
          </div>
        )}

        {/* Agent Information */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{agent.name}</h2>
              {agent.location && (
                <div className="flex items-center justify-center gap-2 text-blue-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-lg">{agent.location}</span>
                </div>
              )}
              {agent.isHeadOffice && (
                <div className="mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-400 text-yellow-900">
                    Head Office
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          {(agent.phone || agent.email) && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center text-sm text-gray-600">
                {agent.phone && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{agent.phone}</span>
                  </div>
                )}
                {agent.email && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{agent.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* New Customer Button */}
          <button
            onClick={() => router.push(`/portal/${agentCode}/customer/new`)}
            className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center transform hover:-translate-y-1"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <UserPlusIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">New Customer</h2>
            <p className="text-gray-600">Register a new customer to get started</p>
          </button>

          {/* New Transaction Button */}
          <button
            onClick={() => router.push(`/portal/${agentCode}/transaction/new`)}
            className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center transform hover:-translate-y-1"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <CurrencyDollarIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">New Transaction</h2>
            <p className="text-gray-600">Process a money transfer</p>
          </button>
        </div>

        {/* Agent Info Footer */}
        <div className="text-center text-sm text-gray-500 mb-6">
          <p>Agent Code: {agent.agentCode}</p>
        </div>
      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
