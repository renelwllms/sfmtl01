#!/bin/bash

#############################################
# Samoa Finance App - Ubuntu Setup Script
#############################################
# This script automates the installation and setup process on Ubuntu
# It will install PostgreSQL, Node.js, clone the repo, and configure everything

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

#############################################
# Welcome Message
#############################################
clear
echo "============================================"
echo "  Samoa Finance App - Ubuntu Setup Script  "
echo "============================================"
echo ""
print_info "This script will install and configure everything needed to run the app."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

#############################################
# Step 1: Update System
#############################################
print_info "Step 1: Updating system packages..."
sudo apt-get update
print_success "System packages updated"
echo ""

#############################################
# Step 2: Install PostgreSQL
#############################################
print_info "Step 2: Checking PostgreSQL installation..."

if command_exists psql; then
    print_warning "PostgreSQL is already installed"
    POSTGRES_VERSION=$(psql --version | awk '{print $3}')
    print_info "Installed version: $POSTGRES_VERSION"
else
    print_info "Installing PostgreSQL..."
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    print_success "PostgreSQL installed and started"
fi
echo ""

#############################################
# Step 3: Install Node.js
#############################################
print_info "Step 3: Checking Node.js installation..."

if command_exists node; then
    NODE_VERSION=$(node --version)
    print_warning "Node.js is already installed: $NODE_VERSION"

    # Check if version is at least 20
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    if [ "$MAJOR_VERSION" -lt 20 ]; then
        print_warning "Node.js version is below 20. Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        print_success "Node.js 20 installed"
    fi
else
    print_info "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed"
fi

print_info "Node.js version: $(node --version)"
print_info "npm version: $(npm --version)"
echo ""

#############################################
# Step 4: Install Git
#############################################
print_info "Step 4: Checking Git installation..."

if command_exists git; then
    print_warning "Git is already installed: $(git --version)"
else
    print_info "Installing Git..."
    sudo apt-get install -y git
    print_success "Git installed"
fi
echo ""

#############################################
# Step 5: Gather Configuration Information
#############################################
print_info "Step 5: Configuration Setup"
echo "============================================"
echo ""

# Git repository URL
read -p "Enter the Git repository URL: " GIT_REPO_URL
while [ -z "$GIT_REPO_URL" ]; do
    print_error "Repository URL cannot be empty"
    read -p "Enter the Git repository URL: " GIT_REPO_URL
done

# Installation directory
read -p "Enter installation directory (default: $HOME/samoa-finance-app): " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-$HOME/samoa-finance-app}

echo ""
echo "--- Database Configuration ---"

# Database name
read -p "Enter PostgreSQL database name (default: samoa_finance): " DB_NAME
DB_NAME=${DB_NAME:-samoa_finance}

# Database user
read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

# Database password
read -sp "Enter PostgreSQL password (leave empty to generate): " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(generate_password)
    print_info "Generated database password: $DB_PASSWORD"
fi

# Database host
read -p "Enter PostgreSQL host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

# Database port
read -p "Enter PostgreSQL port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo "--- Application Configuration ---"

# NextAuth Secret
NEXTAUTH_SECRET=$(generate_password)
print_info "Generated NEXTAUTH_SECRET"

