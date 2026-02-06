#!/bin/bash

# ==============================================================================
# Hive AC - One-Click Server Setup Script
# Run this on your fresh Ubuntu Server
# ==============================================================================

REPO_URL="https://gitlab.com/isira.aw/AC_contoler_HVAC.git" # Replace if public, or use token for private
APP_DIR="/opt/hvac"

echo "Starting Server Setup for Live AC..."

# 1. Install Dependencies
echo "Installing Docker and Git..."
apt-get update
apt-get install -y git curl
# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

# 2. Setup Application Directory
mkdir -p $APP_DIR
cd $APP_DIR

# 3. Clone Repository (if empty)
if [ -z "$(ls -A $APP_DIR)" ]; then
    echo "Cloning repository..."
    # Note: If private, you will need to enter credentials or use an SSH key before this
    git clone $REPO_URL .
else
    echo "Directory not empty, pulling latest..."
    git pull
fi

# 4. Make scripts executable
chmod +x deploy.sh

# 5. Setup Auto-Update (Cron Job)
# Runs deploy.sh every 5 minutes
CRON_JOB="*/5 * * * * cd $APP_DIR && ./deploy.sh >> /var/log/hvac_deploy.log 2>&1"
(crontab -l 2>/dev/null | grep -v "$APP_DIR/deploy.sh"; echo "$CRON_JOB") | crontab -

echo "========================================================"
echo "Setup Complete!"
echo "1. Edit docker-compose.prod.yml if you need to change passwords."
echo "2. Run './deploy.sh' manually once to start everything."
echo "3. Auto-updates are now enabled (checks every 5 mins)."
echo "========================================================"
