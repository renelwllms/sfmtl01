# SFMTL Finance App - Windows Deployment Guide

Complete guide for deploying the SFMTL Finance Application on Windows Server with Caddy reverse proxy and automatic SSL.

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

Open PowerShell as Administrator and run:

```powershell
# Download and run deployment script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/renelwllms/sfmtl01/main/deploy-windows.ps1" -OutFile "$env:TEMP\deploy-windows.ps1"
Set-ExecutionPolicy Bypass -Scope Process -Force
& "$env:TEMP\deploy-windows.ps1"
```

The script will automatically:
- Install Chocolatey package manager
- Install PostgreSQL 16
- Install Node.js 20
- Install Caddy web server
- Install Git and NSSM
- Clone the repository to `C:\apps\sfmtl`
- Configure the database
- Build and deploy the application
- Create Windows services for auto-start
- Configure Caddy for automatic SSL

## Prerequisites

- **Windows Server**: 2019 or newer (2022 recommended)
- **Windows 10/11**: Pro or Enterprise (for development)
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: Minimum 20GB free on C: drive
- **Administrator**: PowerShell with admin privileges
- **Domain**: DNS record pointing to server IP
- **Ports**: 80 (HTTP) and 443 (HTTPS) open in firewall

## Deployment Steps

### Step 1: Prepare Windows Server

Open PowerShell as Administrator:

```powershell
# Enable script execution
Set-ExecutionPolicy RemoteSigned -Force

# Install Windows Updates
Install-Module PSWindowsUpdate -Force
Get-WindowsUpdate
Install-WindowsUpdate -AcceptAll
```

### Step 2: Configure DNS

Before deployment, ensure your DNS is configured:
- Point `sfmtl.edgepoint.co.nz` to your server's public IP
- Verify DNS propagation using:

```powershell
nslookup sfmtl.edgepoint.co.nz
Resolve-DnsName sfmtl.edgepoint.co.nz
```

### Step 3: Download Deployment Script

```powershell
# Download script
$scriptUrl = "https://raw.githubusercontent.com/renelwllms/sfmtl01/main/deploy-windows.ps1"
Invoke-WebRequest -Uri $scriptUrl -OutFile "C:\deploy-windows.ps1"

# Review script (optional but recommended)
notepad C:\deploy-windows.ps1
```

### Step 4: Run Deployment Script

```powershell
# Run as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
C:\deploy-windows.ps1
```

The script will:
1. Install Chocolatey package manager
2. Install PostgreSQL, Node.js, Git
3. Install Caddy web server
4. Install NSSM (service manager)
5. Clone repository to C:\apps\sfmtl
6. Setup PostgreSQL database
7. Configure environment variables
8. Install dependencies and build app
9. Create Windows services
10. Configure firewall rules

### Step 5: Verify SSL

Caddy automatically obtains SSL certificates from Let's Encrypt. Verify:

```powershell
# Check Caddy logs
Get-Content C:\apps\sfmtl\logs\caddy.log -Tail 50

# Test SSL in browser
Start-Process "https://sfmtl.edgepoint.co.nz"
```

## Post-Deployment

### Verify Installation

```powershell
# Check service status
Get-Service SFMTL, SFMTLCaddy | Format-Table -AutoSize

# View application logs
Get-Content C:\apps\sfmtl\logs\app.log -Tail 50 -Wait

# Test application
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
```

### Access Application

Open your browser and navigate to:
```
https://sfmtl.edgepoint.co.nz
```

### Default Login Credentials

| Role  | Email                       | Password  |
|-------|----------------------------|-----------|
| Admin | admin@samoafinance.local   | Admin@123 |
| Staff | staff@samoafinance.local   | Staff@123 |

**⚠️ IMPORTANT:** Change these passwords immediately after first login!

### Deployment Information

All configuration details are saved in:
```
C:\apps\sfmtl\DEPLOYMENT_INFO.txt
```

This file contains:
- Database credentials
- NextAuth secret
- Service management commands
- Log file locations

## Management

### Service Management

```powershell
# Start application
Start-Service SFMTL

# Stop application
Stop-Service SFMTL

# Restart application
Restart-Service SFMTL

# Check status
Get-Service SFMTL | Format-List

# Start Caddy
Start-Service SFMTLCaddy

# Stop Caddy
Stop-Service SFMTLCaddy

# Check all SFMTL services
Get-Service SFMTL* | Format-Table -AutoSize
```

