# Transaction Document Upload Feature

## Overview
This system now supports uploading supporting documents for transactions, including:
- **Source of Funds** documents (bank statements, pay slips, etc.)
- **Proof of Address** documents (utility bills, bank statements, government letters, etc.)
- **Other** supporting documents

## Supported File Types
The system accepts the following file types:
- **Images**: JPEG, JPG, PNG, GIF, WebP
- **PDF Documents**: PDF files
- **Microsoft Office**: DOC, DOCX, XLS, XLSX

## Database Schema

### TransactionDocument Model
```prisma
model TransactionDocument {
  id             String                  @id @default(cuid())
  transaction    Transaction             @relation
  transactionId  String
  filePath       String                  // File system path
  mimeType       String                  // MIME type of the file
  documentType   TransactionDocumentType // SOURCE_OF_FUNDS, PROOF_OF_ADDRESS, OTHER
  description    String?                 // Optional description
  createdAt      DateTime                @default(now())
}

enum TransactionDocumentType {
  SOURCE_OF_FUNDS
  PROOF_OF_ADDRESS
  OTHER
}
```

## API Endpoints

### Authenticated Endpoints (Requires session)

#### Upload Document
**POST** `/api/transactions/[id]/documents`

**Body** (multipart/form-data):
- `file`: The file to upload (required)
- `documentType`: "SOURCE_OF_FUNDS" | "PROOF_OF_ADDRESS" | "OTHER" (required)
- `description`: Optional description of the document

**Response**:
```json
{
  "document": {
    "id": "doc_id",
    "transactionId": "txn_id",
    "filePath": "uploads/transactions/TXN-2025-001/documents/timestamp-filename.pdf",
    "mimeType": "application/pdf",
    "documentType": "SOURCE_OF_FUNDS",
    "description": "Bank statement",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Get All Documents for a Transaction
**GET** `/api/transactions/[id]/documents`

**Response**:
```json
{
  "documents": [
    {
      "id": "doc_id",
      "transactionId": "txn_id",
      "filePath": "uploads/transactions/TXN-2025-001/documents/timestamp-filename.pdf",
      "mimeType": "application/pdf",
      "documentType": "SOURCE_OF_FUNDS",
      "description": "Bank statement",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get/View Specific Document
**GET** `/api/transactions/[id]/documents/[documentId]`

Returns the actual file with proper Content-Type header. Can be used in:
- `<img>` tags for images
- `<embed>` or `<iframe>` for PDFs
- Download links

#### Delete Document
**DELETE** `/api/transactions/[id]/documents/[documentId]`

Deletes both the file from disk and the database record.

**Response**:
```json
{
  "message": "Document deleted successfully"
}
```

### Public Endpoints (For Agent Portal)

#### Upload Document (Public)
**POST** `/api/public/transactions/[id]/documents`

Same as authenticated endpoint but accessible without session.

#### Get All Documents (Public)
**GET** `/api/public/transactions/[id]/documents`

Same as authenticated endpoint but accessible without session.

#### Get/View Specific Document (Public)
**GET** `/api/public/transactions/[id]/documents/[documentId]`

Same as authenticated endpoint but accessible without session.

## File Storage

Files are stored in the following structure:
```
uploads/
└── transactions/
    └── TXN-2025-001/
        └── documents/
            ├── 1234567890-bank_statement.pdf
            ├── 1234567891-proof_of_address.pdf
            └── 1234567892-payslip.jpg
```

## Usage Example

### Client-Side Upload (React/Next.js)

```typescript
async function uploadTransactionDocument(
  transactionId: string,
  file: File,
  documentType: 'SOURCE_OF_FUNDS' | 'PROOF_OF_ADDRESS' | 'OTHER',
  description?: string
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  if (description) {
    formData.append('description', description);
  }

  const response = await fetch(`/api/transactions/${transactionId}/documents`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
const file = fileInput.files[0];
const result = await uploadTransactionDocument(
  'txn_abc123',
  file,
  'SOURCE_OF_FUNDS',
  'Bank statement for January 2025'
);
console.log('Uploaded document:', result.document);
```

### Displaying Documents

#### For Images
```tsx
<img
  src={`/api/transactions/${txnId}/documents/${docId}`}
  alt="Document"
  className="max-w-full"
/>
```

#### For PDFs
```tsx
<embed
  src={`/api/transactions/${txnId}/documents/${docId}`}
  type="application/pdf"
  width="100%"
  height="600px"
/>
```

Or use an iframe:
```tsx
<iframe
  src={`/api/transactions/${txnId}/documents/${docId}`}
  width="100%"
  height="600px"
/>
```

#### Universal Document Viewer
```tsx
function DocumentViewer({ transactionId, documentId, mimeType }) {
  const url = `/api/transactions/${transactionId}/documents/${documentId}`;

  if (mimeType.startsWith('image/')) {
    return <img src={url} alt="Document" className="max-w-full" />;
  }

  if (mimeType === 'application/pdf') {
    return <embed src={url} type="application/pdf" width="100%" height="600px" />;
  }

  // For other file types, provide download link
  return (
    <a href={url} download className="btn btn-primary">
      Download Document
    </a>
  );
}
```

## ID Documents Update

The ID document upload functionality has also been updated to accept common file types beyond just images:
- Location: `/api/customers/[id]/ids`
- Accepts: Images (JPEG, PNG, GIF) and PDFs
- Update: The file input accept attribute now includes: `accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"`

## Integration Points

### Transaction List Page
- Add a "Documents" column showing document count
- Click to view/manage documents

### Transaction Detail Page
- Show list of attached documents with thumbnails
- Allow viewing, downloading, and deleting documents
- Provide upload interface for adding new documents

### Agent Portal
- Use public API endpoints for document upload
- Show documents attached to transactions
- Allow agents to upload source of funds and proof of address during transaction creation

## Security Considerations

1. **File Validation**: Only allowed MIME types are accepted
2. **Filename Sanitization**: Special characters are replaced with underscores
3. **Unique Filenames**: Timestamps are prepended to prevent collisions
4. **Access Control**: Authenticated endpoints require session
5. **File Size**: Consider adding file size limits (currently unlimited)

## Future Enhancements

1. **File Size Limits**: Add maximum file size validation
2. **Image Compression**: Automatically compress large images
3. **Thumbnail Generation**: Generate thumbnails for images
4. **Virus Scanning**: Integrate virus scanning for uploaded files
5. **Cloud Storage**: Move to cloud storage (AWS S3, Azure Blob, etc.)
6. **Metadata Extraction**: Extract and store file metadata
7. **Versioning**: Support document versioning
8. **Bulk Upload**: Allow multiple files to be uploaded at once
