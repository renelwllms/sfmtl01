# Deployment Guide - SAMOA Finance App

## Quick Start

### Option 1: Interactive Deployment (Recommended for first-time setup)

```bash
cd ~/sfmtl01
chmod +x deploy-update.sh
./deploy-update.sh
```

**Features:**
- ✅ Checks and upgrades Node.js version automatically
- ✅ Creates backups before updating
- ✅ Pulls latest code from Git
- ✅ Installs dependencies
- ✅ Prompts for database migrations if schema changed
- ✅ Builds the application
- ✅ Restarts PM2/systemd service
- ✅ Shows helpful status information

**When to use:** Regular updates, when you want control over migration decisions

---

### Option 2: Fully Automated Deployment (No prompts)

```bash
cd ~/sfmtl01
chmod +x quick-deploy.sh
./quick-deploy.sh
```

**Features:**
- ✅ Fully automated (no user input required)
- ✅ Logs everything to file
- ✅ Perfect for CI/CD or cron jobs
- ✅ Faster execution

**When to use:** Automated deployments, scheduled updates, CI/CD pipelines

---

## System Requirements

### Node.js Version
- **Minimum:** Node.js v20.x
- **Recommended:** Node.js v22.x
- **npm:** v10.x or higher

### Why Node 22?
The application uses Next.js 15 which has breaking changes that require newer Node.js versions for optimal compatibility. Your development system runs Node 22, so the live system should match.

---

## First-Time Setup

### 1. Clone the repository
```bash
cd ~
git clone https://github.com/renelwllms/sfmtl01
cd sfmtl01
```

### 2. Run the installation script
```bash
chmod +x install-ubuntu.sh
sudo ./install-ubuntu.sh
```

This will:
- Install Node.js, npm, and dependencies
- Set up the application
- Configure systemd service
- Set up database (optional)

---

## Regular Updates Workflow

### Manual Update (Interactive)
```bash
cd ~/sfmtl01
./deploy-update.sh
```

### Automated Update (No prompts)
```bash
cd ~/sfmtl01
./quick-deploy.sh
```

### What happens during update:
1. **Backup** - `.env` and database backed up to `~/backups/`
2. **Git Pull** - Latest code fetched from GitHub
3. **Dependencies** - `npm install` or `npm ci` (if package.json changed)
4. **Prisma** - Client regenerated, migrations applied (if needed)
5. **Build** - `npm run build` creates production bundle
6. **Restart** - PM2 or systemd service restarted
7. **Verify** - Checks if app is responding

---

## Scheduled Automated Updates (Optional)

### Set up daily automated updates at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line:
0 2 * * * cd /home/epladmin/sfmtl01 && ./quick-deploy.sh >> /home/epladmin/cron-deploy.log 2>&1
```

This will:
- Run every day at 2:00 AM
- Pull latest changes
- Build and restart automatically
- Log output to `~/cron-deploy.log`

---

## Troubleshooting

### 1. Node.js Version Mismatch

**Problem:** Build errors due to old Node.js version

**Solution:**
```bash
# The deploy-update.sh script will handle this automatically
# Or manually upgrade:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
nvm alias default 22
```

### 2. Build Fails with TypeScript Errors

**Problem:** Type errors during `npm run build`

**Common causes:**
- Node.js version mismatch (dev vs production)
- Outdated dependencies
- Prisma Client not regenerated

**Solution:**
```bash
# Clean everything and rebuild
rm -rf node_modules .next package-lock.json
npm install
npx prisma generate
npm run build
```

### 3. Database Migration Errors

**Problem:** Prisma migration fails

**Solution:**
```bash
# For development/test environments (destructive):
npx prisma db push

# For production (safe):
npx prisma migrate deploy
```

### 4. Service Won't Restart

**Problem:** PM2 or systemd service fails to restart

**PM2 Solution:**
```bash
pm2 list                        # Check process status
pm2 logs samoa-finance-app      # View logs
pm2 restart samoa-finance-app   # Manual restart
pm2 delete samoa-finance-app    # Delete process
pm2 start npm --name samoa-finance-app -- start  # Start fresh
pm2 save                        # Save configuration
```

**Systemd Solution:**
```bash
sudo systemctl status samoa-finance-app     # Check status
sudo journalctl -u samoa-finance-app -n 50  # View logs
sudo systemctl restart samoa-finance-app    # Restart
```

### 5. Port Already in Use

**Problem:** Application can't start because port 3000 is in use

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port in .env
echo "PORT=3001" >> .env
```

