'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AgentSalesChart() {
  const [period, setPeriod] = useState('30days');
  const [agentStats, setAgentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStats();
  }, [period]);

  async function fetchAgentStats() {
    setLoading(true);
    try {
      const response = await fetch(`/api/agents/stats?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setAgentStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch agent stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Sales Performance</h2>
        <div className="flex items-center justify-center h-80 text-gray-600">
          Loading agent data...
        </div>
      </div>
    );
  }

  if (!agentStats || agentStats.stats.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Agent Sales Performance</h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>
        <div className="flex items-center justify-center h-80 text-gray-600">
          No agent transaction data available for this period.
        </div>
      </div>
    );
  }

  // Prepare chart data - top 10 agents
  const chartData = agentStats.stats.slice(0, 10).map((agent: any) => ({
    name: agent.agentCode,
    fullName: agent.agentName,
    transactions: agent.transactionCount,
    revenue: agent.totalRevenueNzd,
    amount: agent.totalAmountNzd
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Agent Sales Performance</h2>
          <p className="text-sm text-gray-600 mt-1">
            Top performing agents by revenue • {agentStats.startDate} to {agentStats.endDate}
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-700">{agentStats.totals.transactionCount}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-green-700">
            ${agentStats.totals.totalAmountNzd.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-purple-700">
            ${agentStats.totals.totalRevenueNzd.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="category" dataKey="name" />
          <YAxis type="number" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
                    <p className="text-sm text-gray-700">Code: {data.name}</p>
                    <p className="text-sm text-gray-700">Transactions: {data.transactions}</p>
                    <p className="text-sm text-gray-700">
                      Amount: ${data.amount.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-green-700 font-semibold">
                      Revenue: ${data.revenue.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar dataKey="revenue" fill="#10b981" name="Revenue (NZD)" />
          <Bar dataKey="amount" fill="#3b82f6" name="Amount (NZD)" />
        </BarChart>
      </ResponsiveContainer>

      {/* Agent Table */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Detailed Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rank
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Agent
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Transactions
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Amount
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Fees
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agentStats.stats.map((agent: any, index: number) => (
                <tr key={agent.agentId} className={index < 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-900' :
                      index === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{agent.agentName}</div>
                    <div className="text-xs text-gray-500">{agent.agentCode}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                    {agent.transactionCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                    ${agent.totalAmountNzd.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                    ${agent.totalFeesNzd.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-green-700">
                    ${agent.totalRevenueNzd.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
