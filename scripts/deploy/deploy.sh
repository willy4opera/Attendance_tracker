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

log_info "Starting deployment to $ENVIRONMENT environment..."

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

# Pull latest changes
log_info "Pulling latest changes..."
git pull origin main || {
    log_error "Failed to pull latest changes"
    exit 1
}

# Build and deploy services
log_info "Building and starting services..."
docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build || {
    log_error "Failed to start services"
    
    # Rollback
    log_info "Rolling back to previous version..."
    docker-compose -f $COMPOSE_FILE down || true
    
    # Restore from backup if available
    if [ -f "$BACKUP_DIR/deployment_backup_$TIMESTAMP.tar.gz" ]; then
        log_info "Restoring from backup..."
        tar -xzf "$BACKUP_DIR/deployment_backup_$TIMESTAMP.tar.gz"
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
    fi
    
    exit 1
}

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 30

# Run database migrations
log_info "Running database migrations..."
docker-compose -f $COMPOSE_FILE exec -T backend npm run migrate || log_warn "Migrations failed"

# Health check
log_info "Performing health check..."
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:80"

if [ "$ENVIRONMENT" = "production" ]; then
    BACKEND_URL="https://api.yourdomain.com"
    FRONTEND_URL="https://yourdomain.com"
fi

# Check backend health
if curl -f -s "$BACKEND_URL/health" > /dev/null; then
    log_info "Backend health check passed"
else
    log_error "Backend health check failed"
    exit 1
fi

# Check frontend health
if curl -f -s "$FRONTEND_URL/health" > /dev/null; then
    log_info "Frontend health check passed"
else
    log_warn "Frontend health check failed"
fi

# Clean up old backups (keep last 5)
log_info "Cleaning up old backups..."
ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | tail -n +6 | xargs -r rm
ls -t "$BACKUP_DIR"/deployment_backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm

# Clean up old Docker images
log_info "Cleaning up old Docker images..."
docker image prune -f

log_info "Deployment to $ENVIRONMENT completed successfully!"

# Send notification (customize as needed)
if command -v curl &> /dev/null && [ -n "$WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Attendance Tracker deployed to $ENVIRONMENT successfully!\"}" \
        "$WEBHOOK_URL" || log_warn "Failed to send notification"
fi

log_info "Deployment summary:"
log_info "- Environment: $ENVIRONMENT"
log_info "- Timestamp: $TIMESTAMP"
log_info "- Backend URL: $BACKEND_URL"
log_info "- Frontend URL: $FRONTEND_URL"
log_info "- Backup location: $BACKUP_DIR"
