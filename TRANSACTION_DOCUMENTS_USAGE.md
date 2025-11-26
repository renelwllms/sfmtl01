# Transaction Document Upload - Usage Guide

## Quick Start

The transaction document upload feature has been implemented with reusable components that can be integrated into any transaction page.

## Components

### 1. TransactionDocumentUpload
Upload component for adding new documents to a transaction.

**Location**: `src/components/TransactionDocumentUpload.tsx`

**Props**:
- `transactionId` (required): The transaction ID
- `onUploadComplete?`: Callback function called after successful upload
- `usePublicApi?`: Set to `true` for agent portal (default: `false`)

**Usage Example**:
```tsx
import TransactionDocumentUpload from '@/components/TransactionDocumentUpload';

function TransactionPage({ transactionId }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <TransactionDocumentUpload
      transactionId={transactionId}
      onUploadComplete={() => setRefreshKey(prev => prev + 1)}
      usePublicApi={false}
    />
  );
}
```

### 2. TransactionDocumentList
Display and manage uploaded documents.

**Location**: `src/components/TransactionDocumentList.tsx`

**Props**:
- `transactionId` (required): The transaction ID
- `refreshTrigger?`: Number that triggers re-fetch when changed
- `usePublicApi?`: Set to `true` for agent portal (default: `false`)
- `allowDelete?`: Show delete button (default: `true`)

**Usage Example**:
```tsx
import TransactionDocumentList from '@/components/TransactionDocumentList';

function TransactionPage({ transactionId }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <TransactionDocumentList
      transactionId={transactionId}
      refreshTrigger={refreshKey}
      usePublicApi={false}
      allowDelete={true}
    />
  );
}
```

## Complete Integration Example

### Transaction Detail Page (Admin/Staff)

```tsx
'use client';

import { useState } from 'react';
import TransactionDocumentUpload from '@/components/TransactionDocumentUpload';
import TransactionDocumentList from '@/components/TransactionDocumentList';

export default function TransactionDetailPage({ params }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const transactionId = params.id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Transaction Details</h1>

      {/* Transaction info here... */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Upload Section */}
        <div>
          <TransactionDocumentUpload
            transactionId={transactionId}
            onUploadComplete={() => setRefreshKey(prev => prev + 1)}
          />
        </div>

        {/* Document List */}
        <div>
          <TransactionDocumentList
            transactionId={transactionId}
            refreshTrigger={refreshKey}
          />
        </div>
      </div>
    </div>
  );
}
```

### Agent Portal Transaction Page

```tsx
'use client';

import { useState } from 'react';
import TransactionDocumentUpload from '@/components/TransactionDocumentUpload';
import TransactionDocumentList from '@/components/TransactionDocumentList';

export default function AgentTransactionPage({ params }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const transactionId = params.id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Transaction Documents</h1>

      {/* Upload Section */}
      <div className="mb-6">
        <TransactionDocumentUpload
          transactionId={transactionId}
          onUploadComplete={() => setRefreshKey(prev => prev + 1)}
          usePublicApi={true} // Important for agent portal
        />
      </div>

      {/* Document List */}
      <div>
        <TransactionDocumentList
          transactionId={transactionId}
          refreshTrigger={refreshKey}
          usePublicApi={true} // Important for agent portal
          allowDelete={false} // Agents can't delete documents
        />
      </div>
    </div>
  );
}
```

## Integration Steps

### Step 1: Add to Existing Transaction List Page

Add a documents column to show document count:

```tsx
// In your transaction list component
{transactions.map(txn => (
  <tr key={txn.id}>
    <td>{txn.txnNumber}</td>
    <td>{txn.customer.fullName}</td>
    <td>${(txn.amountNzdCents / 100).toFixed(2)}</td>
    <td>
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {txn.documents?.length || 0} docs
      </span>
    </td>
    <td>
      <Link href={`/transactions/${txn.id}`}>View</Link>
    </td>
  </tr>
))}
```

