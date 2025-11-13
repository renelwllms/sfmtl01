'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Navigation from '@/components/Navigation';

interface Transaction {
  id: string;
  txnNumber: string;
  date: string;
  beneficiaryName: string;
  currency: string;
  amountNzdCents: number;
  feeNzdCents: number;
  totalPaidNzdCents: number;
  totalForeignReceived: number;
  customer: {
    customerId: string;
    fullName: string;
  };
  status: {
    label: string;
    color: string;
  } | null;
}

export default function AgentTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = params.id as string;
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  const [agent, setAgent] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({ transactionCount: 0, totalPaidNzd: 0 });
  const [startDate, setStartDate] = useState(
    startDateParam || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    endDateParam || new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (agentId !== 'head-office') {
      fetchAgent();
    }
    fetchTransactions();
  }, [agentId, startDate, endDate, page]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      if (response.ok) {
        const data = await response.json();
        setAgent(data);
      }
    } catch (error) {
      console.error('Error fetching agent:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/agents/${agentId}/transactions?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setPagination(data.pagination);
        setTotals(data.totals);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const agentName = agentId === 'head-office' ? 'Head Office' : agent?.name || 'Loading...';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <Navigation />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Agents
          </button>

          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{agentName}</h1>
              <p className="text-gray-600 mt-1">
                Transactions from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
              </p>
              {agent && agent.agentCode && (
                <p className="text-sm text-gray-500 mt-1">
                  Agent Code: {agent.agentCode} | Location: {agent.location || 'N/A'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setStartDate(today);
                  setEndDate(today);
                  setPage(1);
                }}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                Today
              </button>
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
              >
                Clear Filter
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totals.transactionCount}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Amount (NZD)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${totals.totalPaidNzd.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No transactions found for this date
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Txn #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Beneficiary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Currency
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount (NZD)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Fee
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total Paid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          <button
                            onClick={() => router.push(`/transactions/${txn.id}`)}
                            className="hover:underline"
                          >
                            {txn.txnNumber}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(txn.date).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {txn.customer.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {txn.customer.customerId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.beneficiaryName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {txn.currency}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(txn.amountNzdCents)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {formatCurrency(txn.feeNzdCents)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {formatCurrency(txn.totalPaidNzdCents)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {txn.status && (
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${txn.status.color}20`,
                                color: txn.status.color
                              }}
                            >
                              {txn.status.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {transactions.length} of {pagination.totalCount} transactions
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
