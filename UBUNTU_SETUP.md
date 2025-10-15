# Ubuntu Setup Guide

This guide explains how to use the automated setup script to install and configure the Samoa Finance App on Ubuntu.

## Quick Start

### One-Command Installation

```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/setup-ubuntu.sh
chmod +x setup-ubuntu.sh
sudo ./setup-ubuntu.sh
```

**Or if you've already cloned the repo:**

```bash
cd samoa-finance-app
chmod +x setup-ubuntu.sh
sudo ./setup-ubuntu.sh
```

## What the Script Does

The automated setup script will:

1. ✅ Update system packages
2. ✅ Install PostgreSQL 16
3. ✅ Install Node.js 20+
4. ✅ Install Git
5. ✅ Clone your repository
6. ✅ Create and configure PostgreSQL database
7. ✅ Generate secure passwords and secrets
8. ✅ Create `.env` configuration file
9. ✅ Install Node.js dependencies
10. ✅ Run database migrations
11. ✅ Seed database with default users
12. ✅ Build the application
13. ✅ (Optional) Setup systemd service for auto-start
14. ✅ (Optional) Configure firewall rules

## Prerequisites

- Ubuntu 20.04 LTS or newer
- Root/sudo access
- Internet connection

## Interactive Configuration

During setup, you'll be prompted for:

### Git Repository
```
Enter the Git repository URL: https://github.com/username/samoa-finance-app.git
```

### Installation Location
```
Enter installation directory (default: /home/user/samoa-finance-app):
```

### Database Configuration
```
Enter PostgreSQL database name (default: samoa_finance):
Enter PostgreSQL username (default: postgres):
Enter PostgreSQL password (leave empty to generate):
Enter PostgreSQL host (default: localhost):
Enter PostgreSQL port (default: 5432):
```

### Application Configuration
```
Enter application URL (default: http://localhost:3000):
Enter application port (default: 3000):
```

**Note:** If you leave password fields empty, the script will generate secure random passwords automatically.

## After Installation

### Default Login Credentials

After installation, you can log in with:

| Role  | Email                     | Password   |
|-------|---------------------------|------------|
| Admin | admin@samoafinance.local  | Admin@123  |
| Staff | staff@samoafinance.local  | Staff@123  |

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

Or the custom URL you configured during setup.

### If Systemd Service Was Installed

**Manage the service:**
```bash
# Start the application
sudo systemctl start samoa-finance

# Stop the application
sudo systemctl stop samoa-finance

# Restart the application
sudo systemctl restart samoa-finance

# Check status
sudo systemctl status samoa-finance

# View logs in real-time
sudo journalctl -u samoa-finance -f
```

The application will automatically start on system boot.

### If No Systemd Service

**Start manually:**
```bash
cd ~/samoa-finance-app  # or your custom directory
npm start
```

**Or run in development mode:**
```bash
npm run dev
```

## Important Files Created

After installation, these files will be available:

- **`.env`** - Environment configuration (contains passwords - keep secure!)
- **`SETUP_INFO.txt`** - Installation summary with all credentials and commands
- **`uploads/`** - Directory for uploaded documents

## Useful Commands

### Database Management

```bash
# Open Prisma Studio (Database GUI)
cd ~/samoa-finance-app
npx prisma studio
```

This opens a web interface at `http://localhost:5555` to view and edit database records.

### View Application Logs

**With systemd service:**
```bash
sudo journalctl -u samoa-finance -f
```

**Manual run:**
Logs will appear in the terminal where you ran `npm start` or `npm run dev`

### Update the Application

```bash
cd ~/samoa-finance-app
git pull
npm install
npx prisma migrate deploy
npm run build
sudo systemctl restart samoa-finance  # if using systemd
```

### Backup Database

```bash
pg_dump -U postgres samoa_finance > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
psql -U postgres samoa_finance < backup_20250316.sql
```

## Troubleshooting

### Port 3000 Already in Use

If port 3000 is already in use:

1. Edit `.env` file and change the port
2. Update systemd service file (if installed): `/etc/systemd/system/samoa-finance.service`
3. Restart the application

### Database Connection Issues

Check PostgreSQL is running:
```bash
sudo systemctl status postgresql
```

Test database connection:
```bash
psql -U postgres -d samoa_finance -h localhost
```

### Permission Issues

Ensure the user running the application has access:
```bash
cd ~/samoa-finance-app
sudo chown -R $USER:$USER .
```

### View Detailed Logs

With systemd:
```bash
sudo journalctl -u samoa-finance -n 100 --no-pager
```

Manual:
```bash
cd ~/samoa-finance-app
npm run dev  # Shows detailed logs
```

### Reset Everything and Start Fresh

```bash
# Stop the service if running
sudo systemctl stop samoa-finance

# Drop database
sudo -u postgres psql -c "DROP DATABASE samoa_finance;"

# Remove installation
rm -rf ~/samoa-finance-app

# Run setup script again
./setup-ubuntu.sh
```

## Security Recommendations

1. **Change default user passwords** after first login
2. **Keep `.env` file secure** - it contains sensitive credentials
3. **Enable UFW firewall** if exposing to network:
   ```bash
   sudo ufw enable
   sudo ufw allow 3000/tcp
   sudo ufw allow ssh
   ```
4. **Use HTTPS in production** with nginx/apache reverse proxy
5. **Set up regular database backups**
6. **Keep the system updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## Production Deployment

For production use:

1. Use a reverse proxy (nginx/apache) with SSL certificate
2. Set `NEXTAUTH_URL` to your production domain
3. Use a strong, unique `NEXTAUTH_SECRET`
4. Enable automatic backups
5. Configure log rotation
6. Set up monitoring (e.g., PM2, Prometheus)

### Example Nginx Configuration

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
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Support

For issues or questions:
- Check the main README.md
- Review application logs
- Check database connectivity
- Verify all environment variables in `.env`

## Uninstall

To completely remove the application:

```bash
# Stop and disable service
sudo systemctl stop samoa-finance
sudo systemctl disable samoa-finance
sudo rm /etc/systemd/system/samoa-finance.service
sudo systemctl daemon-reload

# Remove database
sudo -u postgres psql -c "DROP DATABASE samoa_finance;"
sudo -u postgres psql -c "DROP USER samoa_user;"  # if you created a custom user

# Remove application files
rm -rf ~/samoa-finance-app

# Optionally remove PostgreSQL and Node.js
sudo apt remove --purge postgresql postgresql-contrib
sudo apt remove --purge nodejs
sudo apt autoremove
```

---

**Note:** Keep the `SETUP_INFO.txt` file created during installation - it contains all your configuration details and passwords!
