#!/bin/bash

#############################################
# SFMTL Finance App - Ubuntu Deployment Script
#############################################
# Automated deployment script for Ubuntu servers
# Includes PostgreSQL, Node.js, systemd service
# NOTE: Requires external Nginx Proxy Manager for reverse proxy and SSL

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

command_exists() { command -v "$1" >/dev/null 2>&1; }
generate_password() { openssl rand -base64 32 | tr -d "=+/" | cut -c1-25; }

# Configuration
GIT_REPO="https://github.com/renelwllms/sfmtl01.git"
INSTALL_DIR="/opt/sfmtl"
APP_USER="sfmtl"
DOMAIN="sfmtl.edgepoint.co.nz"
APP_PORT="3000"
DB_NAME="sfmtl_finance"
DB_USER="sfmtl_user"

clear
echo "============================================"
echo "  SFMTL Finance App - Ubuntu Deployment    "
echo "============================================"
echo ""
print_info "This script will install and configure the complete application stack."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

#############################################
# Step 1: Update System
#############################################
print_info "Step 1: Updating system packages..."
apt-get update
apt-get upgrade -y
print_success "System updated"
echo ""

#############################################
# Step 2: Install PostgreSQL
#############################################
print_info "Step 2: Installing PostgreSQL 16..."
if command_exists psql; then
    print_warning "PostgreSQL already installed: $(psql --version)"
else
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    print_success "PostgreSQL installed"
fi
echo ""

#############################################
# Step 3: Install Node.js 20
#############################################
print_info "Step 3: Installing Node.js 20..."
if command_exists node; then
    NODE_VERSION=$(node --version | cut -d'.' -f1 | tr -d 'v')
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_warning "Upgrading Node.js to version 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    else
        print_warning "Node.js already installed: $(node --version)"
    fi
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    print_success "Node.js installed"
fi
print_info "Node.js: $(node --version), npm: $(npm --version)"
echo ""

#############################################
# Step 4: Create Application User
#############################################
print_info "Step 4: Creating application user..."
if id "$APP_USER" &>/dev/null; then
    print_warning "User $APP_USER already exists"
else
    useradd -r -m -s /bin/bash -d /home/$APP_USER $APP_USER
    print_success "User $APP_USER created"
fi
echo ""

#############################################
# Step 5: Clone Repository
#############################################
print_info "Step 5: Cloning repository..."
if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory exists, pulling latest changes..."
    cd "$INSTALL_DIR"
    sudo -u $APP_USER git pull
else
    mkdir -p "$INSTALL_DIR"
    git clone "$GIT_REPO" "$INSTALL_DIR"
    chown -R $APP_USER:$APP_USER "$INSTALL_DIR"
    print_success "Repository cloned"
fi
cd "$INSTALL_DIR"
echo ""

#############################################
# Step 6: Setup Database
#############################################
print_info "Step 6: Setting up PostgreSQL database..."
DB_PASSWORD=$(generate_password)

sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || print_warning "User may already exist"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || print_warning "Database may already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

print_success "Database configured"
echo ""

#############################################
# Step 7: Create .env File
#############################################
print_info "Step 7: Creating environment configuration..."
NEXTAUTH_SECRET=$(generate_password)
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

cat > "$INSTALL_DIR/.env" << EOF
# Database Configuration
DATABASE_URL="$DATABASE_URL"
DIRECT_URL="$DATABASE_URL"

# NextAuth Configuration
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# PostgreSQL Configuration
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=$DB_NAME
EOF

chown $APP_USER:$APP_USER "$INSTALL_DIR/.env"
chmod 600 "$INSTALL_DIR/.env"
print_success "Environment configured"
echo ""

#############################################
# Step 8: Install Dependencies
#############################################
print_info "Step 8: Installing Node.js dependencies..."
sudo -u $APP_USER npm install
print_success "Dependencies installed"
echo ""

#############################################
# Step 9: Run Database Migrations
#############################################
print_info "Step 9: Running database migrations..."
sudo -u $APP_USER npx prisma migrate deploy
sudo -u $APP_USER npx prisma db seed
print_success "Database initialized"
echo ""

#############################################
# Step 10: Build Application
#############################################
print_info "Step 10: Building application..."
sudo -u $APP_USER npm run build
print_success "Application built"
echo ""

