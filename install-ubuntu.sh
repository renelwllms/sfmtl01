#!/bin/bash

# ============================================
# SAMOA FINANCE APP - UBUNTU INSTALLATION SCRIPT
# ============================================
# This script will:
# 1. Check and install required dependencies (Node.js, npm, PostgreSQL client)
# 2. Install the app to /sfmtl
# 3. Set up environment variables
# 4. Build the application
# 5. Create a systemd service for auto-start
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/sfmtl"
SERVICE_NAME="samoa-finance"
APP_PORT=3000
NODE_VERSION="22"  # LTS version (matches development environment)

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}SAMOA FINANCE APP - Ubuntu Installation${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Function to print status messages
print_status() {
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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root or with sudo"
    exit 1
fi

# Update package lists
print_status "Updating package lists..."
apt-get update -qq

# ============================================
# CHECK AND INSTALL NODE.JS
# ============================================
print_status "Checking Node.js installation..."

if command -v node &> /dev/null; then
    NODE_CURRENT_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    print_success "Node.js is already installed (version $(node -v))"

    if [ "$NODE_CURRENT_VERSION" -lt "$NODE_VERSION" ]; then
        print_warning "Your Node.js version is older than recommended (v${NODE_VERSION}.x)"
        read -p "Do you want to upgrade to Node.js v${NODE_VERSION}.x? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            INSTALL_NODE=true
        else
            INSTALL_NODE=false
        fi
    else
        INSTALL_NODE=false
    fi
else
    print_warning "Node.js is not installed"
    INSTALL_NODE=true
fi

if [ "$INSTALL_NODE" = true ]; then
    print_status "Installing Node.js v${NODE_VERSION}.x..."

    # Remove old NodeSource repo if exists
    rm -f /etc/apt/sources.list.d/nodesource.list

    # Install Node.js using NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs

    print_success "Node.js $(node -v) installed successfully"
fi

# Verify npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Installing..."
    apt-get install -y npm
fi
print_success "npm $(npm -v) is available"

# ============================================
# CHECK AND INSTALL POSTGRESQL CLIENT
# ============================================
print_status "Checking PostgreSQL client tools..."

if command -v psql &> /dev/null; then
    print_success "PostgreSQL client is already installed (version $(psql --version))"
else
    print_warning "PostgreSQL client is not installed"
    read -p "Do you want to install PostgreSQL client tools? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Installing PostgreSQL client..."
        apt-get install -y postgresql-client
        print_success "PostgreSQL client installed successfully"
    else
        print_warning "Skipping PostgreSQL client installation. You can configure the database later in Settings."
    fi
fi

# ============================================
# CHECK AND INSTALL OTHER DEPENDENCIES
# ============================================
print_status "Checking other dependencies..."

# Install build essentials for native modules
if ! dpkg -l | grep -q build-essential; then
    print_status "Installing build-essential..."
    apt-get install -y build-essential
fi

# Install git if not present
if ! command -v git &> /dev/null; then
    print_status "Installing git..."
    apt-get install -y git
fi

print_success "All system dependencies are installed"

# ============================================
# CREATE INSTALLATION DIRECTORY
# ============================================
print_status "Setting up installation directory: ${INSTALL_DIR}"

if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory ${INSTALL_DIR} already exists"
    read -p "Do you want to remove it and reinstall? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Removing existing installation..."
        rm -rf "$INSTALL_DIR"
    else
        print_error "Installation cancelled"
        exit 1
    fi
fi

mkdir -p "$INSTALL_DIR"
print_success "Created directory: ${INSTALL_DIR}"

# ============================================
# COPY APPLICATION FILES
# ============================================
print_status "Copying application files to ${INSTALL_DIR}..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copy all files except node_modules, .next, and .git
rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude 'install-ubuntu.sh' \
    "$SCRIPT_DIR/" "$INSTALL_DIR/"

print_success "Application files copied successfully"

# ============================================
# SETUP ENVIRONMENT VARIABLES
# ============================================
print_status "Setting up environment variables..."

cd "$INSTALL_DIR"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"

        # Generate a random secret for NEXTAUTH_SECRET
        NEXTAUTH_SECRET=$(openssl rand -base64 32)

        # Update .env with generated secret
        sed -i "s|NEXTAUTH_SECRET=your-secret-here|NEXTAUTH_SECRET=${NEXTAUTH_SECRET}|g" .env

        # Update NEXTAUTH_URL for production (you can change this later)
        sed -i "s|NEXTAUTH_URL=http://localhost:3000|NEXTAUTH_URL=http://localhost:${APP_PORT}|g" .env

        print_success "Generated NEXTAUTH_SECRET"
        print_warning "Please edit ${INSTALL_DIR}/.env to configure your database and Azure AD settings"
    else
        print_error ".env.example not found!"
        exit 1
    fi
else
    print_warning ".env file already exists, skipping creation"
fi

# ============================================
# INSTALL NPM DEPENDENCIES
# ============================================
print_status "Installing npm dependencies (this may take a few minutes)..."

npm install --production=false

print_success "Dependencies installed successfully"

# ============================================
# GENERATE PRISMA CLIENT
# ============================================
print_status "Generating Prisma Client..."

npx prisma generate

print_success "Prisma Client generated successfully"

# ============================================
# BUILD APPLICATION
# ============================================
print_status "Building the application (this may take a few minutes)..."

npm run build

print_success "Application built successfully"

# ============================================
# CREATE SYSTEMD SERVICE
# ============================================
print_status "Creating systemd service..."

cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=SAMOA Finance Money Transfer System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
Environment="NODE_ENV=production"
Environment="PORT=${APP_PORT}"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=${SERVICE_NAME}

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd service file created"

# Reload systemd
systemctl daemon-reload

# ============================================
# ASK ABOUT DATABASE SETUP
# ============================================
echo ""
print_status "Database Configuration"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "The application needs a PostgreSQL database to function."
echo "You have two options:"
echo ""
echo "  1. Configure database now (requires PostgreSQL running)"
echo "  2. Skip and configure later via Settings UI"
echo ""
read -p "Do you want to configure the database now? (y/n) " -n 1 -r
echo
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Ask for database details
    read -p "Database host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    read -p "Database port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}

    read -p "Database name [samoa_finance]: " DB_NAME
    DB_NAME=${DB_NAME:-samoa_finance}

    read -p "Database user [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}

    read -sp "Database password: " DB_PASSWORD
    echo ""

    # Update .env file
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|g" .env
    sed -i "s|DIRECT_URL=.*|DIRECT_URL=\"${DATABASE_URL}\"|g" .env

    print_success "Database configuration updated in .env"

    # Test connection
    print_status "Testing database connection..."
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
        print_success "Database connection successful!"

        read -p "Do you want to set up the database schema now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Setting up database schema..."
            npx prisma db push
            print_success "Database schema created successfully"

            read -p "Do you want to seed the database with initial data? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_status "Seeding database..."
                npm run prisma:seed
                print_success "Database seeded successfully"
            fi
        fi
    else
        print_error "Could not connect to database. Please check your credentials."
        print_warning "You can configure the database later via the Settings page."
    fi
else
    print_warning "Database configuration skipped."
    print_warning "You can configure it later by:"
    print_warning "  1. Starting the application"
    print_warning "  2. Logging in with default credentials"
    print_warning "  3. Going to Settings → Database tab"
fi

# ============================================
# ENABLE AND START SERVICE
# ============================================
echo ""
print_status "Service Configuration"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
read -p "Do you want to enable the service to start on boot? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    systemctl enable ${SERVICE_NAME}
    print_success "Service enabled to start on boot"
fi

read -p "Do you want to start the service now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting ${SERVICE_NAME} service..."
    systemctl start ${SERVICE_NAME}

    # Wait a bit for the service to start
    sleep 3

    if systemctl is-active --quiet ${SERVICE_NAME}; then
        print_success "Service started successfully!"
    else
        print_error "Service failed to start. Check logs with: journalctl -u ${SERVICE_NAME} -n 50"
    fi
else
    print_warning "Service not started. You can start it manually with: sudo systemctl start ${SERVICE_NAME}"
fi

# ============================================
# INSTALLATION COMPLETE
# ============================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Installation Directory:${NC} ${INSTALL_DIR}"
echo -e "${BLUE}Service Name:${NC} ${SERVICE_NAME}"
echo -e "${BLUE}Application Port:${NC} ${APP_PORT}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "  1. Configure your environment:"
echo "     sudo nano ${INSTALL_DIR}/.env"
echo ""
echo "  2. If you haven't configured the database yet:"
echo "     - Start the service: sudo systemctl start ${SERVICE_NAME}"
echo "     - Access the app: http://localhost:${APP_PORT}"
echo "     - Login with default credentials (see login page)"
echo "     - Go to Settings → Database to configure"
echo ""
echo "  3. Configure Azure AD SSO (optional):"
echo "     - Edit ${INSTALL_DIR}/.env"
echo "     - Set AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID"
echo "     - Restart service: sudo systemctl restart ${SERVICE_NAME}"
echo ""
echo -e "${YELLOW}Service Management Commands:${NC}"
echo ""
echo "  Start service:   sudo systemctl start ${SERVICE_NAME}"
echo "  Stop service:    sudo systemctl stop ${SERVICE_NAME}"
echo "  Restart service: sudo systemctl restart ${SERVICE_NAME}"
echo "  Service status:  sudo systemctl status ${SERVICE_NAME}"
echo "  View logs:       sudo journalctl -u ${SERVICE_NAME} -f"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "  - Default login credentials are on the login page"
echo "  - Configure your reverse proxy to point to port ${APP_PORT}"
echo "  - Update NEXTAUTH_URL in .env with your public URL"
echo "  - The app can start without a database - configure it in Settings"
echo ""
print_success "Installation script completed successfully!"
