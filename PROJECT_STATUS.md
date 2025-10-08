# Samoa Finance App - Project Status

## ✅ Completed (Foundation - 30% Complete)

### 1. Project Setup
- Next.js 15 with TypeScript, Tailwind CSS, and App Router
- All dependencies installed (NextAuth, Prisma, Zod, bcrypt, luxon, formidable)
- Environment configuration (.env, .gitignore)

### 2. Database & ORM
- Prisma schema with all models (User, Customer, CustomerIdFile, Transaction, ExchangeRate, Counter)
- Enums for Role, Currency, ProofOfAddress
- SQLite database initialized (easy switch to Postgres for prod)
- Seed script with admin and staff users created
- Database seeded with:
  - Admin: admin@samoafinance.local / Admin@123
  - Staff: staff@samoafinance.local / Staff@123

### 3. Authentication
- NextAuth configured with Credentials provider
- bcrypt password hashing
- Role-based JWT (ADMIN, STAFF)
- Middleware for route protection
- Admin-only access to /settings enforced

### 4. Core Libraries
- ID generators (sequential customer & transaction IDs with Pacific/Auckland timezone)
- Zod validators with DOB ≥ 18 validation
- E.164 phone validation
- Database client singleton

## 🚧 Remaining Tasks (70%)

### Phase 1: API Routes (High Priority)
1. **Customers API** (`/api/customers`)
   - POST: Create customer (generate customerId, enforce unique phone, calculate fullName)
   - GET: Search by phone or customerId

2. **Customer ID Files API** (`/api/customers/[id]/ids`)
   - POST: Upload ID files (multipart, save to uploads/customers/{customerId}/ids/)

3. **Transactions API** (`/api/transactions`)
   - POST: Create transaction (generate txnNumber, validate all fields)
   - GET: List transactions (with filters)

4. **Exchange Rates API** (`/api/exchange-rates`)
   - GET: Latest rates
   - POST: Set rates for date (admin only)

5. **Reports API** (`/api/reports`)
   - GET `/api/reports/daily?date=YYYY-MM-DD`: Daily report by currency
   - GET `/api/reports/monthly?month=YYYY-MM`: Monthly report by currency
   - Both should support CSV export

### Phase 2: Frontend Pages (High Priority)
1. **Login Page** (`/login`)
   - Email/password form
   - NextAuth signIn integration

2. **Dashboard** (`/`)
   - Quick search by phone or customerId
   - Recent transactions list

3. **New Customer** (`/customers/new`)
   - Registration form with all fields
   - ID upload widget after save

4. **Customer Detail** (`/customers/[id]`)
   - View profile
   - List uploaded IDs
   - Past transactions
   - "New Transaction" button (prefills sender data)

5. **New Transaction** (`/transactions/new`)
   - Customer picker (search & select)
   - Beneficiary details
   - Money calculator (amount, fee, rate, auto-calculate totals)
   - AML/KYC fields

6. **Reports** (`/reports`)
   - Date/month picker
   - Summary by currency
   - Transaction list
   - CSV export button

7. **Settings** (`/settings` - Admin only)
   - Set exchange rates for date
   - User management (create user, change roles)

### Phase 3: UI Polish
1. Currency helpers (cents ↔ display)
2. Toast notifications
3. Form error messages
4. Loading states
5. Responsive design

### Phase 4: Testing
Run all acceptance tests:
- ✓ Admin can access Settings
- ✓ Staff cannot access Settings (redirect)
- ✓ DOB < 18 is rejected
- ✓ Returning customer search works
- ✓ File uploads work
- ✓ Transaction creation works
- ✓ Reports show correct totals (NZ time)
- ✓ CSV exports work
- ✓ Exchange rates can be set

## 📁 Project Structure

```
samoa-finance-app/
├── prisma/
│   ├── schema.prisma          ✅ Complete
│   ├── seed.ts                ✅ Complete
│   └── dev.db                 ✅ Initialized
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  ✅ Complete
│   │   │   ├── customers/          ⏳ TODO
│   │   │   ├── transactions/       ⏳ TODO
│   │   │   ├── exchange-rates/     ⏳ TODO
│   │   │   └── reports/            ⏳ TODO
│   │   ├── login/                  ⏳ TODO
│   │   ├── customers/              ⏳ TODO
│   │   ├── transactions/           ⏳ TODO
│   │   ├── reports/                ⏳ TODO
│   │   ├── settings/               ⏳ TODO
│   │   └── page.tsx                ⏳ TODO (Dashboard)
│   ├── lib/
│   │   ├── db.ts               ✅ Complete
│   │   ├── auth.ts             ✅ Complete
│   │   ├── ids.ts              ✅ Complete
│   │   └── validators.ts       ✅ Complete
│   └── middleware.ts           ✅ Complete
└── uploads/                    (git-ignored, created at runtime)
```

## 🚀 Next Steps

To continue development:

1. Start with API routes (Phase 1) - they're needed by all pages
2. Build pages in order: Login → Dashboard → Customers → Transactions → Reports → Settings
3. Add UI polish as you go
4. Test thoroughly with the acceptance criteria

## 💻 Development Commands

```bash
# Install dependencies (already done)
npm install

# Run development server
npm run dev

# Access at http://localhost:3000

# Test login credentials:
# Admin: admin@samoafinance.local / Admin@123
# Staff: staff@samoafinance.local / Staff@123

# Reset database (if needed)
npx prisma migrate reset

# Re-seed database
npx prisma db seed
```

## 🔧 Technical Notes

- **Timezone**: All date operations use Pacific/Auckland
- **Currency**: Amounts stored as integer cents to avoid floating-point issues
- **File uploads**: Currently local disk, designed for easy S3 migration
- **Database**: SQLite for dev, change `provider` to `postgresql` for production
- **Sequential IDs**: Format CUST-YYYY-NNNNNN and TXN-YYYY-MM-NNNNNN

## 📝 Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=devdevdev
```

For production, generate a strong secret:
```bash
openssl rand -base64 32
```
