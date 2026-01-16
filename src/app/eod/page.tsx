'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { playNotificationSound, getUserSettings } from '@/lib/notifications';

interface Transaction {
  id: string;
  txnNumber: string;
  customer: {
    customerId: string;
    fullName: string;
  };
  beneficiaryName: string;
  totalPaidNzdCents: number;
  date: string;
  status: {
    id: string;
    name: string;
    label: string;
    color: string;
  } | null;
  agent: {
    id: string;
    name: string;
    agentCode: string;
  } | null;
}

interface DayGroup {
  date: string;
  transactions: Transaction[];
  isExpanded: boolean;
  totalAmount: number;
  completedCount: number;
  pendingCount: number;
}

export default function EodPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
    } else if (authStatus === 'authenticated') {
      fetchUserSettings();
      fetchAgents();
      fetchStatuses();
      fetchTransactions();
    }
  }, [authStatus, selectedAgent]);

  const fetchUserSettings = async () => {
    const settings = await getUserSettings();
    if (settings) {
      setSoundEnabled(settings.soundNotificationsEnabled);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/transaction-statuses');
      if (response.ok) {
        const data = await response.json();
        setAllStatuses(data.filter((s: any) => s.isActive));
      }
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '1000',
        sortBy: 'date',
        sortOrder: 'desc'
      });

      if (selectedAgent) {
        params.append('agentId', selectedAgent);
      }

      const response = await fetch(`/api/transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        const transactions = data.transactions as Transaction[];

        const openStatus = allStatuses.find(s => s.name === 'OPEN');

        const pendingTransactions = transactions.filter(txn => {
          return !txn.status || (openStatus && txn.status.id === openStatus.id);
        });

        const grouped = groupTransactionsByDay(pendingTransactions);
        setDayGroups(grouped);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupTransactionsByDay = (transactions: Transaction[]): DayGroup[] => {
    const groups: { [key: string]: Transaction[] } = {};

    transactions.forEach(txn => {
      const dateKey = new Date(txn.date).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(txn);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    return sortedDates.map((date, index) => {
      const transactions = groups[date];
      const totalAmount = transactions.reduce((sum, txn) => sum + txn.totalPaidNzdCents, 0);
      const completedCount = transactions.filter(txn => txn.status && txn.status.name !== 'OPEN').length;
      const pendingCount = transactions.filter(txn => !txn.status || txn.status.name === 'OPEN').length;

      return {
        date,
        transactions,
        isExpanded: index === 0,
        totalAmount,
        completedCount,
        pendingCount
      };
    });
  };

  const handleUpdateTransactionStatus = async (transactionId: string, newStatusId: string, dayDate: string) => {
    const previousGroups = [...dayGroups];

    try {
      const response = await fetch(`/api/transactions/${transactionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: newStatusId })
      });

      if (response.ok) {
        const newStatus = allStatuses.find(s => s.id === newStatusId);

        if (newStatus && newStatus.name !== 'OPEN' && soundEnabled) {
          playNotificationSound();
        }

        await fetchTransactions();
      } else {
        alert('Failed to update transaction status');
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
      alert('Failed to update transaction status');
      setDayGroups(previousGroups);
    }
  };

  const toggleDay = (date: string) => {
    setDayGroups(prev => prev.map(group =>
      group.date === date
        ? { ...group, isExpanded: !group.isExpanded }
        : group
    ));
  };

  const toggleExpandAll = () => {
    setExpandAll(!expandAll);
    setDayGroups(prev => prev.map(group => ({ ...group, isExpanded: !expandAll })));
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const yesterdayOnly = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayOnly) {
      return 'Today';
    } else if (dateOnly === yesterdayOnly) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-NZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const agentOptions = [
    { id: null, name: 'Head Office' },
    ...agents.filter(a => !a.isHeadOffice).map(a => ({ id: a.id, name: `${a.name} (${a.agentCode})` }))
  ];

  const totalPendingTransactions = dayGroups.reduce((sum, group) => sum + group.pendingCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">End of Day Review</h1>
          <p className="text-gray-600 mt-1">Review and complete pending transactions for each day</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Agent:</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Agents</option>
              {agentOptions.map((agent) => (
                <option key={agent.id || 'head-office'} value={agent.id || ''}>
                  {agent.name}
                </option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Total Pending: </span>
                <span className={`font-bold ${totalPendingTransactions > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {totalPendingTransactions}
                </span>
              </div>
              <button
                onClick={toggleExpandAll}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                {expandAll ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          </div>
        </div>

        {dayGroups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-600">No pending transactions found. All transactions have been completed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dayGroups.map((group) => (
              <div key={group.date} className="bg-white rounded-lg shadow overflow-hidden">
                <button
                  onClick={() => toggleDay(group.date)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {group.isExpanded ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                    )}
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatDate(group.date)}
                      </h3>
                      <p className="text-sm text-gray-500">{group.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className={`text-lg font-bold ${group.pendingCount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {group.pendingCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(group.totalAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Transactions</p>
                      <p className="text-lg font-bold text-gray-900">
                        {group.transactions.length}
                      </p>
                    </div>
                  </div>
                </button>

                {group.isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {group.pendingCount === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <p className="text-green-600 font-medium">
                          All transactions completed for this day
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-3">
                        {group.transactions.map((txn) => (
                          <div
                            key={txn.id}
                            className={`rounded-lg p-4 ${
                              !txn.status || txn.status.name === 'OPEN'
                                ? 'bg-yellow-50 border border-yellow-200'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <a
                                    href={`/transactions/${txn.id}`}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                  >
                                    {txn.txnNumber}
                                  </a>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatCurrency(txn.totalPaidNzdCents)}
                                  </span>
                                  {txn.agent && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {txn.agent.agentCode}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="font-medium">{txn.customer.fullName}</span>
                                  <span className="text-gray-400">→</span>
                                  <span>{txn.beneficiaryName}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Customer ID: {txn.customer.customerId}
                                </p>
                              </div>

                              <div className="flex-shrink-0">
                                <select
                                  value={txn.status?.id || ''}
                                  onChange={(e) => handleUpdateTransactionStatus(txn.id, e.target.value, group.date)}
                                  className="text-sm font-semibold px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[150px]"
                                  style={{
                                    backgroundColor: txn.status?.color || '#6b7280',
                                    color: '#ffffff',
                                    borderColor: txn.status?.color || '#6b7280'
                                  }}
                                >
                                  <option value="" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                                    No Status
                                  </option>
                                  {allStatuses.map((status) => (
                                    <option
                                      key={status.id}
                                      value={status.id}
                                      style={{ backgroundColor: '#ffffff', color: '#000000' }}
                                    >
                                      {status.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
