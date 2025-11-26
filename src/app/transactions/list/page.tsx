'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { formatNZDateTime } from '@/lib/date-utils';

interface Transaction {
  id: string;
  txnNumber: string;
  amountNzdCents: number;
  feeNzdCents: number;
  totalPaidNzdCents: number;
  currency: string;
  totalForeignReceived: number;
  beneficiaryName: string;
  createdAt: string;
  customer: {
    id: string;
    customerId: string;
    fullName: string;
    phone: string;
  };
  createdBy: {
    email: string;
  } | null;
  agent: {
    id: string;
    name: string;
    agentCode: string;
    isHeadOffice: boolean;
  } | null;
  status: {
    id: string;
    name: string;
    label: string;
    color: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AllTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currency, setCurrency] = useState('');
  const [source, setSource] = useState(''); // 'agent', 'head-office', or ''
  const [agentId, setAgentId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [agents, setAgents] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchAgentsAndStatuses();
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions();
    }
  }, [status, pagination.page, sortBy, sortOrder, currency, activeSearchTerm, source, agentId, statusId]);

  async function fetchAgentsAndStatuses() {
    try {
      const [agentsRes, statusesRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/transaction-statuses')
      ]);

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.filter((a: any) => !a.isHeadOffice));
      }

      if (statusesRes.ok) {
        const statusesData = await statusesRes.json();
        setStatuses(statusesData.filter((s: any) => s.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch agents and statuses:', error);
    }
  }

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(currency && { currency }),
        ...(activeSearchTerm && { search: activeSearchTerm }),
        ...(source && { source }),
        ...(agentId && { agentId }),
        ...(statusId && { statusId })
      });

      const response = await fetch(`/api/transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setPagination({ ...pagination, page: 1 });
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <Navigation />

      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
          <p className="text-gray-600 mt-1">View and search all money transfer transactions</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Customer name, ID, transaction number, or beneficiary..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Currencies</option>
                  <option value="WST">WST - Samoan Tala</option>
                  <option value="TOP">TOP - Tongan Pa'anga</option>
                  <option value="FJD">FJD - Fijian Dollar</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <select
                  id="source"
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    setAgentId(''); // Clear specific agent when source changes
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Sources</option>
                  <option value="head-office">Head Office</option>
                  <option value="agent">All Agents</option>
                </select>
              </div>
              <div>
                <label htmlFor="agent" className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Agent
                </label>
                <select
                  id="agent"
                  value={agentId}
                  onChange={(e) => {
                    setAgentId(e.target.value);
                    setSource(''); // Clear source filter when specific agent is selected
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={agents.length === 0}
                >
                  <option value="">Select Agent...</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.agentCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveSearchTerm('');
                  setCurrency('');
                  setSource('');
                  setAgentId('');
                  setStatusId('');
                  setPagination({ ...pagination, page: 1 });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Transactions</p>
              <p className="text-2xl font-bold">{pagination.totalCount}</p>
            </div>
            <div className="text-4xl">💸</div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No transactions found</div>
          ) : (
            <>
              <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('date')}
                      >
                        Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Txn #
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('customer')}
                      >
                        Customer {sortBy === 'customer' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beneficiary
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('amount')}
                      >
                        Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Currency
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/transactions/${txn.id}`)}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatNZDateTime(txn.createdAt)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/transactions/${txn.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                            {txn.txnNumber}
                          </Link>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/customers/${txn.customer.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                            <div className="text-sm font-medium">{txn.customer.fullName}</div>
                          </Link>
                          <div className="text-xs text-gray-500">{txn.customer.customerId}</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {txn.beneficiaryName}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                          ${(txn.amountNzdCents / 100).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                          ${(txn.feeNzdCents / 100).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">
                          ${(txn.totalPaidNzdCents / 100).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{txn.currency} {txn.totalForeignReceived.toFixed(2)}</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {txn.agent ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">{txn.agent.name}</div>
                              <div className="text-xs text-gray-500">{txn.agent.agentCode}</div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Head Office
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {txn.status && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${txn.status.color}20`,
                                color: txn.status.color
                              }}
                            >
                              {txn.status.label}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                          {txn.createdBy?.email || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.totalCount}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        ←
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        disabled={pagination.page === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        →
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
