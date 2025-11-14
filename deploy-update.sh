#!/bin/bash

# ============================================
# SAMOA FINANCE APP - AUTOMATED UPDATE SCRIPT
# ============================================
# This script will:
# 1. Check Node.js version and upgrade if needed
# 2. Backup current installation
# 3. Pull latest changes from Git
# 4. Install/update dependencies
# 5. Run Prisma migrations
# 6. Build the application
# 7. Restart the service
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REQUIRED_NODE_VERSION="22"
MIN_NODE_VERSION="20"
GIT_REPO="https://github.com/renelwllms/sfmtl01"
GIT_BRANCH="main"
SERVICE_NAME="samoa-finance-app"  # PM2 process name
BACKUP_DIR="/home/epladmin/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SAMOA FINANCE APP - Automated Update Script     ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo ""

# Function to print status messages
print_status() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        print_success "$1"
    else
        print_error "$2"
        exit 1
    fi
}

# Get current directory (should be the app directory)
APP_DIR="$(pwd)"
print_status "Working directory: ${APP_DIR}"

# ============================================
# CHECK IF GIT REPO
# ============================================
print_status "Checking if directory is a Git repository..."

if [ ! -d ".git" ]; then
    print_error "Current directory is not a Git repository!"
    print_error "Please run this script from your app directory (e.g., ~/sfmtl01)"
    exit 1
fi

print_success "Git repository confirmed"

# ============================================
# CHECK NODE.JS VERSION
# ============================================
print_status "Checking Node.js version..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    print_error "Please install Node.js ${REQUIRED_NODE_VERSION}.x first"
    exit 1
fi

CURRENT_NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
print_status "Current Node.js version: v${CURRENT_NODE_VERSION}"

if [ "$CURRENT_NODE_VERSION" -lt "$MIN_NODE_VERSION" ]; then
    print_warning "Node.js version is too old (v${CURRENT_NODE_VERSION})"
    print_warning "Recommended version: v${REQUIRED_NODE_VERSION}.x"
    print_warning "Minimum version: v${MIN_NODE_VERSION}.x"

    echo ""
    echo -e "${YELLOW}Your Node.js version needs to be upgraded.${NC}"
    echo -e "${YELLOW}This script will install Node.js v${REQUIRED_NODE_VERSION}.x using nvm.${NC}"
    echo ""

    # Check if nvm is installed
    if [ ! -d "$HOME/.nvm" ]; then
        print_status "Installing nvm (Node Version Manager)..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

        # Load nvm
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

        check_success "nvm installed successfully" "Failed to install nvm"
    else
        print_success "nvm is already installed"
        # Load nvm
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi

    # Install Node.js
    print_status "Installing Node.js v${REQUIRED_NODE_VERSION}..."
    nvm install ${REQUIRED_NODE_VERSION}
    nvm use ${REQUIRED_NODE_VERSION}
    nvm alias default ${REQUIRED_NODE_VERSION}

    check_success "Node.js v$(node -v) installed" "Failed to install Node.js"

    print_success "Node.js upgraded to v$(node -v)"
    print_success "npm version: v$(npm -v)"

