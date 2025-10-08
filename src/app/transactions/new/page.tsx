'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function NewTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rates, setRates] = useState<any>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    // Beneficiary
    beneficiaryName: '',
    beneficiaryVillage: '',
    beneficiaryPhone: '',
    bank: '',
    accountNumber: '',
    accountName: '',
    // Sender (prefilled from customer)
    senderName: '',
    senderAddress: '',
    senderPhone: '',
    senderEmail: '',
    occupation: '',
    purposeOfTransfer: '',
    // Money
    amountNzd: '',
    feeNzd: '',
    rate: '',
    currency: 'WST' as 'WST' | 'AUD' | 'USD',
    // AML/KYC
    dob: '',
    verifiedWithOriginalId: false,
    proofOfAddressType: '' as '' | 'BILL' | 'BANK_STATEMENT' | 'OTHER',
    sourceOfFunds: '',
    id1CountryAndType: '',
    id1Number: '',
    id1IssueDate: '',
    id1ExpiryDate: '',
    id2CountryAndType: '',
    id2Number: '',
    id2IssueDate: '',
    id2ExpiryDate: ''
  });

  useEffect(() => {
    fetchRates();
    if (preselectedCustomerId) {
      fetchCustomer(preselectedCustomerId);
    }
  }, []);

  useEffect(() => {
    if (rates && formData.currency) {
      const rateKey = `NZD_${formData.currency}` as 'NZD_WST' | 'NZD_AUD' | 'NZD_USD';
      setFormData(prev => ({ ...prev, rate: rates.rates[rateKey].toString() }));
    }
  }, [formData.currency, rates]);

  async function fetchRates() {
    try {
      const response = await fetch('/api/exchange-rates');
      const data = await response.json();
      setRates(data);
    } catch (err) {
      console.error('Failed to fetch rates');
    }
  }

  async function fetchCustomer(id: string) {
    try {
      const response = await fetch(`/api/customers/${id}`);
      if (response.ok) {
        const data = await response.json();
        const cust = data.customer;
        setCustomer(cust);
        setFormData(prev => ({
          ...prev,
          customerId: cust.id,
          senderName: cust.fullName,
          senderAddress: cust.address || '',
          senderPhone: cust.phone,
          senderEmail: cust.email || '',
          dob: cust.dob.split('T')[0]
        }));
      }
    } catch (err) {
      console.error('Failed to fetch customer');
    }
  }

  async function searchCustomer(e: FormEvent) {
    e.preventDefault();
    if (!searchTerm) return;

    try {
      const isPhone = searchTerm.startsWith('+');
      const param = isPhone ? `phone=${searchTerm}` : `customerId=${searchTerm}`;
      const response = await fetch(`/api/customers?${param}`);

      if (response.ok) {
        const data = await response.json();
        const cust = data.customer;
        setCustomer(cust);
        setFormData(prev => ({
          ...prev,
          customerId: cust.id,
          senderName: cust.fullName,
          senderAddress: cust.address || '',
          senderPhone: cust.phone,
          senderEmail: cust.email || '',
          dob: cust.dob.split('T')[0]
        }));
        setError('');
      } else {
        setError('Customer not found');
        setCustomer(null);
      }
    } catch (err) {
      setError('Failed to search customer');
    }
  }

  const totalPaidNzd = (parseFloat(formData.amountNzd || '0') + parseFloat(formData.feeNzd || '0')).toFixed(2);
  const totalForeign = (parseFloat(formData.amountNzd || '0') * parseFloat(formData.rate || '0')).toFixed(2);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        amountNzdCents: Math.round(parseFloat(formData.amountNzd) * 100),
        feeNzdCents: Math.round(parseFloat(formData.feeNzd) * 100),
        rate: parseFloat(formData.rate),
        totalPaidNzdCents: Math.round(parseFloat(totalPaidNzd) * 100),
        totalForeignReceived: parseFloat(totalForeign),
        proofOfAddressType: formData.proofOfAddressType || undefined,
        id1IssueDate: formData.id1IssueDate || undefined,
        id1ExpiryDate: formData.id1ExpiryDate || undefined,
        id2IssueDate: formData.id2IssueDate || undefined,
        id2ExpiryDate: formData.id2ExpiryDate || undefined
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setError(data.details.map((d: any) => d.message).join(', '));
        } else {
          setError(data.error || 'Failed to create transaction');
        }
        setLoading(false);
        return;
      }

      alert(`Transaction created! TXN: ${data.transaction.txnNumber}`);
      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">New Transaction</h1>

          {/* Customer Search */}
          {!customer && (
            <div className="mb-6 pb-6 border-b">
              <h2 className="text-lg font-semibold mb-4">Select Customer</h2>
              <form onSubmit={searchCustomer} className="flex gap-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter phone (+6421234567) or customer ID (SFMTL0001)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Search
                </button>
              </form>
            </div>
          )}

          {customer && (
            <div className="mb-6 pb-6 border-b bg-blue-50 p-4 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.fullName}</h3>
                  <p className="text-sm text-gray-600">ID: {customer.customerId}</p>
                  <p className="text-sm text-gray-600">Phone: {customer.phone}</p>
                </div>
                <button
                  onClick={() => { setCustomer(null); setFormData(prev => ({ ...prev, customerId: '' })); }}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Change Customer
                </button>
              </div>
            </div>
          )}

          {customer && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Beneficiary Details */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Beneficiary Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Beneficiary Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.beneficiaryName}
                      onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Village</label>
                    <input
                      type="text"
                      value={formData.beneficiaryVillage}
                      onChange={(e) => setFormData({ ...formData, beneficiaryVillage: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.beneficiaryPhone}
                      onChange={(e) => setFormData({ ...formData, beneficiaryPhone: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank</label>
                    <input
                      type="text"
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Account Name</label>
                    <input
                      type="text"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Money */}
              <div className="space-y-4 bg-yellow-50 p-4 rounded-md">
                <h2 className="text-lg font-semibold">Transaction Details</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="WST">WST (Samoa Tala)</option>
                      <option value="AUD">AUD (Australian Dollar)</option>
                      <option value="USD">USD (US Dollar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount NZD <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amountNzd}
                      onChange={(e) => setFormData({ ...formData, amountNzd: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fee NZD <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.feeNzd}
                      onChange={(e) => setFormData({ ...formData, feeNzd: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Exchange Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Paid NZD</label>
                    <input
                      type="text"
                      readOnly
                      value={`$${totalPaidNzd}`}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Foreign Received</label>
                    <input
                      type="text"
                      readOnly
                      value={`${totalForeign} ${formData.currency}`}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose of Transfer</label>
                  <input
                    type="text"
                    value={formData.purposeOfTransfer}
                    onChange={(e) => setFormData({ ...formData, purposeOfTransfer: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source of Funds</label>
                  <input
                    type="text"
                    value={formData.sourceOfFunds}
                    onChange={(e) => setFormData({ ...formData, sourceOfFunds: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Proof of Address</label>
                  <select
                    value={formData.proofOfAddressType}
                    onChange={(e) => setFormData({ ...formData, proofOfAddressType: e.target.value as any })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select...</option>
                    <option value="BILL">Utility Bill</option>
                    <option value="BANK_STATEMENT">Bank Statement</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Verification */}
              <div className="flex items-center">
                <input
                  id="verified"
                  type="checkbox"
                  checked={formData.verifiedWithOriginalId}
                  onChange={(e) => setFormData({ ...formData, verifiedWithOriginalId: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded"
                />
                <label htmlFor="verified" className="ml-2 text-sm text-gray-700">
                  Verified with original ID
                </label>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Transaction...' : 'Create Transaction'}
                </button>
                <a
                  href="/"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </a>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
