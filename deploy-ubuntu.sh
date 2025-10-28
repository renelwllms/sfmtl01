#!/bin/bash

#############################################
# SFMTL Finance App - Ubuntu Deployment Script
#############################################
# Automated deployment script for Ubuntu servers
# Includes PostgreSQL, Node.js, Nginx, SSL setup

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
# Step 4: Install Nginx
#############################################
print_info "Step 4: Installing Nginx..."
if command_exists nginx; then
    print_warning "Nginx already installed"
else
    apt-get install -y nginx
    systemctl enable nginx
    print_success "Nginx installed"
fi
echo ""

#############################################
# Step 5: Install Certbot for SSL
#############################################
print_info "Step 5: Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx
print_success "Certbot installed"
echo ""

#############################################
# Step 6: Create Application User
#############################################
print_info "Step 6: Creating application user..."
if id "$APP_USER" &>/dev/null; then
    print_warning "User $APP_USER already exists"
else
    useradd -r -m -s /bin/bash -d /home/$APP_USER $APP_USER
    print_success "User $APP_USER created"
fi
echo ""

#############################################
# Step 7: Clone Repository
#############################################
print_info "Step 7: Cloning repository..."
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
# Step 8: Setup Database
#############################################
print_info "Step 8: Setting up PostgreSQL database..."
DB_PASSWORD=$(generate_password)

sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || print_warning "User may already exist"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || print_warning "Database may already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

print_success "Database configured"
echo ""

#############################################
# Step 9: Create .env File
#############################################
print_info "Step 9: Creating environment configuration..."
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
# Step 10: Install Dependencies
#############################################
print_info "Step 10: Installing Node.js dependencies..."
sudo -u $APP_USER npm install
print_success "Dependencies installed"
echo ""

#############################################
# Step 11: Run Database Migrations
#############################################
print_info "Step 11: Running database migrations..."
sudo -u $APP_USER npx prisma migrate deploy
sudo -u $APP_USER npx prisma db seed
print_success "Database initialized"
echo ""

#############################################
# Step 12: Build Application
#############################################
print_info "Step 12: Building application..."
sudo -u $APP_USER npm run build
print_success "Application built"
echo ""

#############################################
# Step 13: Configure Nginx
#############################################
print_info "Step 13: Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/sfmtl << EOF
# HTTP - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    # SSL certificates (managed by Certbot)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/sfmtl.access.log;
    error_log /var/log/nginx/sfmtl.error.log;

    # Client settings
    client_max_body_size 50M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Standard headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_cache_bypass \$http_upgrade;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$APP_PORT;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/sfmtl /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
print_success "Nginx configured"
echo ""

#############################################
# Step 14: Setup Systemd Service
#############################################
print_info "Step 14: Creating systemd service..."
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
# Step 15: Configure Firewall
#############################################
print_info "Step 15: Configuring firewall..."
if command_exists ufw; then
    ufw --force enable
    ufw allow 'Nginx Full'
    ufw allow 'OpenSSH'
    print_success "Firewall configured"
else
    print_warning "UFW not installed, skipping firewall configuration"
fi
echo ""

#############################################
# Step 16: SSL Certificate
#############################################
print_info "Step 16: SSL Certificate Setup"
echo "To complete SSL setup, run:"
echo "  sudo certbot --nginx -d $DOMAIN"
echo ""
read -p "Do you want to set up SSL now? (y/n): " SETUP_SSL

if [[ "$SETUP_SSL" =~ ^[Yy]$ ]]; then
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email || print_warning "SSL setup failed. Run manually: sudo certbot --nginx -d $DOMAIN"
fi
echo ""

#############################################
# Save Configuration
#############################################
cat > "$INSTALL_DIR/DEPLOYMENT_INFO.txt" << EOF
SFMTL Finance App - Deployment Information
Generated: $(date)

Installation Directory: $INSTALL_DIR
Domain: https://$DOMAIN
Application Port: $APP_PORT

Database Configuration:
- Database: $DB_NAME
- User: $DB_USER
- Password: $DB_PASSWORD
- Connection: $DATABASE_URL

NextAuth Secret: $NEXTAUTH_SECRET

Default Login Credentials:
- Admin: admin@samoafinance.local / Admin@123
- Staff: staff@samoafinance.local / Staff@123

Service Management:
- Start:   sudo systemctl start sfmtl
- Stop:    sudo systemctl stop sfmtl
- Restart: sudo systemctl restart sfmtl
- Status:  sudo systemctl status sfmtl
- Logs:    sudo journalctl -u sfmtl -f

Application Logs:
- App:   /var/log/sfmtl/app.log
- Error: /var/log/sfmtl/error.log
- Nginx: /var/log/nginx/sfmtl.access.log

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
echo "Domain: https://$DOMAIN"
echo "Status: sudo systemctl status sfmtl"
echo "Logs: sudo journalctl -u sfmtl -f"
echo ""
echo "Default credentials saved to: $INSTALL_DIR/DEPLOYMENT_INFO.txt"
echo ""
echo "Next steps:"
echo "1. Ensure DNS points $DOMAIN to this server"
echo "2. Complete SSL setup if not done: sudo certbot --nginx -d $DOMAIN"
echo "3. Change default user passwords after first login"
echo ""
print_success "Deployment complete!"
echo "============================================"
