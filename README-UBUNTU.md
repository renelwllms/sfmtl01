# SFMTL Finance App - Ubuntu Deployment Guide

Complete guide for deploying the SFMTL Finance Application on Ubuntu Server with Nginx reverse proxy and SSL.

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment](#post-deployment)
- [Management](#management)
- [Troubleshooting](#troubleshooting)
- [Updates](#updates)

## Quick Start

### One-Command Deployment

```bash
# Download and run the deployment script
wget https://raw.githubusercontent.com/renelwllms/sfmtl01/main/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

The script will automatically:
- Install PostgreSQL 16
- Install Node.js 20
- Install and configure Nginx
- Setup SSL with Let's Encrypt
- Clone the repository
- Configure the database
- Build and deploy the application
- Create systemd service for auto-start

## Prerequisites

- **Ubuntu Server**: 20.04 LTS or newer
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk Space**: Minimum 10GB free
- **Root Access**: sudo privileges required
- **Domain**: DNS record pointing to server IP
- **Ports**: 80 (HTTP) and 443 (HTTPS) open

## Deployment Steps

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required tools
sudo apt install -y wget curl git
```

### Step 2: Configure DNS

Before running the deployment script, ensure your DNS is configured:

```bash
# Point your domain to server IP
# Example: sfmtl.edgepoint.co.nz → 203.0.113.10

# Verify DNS propagation
dig sfmtl.edgepoint.co.nz
nslookup sfmtl.edgepoint.co.nz
```

### Step 3: Run Deployment Script

```bash
# Download script
wget https://raw.githubusercontent.com/renelwllms/sfmtl01/main/deploy-ubuntu.sh

# Make executable
chmod +x deploy-ubuntu.sh

# Run as root
sudo ./deploy-ubuntu.sh
```

The script will:
1. Install all dependencies
2. Setup PostgreSQL database
3. Configure Nginx reverse proxy
4. Create systemd service
5. Setup firewall rules
6. Optionally configure SSL certificate

### Step 4: SSL Certificate (if not done automatically)

```bash
# Install SSL certificate manually
sudo certbot --nginx -d sfmtl.edgepoint.co.nz
```

Follow the prompts to:
- Enter your email address
- Agree to Terms of Service
- Choose to redirect HTTP to HTTPS (recommended)

## Post-Deployment

### Verify Installation

```bash
# Check service status
sudo systemctl status sfmtl

# Check application logs
sudo journalctl -u sfmtl -f

# Check Nginx status
sudo systemctl status nginx

# Test SSL certificate
curl -I https://sfmtl.edgepoint.co.nz
```

### Access Application

Open your browser and navigate to:
```
https://sfmtl.edgepoint.co.nz
```

### Default Login Credentials

After deployment, log in with:

| Role  | Email                       | Password  |
|-------|----------------------------|-----------|
| Admin | admin@samoafinance.local   | Admin@123 |
| Staff | staff@samoafinance.local   | Staff@123 |

**⚠️ IMPORTANT:** Change these passwords immediately after first login!

### Deployment Information

All configuration details are saved in:
```
/opt/sfmtl/DEPLOYMENT_INFO.txt
```

This file contains:
- Database credentials
- NextAuth secret
- Service management commands
- Application logs locations

## Management

### Service Management

```bash
# Start application
sudo systemctl start sfmtl

# Stop application
sudo systemctl stop sfmtl

# Restart application
sudo systemctl restart sfmtl

# Check status
sudo systemctl status sfmtl

# Enable auto-start on boot
sudo systemctl enable sfmtl

# Disable auto-start
sudo systemctl disable sfmtl
```

### View Logs

```bash
# Application logs (real-time)
sudo journalctl -u sfmtl -f

# Last 100 lines
sudo journalctl -u sfmtl -n 100

# Logs for specific date
sudo journalctl -u sfmtl --since "2025-01-01"

# Application-specific logs
tail -f /var/log/sfmtl/app.log
tail -f /var/log/sfmtl/error.log

# Nginx logs
tail -f /var/log/nginx/sfmtl.access.log
tail -f /var/log/nginx/sfmtl.error.log
```

### Database Management

```bash
# Access database
sudo -u postgres psql -d sfmtl_finance

# Create backup
sudo -u postgres pg_dump sfmtl_finance > backup_$(date +%Y%m%d).sql

# Restore from backup
sudo -u postgres psql sfmtl_finance < backup_20250129.sql

# Open Prisma Studio (Database GUI)
cd /opt/sfmtl
sudo -u sfmtl npx prisma studio
# Access at http://localhost:5555
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload configuration (no downtime)
sudo nginx -s reload

# Restart Nginx
sudo systemctl restart nginx

# Edit Nginx config
sudo nano /etc/nginx/sites-available/sfmtl
```

### SSL Certificate Management

```bash
# Renew certificates manually
sudo certbot renew

# Test renewal (dry run)
sudo certbot renew --dry-run

# View certificate info
sudo certbot certificates

# Renew specific domain
sudo certbot renew --cert-name sfmtl.edgepoint.co.nz
```

Certificates auto-renew via systemd timer. Check status:
```bash
sudo systemctl status certbot.timer
```

## Updates

### Update Application

```bash
# Navigate to application directory
cd /opt/sfmtl

# Pull latest changes
sudo -u sfmtl git pull

# Install new dependencies
sudo -u sfmtl npm install

# Run database migrations
sudo -u sfmtl npx prisma migrate deploy

# Rebuild application
sudo -u sfmtl npm run build

# Restart service
sudo systemctl restart sfmtl

# Verify update
sudo systemctl status sfmtl
sudo journalctl -u sfmtl -f
```

### Update Script (automated)

Create an update script for easier updates:

```bash
#!/bin/bash
cd /opt/sfmtl
sudo -u sfmtl git pull
sudo -u sfmtl npm install
sudo -u sfmtl npx prisma migrate deploy
sudo -u sfmtl npm run build
sudo systemctl restart sfmtl
echo "Update complete!"
sudo systemctl status sfmtl
```

Save as `/opt/sfmtl/update.sh` and make executable:
```bash
chmod +x /opt/sfmtl/update.sh
```

## Troubleshooting

### Application Not Starting

```bash
# Check service status
sudo systemctl status sfmtl

# View error logs
sudo journalctl -u sfmtl -n 50

# Check if port is in use
sudo netstat -tulpn | grep 3000
sudo ss -tulpn | grep 3000

# Restart service
sudo systemctl restart sfmtl
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test database connection
sudo -u postgres psql -d sfmtl_finance -c "SELECT version();"

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 502 Bad Gateway Error

This means Nginx can't connect to the application:

```bash
# Check if application is running
sudo systemctl status sfmtl

# Check if app is listening on port 3000
sudo netstat -tulpn | grep 3000

# Restart both services
sudo systemctl restart sfmtl
sudo systemctl restart nginx

# Check logs
sudo journalctl -u sfmtl -f
tail -f /var/log/nginx/sfmtl.error.log
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Force renew
sudo certbot renew --force-renewal

# Check Nginx SSL configuration
sudo nginx -t

# View SSL error logs
tail -f /var/log/letsencrypt/letsencrypt.log
```

### High Memory Usage

```bash
# Check memory usage
free -h
htop

# Restart application
sudo systemctl restart sfmtl

# Check for memory leaks
sudo journalctl -u sfmtl | grep -i "memory\|heap"
```

### Disk Space Issues

```bash
# Check disk space
df -h

# Find large files
sudo du -sh /opt/sfmtl/*
sudo du -sh /var/log/*

# Clean up logs
sudo journalctl --vacuum-time=7d
sudo find /var/log -name "*.gz" -delete

# Clean npm cache
sudo -u sfmtl npm cache clean --force
```

## File Locations

| Item | Location |
|------|----------|
| Application | `/opt/sfmtl` |
| Configuration | `/opt/sfmtl/.env` |
| Deployment Info | `/opt/sfmtl/DEPLOYMENT_INFO.txt` |
| App Logs | `/var/log/sfmtl/` |
| Nginx Config | `/etc/nginx/sites-available/sfmtl` |
| Nginx Logs | `/var/log/nginx/sfmtl.*.log` |
| SSL Certificates | `/etc/letsencrypt/live/sfmtl.edgepoint.co.nz/` |
| Systemd Service | `/etc/systemd/system/sfmtl.service` |
| Uploads | `/opt/sfmtl/uploads/` |

## Security Best Practices

1. **Change Default Passwords**
   ```bash
   # After first login, change all default user passwords
   ```

2. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Configure Firewall**
   ```bash
   sudo ufw status
   sudo ufw allow 'Nginx Full'
   sudo ufw allow 'OpenSSH'
   sudo ufw enable
   ```

4. **Regular Backups**
   ```bash
   # Setup automated daily backups
   sudo crontab -e
   # Add: 0 2 * * * pg_dump -U postgres sfmtl_finance > /backups/sfmtl_$(date +\%Y\%m\%d).sql
   ```

5. **Monitor Logs**
   ```bash
   # Setup log monitoring with logwatch or similar tools
   sudo apt install logwatch
   ```

6. **SSL Certificate Monitoring**
   ```bash
   # Certificates auto-renew, but verify:
   sudo systemctl status certbot.timer
   ```

## Performance Optimization

### Enable HTTP/2

HTTP/2 is already enabled in the Nginx configuration. Verify:
```bash
curl -I https://sfmtl.edgepoint.co.nz | grep HTTP
```

### Enable Gzip Compression

Add to `/etc/nginx/nginx.conf`:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

Then reload:
```bash
sudo nginx -s reload
```

### Database Optimization

```bash
# Analyze database for optimization
sudo -u postgres psql -d sfmtl_finance -c "ANALYZE;"

# Vacuum database
sudo -u postgres psql -d sfmtl_finance -c "VACUUM ANALYZE;"
```

## Monitoring

### Setup Basic Monitoring

```bash
# Install htop for system monitoring
sudo apt install htop

# Install netdata for web-based monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
# Access at http://your-server-ip:19999
```

### Health Check Endpoint

The application provides a health check endpoint:
```bash
curl https://sfmtl.edgepoint.co.nz/api/health
```

## Uninstall

To completely remove the application:

```bash
# Stop and disable service
sudo systemctl stop sfmtl
sudo systemctl disable sfmtl
sudo rm /etc/systemd/system/sfmtl.service
sudo systemctl daemon-reload

# Remove Nginx configuration
sudo rm /etc/nginx/sites-enabled/sfmtl
sudo rm /etc/nginx/sites-available/sfmtl
sudo nginx -s reload

# Remove SSL certificate
sudo certbot delete --cert-name sfmtl.edgepoint.co.nz

# Remove database
sudo -u postgres psql -c "DROP DATABASE sfmtl_finance;"
sudo -u postgres psql -c "DROP USER sfmtl_user;"

# Remove application files
sudo rm -rf /opt/sfmtl
sudo rm -rf /var/log/sfmtl

# Remove user
sudo userdel -r sfmtl
```

## Support

For issues or questions:
- Check the troubleshooting section above
- Review application logs: `sudo journalctl -u sfmtl -f`
- Review Nginx logs: `tail -f /var/log/nginx/sfmtl.error.log`
- Check deployment info: `cat /opt/sfmtl/DEPLOYMENT_INFO.txt`

## License

Private - Edgepoint Limited
