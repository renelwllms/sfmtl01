'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import TransactionDocumentList from '@/components/TransactionDocumentList';

interface Transaction {
  id: string;
  txnNumber: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    customerId: string;
    fullName: string;
    email: string | null;
    phone: string;
    dob: string;
    address: string | null;
  };
  beneficiaryName: string;
  beneficiaryVillage: string | null;
  beneficiaryPhone: string | null;
  bank: string | null;
  accountNumber: string | null;
  accountName: string | null;
  senderName: string;
  senderAddress: string | null;
  senderPhone: string;
  senderEmail: string | null;
  occupation: string | null;
  purposeOfTransfer: string | null;
  senderStreetAddress: string | null;
  senderSuburb: string | null;
  senderCity: string | null;
  senderPostcode: string | null;
  senderHomePhone: string | null;
  senderMobilePhone: string | null;
  employerName: string | null;
  employerAddress: string | null;
  employerPhone: string | null;
  reasonForRemittance: string | null;
  relationshipToBeneficiary: string | null;
  amountNzdCents: number;
  feeNzdCents: number;
  rate: number;
  currency: string;
  totalPaidNzdCents: number;
  totalForeignReceived: number;
  dob: string;
  verifiedWithOriginalId: boolean;
  proofOfAddressType: string | null;
  sourceOfFunds: string | null;
  sourceOfFundsDetails: string | null;
  bankAccountDetails: string | null;
  proofDocumentsProvided: string | null;
  id1CountryAndType: string | null;
  id1Number: string | null;
  id1IssueDate: string | null;
  id1ExpiryDate: string | null;
  id2CountryAndType: string | null;
  id2Number: string | null;
  id2IssueDate: string | null;
  id2ExpiryDate: string | null;
  isPtrRequired: boolean;
  isGoAmlExportReady: boolean;
  familyContributions?: Array<{
    id: string;
    contributorName: string;
    amountNzdCents: number;
    relationship?: string;
    createdAt: string;
  }>;
  createdBy: {
    id: string;
    email: string;
  } | null;
  agent: {
    id: string;
    name: string;
    agentCode: string;
    isHeadOffice: boolean;
  } | null;
  status: {
    id: string;
    name: string;
    label: string;
    color: string;
  } | null;
}