### Service Configuration with NSSM

```powershell
# Edit application service
nssm edit SFMTL

# Edit Caddy service
nssm edit SFMTLCaddy

# View service status
nssm status SFMTL
nssm status SFMTLCaddy

# Restart services
nssm restart SFMTL
nssm restart SFMTLCaddy
```

### View Logs

```powershell
# Application logs (real-time)
Get-Content C:\apps\sfmtl\logs\app.log -Tail 50 -Wait

# Error logs
Get-Content C:\apps\sfmtl\logs\error.log -Tail 50 -Wait

# Caddy logs
Get-Content C:\apps\sfmtl\logs\caddy.log -Tail 50 -Wait

# View last 100 lines
Get-Content C:\apps\sfmtl\logs\app.log -Tail 100

# Search logs for errors
Select-String -Path C:\apps\sfmtl\logs\*.log -Pattern "error" -CaseSensitive:$false
```

### Database Management

```powershell
# Access database (update path if different)
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d sfmtl_finance

# Create backup
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres sfmtl_finance > "C:\backups\sfmtl_$(Get-Date -Format 'yyyyMMdd').sql"

# Restore from backup
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d sfmtl_finance -f "C:\backups\sfmtl_20250129.sql"

# Open Prisma Studio (Database GUI)
cd C:\apps\sfmtl
npx prisma studio
# Access at http://localhost:5555
```

### Caddy Management

```powershell
# Test Caddy configuration
cd C:\apps\sfmtl
caddy validate --config Caddyfile

# Reload Caddy configuration
Restart-Service SFMTLCaddy

# View Caddy version
caddy version

# Check SSL certificate
caddy list-modules | Select-String -Pattern "tls"
```

### Firewall Management

```powershell
# Check firewall rules
Get-NetFirewallRule -DisplayName "SFMTL*" | Format-Table -AutoSize

# View firewall rule details
Get-NetFirewallRule -DisplayName "SFMTL HTTP" | Format-List

# Temporarily disable rule
Disable-NetFirewallRule -DisplayName "SFMTL HTTP"

# Re-enable rule
Enable-NetFirewallRule -DisplayName "SFMTL HTTP"
```

## Updates

### Update Application

```powershell
# Navigate to application directory
cd C:\apps\sfmtl

# Stop service
Stop-Service SFMTL

# Pull latest changes
git pull

# Install new dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Rebuild application
npm run build

# Start service
Start-Service SFMTL

# Verify update
Get-Service SFMTL
Get-Content C:\apps\sfmtl\logs\app.log -Tail 20
```

### Update Script (PowerShell)

Create an update script for easier updates:

```powershell
# Save as C:\apps\sfmtl\update.ps1
cd C:\apps\sfmtl
Stop-Service SFMTL
git pull
npm install
npx prisma migrate deploy
npm run build
Start-Service SFMTL
Write-Host "Update complete!" -ForegroundColor Green
Get-Service SFMTL | Format-List
Get-Content C:\apps\sfmtl\logs\app.log -Tail 20
```

Run the update script:
```powershell
powershell -ExecutionPolicy Bypass -File C:\apps\sfmtl\update.ps1
```

### Scheduled Updates (Optional)

Create a scheduled task for automatic updates:

```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\apps\sfmtl\update.ps1"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -TaskName "SFMTL Auto Update" -Description "Weekly update of SFMTL application"
```

## Troubleshooting

### Application Not Starting

```powershell
# Check service status
Get-Service SFMTL | Format-List

# View error logs
Get-Content C:\apps\sfmtl\logs\error.log -Tail 50

# Check if port is in use
netstat -ano | findstr :3000
Get-NetTCPConnection -LocalPort 3000

# Restart service
Restart-Service SFMTL

# Check event log
Get-EventLog -LogName Application -Source SFMTL -Newest 20
```

### Database Connection Issues

```powershell
# Check PostgreSQL service
Get-Service postgresql-x64-16

# Start PostgreSQL if stopped
Start-Service postgresql-x64-16

# Test database connection
$env:PGPASSWORD="PostgresPass123!"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d sfmtl_finance -c "SELECT version();"

# Check PostgreSQL logs
Get-Content "C:\Program Files\PostgreSQL\16\data\log\*" -Tail 50
```

### Caddy Issues (502/503 Errors)

