'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AgentPortalPage({ params }: { params: Promise<{ agentCode: string }> }) {
  const resolvedParams = use(params);
  const { agentCode } = resolvedParams;
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAgent();
  }, [agentCode]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents?agentCode=${agentCode}`);
      if (response.ok) {
        const agents = await response.json();
        const foundAgent = agents.find((a: any) => a.agentCode === agentCode);

        if (foundAgent) {
          setAgent(foundAgent);
          // Store agent info in session storage for transaction creation
          sessionStorage.setItem('agentId', foundAgent.id);
          sessionStorage.setItem('agentCode', foundAgent.agentCode);
          sessionStorage.setItem('agentName', foundAgent.name);
        } else {
          setError('Agent not found');
        }
      } else {
        setError('Failed to fetch agent');
      }
    } catch (err) {
      console.error('Error fetching agent:', err);
      setError('Error loading agent information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent portal...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">Agent Code: {agentCode}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Agent Portal</h1>
              <p className="text-blue-100 mt-1">
                {agent.name} ({agent.agentCode})
              </p>
              {agent.location && (
                <p className="text-blue-200 text-sm mt-1">
                  📍 {agent.location}
                </p>
              )}
            </div>
            <div className="bg-white/20 rounded-lg p-4 text-center">
              <div className="text-xs text-blue-100">Status</div>
              <div className="text-lg font-bold">
                {agent.status === 'ACTIVE' ? '✓ Active' : agent.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* New Transaction Card */}
          <button
            onClick={() => router.push(`/agent/${agentCode}/transaction`)}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">New Transaction</h2>
            <p className="text-gray-600">Create a new money transfer transaction for a customer</p>
          </button>

          {/* Register Customer Card */}
          <button
            onClick={() => router.push(`/register/${agentCode}`)}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Register Customer</h2>
            <p className="text-gray-600">Register a new customer with ID verification</p>
          </button>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• <strong>New customers:</strong> Click "Register Customer" to create a new customer account with ID verification</li>
                <li>• <strong>Existing customers:</strong> Click "New Transaction" to search for the customer and create a money transfer</li>
                <li>• All transactions created through this portal will be automatically tracked to your agent account</li>
                <li>• Customers will receive email notifications when transactions are created and completed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
