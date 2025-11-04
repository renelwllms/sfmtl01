# SFMTL Finance Application

A full-stack finance management system for remittance transactions with AML/KYC compliance tracking.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (self-hosted)
- **Authentication**: NextAuth.js
- **ORM**: Prisma

## Features

- Role-based authentication (Admin, Staff, AML, Agent)
- Customer management with E.164 phone validation
- Transaction tracking with sequential IDs
- Multi-currency support (WST, AUD, USD)
- AML/KYC compliance fields
- Document upload for customer IDs
- Timezone-aware operations (Pacific/Auckland)
- Daily/monthly reporting capabilities

## Quick Start

Choose your platform:

### Ubuntu / Linux Server

Complete automated deployment with Nginx and SSL:

```bash
wget https://raw.githubusercontent.com/renelwllms/sfmtl01/main/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

[View Ubuntu Deployment Guide →](./README-UBUNTU.md)

### Windows Server

Automated deployment with Caddy and automatic SSL:

```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/renelwllms/sfmtl01/main/deploy-windows.ps1" -OutFile "$env:TEMP\deploy-windows.ps1"
Set-ExecutionPolicy Bypass -Scope Process -Force
& "$env:TEMP\deploy-windows.ps1"
```

[View Windows Deployment Guide →](./README-WINDOWS.md)

## Production Deployment

### Ubuntu/Linux
- **Location**: `/opt/sfmtl`
- **Reverse Proxy**: Nginx with Let's Encrypt SSL
- **Service**: Systemd
- **Domain**: https://sfmtl.edgepoint.co.nz

### Windows
- **Location**: `C:\apps\sfmtl`
- **Reverse Proxy**: Caddy with automatic SSL
- **Service**: Windows Service (via NSSM)
- **Domain**: https://sfmtl.edgepoint.co.nz

## Default Login Credentials

After deployment, log in with:

| Role  | Email                       | Password  |
|-------|----------------------------|-----------|
| Admin | admin@samoafinance.local   | Admin@123 |
| Staff | staff@samoafinance.local   | Staff@123 |

**⚠️ Change these passwords immediately after first login!**

## Documentation

- **[Ubuntu Deployment Guide](./README-UBUNTU.md)** - Complete guide for Linux servers
- **[Windows Deployment Guide](./README-WINDOWS.md)** - Complete guide for Windows servers

## Development Setup

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 16+

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/renelwllms/sfmtl01.git
cd samoa-finance-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up database:
```bash
# Create PostgreSQL database
createdb samoa_finance
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Run migrations:
```bash
npx prisma migrate dev
npx prisma db seed
```

6. Start development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply migrations
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
│   │   ├── db.ts         # Prisma client
│   │   ├── auth.ts       # NextAuth config
│   │   ├── ids.ts        # ID generators
│   │   └── validators.ts # Zod schemas
│   └── middleware.ts     # Route protection
├── uploads/              # File uploads (git-ignored)
├── .env                  # Environment variables (git-ignored)
├── .env.example          # Environment template
├── deploy-ubuntu.sh      # Ubuntu deployment script
├── deploy-windows.ps1    # Windows deployment script
└── README.md            # This file
```

## Database Schema

Key models:
- **User** - System users with role-based access
- **Customer** - Customer profiles with KYC data
- **CustomerIdFile** - Uploaded ID documents
- **Transaction** - Remittance transactions with AML tracking
- **ExchangeRate** - Daily exchange rates
- **ActivityLog** - Audit trail

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sfmtl_finance"
DIRECT_URL="postgresql://user:password@localhost:5432/sfmtl_finance"

# NextAuth
NEXTAUTH_URL="https://sfmtl.edgepoint.co.nz"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Security Notes

- Never commit `.env` file to git
- Rotate `NEXTAUTH_SECRET` regularly in production
- Store uploaded files securely (consider S3/cloud storage)
- Enable database backups
- Keep dependencies updated
- Use strong passwords for all default accounts

## Support

For deployment issues:
- **Ubuntu**: See [README-UBUNTU.md](./README-UBUNTU.md) troubleshooting section
- **Windows**: See [README-WINDOWS.md](./README-WINDOWS.md) troubleshooting section
- Check application logs for error details
- Verify database connectivity
- Ensure environment variables are correct

## Updates

### Ubuntu
```bash
cd /opt/sfmtl
sudo -u sfmtl git pull
sudo -u sfmtl npm install
sudo -u sfmtl npx prisma migrate deploy
sudo -u sfmtl npm run build
sudo systemctl restart sfmtl
```

### Windows
```powershell
cd C:\apps\sfmtl
Stop-Service SFMTL
git pull
npm install
npx prisma migrate deploy
npm run build
Start-Service SFMTL
```

## License

Private - Edgepoint Limited

## Contact

For support or questions, contact: admin@edgepoint.co.nz
