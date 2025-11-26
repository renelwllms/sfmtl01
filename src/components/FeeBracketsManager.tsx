'use client';

import { useState, useEffect } from 'react';

interface Bracket {
  id?: string;
  minAmount: number;
  maxAmount: number;
  feeAmount: number;
}

export default function FeeBracketsManager() {
  const [brackets, setBrackets] = useState<Bracket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBrackets();
  }, []);

  const fetchBrackets = async () => {
    try {
      const response = await fetch('/api/fees/brackets');
      const data = await response.json();

      if (response.ok) {
        if (data.brackets.length === 0) {
          // Set default brackets based on requirements
          setBrackets([
            { minAmount: 1, maxAmount: 19999.99, feeAmount: 10 },
            { minAmount: 20000, maxAmount: 29999.99, feeAmount: 20 },
            { minAmount: 30000, maxAmount: 40000, feeAmount: 30 }
          ]);
        } else {
          setBrackets(data.brackets);
        }
      }
    } catch (error) {
      console.error('Failed to fetch brackets:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBracket = () => {
    const lastBracket = brackets[brackets.length - 1];
    const newMin = lastBracket ? lastBracket.maxAmount + 0.01 : 1;
    const newMax = newMin + 9999.99;
    const newFee = lastBracket ? lastBracket.feeAmount + 10 : 10;

    setBrackets([
      ...brackets,
      {
        minAmount: parseFloat(newMin.toFixed(2)),
        maxAmount: parseFloat(newMax.toFixed(2)),
        feeAmount: newFee
      }
    ]);
  };

  const removeBracket = (index: number) => {
    setBrackets(brackets.filter((_, i) => i !== index));
  };

  const updateBracket = (index: number, field: keyof Bracket, value: number) => {
    const updated = [...brackets];
    updated[index] = { ...updated[index], [field]: value };
    setBrackets(updated);
  };

  const saveBrackets = async () => {
    setSaving(true);
    setMessage('');

    // Validate brackets
    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      if (bracket.minAmount >= bracket.maxAmount) {
        setMessage(`Error: Bracket ${i + 1} - minimum amount must be less than maximum amount`);
        setSaving(false);
        return;
      }
      if (bracket.feeAmount < 0) {
        setMessage(`Error: Bracket ${i + 1} - fee amount must be positive`);
        setSaving(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/fees/brackets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brackets })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Fee brackets saved successfully!');
        setBrackets(data.brackets);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to save brackets');
      }
    } catch (error) {
      setMessage('An error occurred while saving brackets');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading fee brackets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-900">Fee Brackets</h4>
        <button
          onClick={addBracket}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          + Add Bracket
        </button>
      </div>

      <p className="text-xs text-gray-600">
        Define fee brackets based on transaction amount ranges (in NZD). Each bracket specifies a minimum amount, maximum amount, and the fee to charge.
      </p>

      <div className="space-y-3">
        {brackets.map((bracket, index) => (
          <div key={index} className="grid grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-md border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={bracket.minAmount}
                onChange={(e) => updateBracket(index, 'minAmount', parseFloat(e.target.value) || 0)}
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={bracket.maxAmount}
                onChange={(e) => updateBracket(index, 'maxAmount', parseFloat(e.target.value) || 0)}
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={bracket.feeAmount}
                onChange={(e) => updateBracket(index, 'feeAmount', parseFloat(e.target.value) || 0)}
                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-end pb-1.5">
              <button
                onClick={() => removeBracket(index)}
                className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {message && (
        <div className={`rounded-md p-3 border ${message.includes('Error') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <p className={`text-sm ${message.includes('Error') ? 'text-red-800' : 'text-green-800'}`}>
            {message}
          </p>
        </div>
      )}

      <button
        onClick={saveBrackets}
        disabled={saving || brackets.length === 0}
        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
      >
        {saving ? 'Saving...' : 'Save Fee Brackets'}
      </button>

      {brackets.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm font-semibold text-blue-900 mb-2">Current Brackets:</p>
          <ul className="text-xs text-blue-800 space-y-1">
            {brackets.map((bracket, index) => (
              <li key={index}>
                ${bracket.minAmount.toFixed(2)} - ${bracket.maxAmount.toFixed(2)} = Fee: ${bracket.feeAmount.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
