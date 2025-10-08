'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  dob: string;
}

export default function AgentNewTransactionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exchangeRates, setExchangeRates] = useState<any>(null);

  const [newCustomerData, setNewCustomerData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    phone: '',
    email: '',
    address: ''
  });

  const [transactionData, setTransactionData] = useState({
    beneficiaryName: '',
    beneficiaryVillage: '',
    beneficiaryPhone: '',
    bank: '',
    accountNumber: '',
    accountName: '',
    amountNzd: '',
    currency: 'WST' as 'WST' | 'AUD' | 'USD',
    purposeOfTransfer: ''
  });

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  async function fetchExchangeRates() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/exchange-rates?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        setExchangeRates(data.rates);
      }
    } catch (err) {
      console.error('Failed to fetch exchange rates:', err);
    }
  }

  async function searchCustomers(term: string) {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.customers || []);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  async function handleCreateCustomer(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create customer');
        setLoading(false);
        return;
      }

      setSelectedCustomer(data.customer);
      setShowNewCustomerForm(false);
      setNewCustomerData({ firstName: '', lastName: '', dob: '', phone: '', email: '', address: '' });
      setSuccess('Customer created successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('An error occurred while creating customer');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitTransaction(e: FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) {
      setError('Please select a customer first');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const amountCents = Math.round(parseFloat(transactionData.amountNzd) * 100);
      const rate = exchangeRates?.[`NZD_${transactionData.currency}`] || 1;

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          ...transactionData,
          amountNzdCents: amountCents,
          rate,
          senderName: selectedCustomer.fullName,
          senderPhone: selectedCustomer.phone,
          dob: selectedCustomer.dob
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create transaction');
        setLoading(false);
        return;
      }

      setSuccess(`Transaction ${data.transaction.txnNumber} created successfully!`);
      // Reset form
      setTransactionData({
        beneficiaryName: '',
        beneficiaryVillage: '',
        beneficiaryPhone: '',
        bank: '',
        accountNumber: '',
        accountName: '',
        amountNzd: '',
        currency: 'WST',
        purposeOfTransfer: ''
      });
      setSelectedCustomer(null);
      setSearchTerm('');

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('An error occurred while creating transaction');
    } finally {
      setLoading(false);
    }
  }

  const totalForeign = transactionData.amountNzd && exchangeRates
    ? (parseFloat(transactionData.amountNzd) * (exchangeRates[`NZD_${transactionData.currency}`] || 0)).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Mobile Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">SFMTL</h1>
            <p className="text-xs text-blue-100">Agent Portal</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-sm"
          >
            Logout
          </button>
        </div>
        {session?.user?.email && (
          <p className="text-xs text-blue-100 mt-2">📧 {session.user.email}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-4 max-w-2xl mx-auto">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 p-3 border border-green-200">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Customer Selection */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Select Customer</h2>

          {!selectedCustomer ? (
            <>
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchCustomers(e.target.value);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="w-5 h-5 absolute right-3 top-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {showSearchResults && searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg mb-3 max-h-60 overflow-y-auto">
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowSearchResults(false);
                        setSearchTerm('');
                      }}
                      className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-semibold text-gray-900">{customer.fullName}</div>
                      <div className="text-sm text-gray-600">{customer.phone}</div>
                      <div className="text-xs text-gray-500">{customer.customerId}</div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchTerm.length > 2 && showSearchResults && (
                <div className="text-center py-4 text-gray-500 mb-3">
                  No customers found
                </div>
              )}

              <button
                onClick={() => setShowNewCustomerForm(true)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                + Create New Customer
              </button>
            </>
          ) : (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{selectedCustomer.fullName}</div>
                  <div className="text-sm text-gray-600">{selectedCustomer.phone}</div>
                  <div className="text-xs text-gray-500">{selectedCustomer.customerId}</div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Form */}
        {selectedCustomer && (
          <form onSubmit={handleSubmitTransaction} className="bg-white rounded-lg shadow-md p-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">2. Transaction Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beneficiary Name *
              </label>
              <input
                type="text"
                required
                value={transactionData.beneficiaryName}
                onChange={(e) => setTransactionData({ ...transactionData, beneficiaryName: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Recipient's name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Village
                </label>
                <input
                  type="text"
                  value={transactionData.beneficiaryVillage}
                  onChange={(e) => setTransactionData({ ...transactionData, beneficiaryVillage: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={transactionData.beneficiaryPhone}
                  onChange={(e) => setTransactionData({ ...transactionData, beneficiaryPhone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank
              </label>
              <input
                type="text"
                value={transactionData.bank}
                onChange={(e) => setTransactionData({ ...transactionData, bank: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Bank name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={transactionData.accountNumber}
                onChange={(e) => setTransactionData({ ...transactionData, accountNumber: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={transactionData.accountName}
                onChange={(e) => setTransactionData({ ...transactionData, accountName: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <select
                  required
                  value={transactionData.currency}
                  onChange={(e) => setTransactionData({ ...transactionData, currency: e.target.value as any })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WST">WST (Samoa)</option>
                  <option value="AUD">AUD</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (NZD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transactionData.amountNzd}
                  onChange={(e) => setTransactionData({ ...transactionData, amountNzd: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {transactionData.amountNzd && exchangeRates && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-gray-700">
                  Rate: 1 NZD = {exchangeRates[`NZD_${transactionData.currency}`]?.toFixed(4)} {transactionData.currency}
                </div>
                <div className="text-lg font-bold text-blue-700 mt-1">
                  Recipient gets: {totalForeign} {transactionData.currency}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose of Transfer
              </label>
              <textarea
                rows={3}
                value={transactionData.purposeOfTransfer}
                onChange={(e) => setTransactionData({ ...transactionData, purposeOfTransfer: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Family support, education, medical"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Processing...' : 'Create Transaction'}
            </button>
          </form>
        )}
      </div>

      {/* New Customer Modal */}
      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8">
            <div className="bg-white rounded-lg shadow-xl max-w-lg mx-auto">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Create New Customer</h3>
                <button
                  onClick={() => setShowNewCustomerForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={newCustomerData.firstName}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, firstName: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newCustomerData.lastName}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, lastName: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth * <span className="text-xs text-gray-500">(Must be 18+)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newCustomerData.dob}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, dob: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone * <span className="text-xs text-gray-500">(+64...)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+6421234567"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={newCustomerData.address}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Customer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerForm(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
