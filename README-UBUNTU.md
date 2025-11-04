# SFMTL Finance App - Ubuntu Deployment Guide

Complete guide for deploying the SFMTL Finance Application on Ubuntu Server with external Nginx Proxy Manager.

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
- Clone the repository
- Configure the database
- Build and deploy the application
- Create systemd service for auto-start
- Open firewall port 3000

**Note:** This script does NOT install Nginx. You need to configure your external Nginx Proxy Manager to point to port 3000.

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
3. Create systemd service
4. Setup firewall rules (opens port 3000)

### Step 4: Configure External Nginx Proxy Manager

After deployment, configure your Nginx Proxy Manager:

1. **Add Proxy Host**:
   - Domain: `sfmtl.edgepoint.co.nz`
   - Scheme: `http`
   - Forward Hostname/IP: `localhost` (or server IP if remote)
   - Forward Port: `3000`

2. **Custom Nginx Configuration** (Advanced tab):
   ```nginx
   client_max_body_size 50M;
   proxy_set_header X-Forwarded-Proto $scheme;
   ```

3. **SSL Certificate**:
   - Request SSL certificate via Let's Encrypt
   - Enable Force SSL
   - Enable HTTP/2 Support

## Post-Deployment

### Verify Installation

```bash
# Check service status
sudo systemctl status sfmtl

# Check application logs
sudo journalctl -u sfmtl -f

# Test if app is running on port 3000
curl http://localhost:3000

# Test via domain (after configuring Nginx Proxy Manager)
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

### Nginx Proxy Manager

All reverse proxy and SSL management is handled by your external Nginx Proxy Manager.
For Nginx configuration, logs, and SSL certificates, please refer to your Nginx Proxy Manager documentation.

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

If you see 502 errors from your Nginx Proxy Manager:

```bash
# Check if application is running
sudo systemctl status sfmtl

# Check if app is listening on port 3000
sudo netstat -tulpn | grep 3000

# Restart application
sudo systemctl restart sfmtl

# Check logs
sudo journalctl -u sfmtl -f
tail -f /var/log/sfmtl/error.log
```

Verify your Nginx Proxy Manager configuration:
- Correct forward hostname/IP
- Forward port is 3000
- Proxy host is online

### SSL Certificate Issues

SSL certificates are managed by your external Nginx Proxy Manager.
Please refer to your Nginx Proxy Manager documentation for SSL troubleshooting.

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
   sudo ufw allow 3000/tcp
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
   - SSL certificates are managed by your external Nginx Proxy Manager
   - Ensure auto-renewal is configured in your Nginx Proxy Manager

## Performance Optimization

### Nginx Proxy Manager Settings

Configure these in your Nginx Proxy Manager for optimal performance:

1. **Enable HTTP/2** in SSL settings
2. **Enable Gzip Compression** (Custom Nginx Configuration):
   ```nginx
   gzip on;
   gzip_vary on;
   gzip_min_length 1024;
   gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
   ```
3. **Enable caching** for static assets

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

# Remove from Nginx Proxy Manager
# (Delete proxy host from your Nginx Proxy Manager interface)

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
- Review error logs: `tail -f /var/log/sfmtl/error.log`
- Check deployment info: `cat /opt/sfmtl/DEPLOYMENT_INFO.txt`
- Check your Nginx Proxy Manager logs for reverse proxy issues

## License

Private - Edgepoint Limited