```powershell
# Check if application is running
Get-Service SFMTL

# Check if app is listening on port 3000
Test-NetConnection -ComputerName localhost -Port 3000

# Restart services
Restart-Service SFMTL
Restart-Service SFMTLCaddy

# Check Caddy logs
Get-Content C:\apps\sfmtl\logs\caddy-error.log -Tail 50

# Test Caddy configuration
cd C:\apps\sfmtl
caddy validate --config Caddyfile
```

### SSL Certificate Issues

```powershell
# Check Caddy logs for SSL errors
Get-Content C:\apps\sfmtl\logs\caddy.log | Select-String -Pattern "certificate|ssl|tls"

# Verify domain points to server
nslookup sfmtl.edgepoint.co.nz

# Check firewall allows HTTPS
Get-NetFirewallRule -DisplayName "SFMTL HTTPS" | Format-List

# Restart Caddy to retry certificate
Restart-Service SFMTLCaddy
Start-Sleep -Seconds 10
Get-Content C:\apps\sfmtl\logs\caddy.log -Tail 30
```

### High Memory Usage

```powershell
# Check process memory usage
Get-Process node | Sort-Object WorkingSet -Descending | Select-Object -First 5

# Check system memory
Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory, TotalVisibleMemorySize

# Restart application
Restart-Service SFMTL

# Monitor memory usage
while($true) {
    Get-Process node | Select-Object Name, @{Name="Memory(MB)";Expression={$_.WorkingSet/1MB}} | Format-Table
    Start-Sleep -Seconds 5
}
```

### Disk Space Issues

```powershell
# Check disk space
Get-PSDrive C | Select-Object Used, Free

# Find large files in app directory
Get-ChildItem C:\apps\sfmtl -Recurse | Sort-Object Length -Descending | Select-Object -First 20 FullName, @{Name="Size(MB)";Expression={$_.Length/1MB}}

# Clean up log files older than 30 days
Get-ChildItem C:\apps\sfmtl\logs\*.log | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item

# Clean npm cache
npm cache clean --force

# Clean temp files
Remove-Item $env:TEMP\* -Recurse -Force -ErrorAction SilentlyContinue
```

### Port Already in Use

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Get process details
Get-Process -Id <PID>

# Kill process (replace <PID> with actual process ID)
Stop-Process -Id <PID> -Force

# Restart SFMTL service
Start-Service SFMTL
```

## File Locations

| Item | Location |
|------|----------|
| Application | `C:\apps\sfmtl` |
| Configuration | `C:\apps\sfmtl\.env` |
| Deployment Info | `C:\apps\sfmtl\DEPLOYMENT_INFO.txt` |
| Application Logs | `C:\apps\sfmtl\logs\app.log` |
| Error Logs | `C:\apps\sfmtl\logs\error.log` |
| Caddy Config | `C:\apps\sfmtl\Caddyfile` |
| Caddy Logs | `C:\apps\sfmtl\logs\caddy.log` |
| PostgreSQL Data | `C:\Program Files\PostgreSQL\16\data` |
| PostgreSQL Logs | `C:\Program Files\PostgreSQL\16\data\log` |
| Uploads | `C:\apps\sfmtl\uploads` |

## Security Best Practices

### 1. Change Default Passwords

```powershell
# Change PostgreSQL password
$env:PGPASSWORD="PostgresPass123!"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD 'NewSecurePassword123!';"
```

### 2. Configure Windows Firewall

```powershell
# Review firewall rules
Get-NetFirewallRule -DisplayName "SFMTL*"

# Block all except necessary ports
Set-NetFirewallProfile -DefaultInboundAction Block
```

### 3. Regular Backups

Setup automated daily backups:

```powershell
# Create backup script
$backupScript = @"
`$date = Get-Date -Format 'yyyyMMdd'
`$backupPath = "C:\backups\sfmtl_`$date.sql"
`$env:PGPASSWORD="PostgresPass123!"
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres sfmtl_finance > `$backupPath
Write-Host "Backup created: `$backupPath"
"@

$backupScript | Out-File -FilePath C:\apps\sfmtl\backup.ps1

# Schedule daily backup at 2 AM
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\apps\sfmtl\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -TaskName "SFMTL Daily Backup"
```

### 4. Keep System Updated

```powershell
# Install Windows updates
Install-Module PSWindowsUpdate -Force
Get-WindowsUpdate
Install-WindowsUpdate -AcceptAll -AutoReboot

