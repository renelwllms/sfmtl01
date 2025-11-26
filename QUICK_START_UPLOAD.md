# Quick Start - Document Upload Feature

## ✅ What's Now Available

After creating a transaction **≥ NZ$1,000**, the system will automatically show you a document upload screen where you can upload:

1. **Source of Funds** document (bank statement, payslip, etc.)
2. **Proof of Address** document (utility bill, council rates, etc.)

## How It Works

### Step 1: Create a Transaction
1. Go to "New Transaction" (`/transactions/new`)
2. Select a customer
3. Fill in transaction details
4. **Important**: Enter an amount ≥ NZ$1,000
5. Click "Create Transaction"

### Step 2: Upload Documents (Automatic Prompt)
After successful transaction creation, if the amount is ≥ NZ$1,000:
- ✅ You'll see a **success screen** with document upload options
- ✅ Upload "Source of Funds" document
- ✅ Upload "Proof of Address" document
- ✅ Click "Done - View Transactions" when finished

### For Transactions < NZ$1,000
- The system automatically redirects to the transaction list
- No document upload required

## Supported File Types

✅ **Images**: JPEG, PNG, GIF, WebP
✅ **Documents**: PDF
✅ **Office**: Word (DOC, DOCX)

## What Happens Behind the Scenes

1. Transaction is created in the database
2. Files are saved to: `uploads/transactions/[TXN-NUMBER]/documents/`
3. Document metadata is stored in the `TransactionDocument` table
4. Documents are linked to the transaction with type (SOURCE_OF_FUNDS or PROOF_OF_ADDRESS)

## API Endpoints Available

- `POST /api/transactions/[id]/documents` - Upload document
- `GET /api/transactions/[id]/documents` - List all documents
- `GET /api/transactions/[id]/documents/[documentId]` - View/download document
- `DELETE /api/transactions/[id]/documents/[documentId]` - Delete document

## Try It Now!

1. **Login** to the system
2. Go to **New Transaction**
3. Create a transaction with amount **≥ NZ$1,000**
4. You'll automatically see the **upload screen** after creation
5. Upload your documents and click "Done"

## Example

**Transaction Amount**: NZ$1,500
**After Creation**: Upload screen appears
**Upload**:
- Source of Funds → bank_statement.pdf
- Proof of Address → power_bill.pdf
**Result**: Documents saved and linked to transaction

## Features

✅ Automatic prompt for high-value transactions (≥ $1,000)
✅ Simple file selection interface
✅ Success confirmation after upload
✅ Option to skip and upload later
✅ Can upload from transaction details page later

## Skip Upload Option

Don't have documents ready? No problem!
- Click **"Done - View Transactions"** to skip
- You can upload documents later from the transaction details page
- The message says: "You can also upload documents later from the transaction details page"

## Next Steps

### For Full Integration:
1. Add document viewing to transaction detail pages
2. Add document list to transaction reports
3. Add document count to transaction list view

### Advanced Features (Future):
- Bulk document upload
- Document preview before upload
- Auto-populate document types based on transaction amount
- Email notifications when documents are uploaded
- Document expiry tracking

## Reusable Components

For advanced integration, use these components:

```tsx
import TransactionDocumentUpload from '@/components/TransactionDocumentUpload';
import TransactionDocumentList from '@/components/TransactionDocumentList';
```

See `TRANSACTION_DOCUMENTS_USAGE.md` for detailed integration guide.

## Need Help?

- **API Documentation**: See `TRANSACTION_DOCUMENTS_README.md`
- **Usage Examples**: See `TRANSACTION_DOCUMENTS_USAGE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
