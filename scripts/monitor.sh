#!/bin/bash

# Monitoring script for Attendance Tracker
# Usage: ./monitor.sh [environment]

ENVIRONMENT=${1:-development}
CHECK_INTERVAL=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Configuration based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    BACKEND_URL="https://api.yourdomain.com"
    FRONTEND_URL="https://yourdomain.com"
    DB_CONTAINER="attendance_backend_prod"
elif [ "$ENVIRONMENT" = "staging" ]; then
    BACKEND_URL="http://localhost:3001"
    FRONTEND_URL="http://localhost:8080"
    DB_CONTAINER="attendance_backend_staging"
else
    BACKEND_URL="http://localhost:3000"
    FRONTEND_URL="http://localhost:5173"
    DB_CONTAINER="attendance_backend"
fi

check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        log_info "$service_name is healthy"
        return 0
    else
        log_error "$service_name is unhealthy"
        return 1
    fi
}

check_database() {
    if docker ps | grep -q postgres; then
        log_info "Database container is running"
        
        # Test database connection
        if docker exec postgres pg_isready -U postgres >/dev/null 2>&1; then
            log_info "Database is accepting connections"
            return 0
        else
            log_error "Database is not accepting connections"
            return 1
        fi
    else
        log_error "Database container is not running"
        return 1
    fi
}

check_redis() {
    if docker ps | grep -q redis; then
        log_info "Redis container is running"
        
        # Test Redis connection
        if docker exec redis redis-cli ping | grep -q PONG; then
            log_info "Redis is responding"
            return 0
        else
            log_error "Redis is not responding"
            return 1
        fi
    else
        log_error "Redis container is not running"
        return 1
    fi
}

check_disk_space() {
    local threshold=80
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt "$threshold" ]; then
        log_info "Disk usage: ${usage}% (healthy)"
    elif [ "$usage" -lt 90 ]; then
        log_warn "Disk usage: ${usage}% (warning)"
    else
        log_error "Disk usage: ${usage}% (critical)"
    fi
}

check_memory() {
    local mem_info=$(free | grep Mem)
    local total=$(echo $mem_info | awk '{print $2}')
    local used=$(echo $mem_info | awk '{print $3}')
    local usage=$((used * 100 / total))
    
    if [ "$usage" -lt 80 ]; then
        log_info "Memory usage: ${usage}% (healthy)"
    elif [ "$usage" -lt 90 ]; then
        log_warn "Memory usage: ${usage}% (warning)"
    else
        log_error "Memory usage: ${usage}% (critical)"
    fi
}

check_docker_containers() {
    local containers=("postgres" "redis" "attendance_backend" "attendance_frontend")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            log_info "Container $container is running"
        else
            log_error "Container $container is not running"
        fi
    done
}

# Main monitoring loop
log_info "Starting monitoring for $ENVIRONMENT environment..."
log_info "Backend URL: $BACKEND_URL"
log_info "Frontend URL: $FRONTEND_URL"
log_info "Check interval: ${CHECK_INTERVAL}s"

while true; do
    echo "----------------------------------------"
    log_info "Performing health checks..."
    
    # Service health checks
    check_service "Backend API" "$BACKEND_URL/health"
    check_service "Frontend" "$FRONTEND_URL/health" "200\|404"
    
    # Infrastructure checks
    check_database
    check_redis
    check_docker_containers
    
    # System resource checks
    check_disk_space
    check_memory
    
    log_info "Health check cycle completed. Next check in ${CHECK_INTERVAL}s..."
    sleep $CHECK_INTERVAL
done