# Update Chocolatey packages
choco upgrade all -y
```

### 5. Monitor Logs

```powershell
# Create log monitoring script
$monitorScript = @"
`$errors = Select-String -Path C:\apps\sfmtl\logs\*.log -Pattern "error|exception|failed" -CaseSensitive:`$false
if (`$errors) {
    Send-MailMessage -To "admin@edgepoint.co.nz" -From "sfmtl@edgepoint.co.nz" -Subject "SFMTL Errors Detected" -Body (`$errors | Out-String) -SmtpServer "smtp.example.com"
}
"@

$monitorScript | Out-File -FilePath C:\apps\sfmtl\monitor.ps1
```

## Performance Optimization

### Enable Windows Performance Features

```powershell
# Disable unnecessary services
Get-Service | Where-Object {$_.StartType -eq "Automatic" -and $_.Status -eq "Running"} | Out-GridView -PassThru | Stop-Service

# Optimize power settings
powercfg -setactive SCHEME_MIN  # High Performance

# Disable hibernation (saves disk space)
powercfg -h off
```

### Database Optimization

```powershell
# Analyze and vacuum database
$env:PGPASSWORD="PostgresPass123!"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d sfmtl_finance -c "ANALYZE;"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d sfmtl_finance -c "VACUUM ANALYZE;"
```

### Caddy Optimization

Caddy automatically handles HTTP/2 and compression. Verify:

```powershell
# Check Caddy configuration
Get-Content C:\apps\sfmtl\Caddyfile
```

## Monitoring

### Basic Monitoring

```powershell
# Create monitoring dashboard script
while ($true) {
    Clear-Host
    Write-Host "SFMTL System Monitor" -ForegroundColor Green
    Write-Host "===================="
    Write-Host ""

    # Service status
    Write-Host "Services:" -ForegroundColor Yellow
    Get-Service SFMTL, SFMTLCaddy | Format-Table -AutoSize

    # Memory usage
    Write-Host "Memory Usage:" -ForegroundColor Yellow
    Get-Process node | Select-Object Name, @{Name="Memory(MB)";Expression={$_.WorkingSet/1MB}} | Format-Table

    # CPU usage
    Write-Host "CPU Usage:" -ForegroundColor Yellow
    Get-Counter '\Processor(_Total)\% Processor Time' | Select-Object -ExpandProperty CounterSamples | Format-Table

    # Disk space
    Write-Host "Disk Space:" -ForegroundColor Yellow
    Get-PSDrive C | Format-Table

    Start-Sleep -Seconds 5
}
```

### Event Log Monitoring

```powershell
# View application events
Get-EventLog -LogName Application -After (Get-Date).AddHours(-1) | Where-Object {$_.Source -like "*SFMTL*"}

# Create event log alert
$query = "*[System[Provider[@Name='SFMTL'] and (Level=1 or Level=2)]]"
Register-WmiEvent -Query "SELECT * FROM __InstanceCreationEvent WHERE TargetInstance ISA 'Win32_NTLogEvent'" -SourceIdentifier "SFMTLAlert"
```

## Uninstall

To completely remove the application:

```powershell
# Stop services
Stop-Service SFMTL, SFMTLCaddy

# Remove services
nssm remove SFMTL confirm
nssm remove SFMTLCaddy confirm

# Remove firewall rules
Remove-NetFirewallRule -DisplayName "SFMTL HTTP"
Remove-NetFirewallRule -DisplayName "SFMTL HTTPS"

# Drop database
$env:PGPASSWORD="PostgresPass123!"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "DROP DATABASE sfmtl_finance;"

# Remove application files
Remove-Item -Path C:\apps\sfmtl -Recurse -Force

# Optionally uninstall software (if not needed for other apps)
choco uninstall postgresql16 nodejs-lts caddy nssm git -y
```

## Support

For issues or questions:
- Check the troubleshooting section above
- Review application logs: `Get-Content C:\apps\sfmtl\logs\app.log -Tail 50 -Wait`
- Review Caddy logs: `Get-Content C:\apps\sfmtl\logs\caddy.log -Tail 50`
- Check deployment info: `Get-Content C:\apps\sfmtl\DEPLOYMENT_INFO.txt`

## License

Private - Edgepoint Limited
