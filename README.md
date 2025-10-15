# Samoa Finance App

A full-stack learner management system for remittance transactions with AML/KYC compliance tracking.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js
- **ORM**: Prisma

## Prerequisites

### Option A: Automated Ubuntu Setup (Easiest for Ubuntu/Debian)
- Ubuntu 20.04+ or Debian-based Linux
- Root/sudo access
- See [UBUNTU_SETUP.md](./UBUNTU_SETUP.md) for one-command installation

### Option B: Docker (Recommended for other systems)
- Docker and Docker Compose installed

### Option C: Manual Setup
- Node.js 20+ and npm
- PostgreSQL 16+ (or Supabase account)

## Setup Instructions

### Quick Start (Ubuntu/Debian)

For Ubuntu or Debian-based systems, use the automated setup script:

```bash
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/setup-ubuntu.sh
chmod +x setup-ubuntu.sh
sudo ./setup-ubuntu.sh
```

The script will install everything (PostgreSQL, Node.js, dependencies) and configure the entire application automatically. See [UBUNTU_SETUP.md](./UBUNTU_SETUP.md) for details.

---

### Manual Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd samoa-finance-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

#### Option A: Local PostgreSQL (Recommended for PC Setup)

If you have PostgreSQL installed on your PC:

1. Create a new database:
```bash
# Login to PostgreSQL (adjust for your installation)
psql -U postgres

# Create database
CREATE DATABASE samoa_finance;
\q
```

2. Note your PostgreSQL credentials:
   - Host: `localhost`
   - Port: `5432` (default)
   - Database: `samoa_finance`
   - User: `postgres` (or your PostgreSQL user)
   - Password: (your PostgreSQL password)

#### Option B: Supabase (Cloud Database)

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the database to provision (~2 minutes)
3. Go to **Project Settings → Database**
4. Copy your **Database Password** (set during project creation)

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` based on your database choice:

**For Local PostgreSQL:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/samoa_finance"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/samoa_finance"

NEXTAUTH_URL=http://localhost:3000
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here
```

**For Supabase:**
```env
# Get connection strings from Supabase Dashboard → Settings → Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

NEXTAUTH_URL=http://localhost:3000
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here
```

**To generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 5. Run Database Migration

```bash
npx prisma migrate dev
```

This will:
- Create all database tables
- Apply the schema to your Supabase database

### 6. Seed the Database

```bash
npx prisma db seed
```

This creates default users:
- **Admin**: `admin@samoafinance.local` / `Admin@123`
- **Staff**: `staff@samoafinance.local` / `Staff@123`

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma db seed` - Seed database with test data

## Project Structure

```
samoa-finance-app/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts            # Database seeding script
│   └── migrations/        # Database migrations
├── src/
│   ├── app/               # Next.js App Router pages & API routes
│   │   ├── api/          # API endpoints
│   │   │   └── auth/     # NextAuth configuration
│   │   └── ...           # Page components
│   ├── lib/              # Utility functions
│   │   ├── db.ts         # Prisma client singleton
│   │   ├── auth.ts       # NextAuth configuration
│   │   ├── ids.ts        # ID generators (CUST-YYYY-NNNNNN)
│   │   └── validators.ts # Zod schemas
│   └── middleware.ts     # Route protection
├── uploads/              # File uploads (git-ignored)
├── .env                  # Environment variables (git-ignored)
├── .env.example          # Environment template
└── package.json
```

## Features

- ✅ Role-based authentication (Admin, Staff, AML, Agent)
- ✅ Customer management with E.164 phone validation
- ✅ Transaction tracking with sequential IDs
- ✅ Multi-currency support (WST, AUD, USD)
- ✅ AML/KYC compliance fields
- ✅ Document upload for customer IDs
- ✅ Timezone-aware operations (Pacific/Auckland)
- ⏳ Daily/monthly reporting
- ⏳ CSV export functionality
- ⏳ Exchange rate management

## Database Schema

Key models:
- **User** - System users with role-based access
- **Customer** - Customer profiles with KYC data
- **CustomerIdFile** - Uploaded ID documents
- **Transaction** - Remittance transactions with AML tracking
- **ExchangeRate** - Daily exchange rates
- **ActivityLog** - Audit trail

## Default Users

After seeding, you can log in with:

| Role  | Email                          | Password   |
|-------|--------------------------------|------------|
| Admin | admin@samoafinance.local       | Admin@123  |
| Staff | staff@samoafinance.local       | Staff@123  |

## Docker Deployment

### Option 1: Docker with Local PostgreSQL (Recommended for New PC)

This is the **easiest way** to run the application on a new PC with everything included:

```bash
# 1. Clone and navigate to the repository
git clone <repository-url>
cd samoa-finance-app