#############################################
# Step 11: Setup Systemd Service
#############################################
print_info "Step 11: Creating systemd service..."
cat > /etc/systemd/system/sfmtl.service << EOF
[Unit]
Description=SFMTL Finance Application
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=append:/var/log/sfmtl/app.log
StandardError=append:/var/log/sfmtl/error.log

[Install]
WantedBy=multi-user.target
EOF

mkdir -p /var/log/sfmtl
chown $APP_USER:$APP_USER /var/log/sfmtl

systemctl daemon-reload
systemctl enable sfmtl.service
systemctl start sfmtl.service
print_success "Service created and started"
echo ""

#############################################
# Step 12: Configure Firewall
#############################################
print_info "Step 12: Configuring firewall..."
if command_exists ufw; then
    ufw --force enable
    ufw allow $APP_PORT/tcp
    ufw allow 'OpenSSH'
    print_success "Firewall configured (port $APP_PORT open)"
else
    print_warning "UFW not installed, skipping firewall configuration"
fi
echo ""

#############################################
# Save Configuration
#############################################
cat > "$INSTALL_DIR/DEPLOYMENT_INFO.txt" << EOF
SFMTL Finance App - Deployment Information
Generated: $(date)

Installation Directory: $INSTALL_DIR
Application Port: $APP_PORT (Configure your external Nginx Proxy Manager to point to this port)
Domain: $DOMAIN

Database Configuration:
- Database: $DB_NAME
- User: $DB_USER
- Password: $DB_PASSWORD
- Connection: $DATABASE_URL

NextAuth Secret: $NEXTAUTH_SECRET

Default Login Credentials:
- Admin: admin@samoafinance.local / Admin@123
- Staff: staff@samoafinance.local / Staff@123

⚠️  REVERSE PROXY CONFIGURATION REQUIRED:
Configure your external Nginx Proxy Manager to:
- Point to: http://localhost:$APP_PORT
- Set up SSL certificate for: $DOMAIN
- Forward headers: Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto
- Max body size: 50M (for file uploads)

Service Management:
- Start:   sudo systemctl start sfmtl
- Stop:    sudo systemctl stop sfmtl
- Restart: sudo systemctl restart sfmtl
- Status:  sudo systemctl status sfmtl
- Logs:    sudo journalctl -u sfmtl -f

Application Logs:
- App:   /var/log/sfmtl/app.log
- Error: /var/log/sfmtl/error.log

Update Application:
  cd $INSTALL_DIR
  sudo -u $APP_USER git pull
  sudo -u $APP_USER npm install
  sudo -u $APP_USER npx prisma migrate deploy
  sudo -u $APP_USER npm run build
  sudo systemctl restart sfmtl

Database Management:
- GUI: sudo -u $APP_USER npx prisma studio
- Backup: pg_dump -U $DB_USER $DB_NAME > backup.sql
- Restore: psql -U $DB_USER $DB_NAME < backup.sql
EOF

chown $APP_USER:$APP_USER "$INSTALL_DIR/DEPLOYMENT_INFO.txt"

#############################################
# Final Summary
#############################################
clear
echo "============================================"
echo "       DEPLOYMENT COMPLETED! 🎉"
echo "============================================"
echo ""
print_success "SFMTL Finance App successfully deployed!"
echo ""
echo "Application running on: http://localhost:$APP_PORT"
echo "Status: sudo systemctl status sfmtl"
echo "Logs: sudo journalctl -u sfmtl -f"
echo ""
echo "Default credentials saved to: $INSTALL_DIR/DEPLOYMENT_INFO.txt"
echo ""
print_warning "⚠️  IMPORTANT - Configure External Nginx Proxy Manager:"
echo "1. Point your Nginx Proxy Manager to: http://localhost:$APP_PORT"
echo "2. Configure domain: $DOMAIN"
echo "3. Set up SSL certificate in your Nginx Proxy Manager"
echo "4. Forward required headers (Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)"
echo "5. Set client_max_body_size to 50M for file uploads"
echo ""
echo "After configuring proxy:"
echo "1. Change default user passwords after first login"
echo "2. Verify application is accessible at: https://$DOMAIN"
echo ""
print_success "Deployment complete!"
echo "============================================"
