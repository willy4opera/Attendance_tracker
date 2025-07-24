#!/bin/bash

# Quick Deploy and Monitor Script
# Usage: ./scripts/deploy-and-monitor.sh "commit message"

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() {
    echo -e "${1}${2}${NC}"
}

print_header() {
    echo
    print_status $PURPLE "🚀 ATTENDANCE TRACKER - DEPLOY & MONITOR"
    print_status $PURPLE "========================================"
    echo
}

# Check if commit message provided
if [ -z "$1" ]; then
    print_status $RED "❌ Please provide a commit message"
    echo "Usage: $0 \"Your commit message\""
    exit 1
fi

COMMIT_MSG="$1"
BRANCH=$(git branch --show-current)

print_header

print_status $BLUE "📋 Deployment Summary:"
print_status $CYAN "  Branch: $BRANCH"
print_status $CYAN "  Message: $COMMIT_MSG"
echo

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    print_status $YELLOW "📝 Found uncommitted changes, committing..."
    git add .
    git commit -m "$COMMIT_MSG"
else
    print_status $YELLOW "ℹ️  No changes to commit"
fi

# Push to remote
print_status $BLUE "📤 Pushing to origin/$BRANCH..."
git push origin $BRANCH

print_status $GREEN "✅ Push completed!"
echo

# Wait a moment for GitHub to register the push
print_status $YELLOW "⏳ Waiting for GitHub Actions to start..."
sleep 5

# Start monitoring
print_status $BLUE "🔍 Starting workflow monitor..."
echo

# Run the monitoring script
./scripts/monitor-deployment.sh
