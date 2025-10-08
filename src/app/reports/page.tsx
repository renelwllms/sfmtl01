'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { formatNZDate } from '@/lib/date-utils';

type ReportType = 'daily' | 'monthly';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  async function generateReport() {
    setError('');
    setLoading(true);
    setReport(null);

    try {
      const param = reportType === 'daily' ? `date=${date}` : `month=${month}`;
      const response = await fetch(`/api/reports/${reportType}?${param}`);

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to generate report');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError('An error occurred while generating the report');
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    const param = reportType === 'daily' ? `date=${date}` : `month=${month}`;
    window.open(`/api/reports/${reportType}?${param}&format=csv`, '_blank');
  }

  function formatCurrency(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction Reports</h1>

          {/* Report Type Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="daily"
                    checked={reportType === 'daily'}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="mr-2"
                  />
                  Daily Report
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="monthly"
                    checked={reportType === 'monthly'}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="mr-2"
                  />
                  Monthly Report
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {reportType === 'daily' ? 'Select Date' : 'Select Month'}
              </label>
              {reportType === 'daily' ? (
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              )}
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={loading || (reportType === 'daily' && !date) || (reportType === 'monthly' && !month)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Report Results */}
        {report && (
          <div className="space-y-6">
            {/* Summary by Currency */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Summary by Currency</h2>
                <button
                  onClick={downloadCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Download CSV
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {['WST', 'AUD', 'USD'].map((currency) => (
                  <div key={currency} className="border rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{currency}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transactions:</span>
                        <span className="font-semibold">{report.summary[currency].count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-semibold">
                          {formatCurrency(report.summary[currency].totalNzdCents)} NZD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Fees:</span>
                        <span className="font-semibold">
                          {formatCurrency(report.summary[currency].totalFees)} NZD
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Total Paid:</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(report.summary[currency].totalPaid)} NZD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Foreign Sent:</span>
                        <span className="font-semibold">
                          {report.summary[currency].totalForeign.toFixed(2)} {currency}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Grand Total (All Currencies):</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      report.summary.WST.totalPaid +
                      report.summary.AUD.totalPaid +
                      report.summary.USD.totalPaid
                    )} NZD
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Total Transactions:</span>
                  <span className="font-semibold">
                    {report.summary.WST.count + report.summary.AUD.count + report.summary.USD.count}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Transaction Details ({report.transactions.length})
              </h2>

              {report.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TXN Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiary</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fee</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Foreign</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.transactions.map((txn: any) => (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{txn.txnNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatNZDate(txn.date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>{txn.customer.fullName}</div>
                            <div className="text-xs text-gray-500">{txn.customer.customerId}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{txn.beneficiaryName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{txn.currency}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {formatCurrency(txn.amountNzdCents)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {formatCurrency(txn.feeNzdCents)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">
                            {formatCurrency(txn.totalPaidNzdCents)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {txn.totalForeignReceived.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No transactions found for this period.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
