'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useSession } from 'next-auth/react';
import { formatNZDate } from '@/lib/date-utils';

export default function CustomerListPage() {
  const { data: session } = useSession();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const userRoles = (session?.user as any)?.roles || '';
  const isAdmin = userRoles.split(',').includes('ADMIN');

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const response = await fetch('/api/customers?list=true');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      setCustomers(data.customers);
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCustomer(customerId: string, customerName: string) {
    if (!confirm(`Are you sure you want to delete customer "${customerName}"?\n\nThis action cannot be undone. The customer must have no transactions to be deleted.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete customer');
        setTimeout(() => setError(''), 5000);
        return;
      }

      setSuccess('Customer deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchCustomers(); // Refresh list
    } catch (err) {
      setError('An error occurred while deleting customer');
      setTimeout(() => setError(''), 5000);
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.fullName.toLowerCase().includes(searchLower) ||
      customer.customerId.toLowerCase().includes(searchLower) ||
      customer.phone.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading customers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/" className="text-blue-600 hover:text-blue-700">← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">All Customers</h1>
              <span className="text-sm text-gray-500">
                {filteredCustomers.length} of {customers.length} customers
              </span>
            </div>

            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search by name, customer ID, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Customer Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date of Birth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a
                          href={`/customers/${customer.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {customer.customerId}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {customer.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {customer.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatNZDate(customer.dob)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {customer._count.transactions}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatNZDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/customers/${customer.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </a>
                          <a
                            href={`/transactions/new?customerId=${customer.id}`}
                            className="text-green-600 hover:text-green-900"
                          >
                            New Txn
                          </a>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteCustomer(customer.id, customer.fullName)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No customers match your search.' : 'No customers yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
