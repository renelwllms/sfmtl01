# Samoa Finance App - API Documentation

## Authentication
All API routes require NextAuth session authentication. Include session token in requests.

---

## Customer APIs

### GET /api/customers
Search for a customer by phone or customerId.

**Query Parameters:**
- `phone` (string, optional): E.164 format phone number
- `customerId` (string, optional): Customer ID (e.g., CUST-2025-000001)

**Response:**
```json
{
  "customer": {
    "id": "...",
    "customerId": "CUST-2025-000001",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "dob": "1990-01-01T00:00:00.000Z",
    "phone": "+6421234567",
    "email": "john@example.com",
    "address": "123 Main St",
    "createdAt": "2025-10-06T...",
    "ids": [...],
    "transactions": [...]
  }
}
```

### POST /api/customers
Create a new customer.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dob": "1990-01-01",
  "phone": "+6421234567",
  "email": "john@example.com",
  "address": "123 Main St"
}
```

**Validation:**
- DOB must be ≥ 18 years old
- Phone must be unique and in E.164 format
- First name and last name required

**Response:** 201 Created
```json
{
  "customer": {
    "id": "...",
    "customerId": "CUST-2025-000001",
    ...
  }
}
```

### GET /api/customers/[id]
Get customer details by ID.

**Response:**
```json
{
  "customer": {
    "id": "...",
    "customerId": "CUST-2025-000001",
    "ids": [...],
    "transactions": [...]
  }
}
```

### POST /api/customers/[id]/ids
Upload ID file for a customer.

**Request:** multipart/form-data
- `file`: Image or PDF file

**Response:** 201 Created
```json
{
  "file": {
    "id": "...",
    "customerId": "...",
    "filePath": "uploads/customers/CUST-2025-000001/ids/1234567890-passport.jpg",
    "mimeType": "image/jpeg",
    "createdAt": "..."
  }
}
```

---

## Transaction APIs

### GET /api/transactions
List transactions with optional filters.

**Query Parameters:**
- `customerId` (string, optional): Filter by customer ID
- `limit` (number, optional): Max results (default: 50)

**Response:**
```json
{
  "transactions": [
    {
      "id": "...",
      "txnNumber": "TXN-2025-10-000001",
      "customer": {...},
      "beneficiaryName": "Jane Doe",
      "currency": "WST",
      "amountNzdCents": 10000,
      "feeNzdCents": 500,
      "totalPaidNzdCents": 10500,
      "rate": 2.1,
      "totalForeignReceived": 21.0,
      ...
    }
  ]
}
```

### POST /api/transactions
Create a new transaction.

**Request Body:**
```json
{
  "customerId": "...",
  "beneficiaryName": "Jane Doe",
  "beneficiaryVillage": "Apia",
  "beneficiaryPhone": "+685123456",
  "bank": "ANZ Samoa",
  "accountNumber": "1234567890",
  "accountName": "Jane Doe",
  "senderName": "John Doe",
  "senderAddress": "123 Main St",
  "senderPhone": "+6421234567",
  "senderEmail": "john@example.com",
  "occupation": "Engineer",
  "purposeOfTransfer": "Family support",
  "amountNzdCents": 10000,
  "feeNzdCents": 500,
  "rate": 2.1,
  "currency": "WST",
  "totalPaidNzdCents": 10500,
  "totalForeignReceived": 21.0,
  "dob": "1990-01-01",
  "verifiedWithOriginalId": true,
  "proofOfAddressType": "BILL",
  "sourceOfFunds": "Employment",
  "id1CountryAndType": "NZ Passport",
  "id1Number": "AB123456",
  "id1IssueDate": "2020-01-01",
  "id1ExpiryDate": "2030-01-01"
}
```

**Response:** 201 Created

---

## Exchange Rate APIs

### GET /api/exchange-rates
Get exchange rates for a specific date (defaults to today).

**Query Parameters:**
- `date` (string, optional): Date in YYYY-MM-DD format

**Response:**
```json
{
  "rates": {
    "id": "...",
    "dateKey": "2025-10-06",
    "NZD_WST": 2.1,
    "NZD_AUD": 0.93,
    "NZD_USD": 0.61,
    "updatedById": "...",
    "updatedAt": "..."
  },
  "isDefault": false
}
```

### POST /api/exchange-rates (Admin Only)
Set exchange rates for a specific date.

**Request Body:**
```json
{
  "dateKey": "2025-10-06",
  "NZD_WST": 2.1,
  "NZD_AUD": 0.93,
  "NZD_USD": 0.61
}
```

**Response:**
```json
{
  "rate": {
    "id": "...",
    "dateKey": "2025-10-06",
    ...
  }
}
```

---

## Report APIs

### GET /api/reports/daily
Generate daily transaction report.

**Query Parameters:**
- `date` (string, required): Date in YYYY-MM-DD format
- `format` (string, optional): "json" or "csv" (default: json)

**Response (JSON):**
```json
{
  "report": {
    "date": "2025-10-06",
    "summary": {
      "WST": {
        "count": 5,
        "totalNzdCents": 50000,
        "totalFees": 2500,
        "totalPaid": 52500,
        "totalForeign": 105.0
      },
      "AUD": {...},
      "USD": {...}
    },
    "transactions": [...]
  }
}
```

**Response (CSV):**
Downloads CSV file with all transaction details.

### GET /api/reports/monthly
Generate monthly transaction report.

**Query Parameters:**
- `month` (string, required): Month in YYYY-MM format
- `format` (string, optional): "json" or "csv" (default: json)

**Response:** Same structure as daily report.

---

## Error Responses

All endpoints may return these error responses:

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden (Admin-only endpoints):**
```json
{
  "error": "Admin access required"
}
```

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "details": [...]
}
```

**404 Not Found:**
```json
{
  "error": "Customer not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Notes

- All amounts are stored in cents (integers) to avoid floating-point issues
- All dates use Pacific/Auckland timezone
- File uploads are saved to `uploads/customers/{customerId}/ids/`
- Sequential IDs: CUST-YYYY-NNNNNN, TXN-YYYY-MM-NNNNNN
- DOB validation ensures customer is ≥ 18 years old