---

## Rollback to Previous Version

### If an update breaks something:

```bash
# Option 1: Restore from backup
cp ~/backups/.env.YYYYMMDD_HHMMSS .env

# Option 2: Revert git commit
git log --oneline -10           # Find the commit to revert to
git reset --hard <commit-hash>  # Revert to that commit
npm install
npx prisma generate
npm run build
pm2 restart samoa-finance-app

# Option 3: Restore stashed changes
git stash list                  # See stashed changes
git stash pop                   # Restore most recent stash
```

---

## Environment Variables

### Critical variables in `.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"  # For PostgreSQL only

# NextAuth
NEXTAUTH_SECRET="<random-secret>"
NEXTAUTH_URL="https://your-domain.com"

# Azure AD (Optional)
AZURE_AD_CLIENT_ID="your-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"
AZURE_AD_TENANT_ID="your-tenant-id"
```

### Generate new NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

---

## Service Management

### PM2 Commands (if using PM2):
```bash
pm2 list                          # List all processes
pm2 logs samoa-finance-app        # View logs
pm2 restart samoa-finance-app     # Restart app
pm2 stop samoa-finance-app        # Stop app
pm2 start samoa-finance-app       # Start app
pm2 delete samoa-finance-app      # Remove from PM2
pm2 save                          # Save configuration
pm2 startup                       # Enable startup on boot
```

### Systemd Commands (if using systemd):
```bash
sudo systemctl status samoa-finance-app      # Check status
sudo systemctl start samoa-finance-app       # Start service
sudo systemctl stop samoa-finance-app        # Stop service
sudo systemctl restart samoa-finance-app     # Restart service
sudo systemctl enable samoa-finance-app      # Enable on boot
sudo systemctl disable samoa-finance-app     # Disable on boot
sudo journalctl -u samoa-finance-app -f      # Follow logs
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Node.js v22 installed on live system
- [ ] Environment variables configured (`.env`)
- [ ] Database connection tested
- [ ] Azure AD credentials configured (if using SSO)
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] Database backed up
- [ ] SSL certificate configured (reverse proxy)
- [ ] Firewall rules configured (allow port 3000 or proxy port)
- [ ] PM2 or systemd service configured
- [ ] Service enabled to start on boot

---

## Performance Tips

### 1. Use Process Manager
PM2 is recommended for production:
```bash
npm install -g pm2
pm2 start npm --name samoa-finance-app -- start
pm2 startup  # Enable on boot
pm2 save
```

### 2. Enable Logging
```bash
# PM2 logs
pm2 logs samoa-finance-app --lines 100

# Systemd logs
sudo journalctl -u samoa-finance-app -f
```

### 3. Monitor Resources
```bash
pm2 monit  # Real-time monitoring
htop       # System resources
```

---

## Security Best Practices

1. **Keep Node.js Updated**
   ```bash
   nvm install 22  # Latest LTS
   nvm use 22
   ```

2. **Secure Environment Variables**
   ```bash
   chmod 600 .env
   ```

3. **Use Strong Secrets**
   ```bash
   openssl rand -base64 32  # Generate strong secrets
   ```

4. **Enable Firewall**
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

5. **Regular Backups**
   ```bash
   # Database backup
   pg_dump -h localhost -U postgres samoa_finance > backup-$(date +%Y%m%d).sql
   ```

---

## Support

### View Logs
```bash
# Deployment logs
tail -f ~/deploy-YYYYMMDD_HHMMSS.log

# Application logs (PM2)
pm2 logs samoa-finance-app

# Application logs (systemd)
sudo journalctl -u samoa-finance-app -f
```

### Common Issues
- Check Node.js version matches development (`node --version`)
- Verify `.env` file exists and is configured
- Check database connection
- Ensure port 3000 is available
- Review logs for errors

---

## Version History

| Version | Node.js | Next.js | Notes |
|---------|---------|---------|-------|
| Current | v22.20.0 | 15.5.4 | Recommended for production |
| Minimum | v20.19.5 | 15.5.4 | Minimal compatible version |

---

**Created:** 2025-01-14
**Last Updated:** 2025-01-14
**Maintained by:** SFMTL Development Team
