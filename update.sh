#!/bin/bash

#############################################
# SFMTL Finance App - Update Script
#############################################
# Updates the application to the latest version from Git
# Run this script on your Ubuntu production server

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

# Configuration
INSTALL_DIR="/opt/sfmtl"
APP_USER="sfmtl"
SERVICE_NAME="sfmtl"

clear
echo "============================================"
echo "    SFMTL Finance App - Update Script      "
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Check if application directory exists
if [ ! -d "$INSTALL_DIR" ]; then
    print_error "Application directory not found: $INSTALL_DIR"
    print_error "Please run the deployment script first."
    exit 1
fi

cd "$INSTALL_DIR"

#############################################
# Step 1: Show current version
#############################################
print_info "Current version:"
git log -1 --oneline || print_warning "Could not determine current version"
echo ""

#############################################
# Step 2: Backup current version
#############################################
print_info "Creating backup..."
BACKUP_DIR="/opt/sfmtl-backup-$(date +%Y%m%d-%H%M%S)"
cp -r "$INSTALL_DIR" "$BACKUP_DIR"
print_success "Backup created at: $BACKUP_DIR"
echo ""

#############################################
# Step 3: Stop the service
#############################################
print_info "Stopping application service..."
systemctl stop $SERVICE_NAME
print_success "Service stopped"
echo ""

#############################################
# Step 4: Pull latest changes
#############################################
print_info "Pulling latest changes from Git..."
sudo -u $APP_USER git fetch origin
sudo -u $APP_USER git pull origin main
print_success "Latest changes pulled"
echo ""

#############################################
# Step 5: Show new version
#############################################
print_info "New version:"
git log -1 --oneline
echo ""

#############################################
# Step 6: Install dependencies
#############################################
print_info "Installing/updating dependencies..."
sudo -u $APP_USER npm install
print_success "Dependencies updated"
echo ""

#############################################
# Step 7: Run database migrations
#############################################
print_info "Running database migrations..."
sudo -u $APP_USER npx prisma migrate deploy
print_success "Migrations completed"
echo ""

#############################################
# Step 8: Build application
#############################################
print_info "Building application..."
sudo -u $APP_USER npm run build
print_success "Build completed"
echo ""

#############################################
# Step 9: Start the service
#############################################
print_info "Starting application service..."
systemctl start $SERVICE_NAME
sleep 3
print_success "Service started"
echo ""

#############################################
# Step 10: Verify service status
#############################################
print_info "Verifying service status..."
if systemctl is-active --quiet $SERVICE_NAME; then
    print_success "Service is running successfully!"
else
    print_error "Service failed to start!"
    print_warning "Check logs: sudo journalctl -u $SERVICE_NAME -n 50"
    print_warning "Restore backup if needed: sudo rm -rf $INSTALL_DIR && sudo mv $BACKUP_DIR $INSTALL_DIR"
    exit 1
fi
echo ""

#############################################
# Final Summary
#############################################
echo "============================================"
echo "         UPDATE COMPLETED! ✓"
echo "============================================"
echo ""
print_success "Application updated successfully!"
echo ""
echo "Service status: $(systemctl is-active $SERVICE_NAME)"
echo "Backup location: $BACKUP_DIR"
echo ""
echo "Useful commands:"
echo "  View logs: sudo journalctl -u $SERVICE_NAME -f"
echo "  Restart:   sudo systemctl restart $SERVICE_NAME"
echo "  Status:    sudo systemctl status $SERVICE_NAME"
echo ""
print_info "You can delete the backup after confirming everything works:"
print_info "  sudo rm -rf $BACKUP_DIR"
echo ""
echo "============================================"
