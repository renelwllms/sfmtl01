'use client';

import { useState } from 'react';

interface TransactionDocumentUploadProps {
  transactionId: string;
  onUploadComplete?: () => void;
  usePublicApi?: boolean;
}

export default function TransactionDocumentUpload({
  transactionId,
  onUploadComplete,
  usePublicApi = false
}: TransactionDocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'SOURCE_OF_FUNDS' | 'PROOF_OF_ADDRESS' | 'OTHER'>('SOURCE_OF_FUNDS');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (description) {
        formData.append('description', description);
      }

      const apiPath = usePublicApi
        ? `/api/public/transactions/${transactionId}/documents`
        : `/api/transactions/${transactionId}/documents`;

      const response = await fetch(apiPath, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Upload failed');
        setUploading(false);
        return;
      }

      setSuccess('Document uploaded successfully!');
      setFile(null);
      setDescription('');
      setDocumentType('SOURCE_OF_FUNDS');

      // Reset file input
      const fileInput = document.getElementById('document-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      setError('An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Supporting Document</h3>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type <span className="text-red-500">*</span>
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={uploading}
          >
            <option value="SOURCE_OF_FUNDS">Source of Funds</option>
            <option value="PROOF_OF_ADDRESS">Proof of Address</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File <span className="text-red-500">*</span>
          </label>
          <input
            id="document-file-input"
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={uploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Accepted: Images (JPG, PNG, GIF), PDF, Word, Excel
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                const fileInput = document.getElementById('document-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }}
              className="text-red-600 hover:text-red-800"
              disabled={uploading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Bank statement for January 2025"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={uploading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>📌 Tip:</strong> For transactions ≥ NZ$1,000, please upload:
        </p>
        <ul className="text-xs text-blue-700 mt-2 ml-4 list-disc space-y-1">
          <li>Source of Funds document (bank statement, payslip, etc.)</li>
          <li>Proof of Address (utility bill, bank statement, IRD letter, etc.)</li>
        </ul>
      </div>
    </div>
  );
}
