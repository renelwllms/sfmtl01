'use client';

import { useState, useEffect } from 'react';

interface TransactionDocument {
  id: string;
  transactionId: string;
  filePath: string;
  mimeType: string;
  documentType: 'SOURCE_OF_FUNDS' | 'PROOF_OF_ADDRESS' | 'OTHER';
  description?: string;
  createdAt: string;
}

interface TransactionDocumentListProps {
  transactionId: string;
  refreshTrigger?: number;
  usePublicApi?: boolean;
  allowDelete?: boolean;
}

export default function TransactionDocumentList({
  transactionId,
  refreshTrigger,
  usePublicApi = false,
  allowDelete = true
}: TransactionDocumentListProps) {
  const [documents, setDocuments] = useState<TransactionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingDoc, setViewingDoc] = useState<{ id: string; mimeType: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [transactionId, refreshTrigger]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');

    try {
      const apiPath = usePublicApi
        ? `/api/public/transactions/${transactionId}/documents`
        : `/api/transactions/${transactionId}/documents`;

      const response = await fetch(apiPath);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load documents');
        setLoading(false);
        return;
      }

      setDocuments(data.documents || []);
    } catch (err) {
      setError('An error occurred while loading documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(documentId);

    try {
      const response = await fetch(`/api/transactions/${transactionId}/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to delete document');
        setDeletingId(null);
        return;
      }

      // Refresh list
      await fetchDocuments();
    } catch (err) {
      alert('An error occurred while deleting the document');
    } finally {
      setDeletingId(null);
    }
  };

  const getDocumentUrl = (documentId: string) => {
    const safeTransactionId = encodeURIComponent(transactionId);
    const safeDocumentId = encodeURIComponent(documentId);

    if (usePublicApi) {
      return `/api/public/transactions/${safeTransactionId}/documents/${safeDocumentId}`;
    }
    return `/api/transactions/${safeTransactionId}/documents/${safeDocumentId}`;
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'SOURCE_OF_FUNDS':
        return 'Source of Funds';
      case 'PROOF_OF_ADDRESS':
        return 'Proof of Address';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  };

  const getDocumentTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'SOURCE_OF_FUNDS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PROOF_OF_ADDRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OTHER':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Supporting Documents ({documents.length})
      </h3>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDocumentTypeBadgeColor(doc.documentType)}`}>
                    {getDocumentTypeLabel(doc.documentType)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {doc.description && (
                  <p className="text-sm text-gray-700 mb-1">{doc.description}</p>
                )}
                <p className="text-xs text-gray-500 truncate">
                  {doc.filePath.split('/').pop()}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setViewingDoc({ id: doc.id, mimeType: doc.mimeType })}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  View
                </button>
                <a
                  href={getDocumentUrl(doc.id)}
                  download
                  className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
                >
                  Download
                </a>
                {allowDelete && !usePublicApi && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    {deletingId === doc.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Document Viewer</h3>
              <button
                onClick={() => setViewingDoc(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] flex items-center justify-center bg-gray-100">
              {viewingDoc.mimeType.startsWith('image/') ? (
                <img
                  src={getDocumentUrl(viewingDoc.id)}
                  alt="Document"
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : viewingDoc.mimeType === 'application/pdf' ? (
                <embed
                  src={getDocumentUrl(viewingDoc.id)}
                  type="application/pdf"
                  width="100%"
                  height="600px"
                  className="rounded"
                />
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <a
                    href={getDocumentUrl(viewingDoc.id)}
                    download
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
