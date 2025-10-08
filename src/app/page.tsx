'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'customerId'>('phone');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const userRoles = (session?.user as any)?.roles || '';
  const isAdmin = userRoles.split(',').map((r: string) => r.trim()).includes('ADMIN');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  async function fetchDashboardData() {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchTerm) return;

    setSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const param = searchType === 'phone' ? `phone=${searchTerm}` : `customerId=${searchTerm}`;
      const response = await fetch(`/api/customers?${param}`);

      if (response.ok) {
        const data = await response.json();
        setSearchResult(data.customer);
      } else {
        setSearchError('Customer not found');
      }
    } catch (err) {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {!loadingDashboard && dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Amount Transferred */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-lg shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Total Transferred (YTD)</h3>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-3xl font-bold">${(dashboardData.summary.totalAmountTransferred / 100).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs opacity-75 mt-1">{dashboardData.summary.totalTransactions} transactions</p>
            </div>

            {/* Total Fees Collected */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-lg shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Fees Collected (YTD)</h3>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-3xl font-bold">${(dashboardData.summary.totalFeesCollected / 100).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs opacity-75 mt-1">Revenue generated</p>
            </div>

            {/* Current Month */}
            <div className="bg-gradient-to-br from-sky-600 to-sky-700 p-6 rounded-lg shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">This Month</h3>
                <span className="text-2xl">📅</span>
              </div>
              <p className="text-3xl font-bold">${(dashboardData.summary.currentMonthTotal / 100).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs opacity-75 mt-1">{dashboardData.summary.currentMonthCount} transactions</p>
            </div>

            {/* Last Month */}
            <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 p-6 rounded-lg shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Last Month</h3>
                <span className="text-2xl">📆</span>
              </div>
              <p className="text-3xl font-bold">${(dashboardData.summary.lastMonthTotal / 100).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs opacity-75 mt-1">{dashboardData.summary.lastMonthCount} transactions</p>
            </div>
          </div>
        )}

        {/* Charts Row */}
        {!loadingDashboard && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Transactions Line Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Transactions (Year to Date)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} name="Transaction Count" />
                  <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} name="Amount (NZD)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Currency Breakdown Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transactions by Currency</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(dashboardData.currencyBreakdown).map(([currency, data]: [string, any]) => ({
                      name: currency,
                      value: data.count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.keys(dashboardData.currencyBreakdown).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#2563eb', '#3b82f6', '#0ea5e9'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Customers and Quick Stats */}
        {!loadingDashboard && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Customers */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Customers (YTD)</h2>
              <div className="space-y-3">
                {dashboardData.topCustomers.map((customer: any, index: number) => (
                  <div key={customer.customerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.customerId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${(customer.totalAmount / 100).toLocaleString('en-NZ')}</p>
                      <p className="text-xs text-gray-500">{customer.transactionCount} txns</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">👥</span>
                    <div>
                      <p className="text-sm text-gray-600">Total Customers</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.totalCustomers}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🔄</span>
                    <div>
                      <p className="text-sm text-gray-600">Recent Activity (7 days)</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.recentTransactions} transactions</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-sky-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📈</span>
                    <div>
                      <p className="text-sm text-gray-600">Average per Transaction</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${dashboardData.summary.totalTransactions > 0
                          ? ((dashboardData.summary.totalAmountTransferred / dashboardData.summary.totalTransactions) / 100).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '0.00'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Search</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search for customer
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchType === 'phone' ? 'Enter phone number (e.g., +6421234567)' : 'Enter customer ID (e.g., SFMTL0001)'}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-48">
                <label htmlFor="searchType" className="block text-sm font-medium text-gray-700 mb-1">
                  Search by
                </label>
                <select
                  id="searchType"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'phone' | 'customerId')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="phone">Phone</option>
                  <option value="customerId">Customer ID</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchError && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{searchError}</p>
            </div>
          )}

          {searchResult && (
            <div className="mt-4 bg-green-50 p-4 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">Customer Found!</h3>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-600">Name:</span> <span className="font-medium">{searchResult.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-600">ID:</span> <span className="font-medium">{searchResult.customerId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span> <span className="font-medium">{searchResult.phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span> <span className="font-medium">{searchResult.email || 'N/A'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/customers/${searchResult.id}`}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Details
                </a>
                <a
                  href={`/transactions/new?customerId=${searchResult.id}`}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                >
                  New Transaction
                </a>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
