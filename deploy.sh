#!/usr/bin/env bash
# =============================================================================
# HVAC System - Production Deployment Script
# Usage: ./deploy.sh [force]
#   force  - Skip confirmation prompt (used by CI/CD)
# =============================================================================
set -euo pipefail

COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# ---------- Colors ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------- Pre-flight checks ----------
preflight() {
    log "Running pre-flight checks..."

    if ! command -v docker &>/dev/null; then
        error "Docker is not installed. Install it: https://docs.docker.com/engine/install/ubuntu/"
        exit 1
    fi

    if ! docker compose version &>/dev/null; then
        error "Docker Compose V2 is not available. Install: https://docs.docker.com/compose/install/"
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        error ".env file not found. Create it from the CI/CD pipeline or manually."
        exit 1
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        error "$COMPOSE_FILE not found."
        exit 1
    fi

    log "Pre-flight checks passed."
}

# ---------- SSL certificates ----------
setup_ssl() {
    # Source .env to get DOMAIN variable
    set -a; source "$ENV_FILE"; set +a

    local CERT_PATH="/etc/letsencrypt/live/${DOMAIN:-live-ac.tech}/fullchain.pem"
    if [ ! -f "$CERT_PATH" ]; then
        warn "SSL certificates not found. Obtaining certificates..."

        # Stop nginx if running to free port 80
        docker compose stop nginx 2>/dev/null || true

        certbot certonly --standalone \
            -d "${DOMAIN:-live-ac.tech}" \
            -d "www.${DOMAIN:-live-ac.tech}" \
            -d "${API_DOMAIN:-api.live-ac.tech}" \
            --non-interactive \
            --agree-tos \
            --email "${MAIL_USERNAME}" \
            --no-eff-email

        log "SSL certificates obtained."
    else
        log "SSL certificates already exist."
    fi
}

# ---------- Deploy ----------
deploy() {
    log "Pulling latest base images..."
    docker compose pull postgres nginx certbot 2>/dev/null || true

    log "Building application containers..."
    docker compose build --no-cache backend customer-portal

    log "Stopping existing containers..."
    docker compose down --remove-orphans

    log "Starting all services..."
    docker compose up -d

    log "Waiting for services to become healthy..."
    local retries=0
    local max_retries=30
    while [ $retries -lt $max_retries ]; do
        if docker compose ps | grep -q "(unhealthy)"; then
            retries=$((retries + 1))
            sleep 10
        elif docker compose ps | grep -q "(health: starting)"; then
            retries=$((retries + 1))
            sleep 10
        else
            break
        fi
    done

    log "Cleaning up old Docker images..."
    docker image prune -f 2>/dev/null || true

    log "Service status:"
    docker compose ps
}

# ---------- Main ----------
main() {
    log "========================================="
    log "  HVAC System - Production Deployment"
    log "========================================="

    if [ "${1:-}" != "force" ]; then
        read -rp "Deploy to production? (y/N): " confirm
        if [[ "$confirm" != [yY] ]]; then
            warn "Deployment cancelled."
            exit 0
        fi
    fi

    preflight
    setup_ssl
    deploy

    log "========================================="
    log "  Deployment completed successfully!"
    log "========================================="
    echo ""
    log "Frontend:  https://${DOMAIN:-live-ac.tech}"
    log "API:       https://${API_DOMAIN:-api.live-ac.tech}"
    log "Health:    https://${API_DOMAIN:-api.live-ac.tech}/actuator/health"
    echo ""
}

main "$@"
