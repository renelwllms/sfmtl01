'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export default function ImportCustomersPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  async function handleImport() {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/customers/import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to import customers');
        setLoading(false);
        return;
      }

      setResult(data.result);
      setFile(null);
    } catch (err) {
      setError('An error occurred during import');
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const csvContent = 'firstName,lastName,dob,phone,email,address\nJohn,Doe,1990-01-15,+6421234567,john@example.com,"123 Main St"\nJane,Smith,1985-05-20,+6427654321,jane@example.com,"456 Oak Ave"';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Import Customers</h1>
            <button
              onClick={() => router.push('/customers/list')}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back to Customers
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Import Instructions</h2>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Download the CSV template below to see the required format</li>
              <li>Fill in customer data: firstName, lastName, dob (YYYY-MM-DD), phone (+64...), email, address</li>
              <li>Phone numbers must be in E.164 format (e.g., +6421234567)</li>
              <li>Date of birth must be YYYY-MM-DD format (e.g., 1990-01-15)</li>
              <li>Customers must be 18 years or older</li>
              <li>Email and address are optional fields</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Download CSV Template
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={loading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                file:cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Importing...' : 'Import Customers'}
          </button>

          {/* Import Results */}
          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Import Complete</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Successfully imported:</span>
                    <span className="ml-2 font-bold text-green-900">{result.success}</span>
                  </div>
                  <div>
                    <span className="text-red-700">Failed:</span>
                    <span className="ml-2 font-bold text-red-900">{result.failed}</span>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Import Errors</h3>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-red-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-red-900">Row</th>
                          <th className="px-3 py-2 text-left text-red-900">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-200">
                        {result.errors.map((err, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-red-800">{err.row}</td>
                            <td className="px-3 py-2 text-red-800">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.success > 0 && (
                <button
                  onClick={() => router.push('/customers/list')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  View Customer List
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