# 2. Create .env file (uses local PostgreSQL by default)
cp .env.example .env

# 3. Generate a secure NEXTAUTH_SECRET
openssl rand -base64 32
# Copy the output and update NEXTAUTH_SECRET in .env

# 4. Start PostgreSQL database and application
docker-compose up -d

# 5. Wait ~10 seconds for database to initialize, then run migrations
docker exec samoa-finance-app npx prisma migrate deploy
docker exec samoa-finance-app npx prisma db seed

# 6. View logs
docker-compose logs -f

# 7. Stop the application
docker-compose down
```

The application will be available at **http://localhost:3000**

**What's included:**
- PostgreSQL 16 database (local container)
- Next.js application
- Persistent data storage (survives container restarts)
- Health checks for both services

**Database credentials (default):**
- Host: `localhost` (or `postgres` from inside containers)
- Port: `5432`
- Database: `samoa_finance`
- User: `postgres`
- Password: `postgres`

You can customize these in `.env` file.

### Option 2: Docker with Supabase (Cloud Database)

If you prefer using Supabase cloud database:

```bash
# 1. Clone and navigate to the repository
git clone <repository-url>
cd samoa-finance-app

# 2. Create .env file with your Supabase credentials
cp .env.example .env
# Edit .env with your Supabase connection strings

# 3. Build and run with Docker Compose
docker-compose up -d

# 4. Run database migrations (first time only)
docker exec samoa-finance-app npx prisma migrate deploy
docker exec samoa-finance-app npx prisma db seed

# 5. View logs
docker-compose logs -f

# 6. Stop the application
docker-compose down
```

The application will be available at **http://localhost:3000**

### Manual Docker Build

If you prefer to build and run manually:

```bash
# Build the image
docker build -t samoa-finance-app .

# Run the container
docker run -d \
  --name samoa-finance-app \
  -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e DIRECT_URL="your-direct-url" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret" \
  -v $(pwd)/uploads:/app/uploads \
  samoa-finance-app

# Run migrations
docker exec samoa-finance-app npx prisma migrate deploy
docker exec samoa-finance-app npx prisma db seed
```

### Docker Features

- ✅ Multi-stage build for minimal image size
- ✅ Non-root user for security
- ✅ Health checks configured
- ✅ Persistent uploads volume
- ✅ Production-optimized Next.js standalone output

## Production Deployment

### Environment Variables

For production, ensure you set:
- Strong `NEXTAUTH_SECRET` (use `openssl rand -base64 32`)
- Production `NEXTAUTH_URL` (your deployed URL)
- Secure Supabase connection strings

### Deployment Options

- **Vercel** (Recommended for Next.js)
- **Railway**
- **AWS/Azure/GCP** with Docker

### Database Migration

```bash
npx prisma migrate deploy
```

## Security Notes

- Never commit `.env` file to git
- Rotate `NEXTAUTH_SECRET` regularly in production
- Use Supabase Row Level Security (RLS) for additional security
- Store uploaded files in secure storage (S3/Supabase Storage)
- Enable database backups in Supabase

## Support & Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)

## License

Private - The Get Group
