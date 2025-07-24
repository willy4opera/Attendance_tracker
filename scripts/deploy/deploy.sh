#!/bin/bash
set -e

# Deployment script for Attendance Tracker
# Usage: ./deploy.sh [staging|production]

ENVIRONMENT=${1:-staging}
PROJECT_NAME="attendance-tracker"
BACKUP_DIR="/var/backups/$PROJECT_NAME"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment-specific configuration
if [ "$ENVIRONMENT" = "production" ]; then
    ENV_FILE=".env.production"
    COMPOSE_FILE="docker-compose.prod.yml"
    SERVICE_PREFIX="prod"
elif [ "$ENVIRONMENT" = "staging" ]; then
    ENV_FILE=".env.staging"
    COMPOSE_FILE="docker-compose.staging.yml"
    SERVICE_PREFIX="staging"
else
    log_error "Invalid environment: $ENVIRONMENT. Use 'staging' or 'production'"
    exit 1
fi

# Check if required files exist
if [ ! -f "$ENV_FILE" ]; then
    log_error "$ENV_FILE not found!"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
log_info "Creating database backup..."
if command -v docker &> /dev/null; then
    docker-compose exec -T postgres pg_dump -U postgres attendance_tracker > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql" || log_warn "Database backup failed"
fi

# Backup current deployment
log_info "Creating deployment backup..."
tar -czf "$BACKUP_DIR/deployment_backup_$TIMESTAMP.tar.gz" --exclude='node_modules' --exclude='.git' . || log_warn "Deployment backup failed"