export default function TransactionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBeneficiary, setEditingBeneficiary] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [savingBeneficiary, setSavingBeneficiary] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTransaction();
      fetchStatuses();
    }
  }, [id]);

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/transaction-statuses');
      if (response.ok) {
        const data = await response.json();
        setStatuses(data.filter((s: any) => s.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    }
  };

  const fetchTransaction = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/transactions/${id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load transaction');
        setLoading(false);
        return;
      }

      setTransaction(data.transaction);
    } catch (err) {
      setError('An error occurred while loading the transaction');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleEditBeneficiary = () => {
    setBeneficiaryName(transaction?.beneficiaryName || '');
    setEditingBeneficiary(true);
  };

  const handleCancelEdit = () => {
    setEditingBeneficiary(false);
    setBeneficiaryName('');
  };

  const handleSaveBeneficiary = async () => {
    if (!beneficiaryName.trim()) {
      alert('Beneficiary name cannot be empty');
      return;
    }

    setSavingBeneficiary(true);

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaryName: beneficiaryName.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to update beneficiary name');
        setSavingBeneficiary(false);
        return;
      }

      setTransaction(data.transaction);
      setEditingBeneficiary(false);
      setBeneficiaryName('');
    } catch (err) {
      alert('An error occurred while updating beneficiary name');
    } finally {
      setSavingBeneficiary(false);
    }
  };

  const handleStatusChange = async (newStatusId: string) => {
    if (!transaction) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/transactions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: newStatusId })
      });

      if (response.ok) {
        const updatedTransaction = await response.json();
        setTransaction(updatedTransaction);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading transaction...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error || 'Transaction not found'}
          </div>
          <button
            onClick={() => router.push('/transactions/list')}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Transactions
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/transactions/list')}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Transactions
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
              <p className="text-lg text-gray-600 mt-1">{transaction.txnNumber}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <label className="text-xs font-medium text-gray-600">Transaction Status</label>
              <select
                value={transaction.status?.id || ''}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="px-4 py-2 text-sm font-semibold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: transaction.status?.color || '#6b7280',
                  color: '#ffffff',
                  borderColor: transaction.status?.color || '#6b7280',
                }}
              >
                <option value="">No Status</option>
                {statuses.map((status) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Amount (NZD)</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(transaction.amountNzdCents)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fee (NZD)</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(transaction.feeNzdCents)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Paid (NZD)</p>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(transaction.totalPaidNzdCents)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Foreign Received</p>
                  <p className="text-lg font-semibold text-green-600">{transaction.currency} {transaction.totalForeignReceived.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Exchange Rate</p>
                  <p className="text-lg font-semibold text-gray-900">{transaction.rate.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">{formatDate(transaction.createdAt)}</p>
                </div>
              </div>
              {transaction.agent && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Created by Agent</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.agent.name} ({transaction.agent.agentCode})</p>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
                <button
                  onClick={() => router.push(`/customers/${transaction.customer.id}`)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium cursor-pointer"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.customer.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer ID</p>
                  <button
                    onClick={() => router.push(`/customers/${transaction.customer.id}`)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {transaction.customer.customerId}
                  </button>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.customer.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(transaction.customer.dob).toLocaleDateString('en-NZ')}</p>
                </div>
                {transaction.customer.address && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.customer.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Beneficiary Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Beneficiary Information</h2>
                {!editingBeneficiary && (
                  <button
                    onClick={handleEditBeneficiary}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Edit Name
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={editingBeneficiary ? 'col-span-2' : ''}>
                  <p className="text-sm text-gray-500 mb-2">Name</p>
                  {editingBeneficiary ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={beneficiaryName}
                        onChange={(e) => setBeneficiaryName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter beneficiary name"
                        disabled={savingBeneficiary}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveBeneficiary}
                          disabled={savingBeneficiary}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {savingBeneficiary ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={savingBeneficiary}
                          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{transaction.beneficiaryName}</p>
                  )}
                </div>
                {transaction.beneficiaryVillage && (
                  <div>
                    <p className="text-sm text-gray-500">Village</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.beneficiaryVillage}</p>
                  </div>
                )}
                {transaction.beneficiaryPhone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.beneficiaryPhone}</p>
                  </div>
                )}
                {transaction.bank && (
                  <div>
                    <p className="text-sm text-gray-500">Bank</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.bank}</p>
                  </div>
                )}
                {transaction.accountNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Account Number</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.accountNumber}</p>
                  </div>
                )}
                {transaction.accountName && (
                  <div>
                    <p className="text-sm text-gray-500">Account Name</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.accountName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sender Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sender Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.senderName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.senderPhone}</p>
                </div>
                {transaction.senderEmail && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.senderEmail}</p>
                  </div>
                )}
                {transaction.senderAddress && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.senderAddress}</p>
                  </div>
                )}
                {(transaction.senderStreetAddress || transaction.senderCity) && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Full Address</p>
                    <p className="text-sm font-medium text-gray-900">
                      {[transaction.senderStreetAddress, transaction.senderSuburb, transaction.senderCity, transaction.senderPostcode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {transaction.occupation && (
                  <div>
                    <p className="text-sm text-gray-500">Occupation</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.occupation}</p>
                  </div>
                )}
                {transaction.purposeOfTransfer && (
                  <div>
                    <p className="text-sm text-gray-500">Purpose of Transfer</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.purposeOfTransfer}</p>
                  </div>
                )}
              </div>
            </div>

            {/* AML/KYC Information (for transactions >= NZD 1000) */}
            {transaction.totalPaidNzdCents >= 100000 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">AML/KYC Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  {transaction.sourceOfFunds && (
                    <div>
                      <p className="text-sm text-gray-500">Source of Funds</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.sourceOfFunds.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {transaction.sourceOfFundsDetails && (
                    <div>
                      <p className="text-sm text-gray-500">Source of Funds Details</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.sourceOfFundsDetails}</p>
                    </div>
                  )}
                  {transaction.bankAccountDetails && (
                    <div>
                      <p className="text-sm text-gray-500">Bank Account</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.bankAccountDetails}</p>
                    </div>
                  )}
                  {transaction.proofOfAddressType && (
                    <div>
                      <p className="text-sm text-gray-500">Proof of Address Type</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.proofOfAddressType.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {transaction.employerName && (
                    <div>
                      <p className="text-sm text-gray-500">Employer</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.employerName}</p>
                    </div>
                  )}
                  {transaction.reasonForRemittance && (
                    <div>
                      <p className="text-sm text-gray-500">Reason for Remittance</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.reasonForRemittance}</p>
                    </div>
                  )}
                  {transaction.relationshipToBeneficiary && (
                    <div>
                      <p className="text-sm text-gray-500">Relationship to Beneficiary</p>
                      <p className="text-sm font-medium text-gray-900">{transaction.relationshipToBeneficiary}</p>
                    </div>
                  )}
                </div>

                {/* Family Contributions Table */}
                {transaction.sourceOfFunds === 'FAMILY_CONTRIBUTIONS' && transaction.familyContributions && transaction.familyContributions.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Family Member Contributions</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Contributor Name
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Relationship
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Amount (NZD)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transaction.familyContributions.map((contribution) => (
                            <tr key={contribution.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {contribution.contributorName}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {contribution.relationship || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {formatCurrency(contribution.amountNzdCents)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                          <tr>
                            <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">
                              Total:
                            </td>
                            <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                              {formatCurrency(transaction.familyContributions.reduce((sum, c) => sum + c.amountNzdCents, 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ID Information */}
            {(transaction.id1CountryAndType || transaction.id2CountryAndType) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">ID Documentation</h2>
                <div className="space-y-4">
                  {transaction.id1CountryAndType && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Primary ID</p>
                      <div className="grid grid-cols-2 gap-4 pl-4">
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <p className="text-sm font-medium text-gray-900">{transaction.id1CountryAndType}</p>
                        </div>
                        {transaction.id1Number && (
                          <div>
                            <p className="text-sm text-gray-500">Number</p>
                            <p className="text-sm font-medium text-gray-900">{transaction.id1Number}</p>
                          </div>
                        )}
                        {transaction.id1IssueDate && (
                          <div>
                            <p className="text-sm text-gray-500">Issue Date</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(transaction.id1IssueDate).toLocaleDateString('en-NZ')}</p>
                          </div>
                        )}
                        {transaction.id1ExpiryDate && (
                          <div>
                            <p className="text-sm text-gray-500">Expiry Date</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(transaction.id1ExpiryDate).toLocaleDateString('en-NZ')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {transaction.id2CountryAndType && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Secondary ID</p>
                      <div className="grid grid-cols-2 gap-4 pl-4">
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <p className="text-sm font-medium text-gray-900">{transaction.id2CountryAndType}</p>
                        </div>
                        {transaction.id2Number && (
                          <div>
                            <p className="text-sm text-gray-500">Number</p>
                            <p className="text-sm font-medium text-gray-900">{transaction.id2Number}</p>
                          </div>
                        )}
                        {transaction.id2IssueDate && (
                          <div>
                            <p className="text-sm text-gray-500">Issue Date</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(transaction.id2IssueDate).toLocaleDateString('en-NZ')}</p>
                          </div>
                        )}
                        {transaction.id2ExpiryDate && (
                          <div>
                            <p className="text-sm text-gray-500">Expiry Date</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(transaction.id2ExpiryDate).toLocaleDateString('en-NZ')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <p className="text-sm text-gray-500">Verified with Original ID</p>
                    <p className="text-sm font-medium text-gray-900">{transaction.verifiedWithOriginalId ? 'Yes ✓' : 'No'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Supporting Documents */}
            <TransactionDocumentList transactionId={transaction.id} allowDelete={false} />
          </div>
        </div>
      </main>
    </div>
  );
}
