'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { hasRole } from '@/lib/roles';

interface Transaction {
  id: string;
  txnNumber: string;
  date: string;
  currency: string;
  amountNzdCents: number;
  totalPaidNzdCents: number;
  totalForeignReceived: number;
  beneficiaryName: string;
  beneficiaryPhone?: string;
  bank?: string;
  accountNumber?: string;
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  purposeOfTransfer?: string;
  sourceOfFunds?: string;
  isPtrRequired: boolean;
  isGoAmlExportReady: boolean;
  goAmlExportedAt?: string;
  customer: {
    id: string;
    customerId: string;
    fullName: string;
    phone: string;
    email?: string;
    address?: string;
    dob: string;
  };
  createdBy: {
    email: string;
  };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AMLPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ptr' | 'goaml'>('ptr');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0
  });
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      checkAccess();
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions();
    }
  }, [activeTab, pagination.page, status]);

  function checkAccess() {
    const userRoles = (session?.user as any)?.roles || '';
    const hasAccess = hasRole(userRoles, 'ADMIN') || hasRole(userRoles, 'AML');

    if (!hasAccess) {
      router.push('/');
    }
  }

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: activeTab,
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await fetch(`/api/aml/transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch AML transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleTransaction(id: string) {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  }

  function selectAll() {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  }

  async function handleExport() {
    if (selectedTransactions.size === 0) {
      setMessage('Please select at least one transaction to export');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/aml/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionIds: Array.from(selectedTransactions)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        setSelectedTransactions(new Set());
        fetchTransactions(); // Refresh the list
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage('Failed to export transactions');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setExporting(false);
    }
  }

  function formatCurrency(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">AML Compliance</h1>
            <p className="mt-1 text-sm text-gray-600">
              Anti-Money Laundering reporting and goAML export management
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => {
                  setActiveTab('ptr');
                  setPagination({ ...pagination, page: 1 });
                  setSelectedTransactions(new Set());
                }}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'ptr'
                    ? 'border-b-2 border-emerald-500 text-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                PTR Required
              </button>
              <button
                onClick={() => {
                  setActiveTab('goaml');
                  setPagination({ ...pagination, page: 1 });
                  setSelectedTransactions(new Set());
                }}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'goaml'
                    ? 'border-b-2 border-emerald-500 text-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                goAML Export
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {message && (
              <div className="mb-4 rounded-md bg-blue-50 p-4">
                <p className="text-sm text-blue-800">{message}</p>
              </div>
            )}

            {/* Summary */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {activeTab === 'ptr' && (
                  <p>
                    <strong>{pagination.totalCount}</strong> international transaction(s) requiring Prescribed Transaction Report (≥ NZD 1,000)
                  </p>
                )}
                {activeTab === 'goaml' && (
                  <p>
                    <strong>{pagination.totalCount}</strong> transaction(s) ready for goAML export (not yet exported)
                  </p>
                )}
              </div>

              {activeTab === 'goaml' && transactions.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {selectedTransactions.size === transactions.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exporting || selectedTransactions.size === 0}
                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? 'Exporting...' : `Mark as Exported (${selectedTransactions.size})`}
                  </button>
                </div>
              )}
            </div>

            {/* Transactions Table */}
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {activeTab === 'ptr'
                    ? 'No PTR required transactions found'
                    : 'No transactions pending goAML export'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {activeTab === 'goaml' && (
                        <th className="px-3 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.size === transactions.length}
                            onChange={selectAll}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beneficiary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        {activeTab === 'goaml' && (
                          <td className="px-3 py-4">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.has(txn.id)}
                              onChange={() => toggleTransaction(txn.id)}
                              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-emerald-600">{txn.txnNumber}</div>
                          <div className="text-xs text-gray-500">{txn.customer.customerId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{txn.customer.fullName}</div>
                          <div className="text-xs text-gray-500">{txn.customer.phone}</div>
                          <div className="text-xs text-gray-500">DOB: {new Date(txn.customer.dob).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{txn.beneficiaryName}</div>
                          {txn.bank && <div className="text-xs text-gray-500">{txn.bank}</div>}
                          {txn.accountNumber && <div className="text-xs text-gray-500">A/C: {txn.accountNumber}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(txn.totalPaidNzdCents)} NZD
                          </div>
                          <div className="text-xs text-gray-500">
                            {txn.totalForeignReceived.toFixed(2)} {txn.currency}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {txn.purposeOfTransfer && (
                            <div className="text-xs text-gray-700">
                              <span className="font-medium">Purpose:</span> {txn.purposeOfTransfer}
                            </div>
                          )}
                          {txn.sourceOfFunds && (
                            <div className="text-xs text-gray-700">
                              <span className="font-medium">Source:</span> {txn.sourceOfFunds}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(txn.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