### Step 2: Add to Transaction Detail/View Page

Create a new tab or section for documents:

```tsx
// src/app/transactions/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import TransactionDocumentUpload from '@/components/TransactionDocumentUpload';
import TransactionDocumentList from '@/components/TransactionDocumentList';

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    // Fetch transaction details
    async function fetchTransaction() {
      const response = await fetch(`/api/transactions/${id}`);
      const data = await response.json();
      setTransaction(data.transaction);
    }
    fetchTransaction();
  }, [id]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'details'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Transaction Details
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'documents'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Documents ({transaction?.documents?.length || 0})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div>
          {/* Show transaction details */}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionDocumentUpload
            transactionId={id}
            onUploadComplete={() => setRefreshKey(prev => prev + 1)}
          />
          <TransactionDocumentList
            transactionId={id}
            refreshTrigger={refreshKey}
          />
        </div>
      )}
    </div>
  );
}
```

### Step 3: Update API to Include Document Count

Update transaction fetch to include document count:

```tsx
// In your transaction API endpoint
const transaction = await db.transaction.findUnique({
  where: { id },
  include: {
    customer: true,
    documents: true, // Include documents
    agent: true,
    status: true
  }
});

// The response will now include documents array
return NextResponse.json({
  transaction: {
    ...transaction,
    documentCount: transaction.documents.length
  }
});
```

## Common Use Cases

### 1. Upload Source of Funds Document After Transaction Creation

```tsx
// After creating transaction
const transaction = await createTransaction(data);

// Show success message with option to upload documents
setShowDocumentUpload(true);
setTransactionId(transaction.id);
```

### 2. Require Documents for High-Value Transactions

```tsx
// In transaction creation form
const requiresDocuments = parseFloat(amountNzd) >= 1000;

if (requiresDocuments && !documentsUploaded) {
  setError('Please upload Source of Funds and Proof of Address documents for transactions ≥ NZ$1,000');
  return;
}
```

### 3. Display Documents in Transaction Receipt/Print View

```tsx
async function printReceipt(transactionId) {
  // Fetch transaction with documents
  const response = await fetch(`/api/transactions/${transactionId}?include=documents`);
  const { transaction } = await response.json();

  // Include document list in receipt
  return (
    <div className="receipt">
      {/* ... transaction details ... */}

      <div className="mt-4">
        <h3>Supporting Documents:</h3>
        <ul>
          {transaction.documents.map(doc => (
            <li key={doc.id}>
              {doc.documentType} - {doc.description || 'N/A'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## File Type Icons

Add visual indicators for different file types:

```tsx
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return '🖼️';
  }
  if (mimeType === 'application/pdf') {
    return '📄';
  }
  if (mimeType.includes('word')) {
    return '📝';
  }
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return '📊';
  }
  return '📎';
}
```

## Validation and Error Handling

### Client-Side Validation

```tsx
function validateFile(file: File) {
  // Check file size (e.g., max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'File size must be less than 10MB';
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf'
  ];

  if (!allowedTypes.includes(file.type)) {
    return 'Invalid file type';
  }

  return null;
}
```

## Testing

1. **Test File Upload**:
   - Upload image files (JPG, PNG)
   - Upload PDF files
   - Upload Word/Excel files
   - Verify files are saved correctly

2. **Test File Viewing**:
   - View images in modal
   - View PDFs in embed
   - Download files

3. **Test Different Document Types**:
   - Source of Funds
   - Proof of Address
   - Other documents

4. **Test Access Control**:
   - Authenticated users can upload/delete
   - Agent portal can upload but not delete

## Next Steps

1. **Add file size limits** in API validation
2. **Implement image compression** for large images
3. **Add bulk upload** functionality
4. **Create admin panel** to manage all transaction documents
5. **Add document search/filter** in transaction list
6. **Generate thumbnails** for preview
7. **Add audit logging** for document operations
