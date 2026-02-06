#!/bin/bash
set -e # Exit on error
set -x # Print commands for debugging

# Configuration
DOMAIN="live-ac.tech"
EMAIL="isira.aw@gmail.com"
DATE=$(date)

echo "[$DATE] Starting Deployment Check..."

# 1. Pull the latest code
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$1" != "force" ] && [ $LOCAL = $REMOTE ]; then
    echo "[$DATE] No changes detected. System is up to date."
    echo "Use './deploy.sh force' to force redeployment."
    exit 0
fi

echo "[$DATE] Changes detected (or forced)! Updating system..."
git pull origin main

# 2. Build and Start Services
echo "[$DATE] Rebuilding and restarting services..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# 3. Cleanup (preserve build cache so subsequent deployments stay fast)
echo "[$DATE] Cleaning up unused images..."
docker container prune -f
docker image prune -f

echo "[$DATE] Deployment completed successfully!"
