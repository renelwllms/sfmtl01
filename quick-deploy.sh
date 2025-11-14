#!/bin/bash

# ============================================
# SAMOA FINANCE APP - QUICK DEPLOY (FULLY AUTOMATED)
# ============================================
# This script runs without user prompts for automated deployments
# Use this for CI/CD or cron jobs
# ============================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
REQUIRED_NODE_VERSION="22"
GIT_BRANCH="main"
SERVICE_NAME="samoa-finance-app"
BACKUP_DIR="/home/epladmin/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/home/epladmin/deploy-${TIMESTAMP}.log"

# Logging function
log() {
    echo -e "$1" | tee -a "${LOG_FILE}"
}

log "${BLUE}═══════════════════════════════════════════════════${NC}"
log "${BLUE}  SAMOA FINANCE - Quick Deploy (Automated)${NC}"
log "${BLUE}  Started: $(date)${NC}"
log "${BLUE}═══════════════════════════════════════════════════${NC}"

# Navigate to app directory
cd ~/sfmtl01 || exit 1
log "${CYAN}[INFO]${NC} Working directory: $(pwd)"

# Backup .env
mkdir -p "${BACKUP_DIR}"
if [ -f ".env" ]; then
    cp .env "${BACKUP_DIR}/.env.${TIMESTAMP}"
    log "${GREEN}[✓]${NC} Backed up .env"
fi

# Stash any local changes
if [ -n "$(git status --porcelain)" ]; then
    git stash save "Auto-stash ${TIMESTAMP}"
    log "${YELLOW}[⚠]${NC} Stashed local changes"
fi

# Pull latest changes
log "${CYAN}[INFO]${NC} Pulling latest changes from Git..."
git fetch origin ${GIT_BRANCH}
git pull origin ${GIT_BRANCH}

if [ $? -eq 0 ]; then
    log "${GREEN}[✓]${NC} Git pull successful"
    git log --oneline -3 | tee -a "${LOG_FILE}"
else
    log "${RED}[✗]${NC} Git pull failed"
    exit 1
fi

# Install dependencies
log "${CYAN}[INFO]${NC} Installing dependencies..."
npm install
log "${GREEN}[✓]${NC} Dependencies installed"

# Generate Prisma Client
log "${CYAN}[INFO]${NC} Generating Prisma Client..."
npx prisma generate
log "${GREEN}[✓]${NC} Prisma Client generated"

# Build application
log "${CYAN}[INFO]${NC} Building application..."
npm run build

if [ $? -eq 0 ]; then
    log "${GREEN}[✓]${NC} Build completed successfully"
else
    log "${RED}[✗]${NC} Build failed!"
    exit 1
fi

# Restart service
log "${CYAN}[INFO]${NC} Restarting service..."

if command -v pm2 &> /dev/null && pm2 list | grep -q "${SERVICE_NAME}"; then
    pm2 restart ${SERVICE_NAME}
    pm2 save
    log "${GREEN}[✓]${NC} PM2 process restarted"
elif systemctl list-units --type=service --all | grep -q "${SERVICE_NAME}"; then
    sudo systemctl restart ${SERVICE_NAME}
    log "${GREEN}[✓]${NC} Systemd service restarted"
else
    log "${YELLOW}[⚠]${NC} No service manager detected"
fi

# Cleanup old backups (keep last 5)
cd "${BACKUP_DIR}"
ls -t .env.* 2>/dev/null | tail -n +6 | xargs -r rm
log "${GREEN}[✓]${NC} Old backups cleaned"

log "${GREEN}═══════════════════════════════════════════════════${NC}"
log "${GREEN}  Deployment Completed Successfully!${NC}"
log "${GREEN}  Finished: $(date)${NC}"
log "${GREEN}  Log saved to: ${LOG_FILE}${NC}"
log "${GREEN}═══════════════════════════════════════════════════${NC}"