elif [ "$CURRENT_NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
    print_warning "Node.js v${CURRENT_NODE_VERSION} detected (recommended: v${REQUIRED_NODE_VERSION})"
    print_status "Continuing with current version..."
else
    print_success "Node.js version is compatible (v${CURRENT_NODE_VERSION})"
fi

# ============================================
# BACKUP CURRENT STATE
# ============================================
print_status "Creating backup of current state..."

mkdir -p "${BACKUP_DIR}"

# Backup .env file
if [ -f ".env" ]; then
    cp .env "${BACKUP_DIR}/.env.${TIMESTAMP}"
    print_success "Backed up .env to ${BACKUP_DIR}/.env.${TIMESTAMP}"
fi

# Backup database (if using SQLite or if DATABASE_URL is set)
if [ -f "prisma/dev.db" ]; then
    cp prisma/dev.db "${BACKUP_DIR}/dev.db.${TIMESTAMP}"
    print_success "Backed up database to ${BACKUP_DIR}/dev.db.${TIMESTAMP}"
fi

# Create a git stash for any local changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Uncommitted changes detected"
    git stash save "Auto-stash before update ${TIMESTAMP}"
    print_success "Stashed local changes (can be restored with: git stash pop)"
fi

# ============================================
# PULL LATEST CHANGES
# ============================================
print_status "Fetching latest changes from Git..."

git fetch origin ${GIT_BRANCH}
check_success "Fetched latest changes" "Failed to fetch from Git"

# Check if there are updates
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" = "$REMOTE" ]; then
    print_success "Already up to date!"
    echo ""
    read -p "No updates available. Do you want to rebuild anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Update cancelled by user"
        exit 0
    fi
else
    print_status "Updates available. Pulling changes..."
    git pull origin ${GIT_BRANCH}
    check_success "Successfully pulled latest changes" "Failed to pull changes"

    # Show what changed
    print_status "Recent commits:"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    git log --oneline -5
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

# ============================================
# CHECK FOR PACKAGE CHANGES
# ============================================
print_status "Checking for dependency changes..."

# Check if package.json or package-lock.json changed
if git diff HEAD@{1} HEAD --name-only 2>/dev/null | grep -q "package"; then
    print_warning "Dependencies have changed"
    INSTALL_DEPS=true
else
    print_status "No dependency changes detected"
    INSTALL_DEPS=false
fi

# ============================================
# INSTALL/UPDATE DEPENDENCIES
# ============================================
if [ "$INSTALL_DEPS" = true ] || [ "$LOCAL" != "$REMOTE" ]; then
    print_status "Installing/updating dependencies..."

    # Clean install for reliability
    if [ "$INSTALL_DEPS" = true ]; then
        print_status "Running clean install (npm ci)..."
        npm ci
    else
        print_status "Running npm install..."
        npm install
    fi

    check_success "Dependencies installed successfully" "Failed to install dependencies"
else
    print_status "Skipping dependency installation (no changes)"
fi

# ============================================
# GENERATE PRISMA CLIENT
# ============================================
print_status "Generating Prisma Client..."

npx prisma generate
check_success "Prisma Client generated" "Failed to generate Prisma Client"

# ============================================
# CHECK FOR SCHEMA CHANGES
# ============================================
print_status "Checking for database schema changes..."

if git diff HEAD@{1} HEAD --name-only 2>/dev/null | grep -q "prisma/schema.prisma"; then
    print_warning "Prisma schema has changed!"

    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Database schema has been modified.${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "You have two options:"
    echo "  1. Run migrations (production - safe, creates migration files)"
    echo "  2. Push schema (development - direct push, no migration files)"
    echo "  3. Skip (configure manually later)"
    echo ""
    read -p "Choose option (1/2/3): " -n 1 -r
    echo

    if [[ $REPLY == "1" ]]; then
        print_status "Running database migrations..."
        npx prisma migrate deploy
        check_success "Migrations applied successfully" "Failed to apply migrations"
    elif [[ $REPLY == "2" ]]; then
        print_status "Pushing schema to database..."
        npx prisma db push
        check_success "Schema pushed successfully" "Failed to push schema"
    else
        print_warning "Skipping database migration. Please run manually if needed."
    fi
else
    print_status "No schema changes detected"
fi

# ============================================
# BUILD APPLICATION
# ============================================
print_status "Building application..."
echo -e "${YELLOW}(This may take a few minutes...)${NC}"

npm run build
check_success "Build completed successfully" "Build failed!"

# ============================================
# RESTART SERVICE
# ============================================
print_status "Checking for running services..."

# Check if PM2 is being used
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "${SERVICE_NAME}"; then
        print_status "Restarting PM2 process: ${SERVICE_NAME}"
        pm2 restart ${SERVICE_NAME}
        check_success "PM2 process restarted" "Failed to restart PM2 process"

        # Save PM2 configuration
        pm2 save
        print_success "PM2 configuration saved"

        # Show process status
        echo ""
        print_status "Process status:"
        pm2 list
    else
        print_warning "PM2 is installed but ${SERVICE_NAME} is not running"
        echo ""
        read -p "Do you want to start the app with PM2 now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            pm2 start npm --name "${SERVICE_NAME}" -- start
            pm2 save
            print_success "Application started with PM2"
        fi
    fi
# Check if systemd service exists
elif systemctl list-units --type=service --all | grep -q "${SERVICE_NAME}"; then
    print_status "Restarting systemd service: ${SERVICE_NAME}"
    sudo systemctl restart ${SERVICE_NAME}
    check_success "Service restarted" "Failed to restart service"

    # Show service status
    echo ""
    sudo systemctl status ${SERVICE_NAME} --no-pager -l
else
    print_warning "No service manager detected (PM2 or systemd)"
    echo ""
    echo -e "${YELLOW}To start the application manually:${NC}"
    echo -e "  ${CYAN}npm start${NC}  (production)"
    echo -e "  ${CYAN}npm run dev${NC}  (development)"
fi

# ============================================
# VERIFY DEPLOYMENT
# ============================================
print_status "Verifying deployment..."

# Wait a few seconds for the app to start
sleep 3

# Try to check if app is responding (if running on default port 3000)
if command -v curl &> /dev/null; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302\|401"; then
        print_success "Application is responding!"
    else
        print_warning "Application may not be responding on port 3000"
    fi
fi

# ============================================
# CLEANUP OLD BACKUPS
# ============================================
print_status "Cleaning up old backups (keeping last 5)..."

# Keep only the 5 most recent backups
cd "${BACKUP_DIR}"
ls -t .env.* 2>/dev/null | tail -n +6 | xargs -r rm
ls -t dev.db.* 2>/dev/null | tail -n +6 | xargs -r rm

cd "${APP_DIR}"
print_success "Old backups cleaned up"

# ============================================
# DEPLOYMENT COMPLETE
# ============================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Deployment Completed Successfully!        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Node.js version: ${GREEN}v$(node -v)${NC}"
echo -e "  npm version: ${GREEN}v$(npm -v)${NC}"
echo -e "  Git branch: ${GREEN}${GIT_BRANCH}${NC}"
echo -e "  Last commit: ${GREEN}$(git log -1 --pretty=format:'%h - %s')${NC}"
echo -e "  Backup location: ${GREEN}${BACKUP_DIR}${NC}"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v pm2 &> /dev/null; then
    echo -e "  View logs:        ${CYAN}pm2 logs ${SERVICE_NAME}${NC}"
    echo -e "  Restart app:      ${CYAN}pm2 restart ${SERVICE_NAME}${NC}"
    echo -e "  Stop app:         ${CYAN}pm2 stop ${SERVICE_NAME}${NC}"
    echo -e "  App status:       ${CYAN}pm2 status${NC}"
elif systemctl list-units --type=service --all | grep -q "${SERVICE_NAME}"; then
    echo -e "  View logs:        ${CYAN}sudo journalctl -u ${SERVICE_NAME} -f${NC}"
    echo -e "  Restart service:  ${CYAN}sudo systemctl restart ${SERVICE_NAME}${NC}"
    echo -e "  Stop service:     ${CYAN}sudo systemctl stop ${SERVICE_NAME}${NC}"
    echo -e "  Service status:   ${CYAN}sudo systemctl status ${SERVICE_NAME}${NC}"
fi

echo -e "  Restore backup:   ${CYAN}cp ${BACKUP_DIR}/.env.${TIMESTAMP} .env${NC}"
echo -e "  Run migrations:   ${CYAN}npx prisma migrate deploy${NC}"
echo -e "  View git log:     ${CYAN}git log --oneline -10${NC}"
echo ""

print_success "Deployment script completed successfully!"
