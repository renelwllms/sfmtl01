'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface Agent {
  id: string;
  agentCode: string;
  name: string;
  location: string | null;
}

interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  dob: string;
}

export default function AgentNewTransactionPage({ params }: { params: Promise<{ agentCode: string }> }) {
  const resolvedParams = use(params);
  const { agentCode } = resolvedParams;
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchAgent();
  }, [agentCode]);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      const timeoutId = setTimeout(() => {
        searchCustomers();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchTerm]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/by-code/${agentCode}`);
      if (response.ok) {
        const data = await response.json();
        setAgent(data);
      }
    } catch (error) {
      console.error('Error fetching agent:', error);
    }
  };

  const searchCustomers = async () => {
    setSearching(true);
    try {
      const response = await fetch(`/api/public/customers/search?q=${encodeURIComponent(searchTerm)}&agentCode=${agentCode}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.customers || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setSearching(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchTerm('');
    setShowResults(false);
    // Redirect to the agent's public transaction creation page
    router.push(`/portal/${agentCode}/transaction/create?customerId=${customer.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/portal/${agentCode}`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Portal
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">New Transaction</h1>
            {agent && (
              <p className="text-gray-600">
                {agent.name} {agent.location && `• ${agent.location}`}
              </p>
            )}
          </div>
        </div>

        {/* Customer Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Customer</h2>
          <p className="text-sm text-gray-600 mb-4">
            Search by name, phone number, email, or customer ID
          </p>

          <div className="relative">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter customer name, phone, email, or ID..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p className="mb-2">No customers found</p>
                    <button
                      onClick={() => router.push(`/portal/${agentCode}/customer/new`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <UserPlusIcon className="w-5 h-5" />
                      Create New Customer
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {searchResults.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{customer.fullName}</p>
                            <p className="text-sm text-blue-600">{customer.customerId}</p>
                            <p className="text-sm text-gray-600">{customer.phone}</p>
                            {customer.email && (
                              <p className="text-xs text-gray-500">{customer.email}</p>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            DOB: {new Date(customer.dob).toLocaleDateString()}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create New Customer Option */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Customer Not Found?</h2>
          <p className="text-gray-600 mb-4">
            If the customer doesn't exist in the system, you can create a new customer profile.
          </p>
          <button
            onClick={() => router.push(`/portal/${agentCode}/customer/new`)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlusIcon className="w-6 h-6" />
            <span className="text-lg font-semibold">Create New Customer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
