'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('DRIVERS_LICENSE');

  useEffect(() => {
    fetchCustomer();
  }, []);

  async function fetchCustomer() {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }
      const data = await response.json();
      setCustomer(data.customer);
    } catch (err) {
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', selectedDocType);

    try {
      const response = await fetch(`/api/customers/${params.id}/ids`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Refresh customer data
      await fetchCustomer();
      alert('File uploaded successfully!');
      // Reset file input
      e.target.value = '';
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  }

  function getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      DRIVERS_LICENSE: "Driver's License",
      PASSPORT: 'Passport',
      NATIONAL_ID: 'National ID',
      BANK_CARD: 'Bank Card',
      BIRTH_CERTIFICATE: 'Birth Certificate',
      OTHER: 'Other'
    };
    return labels[type] || type;
  }

  // Calculate monthly transaction data for chart
  const monthlyTransactionData = useMemo(() => {
    if (!customer?.transactions) return [];

    const monthMap = new Map<string, number>();

    customer.transactions.forEach((txn: any) => {
      const date = new Date(txn.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    });

    const sortedMonths = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12); // Last 12 months

    return sortedMonths.map(([month, count]) => {
      const [year, monthNum] = month.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
        transactions: count
      };
    });
  }, [customer]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Customer not found'}</p>
          <a href="/" className="text-blue-600 hover:text-blue-700">← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Customer Info */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.fullName}</h1>
              <p className="text-sm text-gray-500">Customer ID: {customer.customerId}</p>
            </div>
            <a
              href={`/transactions/new?customerId=${customer.id}`}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              New Transaction
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-gray-900">{customer.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-gray-900">{customer.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p className="text-gray-900">{new Date(customer.dob).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-gray-900">{customer.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Transaction Chart */}
        {monthlyTransactionData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History (Monthly)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTransactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="transactions" fill="#10b981" name="Number of Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Uploaded IDs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Uploaded ID Documents</h2>

            <div className="mb-4 space-y-3">
              <div>
                <label htmlFor="docType" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <select
                  id="docType"
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="BANK_CARD">Bank Card</option>
                  <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Upload File</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                  />
                </label>
              </div>
              {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
            </div>

            {customer.ids && customer.ids.length > 0 ? (
              <ul className="space-y-2">
                {customer.ids.map((idFile: any) => (
                  <li key={idFile.id} className="text-sm border rounded-md p-3 hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => setViewingFile(`/api/customers/${params.id}/ids/${idFile.id}`)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {idFile.filePath.endsWith('.pdf') ? '📄' : '🖼️'}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-emerald-600 hover:text-emerald-700">
                            {getDocumentTypeLabel(idFile.documentType)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded {new Date(idFile.createdAt).toLocaleDateString()} at {new Date(idFile.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className="text-gray-400 text-xs">
                          Click to view
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No ID documents uploaded yet.</p>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
            {customer.transactions && customer.transactions.length > 0 ? (
              <ul className="space-y-3">
                {customer.transactions.slice(0, 5).map((txn: any) => (
                  <li key={txn.id} className="border-b pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{txn.txnNumber}</p>
                        <p className="text-sm text-gray-600">To: {txn.beneficiaryName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${(txn.totalPaidNzdCents / 100).toFixed(2)} NZD
                        </p>
                        <p className="text-sm text-gray-600">
                          {txn.totalForeignReceived.toFixed(2)} {txn.currency}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No transactions yet.</p>
            )}
          </div>
        </div>
      </main>

      {/* File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">View Document</h3>
              <button
                onClick={() => setViewingFile(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {viewingFile.endsWith('.pdf') ? (
                <iframe
                  src={viewingFile}
                  className="w-full h-full min-h-[600px]"
                  title="PDF Viewer"
                />
              ) : (
                <img
                  src={viewingFile}
                  alt="ID Document"
                  className="max-w-full h-auto mx-auto"
                />
              )}
            </div>
            <div className="p-4 border-t flex gap-2">
              <a
                href={viewingFile}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                Open in New Tab
              </a>
              <button
                onClick={() => setViewingFile(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
