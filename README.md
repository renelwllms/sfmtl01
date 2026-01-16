# SAMOA Finance App - Ubuntu Server Deployment Guide

Complete guide for deploying the SAMOA Finance Money Transfer System on Ubuntu Server.

## Table of Contents

- [Quick Start](#quick-start)
- [Requirements](#requirements)
- [Installation](#installation)
- [Office 365 SSO Setup](#office-365-sso-setup)
- [Database Configuration](#database-configuration)
- [Service Management](#service-management)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

---

## Quick Start

```bash
# 1. Transfer files to your Ubuntu server
scp -r samoa-finance-app/ user@your-server:/tmp/

# 2. SSH into server
ssh user@your-server

# 3. Run installation script
cd /tmp/samoa-finance-app
chmod +x install-ubuntu.sh
sudo ./install-ubuntu.sh

# 4. Access your app
# http://your-server-ip:3000
```

---

## Requirements

### System Requirements
- **OS**: Ubuntu 20.04 LTS or later
- **RAM**: 2GB minimum, 4GB recommended
- **Disk**: 2GB free space
- **CPU**: 1 core minimum, 2+ recommended

### Software (Auto-installed by script)
- Node.js v20.x LTS
- npm
- PostgreSQL 12+ (optional, can be remote)
- Build essentials

---

## Installation

### 1. Prepare Installation Files

Transfer the application to your Ubuntu server:

```bash
# Using SCP
scp -r samoa-finance-app/ user@server:/tmp/

# Or using rsync
rsync -avz samoa-finance-app/ user@server:/tmp/samoa-finance-app/
```

### 2. Run Installation Script

```bash
# SSH into your server
ssh user@your-server

# Navigate to app directory
cd /tmp/samoa-finance-app

# Make script executable
chmod +x install-ubuntu.sh

# Run installation as root
sudo ./install-ubuntu.sh
```

### 3. Follow Interactive Prompts

The script will ask you:

**Install/upgrade Node.js v20.x?**
- Recommended: **Yes** (for latest LTS version)

**Install PostgreSQL client tools?**
- Recommended: **Yes** (for database management)

**Configure database now?**
- Option 1: **Yes** - Configure now if PostgreSQL is ready
- Option 2: **No** - Configure later via Settings UI

**Enable service on boot?**
- Recommended: **Yes** (auto-start on reboot)

**Start service now?**
- Recommended: **Yes** (start immediately)

### 4. Installation Complete

The app will be installed to: `/sfmtl/`

Access at: `http://your-server-ip:3000`

Default credentials are shown on the login page.

---

## Office 365 SSO Setup

Enable single sign-on with Microsoft Office 365 accounts.

### Step 1: Azure Portal Configuration

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com
   - Navigate to: **Azure Active Directory** → **App registrations**

2. **Create App Registration**
   - Click **"New registration"**
   - Name: `SAMOA Finance App`
   - Supported account types: **"Accounts in this organizational directory only"**
   - Click **Register**

3. **Note Important Values**
   - Copy **Application (client) ID**
   - Copy **Directory (tenant) ID**

4. **Create Client Secret**
   - Go to **Certificates & secrets**
   - Click **"New client secret"**
   - Description: `SAMOA Finance Secret`
   - Expires: Choose duration (recommended: 24 months)
   - Click **Add**
   - **IMPORTANT**: Copy the secret **VALUE** immediately (you can't see it again!)

5. **Configure Authentication**
   - Go to **Authentication**
   - Click **"Add a platform"** → Select **"Web"**
   - Add redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/azure-ad`
     - Production: `https://your-domain.com/api/auth/callback/azure-ad`
   - Under **"Implicit grant and hybrid flows"**:
     - Check **"ID tokens"**
   - Click **Save**

6. **Add API Permissions**
   - Go to **API permissions**
   - Click **"Add a permission"** → **Microsoft Graph** → **Delegated permissions**
   - Add these permissions:
     - `openid`
     - `profile`
     - `email`
     - `User.Read`
   - Click **"Grant admin consent"** and approve

### Step 2: Configure Environment Variables

Edit the `.env` file on your server:

```bash
sudo nano /sfmtl/.env
```

Add your Azure AD credentials:

```env
# Office 365 SSO Configuration
AZURE_AD_CLIENT_ID=your-application-client-id-here
AZURE_AD_CLIENT_SECRET=your-client-secret-value-here
AZURE_AD_TENANT_ID=your-directory-tenant-id-here
```

### Step 3: Update NEXTAUTH_URL

**For Development (localhost):**
```env
NEXTAUTH_URL=http://localhost:3000
```

**For Production:**
```env
NEXTAUTH_URL=https://your-domain.com
```

### Step 4: Restart Service

```bash
sudo systemctl restart samoa-finance
```

### Step 5: Test SSO Login

1. Go to your app URL
2. You should see **"Sign in with Office 365"** button
3. Click it and login with your Microsoft account
4. After authentication, you'll be redirected back to the app

**First-time Office 365 users** are automatically created with **STAFF** role.

---

## Database Configuration

### Option 1: Configure During Installation

The installation script asks if you want to configure the database. Provide:
- Host (e.g., `localhost`)
- Port (e.g., `5432`)
- Database name (e.g., `samoa_finance`)
- Username (e.g., `postgres`)
- Password

The script will:
- Test the connection
- Optionally set up the schema
- Optionally seed initial data

### Option 2: Configure via Settings UI

If you skip database configuration during installation:

1. **Start the app** (it runs without a database)
2. **Access**: `http://your-server-ip:3000`
3. **Login** with default credentials (shown on login page)
4. **Navigate** to: Settings → Database tab
5. **Enter** connection details
6. **Test Connection**
7. **Setup Schema** (creates tables)
8. **Seed Database** (creates default users and data)

### Option 3: Manual PostgreSQL Installation

If PostgreSQL is not installed:

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE samoa_finance;
CREATE USER samoa_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE samoa_finance TO samoa_user;
\q
EOF

# Update .env file
sudo nano /sfmtl/.env
```

Add to `.env`:
```env
DATABASE_URL="postgresql://samoa_user:your-secure-password@localhost:5432/samoa_finance"
DIRECT_URL="postgresql://samoa_user:your-secure-password@localhost:5432/samoa_finance"
```

Then restart:
```bash
sudo systemctl restart samoa-finance
```

---

## Service Management

The app runs as a systemd service named `samoa-finance`.

### Start Service
```bash
sudo systemctl start samoa-finance
```

### Stop Service
```bash
sudo systemctl stop samoa-finance
```

### Restart Service
```bash
sudo systemctl restart samoa-finance
```

### Check Status
```bash
sudo systemctl status samoa-finance
```

### Enable Auto-Start on Boot
```bash
sudo systemctl enable samoa-finance
```

### Disable Auto-Start
```bash
sudo systemctl disable samoa-finance
```

### View Logs (Live)
```bash
sudo journalctl -u samoa-finance -f
```

### View Last 100 Log Lines
```bash
sudo journalctl -u samoa-finance -n 100
```

### View Logs Since Today
```bash
sudo journalctl -u samoa-finance --since today
```

---

## Environment Configuration

All configuration is in: `/sfmtl/.env`

### Edit Configuration
```bash
sudo nano /sfmtl/.env
```

### Key Variables

#### Required
```env
# Database connection
DATABASE_URL="postgresql://user:password@host:5432/database"
DIRECT_URL="postgresql://user:password@host:5432/database"

# NextAuth configuration
NEXTAUTH_URL=http://localhost:3000  # or https://your-domain.com
NEXTAUTH_SECRET=your-generated-secret-here
```

#### Optional (Office 365 SSO)
```env
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
```

### Development vs Production

**Development (localhost):**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=devdevdev
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/samoa_finance"
```

**Production:**
```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<strong-random-32char-secret>
DATABASE_URL="postgresql://user:password@db-server:5432/samoa_finance"
```

### Generate Production Secret
```bash
openssl rand -base64 32
```

### Using Both Localhost and Production

You can use the **same Azure AD app** for both environments!

**In Azure Portal** → Authentication → Redirect URIs, add both:
```
http://localhost:3000/api/auth/callback/azure-ad
https://your-domain.com/api/auth/callback/azure-ad
```

Then just set `NEXTAUTH_URL` appropriately in each environment's `.env` file.

---

## Reverse Proxy Setup

Configure your external proxy manager to forward traffic to:
```
http://localhost:3000
```

### Example: Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Important**: After configuring reverse proxy with HTTPS, update `.env`:
```env
NEXTAUTH_URL=https://your-domain.com
```

Then restart:
```bash
sudo systemctl restart samoa-finance
```

---

## Troubleshooting

### Service Won't Start

**Check logs:**
```bash
sudo journalctl -u samoa-finance -n 100
```

**Common issues:**
- Database connection failed → Check DATABASE_URL in `.env`
- Port 3000 already in use → Stop conflicting service
- Permission errors → Check file ownership: `sudo chown -R root:root /sfmtl`

### Database Connection Errors

**Test connection manually:**
```bash
psql -h localhost -U postgres -d samoa_finance
```

**Check .env configuration:**
```bash
sudo cat /sfmtl/.env | grep DATABASE_URL
```

**Verify PostgreSQL is running:**
```bash
sudo systemctl status postgresql
```

### Office 365 Login Not Working

**Check SSO status:**
```bash
curl http://localhost:3000/api/auth/sso-status
# Should return: {"enabled":true}
```

**If {"enabled":false}:**
- Verify Azure AD credentials are set in `/sfmtl/.env`
- Check credentials are not empty or commented out
- Restart service after changing `.env`

**If redirect fails:**
- Verify redirect URI in Azure Portal matches exactly:
  - `http://localhost:3000/api/auth/callback/azure-ad` (dev), or
  - `https://your-domain.com/api/auth/callback/azure-ad` (production)
- Ensure `NEXTAUTH_URL` in `.env` matches your access URL
- Check Azure AD app is configured as **Web** platform (not Public client)

**Check for errors:**
```bash
sudo journalctl -u samoa-finance -f
```

Then try logging in again and watch for error messages.

### Port Already in Use

**Find what's using port 3000:**
```bash
sudo netstat -tulpn | grep 3000
```

**Kill the process:**
```bash
sudo kill -9 <PID>
```

**Or change the port:**
Edit service file:
```bash
sudo nano /etc/systemd/system/samoa-finance.service
```

Add under `[Service]`:
```ini
Environment="PORT=3001"
```

Reload and restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart samoa-finance
```

### Permission Errors

**Fix file ownership:**
```bash
sudo chown -R root:root /sfmtl
sudo chmod -R 755 /sfmtl
```

### App Not Accessible Remotely

**Check firewall:**
```bash
sudo ufw status
```

**Allow port 3000 (if not using reverse proxy):**
```bash
sudo ufw allow 3000/tcp
```

**For reverse proxy, allow HTTP/HTTPS:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## Security

### Production Checklist

- [ ] **Strong NEXTAUTH_SECRET** (32+ random characters)
- [ ] **HTTPS enabled** (SSL/TLS certificate)
- [ ] **Firewall configured** (only expose 80/443 via reverse proxy)
- [ ] **Strong database passwords**
- [ ] **Default credentials changed**
- [ ] **`.env` file secured** (never commit to git)
- [ ] **Regular backups** (database + `.env` file)
- [ ] **Azure AD client secret** rotated regularly

### Generate Strong Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

### File Permissions

Ensure `.env` is not world-readable:
```bash
sudo chmod 600 /sfmtl/.env
sudo chown root:root /sfmtl/.env
```

### Firewall Configuration

```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if using reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### Regular Backups

**Backup database:**
```bash
pg_dump -h localhost -U samoa_user samoa_finance > backup-$(date +%Y%m%d).sql
```

**Backup .env:**
```bash
sudo cp /sfmtl/.env /sfmtl/.env.backup-$(date +%Y%m%d)
```

---

## Application Features

- 💰 **Transaction Management** - Create, view, and manage money transfers
- 👥 **Customer Management** - KYC/AML compliance with document uploads
- 📊 **Reports & Analytics** - Daily, monthly reports and dashboards
- 🔐 **Role-Based Access** - ADMIN, STAFF, AML, AGENT roles
- 🔑 **Dual Authentication** - Traditional login + Office 365 SSO
- 🌐 **Multi-Currency** - WST (Samoa Tala), AUD, USD support
- 📝 **Activity Logging** - Complete audit trail
- 📧 **Email Integration** - Office 365 email (optional)
- 🏢 **Agent Management** - Multi-location support with QR codes
- 💾 **Database UI** - Configure database via Settings

---

## Important File Locations

| File/Directory | Location | Purpose |
|---------------|----------|---------|
| Application | `/sfmtl/` | Main application directory |
| Configuration | `/sfmtl/.env` | Environment variables |
| Service File | `/etc/systemd/system/samoa-finance.service` | Systemd service configuration |
| Logs | `journalctl -u samoa-finance` | Application logs |
| Installation Script | `install-ubuntu.sh` | Automated installer |

---

## Updating the Application

```bash
# Stop service
sudo systemctl stop samoa-finance

# Backup .env
sudo cp /sfmtl/.env /sfmtl/.env.backup

# Copy new files (excluding .env)
# ... transfer new files to /sfmtl ...

# Install dependencies
cd /sfmtl
sudo npm install

# Generate Prisma client
sudo npx prisma generate

# Build application
sudo npm run build

# Start service
sudo systemctl start samoa-finance
```

---

## Support & Resources

### Default Login
Microsoft SSO only. Users are created on first sign-in.

### Service Commands Reference
```bash
# Start
sudo systemctl start samoa-finance

# Stop
sudo systemctl stop samoa-finance

# Restart
sudo systemctl restart samoa-finance

# Status
sudo systemctl status samoa-finance

# Logs
sudo journalctl -u samoa-finance -f

# Enable auto-start
sudo systemctl enable samoa-finance
```

### Configuration Files
- Main config: `/sfmtl/.env`
- Service: `/etc/systemd/system/samoa-finance.service`
- Installation script: `install-ubuntu.sh`

---

## Quick Command Reference

```bash
# View logs
sudo journalctl -u samoa-finance -f

# Restart after config change
sudo systemctl restart samoa-finance

# Check status
sudo systemctl status samoa-finance

# Edit configuration
sudo nano /sfmtl/.env

# Test database connection
psql -h localhost -U postgres -d samoa_finance

# Generate secret
openssl rand -base64 32

# View service file
sudo cat /etc/systemd/system/samoa-finance.service
```

---

**Installation Complete!**

Access your app at: `http://your-server-ip:3000`

For production deployment with a domain: Update `NEXTAUTH_URL` in `/sfmtl/.env` and configure your reverse proxy.

**Need help?** Check the [Troubleshooting](#troubleshooting) section above.