# Application URL
read -p "Enter application URL (default: http://localhost:3000): " APP_URL
APP_URL=${APP_URL:-http://localhost:3000}

# Application port
read -p "Enter application port (default: 3000): " APP_PORT
APP_PORT=${APP_PORT:-3000}

echo ""
echo "============================================"
echo "Configuration Summary:"
echo "============================================"
echo "Git Repository: $GIT_REPO_URL"
echo "Install Directory: $INSTALL_DIR"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Host: $DB_HOST"
echo "Database Port: $DB_PORT"
echo "Application URL: $APP_URL"
echo "Application Port: $APP_PORT"
echo "============================================"
echo ""
read -p "Is this configuration correct? (y/n): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    print_error "Setup cancelled by user"
    exit 1
fi
echo ""

#############################################
# Step 6: Clone Repository
#############################################
print_info "Step 6: Cloning repository..."

if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory $INSTALL_DIR already exists"
    read -p "Do you want to remove it and clone fresh? (y/n): " REMOVE_DIR
    if [[ "$REMOVE_DIR" =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
        print_info "Directory removed"
    else
        print_error "Setup cancelled. Please choose a different directory."
        exit 1
    fi
fi

print_info "Cloning from $GIT_REPO_URL..."
git clone "$GIT_REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"
print_success "Repository cloned successfully"
echo ""

#############################################
# Step 7: Setup PostgreSQL Database
#############################################
print_info "Step 7: Setting up PostgreSQL database..."

# Check if we're using the default postgres user
if [ "$DB_USER" = "postgres" ]; then
    print_info "Setting password for postgres user..."
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$DB_PASSWORD';"
else
    # Create new database user
    print_info "Creating database user: $DB_USER"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || print_warning "User might already exist"
fi

# Create database
print_info "Creating database: $DB_NAME"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || print_warning "Database might already exist"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

print_success "Database setup completed"
echo ""

#############################################
# Step 8: Create .env File
#############################################
print_info "Step 8: Creating .env file..."

DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

cat > "$INSTALL_DIR/.env" << EOF
# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL="$DATABASE_URL"
DIRECT_URL="$DATABASE_URL"

# ============================================
# DOCKER CONFIGURATION (for docker-compose)
# ============================================
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=$DB_NAME

# ============================================
# NEXTAUTH CONFIGURATION
# ============================================
NEXTAUTH_URL=$APP_URL
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
EOF

print_success ".env file created"
echo ""

#############################################
# Step 9: Install Dependencies
#############################################
print_info "Step 9: Installing Node.js dependencies..."
cd "$INSTALL_DIR"
npm install
print_success "Dependencies installed"
echo ""

#############################################
# Step 10: Run Database Migrations
#############################################
print_info "Step 10: Running database migrations..."
npx prisma migrate deploy
print_success "Database migrations completed"
echo ""

#############################################
# Step 11: Seed Database
#############################################
print_info "Step 11: Seeding database with default users..."
npx prisma db seed
print_success "Database seeded successfully"
echo ""

#############################################
# Step 12: Build Application
#############################################
print_info "Step 12: Building application..."
npm run build
print_success "Application built successfully"
echo ""

#############################################
# Step 13: Setup Systemd Service (Optional)
#############################################
print_info "Step 13: Setting up systemd service..."
read -p "Do you want to create a systemd service to run the app automatically? (y/n): " CREATE_SERVICE

if [[ "$CREATE_SERVICE" =~ ^[Yy]$ ]]; then
    SERVICE_FILE="/etc/systemd/system/samoa-finance.service"

    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Samoa Finance App
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable samoa-finance.service
    sudo systemctl start samoa-finance.service

    print_success "Systemd service created and started"
    print_info "Service status:"
    sudo systemctl status samoa-finance.service --no-pager
else
    print_info "Skipping systemd service creation"
fi
echo ""

#############################################
# Step 14: Setup UFW Firewall (Optional)
#############################################
print_info "Step 14: Firewall configuration..."
read -p "Do you want to configure UFW firewall to allow port $APP_PORT? (y/n): " CONFIGURE_FIREWALL

if [[ "$CONFIGURE_FIREWALL" =~ ^[Yy]$ ]]; then
    if command_exists ufw; then
        sudo ufw allow "$APP_PORT/tcp"
        print_success "Firewall rule added for port $APP_PORT"
    else
        print_warning "UFW not installed. Skipping firewall configuration."
    fi
fi
echo ""

#############################################
# Final Summary
#############################################
clear
echo "============================================"
echo "       INSTALLATION COMPLETED! 🎉"
echo "============================================"
echo ""
print_success "Samoa Finance App has been successfully installed and configured!"
echo ""
echo "--- Application Details ---"
echo "Installation Directory: $INSTALL_DIR"
echo "Application URL: $APP_URL"
echo ""
echo "--- Database Details ---"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password: $DB_PASSWORD"
echo "Connection String: $DATABASE_URL"
echo ""
echo "--- Default Login Credentials ---"
echo "Admin: admin@samoafinance.local / Admin@123"
echo "Staff: staff@samoafinance.local / Staff@123"
echo ""

if [[ "$CREATE_SERVICE" =~ ^[Yy]$ ]]; then
    echo "--- Service Management ---"
    echo "Start service:   sudo systemctl start samoa-finance"
    echo "Stop service:    sudo systemctl stop samoa-finance"
    echo "Restart service: sudo systemctl restart samoa-finance"
    echo "View logs:       sudo journalctl -u samoa-finance -f"
    echo "Service status:  sudo systemctl status samoa-finance"
    echo ""
    print_info "The application is now running as a service!"
else
    echo "--- Manual Start ---"
    echo "To start the application manually:"
    echo "  cd $INSTALL_DIR"
    echo "  npm start"
    echo ""
    echo "Or for development mode:"
    echo "  npm run dev"
    echo ""
fi

echo "--- Useful Commands ---"
echo "View database:   cd $INSTALL_DIR && npx prisma studio"
echo "View logs:       cd $INSTALL_DIR && npm run dev"
echo "Update app:      cd $INSTALL_DIR && git pull && npm install && npm run build"
echo ""
echo "--- Important Files ---"
echo "Environment config: $INSTALL_DIR/.env"
echo "Application logs:   $INSTALL_DIR/logs/ (if configured)"
echo ""
echo "============================================"
print_success "Setup complete! Visit $APP_URL to access the application."
echo "============================================"
echo ""

# Save configuration to a file for reference
cat > "$INSTALL_DIR/SETUP_INFO.txt" << EOF
Samoa Finance App - Installation Details
Generated: $(date)

Installation Directory: $INSTALL_DIR
Application URL: $APP_URL
Application Port: $APP_PORT

Database Configuration:
- Database Name: $DB_NAME
- Database User: $DB_USER
- Database Password: $DB_PASSWORD
- Database Host: $DB_HOST
- Database Port: $DB_PORT
- Connection String: $DATABASE_URL

Default Login Credentials:
- Admin: admin@samoafinance.local / Admin@123
- Staff: staff@samoafinance.local / Staff@123

NextAuth Secret: $NEXTAUTH_SECRET

Service Management (if installed):
- Start:   sudo systemctl start samoa-finance
- Stop:    sudo systemctl stop samoa-finance
- Restart: sudo systemctl restart samoa-finance
- Logs:    sudo journalctl -u samoa-finance -f
- Status:  sudo systemctl status samoa-finance

Manual Start:
- Production: cd $INSTALL_DIR && npm start
- Development: cd $INSTALL_DIR && npm run dev

Useful Commands:
- Database GUI: cd $INSTALL_DIR && npx prisma studio
- Update App: cd $INSTALL_DIR && git pull && npm install && npm run build
EOF

print_success "Configuration saved to: $INSTALL_DIR/SETUP_INFO.txt"
echo ""
