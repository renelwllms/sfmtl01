# Quick Start - Deployment Commands

## 🚀 On Live Ubuntu Server (epladmin@sfmtlportal)

### First Time - Pull the new scripts
```bash
cd ~/sfmtl01
git pull origin main
chmod +x deploy-update.sh quick-deploy.sh
```

---

## 📦 Deployment Options

### Option 1: Interactive Update (Recommended)
```bash
cd ~/sfmtl01
./deploy-update.sh
```
- ✅ Checks Node.js version (upgrades to v22 if needed)
- ✅ Asks before running migrations
- ✅ Shows detailed progress
- ⏱️ Takes 3-5 minutes

### Option 2: Fully Automated (No prompts)
```bash
cd ~/sfmtl01
./quick-deploy.sh
```
- ✅ Zero user input required
- ✅ Logs to file automatically
- ✅ Perfect for scheduled updates
- ⏱️ Takes 2-3 minutes

---

## 🔧 What Gets Updated Automatically

Both scripts will:
1. ✅ Backup your `.env` file
2. ✅ Pull latest code from GitHub
3. ✅ Install/update npm packages
4. ✅ Generate Prisma client
5. ✅ Build the application
6. ✅ Restart PM2/systemd service
7. ✅ Verify deployment

---

## ⚙️ Manual Commands (if needed)

### Check Node.js version
```bash
node --version   # Should show v22.x.x
npm --version    # Should show v11.x.x
```

### Upgrade Node.js to v22
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
nvm alias default 22
```

### Manual deployment steps
```bash
cd ~/sfmtl01
git pull origin main
npm install
npx prisma generate
npm run build
pm2 restart samoa-finance-app
```

---

## 📊 Service Management

### PM2 Commands
```bash
pm2 list                        # Show all processes
pm2 logs samoa-finance-app      # View logs
pm2 restart samoa-finance-app   # Restart app
pm2 stop samoa-finance-app      # Stop app
pm2 start samoa-finance-app     # Start app
```

### Systemd Commands (if using systemd instead)
```bash
sudo systemctl status samoa-finance-app
sudo systemctl restart samoa-finance-app
sudo journalctl -u samoa-finance-app -f
```

---

## 🐛 Troubleshooting

### Build fails with TypeScript errors?
```bash
# Clean and rebuild
rm -rf node_modules .next package-lock.json
npm install
npx prisma generate
npm run build
pm2 restart samoa-finance-app
```

### Check current git status
```bash
cd ~/sfmtl01
git status
git log --oneline -5
```

### Restore backup
```bash
# List backups
ls -lh ~/backups/

# Restore .env from backup
cp ~/backups/.env.YYYYMMDD_HHMMSS ~/sfmtl01/.env
```

### View deployment logs
```bash
# Quick deploy logs
ls -lh ~/deploy-*.log
tail -f ~/deploy-YYYYMMDD_HHMMSS.log

# Application logs
pm2 logs samoa-finance-app
```

---

## 🔄 Schedule Automatic Updates (Optional)

### Set up daily updates at 2 AM
```bash
crontab -e
```

Add this line:
```cron
0 2 * * * cd /home/epladmin/sfmtl01 && ./quick-deploy.sh >> /home/epladmin/cron-deploy.log 2>&1
```

---

## 📞 Emergency Commands

### App not responding?
```bash
pm2 restart samoa-finance-app
# or
pm2 delete samoa-finance-app
pm2 start npm --name samoa-finance-app -- start
pm2 save
```

### Port 3000 already in use?
```bash
sudo lsof -i :3000
kill -9 <PID>
pm2 restart samoa-finance-app
```

### Revert to previous version?
```bash
cd ~/sfmtl01
git log --oneline -10
git reset --hard <commit-hash>
npm install
npm run build
pm2 restart samoa-finance-app
```

---

## ✅ Post-Deployment Checklist

After running the deployment script:

- [ ] Check application is running: `pm2 list`
- [ ] View logs for errors: `pm2 logs samoa-finance-app --lines 20`
- [ ] Test the website in browser
- [ ] Verify database connection works
- [ ] Check recent commits: `git log --oneline -5`

---

## 📖 Full Documentation

For detailed information, see: `DEPLOYMENT.md`

---

**Last Updated:** 2025-01-14
**Quick Reference Version:** 1.0
