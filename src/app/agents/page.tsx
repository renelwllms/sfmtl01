'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BuildingOfficeIcon, UserGroupIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import Navigation from '@/components/Navigation';

interface Agent {
  id: string;
  agentCode: string;
  name: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  isHeadOffice: boolean;
  _count?: {
    transactions: number;
    customers: number;
  };
}

interface DailyStats {
  agentId: string | null;
  agentName: string;
  transactionCount: number;
  totalNzd: number;
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (agents.length > 0) {
      fetchDailyStats();
    }
  }, [selectedDate, agents]);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents?includeStats=true');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const stats: DailyStats[] = [];

      // Fetch stats for each agent
      for (const agent of agents) {
        const response = await fetch(
          `/api/agents/${agent.id}/transactions?date=${selectedDate}&limit=1000`
        );
        if (response.ok) {
          const data = await response.json();
          stats.push({
            agentId: agent.id,
            agentName: agent.name,
            transactionCount: data.totals.transactionCount,
            totalNzd: data.totals.totalPaidNzd
          });
        }
      }

      // Fetch head office stats
      const headOfficeResponse = await fetch(
        `/api/agents/head-office/transactions?date=${selectedDate}&limit=1000`
      );
      if (headOfficeResponse.ok) {
        const data = await headOfficeResponse.json();
        stats.push({
          agentId: null,
          agentName: 'Head Office',
          transactionCount: data.totals.transactionCount,
          totalNzd: data.totals.totalPaidNzd
        });
      }

      setDailyStats(stats);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const handleViewTransactions = (agentId: string | null) => {
    const id = agentId || 'head-office';
    router.push(`/agents/${id}?date=${selectedDate}`);
  };

  const getTotalStats = () => {
    return dailyStats.reduce(
      (acc, stat) => ({
        transactions: acc.transactions + stat.transactionCount,
        totalNzd: acc.totalNzd + stat.totalNzd
      }),
      { transactions: 0, totalNzd: 0 }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
        <Navigation />
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center">Loading agents...</div>
        </div>
      </div>
    );
  }

  const totalStats = getTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <Navigation />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Agents Dashboard</h1>
          <p className="text-gray-600 mt-1">
            View all agents and their daily transaction activity
          </p>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Select Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Today
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agents.filter(a => !a.isHeadOffice).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Daily Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalStats.transactions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Daily Total (NZD)</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalStats.totalNzd.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agents Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Daily Activity for {new Date(selectedDate).toLocaleDateString()}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily Transactions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily Total (NZD)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Head Office Row */}
                {(() => {
                  const headOfficeStats = dailyStats.find(s => s.agentId === null);
                  return (
                    <tr className="bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              Head Office
                            </div>
                            <div className="text-xs text-gray-500">
                              Main Branch
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {headOfficeStats?.transactionCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ${(headOfficeStats?.totalNzd || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewTransactions(null)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Transactions
                        </button>
                      </td>
                    </tr>
                  );
                })()}

                {/* Agent Rows */}
                {agents
                  .filter(agent => !agent.isHeadOffice)
                  .map((agent) => {
                    const agentStats = dailyStats.find(s => s.agentId === agent.id);
                    return (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <UserGroupIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {agent.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {agent.agentCode}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {agent.location || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{agent.phone || '-'}</div>
                          {agent.email && (
                            <div className="text-xs text-gray-400">{agent.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            agent.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : agent.status === 'INACTIVE'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {agent.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {agentStats?.transactionCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          ${(agentStats?.totalNzd || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewTransactions(agent.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Transactions
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
