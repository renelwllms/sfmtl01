'use client';

import { useState } from 'react';

interface FamilyContribution {
  id?: string; // Optional because it won't exist for new entries
  contributorName: string;
  amountNzdCents: number;
  relationship?: string;
}

interface FamilyContributionsTableProps {
  contributions: FamilyContribution[];
  onContributionsChange: (contributions: FamilyContribution[]) => void;
  readonly?: boolean;
}

export default function FamilyContributionsTable({
  contributions,
  onContributionsChange,
  readonly = false,
}: FamilyContributionsTableProps) {
  const [newContributor, setNewContributor] = useState({
    contributorName: '',
    amountNzd: '',
    relationship: '',
  });

  const handleAddContribution = () => {
    if (!newContributor.contributorName.trim()) {
      alert('Please enter contributor name');
      return;
    }
    if (!newContributor.amountNzd || parseFloat(newContributor.amountNzd) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amountNzdCents = Math.round(parseFloat(newContributor.amountNzd) * 100);

    const newContribution: FamilyContribution = {
      contributorName: newContributor.contributorName.trim(),
      amountNzdCents,
      relationship: newContributor.relationship.trim() || undefined,
    };

    onContributionsChange([...contributions, newContribution]);

    // Reset form
    setNewContributor({
      contributorName: '',
      amountNzd: '',
      relationship: '',
    });
  };

  const handleRemoveContribution = (index: number) => {
    const updated = contributions.filter((_, i) => i !== index);
    onContributionsChange(updated);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getTotalAmount = () => {
    return contributions.reduce((sum, c) => sum + c.amountNzdCents, 0);
  };

  return (
    <div className="space-y-4">
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
              {!readonly && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contributions.length === 0 && (
              <tr>
                <td
                  colSpan={readonly ? 3 : 4}
                  className="px-4 py-4 text-center text-sm text-gray-500"
                >
                  No family contributions added yet
                </td>
              </tr>
            )}
            {contributions.map((contribution, index) => (
              <tr key={contribution.id || index}>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {contribution.contributorName}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {contribution.relationship || '-'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {formatCurrency(contribution.amountNzdCents)}
                </td>
                {!readonly && (
                  <td className="px-4 py-2 text-sm">
                    <button
                      type="button"
                      onClick={() => handleRemoveContribution(index)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!readonly && (
              <tr className="bg-blue-50">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={newContributor.contributorName}
                    onChange={(e) =>
                      setNewContributor({ ...newContributor, contributorName: e.target.value })
                    }
                    placeholder="Contributor name"
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={newContributor.relationship}
                    onChange={(e) =>
                      setNewContributor({ ...newContributor, relationship: e.target.value })
                    }
                    placeholder="e.g., Mother, Brother"
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newContributor.amountNzd}
                    onChange={(e) =>
                      setNewContributor({ ...newContributor, amountNzd: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={handleAddContribution}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Add
                  </button>
                </td>
              </tr>
            )}
          </tbody>
          {contributions.length > 0 && (
            <tfoot className="bg-gray-100">
              <tr>
                <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">
                  Total:
                </td>
                <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                  {formatCurrency(getTotalAmount())}
                </td>
                {!readonly && <td></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {!readonly && contributions.length > 0 && (
        <p className="text-xs text-gray-500">
          💡 The total family contributions amount is {formatCurrency(getTotalAmount())}
        </p>
      )}
    </div>
  );
}
