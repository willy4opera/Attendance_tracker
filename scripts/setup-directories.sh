#!/bin/bash

# Setup script for creating required upload directories
# Usage: ./scripts/setup-directories.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_header() {
    echo -e "${BLUE}$1${NC}"
}

log_header "📁 Setting up Attendance Tracker upload directories..."
echo

# Check if we're in the project root
if [ ! -f "docker-compose.prod.yml" ]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

log_info "Creating backend upload directories..."

# Create all required upload directories
UPLOAD_DIRS=(
    "temp"
    "files" 
    "images"
    "videos"
    "documents"
    "avatars"
    "attachments"
    "debug"
    "qrcodes"
)

# Create base uploads directory
mkdir -p backend/uploads

# Create each subdirectory
for dir in "${UPLOAD_DIRS[@]}"; do
    mkdir -p "backend/uploads/$dir"
    log_info "Created: backend/uploads/$dir"
done

# Set proper permissions
chmod -R 755 backend/uploads
log_info "Set permissions (755) for all upload directories"

# Create .gitkeep files to preserve empty directories in git
for dir in "${UPLOAD_DIRS[@]}"; do
    touch "backend/uploads/$dir/.gitkeep"
done
log_info "Created .gitkeep files to preserve empty directories in git"

echo
log_header "📋 Directory structure created:"
ls -la backend/uploads/

echo
log_info "✅ All upload directories have been created successfully!"
log_info "📌 These directories are required for:"
echo "   • temp: Temporary file uploads"
echo "   • files: General file storage"
echo "   • images: Image uploads"
echo "   • videos: Video file storage"
echo "   • documents: Document uploads (PDF, DOC, etc.)"
echo "   • avatars: User profile pictures"
echo "   • attachments: Comment and task attachments"
echo "   • debug: Debug logs and temporary files"
echo "   • qrcodes: Generated QR codes"

echo
log_info "🚀 You can now start the application with:"
echo "   docker-compose -f docker-compose.prod.yml up -d"
