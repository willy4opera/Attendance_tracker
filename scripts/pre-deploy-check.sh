#!/bin/bash

# Pre-deployment checklist script
# Usage: ./scripts/pre-deploy-check.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

log_header() {
    echo -e "${BLUE}$1${NC}"
}

ERRORS=0

log_header "🔍 Pre-deployment Health Check"
echo

# Check if we're in the project root
log_info "Checking project structure..."
if [ ! -f "docker-compose.prod.yml" ]; then
    log_error "docker-compose.prod.yml not found - are you in the project root?"
    ((ERRORS++))
else
    log_success "Project structure OK"
fi

# Check upload directories
log_info "Checking upload directories..."
REQUIRED_DIRS=(
    "backend/uploads/temp"
    "backend/uploads/files" 
    "backend/uploads/images"
    "backend/uploads/videos"
    "backend/uploads/documents"
    "backend/uploads/avatars"
    "backend/uploads/attachments"
    "backend/uploads/debug"
    "backend/uploads/qrcodes"
)

MISSING_DIRS=()
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        MISSING_DIRS+=("$dir")
    fi
done

if [ ${#MISSING_DIRS[@]} -eq 0 ]; then
    log_success "All upload directories exist"
else
    log_error "Missing upload directories:"
    for dir in "${MISSING_DIRS[@]}"; do
        echo "  - $dir"
    done
    log_warn "Run: ./scripts/setup-directories.sh"
    ((ERRORS++))
fi

# Check environment file
log_info "Checking environment configuration..."
if [ ! -f ".env" ]; then
    log_error ".env file not found"
    ((ERRORS++))
else
    log_success ".env file exists"
    
    # Check critical environment variables
    REQUIRED_VARS=(
        "JWT_SECRET"
        "DB_HOST"
        "DB_NAME"
        "DB_USER"
        "DB_PASSWORD"
        "CLOUDINARY_CLOUD_NAME"
        "CLOUDINARY_API_KEY"
        "CLOUDINARY_API_SECRET"
    )
    
    MISSING_VARS=()
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^$var=" .env; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        log_success "All required environment variables present"
    else
        log_error "Missing environment variables:"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
        ((ERRORS++))
    fi
fi

# Check PostgreSQL connectivity
log_info "Checking PostgreSQL connectivity..."
if command -v psql &> /dev/null; then
    if sudo -u postgres psql -c '\l' | grep -q 'attendance_tracker_pro'; then
        log_success "PostgreSQL database exists"
        
        # Check if user exists
        if sudo -u postgres psql -c '\du' | grep -q 'Hhacker'; then
            log_success "Database user 'Hhacker' exists"
        else
            log_error "Database user 'Hhacker' not found"
            log_warn "Run: sudo -u postgres createuser -s Hhacker"
            ((ERRORS++))
        fi
    else
        log_error "Database 'attendance_tracker_pro' not found"
        ((ERRORS++))
    fi
    
    # Check if PostgreSQL is listening on all interfaces
    if netstat -tlnp | grep -q '0.0.0.0:5432'; then
        log_success "PostgreSQL listening on all interfaces"
    else
        log_error "PostgreSQL not configured for external connections"
        log_warn "Update postgresql.conf: listen_addresses = '*'"
        log_warn "Update pg_hba.conf: Add Docker network ranges"
        ((ERRORS++))
    fi
else
    log_warn "psql not available - cannot check PostgreSQL"
fi

# Check Docker
log_info "Checking Docker..."
if command -v docker &> /dev/null; then
    if systemctl is-active --quiet docker; then
        log_success "Docker is running"
    else
        log_error "Docker is not running"
        ((ERRORS++))
    fi
    
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose available"
    else
        log_error "Docker Compose not available"
        ((ERRORS++))
    fi
else
    log_error "Docker not installed"
    ((ERRORS++))
fi

# Check if ports are available
log_info "Checking port availability..."
REQUIRED_PORTS=(5000 5173 6380)
OCCUPIED_PORTS=()

for port in "${REQUIRED_PORTS[@]}"; do
    if netstat -tlnp | grep -q ":$port "; then
        # Check if it's our containers
        if docker ps | grep -q ":$port->"; then
            log_success "Port $port occupied by our container"
        else
            OCCUPIED_PORTS+=("$port")
        fi
    else
        log_success "Port $port available"
    fi
done

if [ ${#OCCUPIED_PORTS[@]} -gt 0 ]; then
    log_error "Ports occupied by other processes:"
    for port in "${OCCUPIED_PORTS[@]}"; do
        echo "  - $port"
    done
    ((ERRORS++))
fi

echo
log_header "📊 Pre-deployment Summary"

if [ $ERRORS -eq 0 ]; then
    log_success "All checks passed! Ready for deployment 🚀"
    echo
    log_info "You can now deploy with:"
    echo "  ./scripts/deploy/deploy.sh production"
    echo "  OR push to main branch for automatic deployment"
    exit 0
else
    log_error "Found $ERRORS issue(s) that need to be resolved before deployment"
    echo
    log_info "Fix the issues above and run this script again"
    exit 1
fi
