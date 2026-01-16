#############################################
# SFMTL Finance App - Windows Deployment Script
#############################################
# Automated deployment script for Windows Server
# Includes PostgreSQL, Node.js, Caddy reverse proxy

# Requires: PowerShell 5.1+ and Administrator privileges

#Requires -RunAsAdministrator

# Configuration
$SCRIPT_DIR = $PSScriptRoot
$GIT_REPO = "https://github.com/renelwllms/sfmtl01.git"
$INSTALL_DIR = "C:\apps\sfmtl"
$DOMAIN = "sfmtl.edgepoint.co.nz"
$APP_PORT = 3000
$DB_NAME = "sfmtl_finance"
$DB_USER = "postgres"
$EMAIL = "admin@edgepoint.co.nz"  # For SSL certificate

# Functions
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-ErrorMsg { Write-Host "[ERROR] $args" -ForegroundColor Red }

function Test-CommandExists {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function New-RandomPassword {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    $password = -join ((1..25) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    return $password
}

# Welcome
Clear-Host
Write-Host "============================================" -ForegroundColor Blue
Write-Host "  SFMTL Finance App - Windows Deployment   " -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""
Write-Info "This script will install and configure the complete application stack."
Write-Host ""
$continue = Read-Host "Press Enter to continue or Ctrl+C to cancel"

#############################################
# Step 1: Check Chocolatey
#############################################
Write-Info "Step 1: Checking Chocolatey package manager..."
if (-not (Test-CommandExists choco)) {
    Write-Info "Installing Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    refreshenv
    Write-Success "Chocolatey installed"
} else {
    Write-Warning "Chocolatey already installed"
}
Write-Host ""

#############################################
# Step 2: Install PostgreSQL
#############################################
Write-Info "Step 2: Checking PostgreSQL installation..."
if (-not (Test-CommandExists psql)) {
    Write-Info "Installing PostgreSQL 16..."
    choco install postgresql16 -y --params '/Password:PostgresPass123!'
    refreshenv
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Success "PostgreSQL installed"
} else {
    Write-Warning "PostgreSQL already installed"
}
Write-Host ""

#############################################
# Step 3: Install Node.js
#############################################
Write-Info "Step 3: Checking Node.js installation..."
if (-not (Test-CommandExists node)) {
    Write-Info "Installing Node.js 20..."
    choco install nodejs-lts -y --version=20.12.2
    refreshenv
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Success "Node.js installed"
} else {
    $nodeVersion = node --version
    Write-Warning "Node.js already installed: $nodeVersion"
}
Write-Host ""

#############################################
# Step 4: Install Git
#############################################
Write-Info "Step 4: Checking Git installation..."
if (-not (Test-CommandExists git)) {
    Write-Info "Installing Git..."
    choco install git -y
    refreshenv
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Success "Git installed"
} else {
    Write-Warning "Git already installed"
}
Write-Host ""

#############################################
# Step 5: Install Caddy
#############################################
Write-Info "Step 5: Checking Caddy installation..."
if (-not (Test-CommandExists caddy)) {
    Write-Info "Installing Caddy web server..."
    choco install caddy -y
    refreshenv
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Success "Caddy installed"
} else {
    Write-Warning "Caddy already installed"
}
Write-Host ""

#############################################
# Step 6: Clone Repository
#############################################
Write-Info "Step 6: Setting up application directory..."
if (Test-Path $INSTALL_DIR) {
    Write-Warning "Directory exists, pulling latest changes..."
    Set-Location $INSTALL_DIR
    git pull
} else {
    Write-Info "Creating directory: $INSTALL_DIR"
    New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
    Write-Info "Cloning repository..."
    git clone $GIT_REPO $INSTALL_DIR
    Set-Location $INSTALL_DIR
    Write-Success "Repository cloned"
}
Write-Host ""

#############################################
# Step 7: Setup Database
#############################################
Write-Info "Step 7: Setting up PostgreSQL database..."
$DB_PASSWORD = New-RandomPassword

# Set PostgreSQL service to run
Start-Service postgresql-x64-16 -ErrorAction SilentlyContinue

# Wait for PostgreSQL to start
Start-Sleep -Seconds 3

# Create database and user
$env:PGPASSWORD = "PostgresPass123!"
$createDbScript = @"
CREATE DATABASE $DB_NAME;
"@

$createDbScript | & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost

Write-Success "Database created"
Write-Host ""

#############################################
# Step 8: Create .env File
#############################################
Write-Info "Step 8: Creating environment configuration..."
$NEXTAUTH_SECRET = New-RandomPassword
$DATABASE_URL = "postgresql://${DB_USER}:PostgresPass123!@localhost:5432/${DB_NAME}"

$envContent = @"
# Database Configuration
DATABASE_URL="$DATABASE_URL"
DIRECT_URL="$DATABASE_URL"

# NextAuth Configuration
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# PostgreSQL Configuration (for reference)
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=PostgresPass123!
POSTGRES_DB=$DB_NAME
"@

$envContent | Out-File -FilePath "$INSTALL_DIR\.env" -Encoding UTF8
Write-Success "Environment configured"
Write-Host ""

#############################################
# Step 9: Install Dependencies
#############################################
Write-Info "Step 9: Installing Node.js dependencies..."
Set-Location $INSTALL_DIR
npm install
Write-Success "Dependencies installed"
Write-Host ""

#############################################
# Step 10: Run Database Migrations
#############################################
Write-Info "Step 10: Running database migrations..."
$env:DATABASE_URL = $DATABASE_URL
npx prisma migrate deploy
npx prisma db seed
Write-Success "Database initialized"
Write-Host ""

#############################################
# Step 11: Build Application
#############################################
Write-Info "Step 11: Building application..."
npm run build
Write-Success "Application built"
Write-Host ""

#############################################
# Step 12: Configure Caddy
#############################################
Write-Info "Step 12: Configuring Caddy reverse proxy..."
$caddyConfig = @"
{
    email $EMAIL
}

$DOMAIN {
    reverse_proxy localhost:$APP_PORT {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "no-referrer-when-downgrade"
        -Server
    }

    # Logging
    log {
        output file C:/apps/sfmtl/logs/caddy-access.log
        format json
    }

    # File upload size
    request_body {
        max_size 50MB
    }
}
"@

New-Item -ItemType Directory -Path "$INSTALL_DIR\logs" -Force | Out-Null
$caddyConfig | Out-File -FilePath "$INSTALL_DIR\Caddyfile" -Encoding UTF8
Write-Success "Caddy configured"
Write-Host ""

#############################################
# Step 13: Create Windows Services
#############################################
Write-Info "Step 13: Creating Windows services..."

# Install NSSM (Non-Sucking Service Manager)
if (-not (Test-CommandExists nssm)) {
    Write-Info "Installing NSSM..."
    choco install nssm -y
    refreshenv
}

# Create SFMTL App Service
Write-Info "Creating SFMTL application service..."
nssm install SFMTL "C:\Program Files\nodejs\node.exe"
nssm set SFMTL AppDirectory $INSTALL_DIR
nssm set SFMTL AppParameters "node_modules\.bin\next start"
nssm set SFMTL AppEnvironmentExtra "NODE_ENV=production" "PORT=$APP_PORT"
nssm set SFMTL DisplayName "SFMTL Finance Application"
nssm set SFMTL Description "SFMTL Finance Management System"
nssm set SFMTL Start SERVICE_AUTO_START
nssm set SFMTL AppStdout "$INSTALL_DIR\logs\app.log"
nssm set SFMTL AppStderr "$INSTALL_DIR\logs\error.log"
nssm set SFMTL AppRotateFiles 1
nssm set SFMTL AppRotateBytes 1048576

# Create Caddy Service
Write-Info "Creating Caddy service..."
nssm install SFMTLCaddy "C:\ProgramData\chocolatey\bin\caddy.exe"
nssm set SFMTLCaddy AppDirectory $INSTALL_DIR
nssm set SFMTLCaddy AppParameters "run --config $INSTALL_DIR\Caddyfile"
nssm set SFMTLCaddy DisplayName "SFMTL Caddy Web Server"
nssm set SFMTLCaddy Description "Caddy reverse proxy for SFMTL"
nssm set SFMTLCaddy Start SERVICE_AUTO_START
nssm set SFMTLCaddy AppStdout "$INSTALL_DIR\logs\caddy.log"
nssm set SFMTLCaddy AppStderr "$INSTALL_DIR\logs\caddy-error.log"

# Start services
Write-Info "Starting services..."
Start-Service SFMTL
Start-Service SFMTLCaddy

Write-Success "Services created and started"
Write-Host ""

#############################################
# Step 14: Configure Firewall
#############################################
Write-Info "Step 14: Configuring Windows Firewall..."
New-NetFirewallRule -DisplayName "SFMTL HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "SFMTL HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
Write-Success "Firewall configured"
Write-Host ""

#############################################
# Save Configuration
#############################################
$deploymentInfo = @"
SFMTL Finance App - Deployment Information
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Installation Directory: $INSTALL_DIR
Domain: https://$DOMAIN
Application Port: $APP_PORT

Database Configuration:
- Database: $DB_NAME
- User: $DB_USER
- Password: PostgresPass123!
- Connection: $DATABASE_URL

NextAuth Secret: $NEXTAUTH_SECRET

Default Login:
- Microsoft SSO only (users are created on first sign-in)

Service Management:
- Start App:     Start-Service SFMTL
- Stop App:      Stop-Service SFMTL
- Restart App:   Restart-Service SFMTL
- Start Caddy:   Start-Service SFMTLCaddy
- Stop Caddy:    Stop-Service SFMTLCaddy

Application Logs:
- App:   $INSTALL_DIR\logs\app.log
- Error: $INSTALL_DIR\logs\error.log
- Caddy: $INSTALL_DIR\logs\caddy.log

Update Application:
  cd $INSTALL_DIR
  git pull
  npm install
  npx prisma migrate deploy
  npm run build
  Restart-Service SFMTL

Database Management:
- GUI: npx prisma studio
- Backup: pg_dump -U $DB_USER $DB_NAME > backup.sql
- Restore: psql -U $DB_USER $DB_NAME < backup.sql

Service Configuration (using NSSM):
- Edit service: nssm edit SFMTL
- Remove service: nssm remove SFMTL confirm
"@

$deploymentInfo | Out-File -FilePath "$INSTALL_DIR\DEPLOYMENT_INFO.txt" -Encoding UTF8

#############################################
# Final Summary
#############################################
Clear-Host
Write-Host "============================================" -ForegroundColor Green
Write-Host "       DEPLOYMENT COMPLETED! 🎉" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Success "SFMTL Finance App successfully deployed!"
Write-Host ""
Write-Host "Domain: https://$DOMAIN" -ForegroundColor Cyan
Write-Host "Installation: $INSTALL_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services Status:" -ForegroundColor Yellow
Get-Service SFMTL, SFMTLCaddy | Format-Table -AutoSize
Write-Host ""
Write-Host "Default credentials saved to: $INSTALL_DIR\DEPLOYMENT_INFO.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Ensure DNS points $DOMAIN to this server" -ForegroundColor White
Write-Host "2. Caddy will automatically obtain SSL certificate from Let's Encrypt" -ForegroundColor White
Write-Host "3. Change default user passwords after first login" -ForegroundColor White
Write-Host "4. Monitor logs in: $INSTALL_DIR\logs\" -ForegroundColor White
Write-Host ""
Write-Success "Deployment complete!"
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
