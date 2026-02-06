#!/bin/bash
# =============================================================================
# AC_contoler_HVAC Remote Deployment Script
# =============================================================================
# This script deploys the project to a remote Ubuntu server via SSH
# Usage: ./remote-deploy.sh [--with-env]
#
# Options:
#   --with-env    Also update the .env file from local .env.production
# =============================================================================

set -e

# Configuration
SSH_HOST="64.227.144.94"
SSH_USER="root"
SSH_KEY="${SSH_PRIVATE_KEY_PATH:-$HOME/.ssh/id_ed25519}"
WORK_DIRECTORY="/opt/achvac/AC_contoler_HVAC"
MAIN_BRANCH="main"
LOG_PREFIX="[DEPLOY]"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}${LOG_PREFIX}${NC} $1"; }
log_success() { echo -e "${GREEN}${LOG_PREFIX} [SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}${LOG_PREFIX} [WARNING]${NC} $1"; }
log_error() { echo -e "${RED}${LOG_PREFIX} [ERROR]${NC} $1"; }

# Check if SSH key exists
check_ssh_key() {
    log_info "Checking SSH key..."
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH private key not found at: $SSH_KEY"
        log_info "Set SSH_PRIVATE_KEY_PATH environment variable or place key at ~/.ssh/id_ed25519"
        exit 1
    fi
    log_success "SSH key found"
}

# Test SSH connection
test_connection() {
    log_info "Testing SSH connection to $SSH_HOST..."
    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new "$SSH_USER@$SSH_HOST" "echo 'Connection successful'" > /dev/null 2>&1; then
        log_success "SSH connection established"
    else
        log_error "Failed to connect to $SSH_HOST"
        exit 1
    fi
}

# Upload .env file if --with-env flag is provided
upload_env() {
    if [ "$1" == "--with-env" ]; then
        log_info "Uploading .env file..."
        if [ -f ".env.production" ]; then
            scp -i "$SSH_KEY" .env.production "$SSH_USER@$SSH_HOST:$WORK_DIRECTORY/.env"
            log_success ".env file uploaded from .env.production"
        elif [ -f ".env" ]; then
            log_warning "No .env.production found, using .env"
            scp -i "$SSH_KEY" .env "$SSH_USER@$SSH_HOST:$WORK_DIRECTORY/.env"
            log_success ".env file uploaded"
        else
            log_error "No .env or .env.production file found locally"
            exit 1
        fi
    fi
}

# Main deployment
deploy() {
    log_info "Starting deployment to $SSH_HOST..."

    ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << 'DEPLOY_SCRIPT'
set -e

LOG_PREFIX="[REMOTE]"
WORK_DIRECTORY="/opt/achvac/AC_contoler_HVAC"
MAIN_BRANCH="main"

log_info() { echo "$LOG_PREFIX $1"; }
log_success() { echo "$LOG_PREFIX [SUCCESS] $1"; }
log_error() { echo "$LOG_PREFIX [ERROR] $1"; }

# Step 1: Navigate to project directory
log_info "Navigating to project directory..."
if [ ! -d "$WORK_DIRECTORY" ]; then
    log_error "Project directory not found: $WORK_DIRECTORY"
    exit 1
fi
cd "$WORK_DIRECTORY"
log_success "Changed to $WORK_DIRECTORY"

# Step 2: Verify git repository
log_info "Verifying git repository..."
if [ ! -d ".git" ]; then
    log_error "Not a git repository"
    exit 1
fi
log_success "Git repository verified"

# Step 3: Clean and reset repository
log_info "Cleaning local changes..."
git fetch origin "$MAIN_BRANCH"
git reset --hard "origin/$MAIN_BRANCH"
git clean -fd --exclude=.env
log_success "Repository reset to origin/$MAIN_BRANCH"

# Step 4: Pull latest code
log_info "Pulling latest code..."
git pull origin "$MAIN_BRANCH"
log_success "Code updated"

# Step 5: Verify .env file exists
log_info "Checking .env file..."
if [ ! -f ".env" ]; then
    log_error ".env file not found! Please upload it first using --with-env flag"
    log_info "Or create it manually on the server at $WORK_DIRECTORY/.env"
    exit 1
fi
log_success ".env file exists"

# Step 6: Make scripts executable
log_info "Making scripts executable..."
chmod +x deploy.sh
[ -f "init-ssl.sh" ] && chmod +x init-ssl.sh
[ -f "setup_server.sh" ] && chmod +x setup_server.sh
log_success "Scripts are now executable"

# Step 7: Run deployment
log_info "Running deploy.sh force..."
./deploy.sh force

# Step 8: Clean temporary files
log_info "Cleaning temporary files..."
find . -type f -name "*.tmp" -delete 2>/dev/null || true
find . -type f -name "*.log" -not -path "./.git/*" -delete 2>/dev/null || true
find . -type f -name "*.bak" -delete 2>/dev/null || true
find . -type f -name "*~" -delete 2>/dev/null || true
log_success "Temporary files cleaned"

# Step 9: Show deployment status
log_info "Checking container status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -20

log_success "=========================================="
log_success "Deployment completed successfully!"
log_success "=========================================="
DEPLOY_SCRIPT
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --with-env    Upload .env.production (or .env) to server"
    echo "  --help        Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  SSH_PRIVATE_KEY_PATH    Path to SSH private key (default: ~/.ssh/id_ed25519)"
    echo ""
    echo "Examples:"
    echo "  $0                      Deploy without updating .env"
    echo "  $0 --with-env           Deploy and update .env from local .env.production"
}

# Main execution
main() {
    echo ""
    echo "=============================================="
    echo "  AC_contoler_HVAC Deployment Script"
    echo "=============================================="
    echo ""

    if [ "$1" == "--help" ]; then
        show_usage
        exit 0
    fi

    check_ssh_key
    test_connection
    upload_env "$1"
    deploy

    log_success "All done!"
}

main "$@"
