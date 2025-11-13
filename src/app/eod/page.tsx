'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface EodRecord {
  id: string;
  date: string;
  systemTotalCents: number;
  systemTransactionCount: number;
  cashReceivedCents: number;
  differenceCents: number;
  status: 'PENDING' | 'COMPLETED' | 'DISCREPANCY';
  notes: string | null;
  completedBy: string | null;
  completedByEmail: string | null;
  completedAt: string | null;
  agent: {
    id: string;
    name: string;
    agentCode: string;
    isHeadOffice: boolean;
  } | null;
}

export default function EodPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [eodRecords, setEodRecords] = useState<EodRecord[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [currentEod, setCurrentEod] = useState<EodRecord | null>(null);
  const [cashReceived, setCashReceived] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
    } else if (authStatus === 'authenticated') {
      fetchAgents();
      fetchEodRecords();
    }
  }, [authStatus, selectedDate, selectedAgent]);

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

  const fetchEodRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedAgent) params.append('agentId', selectedAgent);

      const response = await fetch(`/api/eod?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEodRecords(data.eodRecords);
      }
    } catch (error) {
      console.error('Error fetching EOD records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEod = async (agentId: string | null) => {
    try {
      const response = await fetch('/api/eod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          date: selectedDate
        })
      });

      if (response.ok) {
        const newEod = await response.json();
        setCurrentEod(newEod);
        setCashReceived('');
        setNotes('');
        setShowModal(true);
        fetchEodRecords();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create EOD record');
      }
    } catch (error) {
      console.error('Error creating EOD:', error);
      alert('Failed to create EOD record');
    }
  };

  const handleOpenEod = (eod: EodRecord) => {
    setCurrentEod(eod);
    setCashReceived((eod.cashReceivedCents / 100).toFixed(2));
    setNotes(eod.notes || '');
    setShowModal(true);
  };

  const handleSubmitEod = async () => {
    if (!currentEod) return;

    const cashReceivedCents = Math.round(parseFloat(cashReceived || '0') * 100);

    try {
      const response = await fetch(`/api/eod/${currentEod.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashReceivedCents,
          notes,
          status: 'COMPLETED'
        })
      });

      if (response.ok) {
        setShowModal(false);
        fetchEodRecords();
        alert('EOD reconciliation completed successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update EOD record');
      }
    } catch (error) {
      console.error('Error updating EOD:', error);
      alert('Failed to update EOD record');
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'DISCREPANCY':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      COMPLETED: 'bg-green-100 text-green-800',
      DISCREPANCY: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
    };
    return styles[status as keyof typeof styles] || styles.PENDING;
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

  const existingEodIds = new Set(eodRecords.map(r => r.agent?.id || 'head-office'));
  const missingAgents = agentOptions.filter(a => !existingEodIds.has(a.id || 'head-office'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">End of Day Reconciliation</h1>
          <p className="text-gray-600 mt-1">Verify cash received matches system records</p>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Today
            </button>

            <div className="ml-auto flex gap-2">
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
            </div>
          </div>
        </div>

        {/* Missing EODs Alert */}
        {missingAgents.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">EOD Not Started</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The following locations have not started EOD for {new Date(selectedDate).toLocaleDateString()}:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {missingAgents.map((agent) => (
                    <button
                      key={agent.id || 'head-office'}
                      onClick={() => handleCreateEod(agent.id)}
                      className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md text-sm font-medium"
                    >
                      Start EOD for {agent.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EOD Records Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              EOD Records for {new Date(selectedDate).toLocaleDateString()}
            </h2>
          </div>

          {eodRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No EOD records found for this date
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      System Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Cash Received
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Difference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Completed By
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eodRecords.map((eod) => (
                    <tr key={eod.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {eod.agent?.name || 'Head Office'}
                        </div>
                        {eod.agent && (
                          <div className="text-xs text-gray-500">{eod.agent.agentCode}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {eod.systemTransactionCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatCurrency(eod.systemTotalCents)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(eod.cashReceivedCents)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                        eod.differenceCents === 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(eod.differenceCents)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(eod.status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(eod.status)}`}>
                            {eod.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {eod.completedByEmail || '-'}
                        {eod.completedAt && (
                          <div className="text-xs text-gray-400">
                            {new Date(eod.completedAt).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenEod(eod)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {eod.status === 'PENDING' ? 'Complete' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* EOD Modal */}
      {showModal && currentEod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">
              EOD Reconciliation - {currentEod.agent?.name || 'Head Office'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">System Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentEod.systemTransactionCount}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">System Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(currentEod.systemTotalCents)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cash Received (NZD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg font-medium"
                  placeholder="0.00"
                  disabled={currentEod.status !== 'PENDING'}
                />
              </div>

              {cashReceived && (
                <div className={`p-4 rounded-lg ${
                  Math.abs(parseFloat(cashReceived) * 100 - currentEod.systemTotalCents) < 1
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-sm font-medium">Difference:</p>
                  <p className={`text-2xl font-bold ${
                    Math.abs(parseFloat(cashReceived) * 100 - currentEod.systemTotalCents) < 1
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.round(parseFloat(cashReceived) * 100) - currentEod.systemTotalCents)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Add notes about any discrepancies or issues..."
                  disabled={currentEod.status !== 'PENDING'}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {currentEod.status === 'PENDING' ? 'Cancel' : 'Close'}
              </button>
              {currentEod.status === 'PENDING' && (
                <button
                  onClick={handleSubmitEod}
                  disabled={!cashReceived}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete EOD
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
