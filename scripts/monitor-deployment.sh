#!/bin/bash

# Attendance Tracker - Deployment Monitor Script
# This script monitors GitHub Actions workflow after pushing to main/develop

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\).*/\1/')"
REPO_NAME="$(git config --get remote.origin.url | sed 's/.*\/\([^/]*\)\.git.*/\1/')"
BRANCH="$(git branch --show-current)"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print header
print_header() {
    echo
    print_status $PURPLE "=================================================="
    print_status $PURPLE "  🚀 ATTENDANCE TRACKER DEPLOYMENT MONITOR"
    print_status $PURPLE "=================================================="
    echo
}

# Function to check if gh CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_status $RED "❌ GitHub CLI (gh) is not installed!"
        echo
        print_status $YELLOW "Install it with:"
        echo "  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
        echo "  echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main\" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null"
        echo "  sudo apt update && sudo apt install gh"
        echo
        print_status $YELLOW "Then run: gh auth login"
        exit 1
    fi
}

# Function to check authentication
check_auth() {
    if ! gh auth status &> /dev/null; then
        print_status $RED "❌ Not authenticated with GitHub!"
        print_status $YELLOW "Run: gh auth login"
        exit 1
    fi
}

# Function to get latest workflow run
get_latest_workflow() {
    local workflow_name=$1
    gh run list --repo "$REPO_OWNER/$REPO_NAME" --workflow "$workflow_name" --branch "$BRANCH" --limit 1 --json databaseId,status,conclusion,url,createdAt --jq '.[0]'
}

# Function to monitor workflow
monitor_workflow() {
    local workflow_name=$1
    local display_name=$2
    
    print_status $BLUE "🔍 Monitoring $display_name workflow..."
    
    local run_data=$(get_latest_workflow "$workflow_name")
    
    if [ "$run_data" = "null" ] || [ -z "$run_data" ]; then
        print_status $YELLOW "⚠️  No recent $display_name workflow found for branch '$BRANCH'"
        return 1
    fi
    
    local run_id=$(echo "$run_data" | jq -r '.databaseId')
    local status=$(echo "$run_data" | jq -r '.status')
    local url=$(echo "$run_data" | jq -r '.url')
    
    print_status $CYAN "📋 Workflow ID: $run_id"
    print_status $CYAN "🌐 URL: $url"
    echo
    
    # Monitor the workflow
    while true; do
        local current_run=$(gh run view $run_id --repo "$REPO_OWNER/$REPO_NAME" --json status,conclusion,jobs)
        local current_status=$(echo "$current_run" | jq -r '.status')
        local conclusion=$(echo "$current_run" | jq -r '.conclusion')
        
        case $current_status in
            "queued")
                print_status $YELLOW "⏳ Workflow is queued..."
                ;;
            "in_progress")
                print_status $BLUE "🔄 Workflow is running..."
                
                # Show job statuses
                local jobs=$(echo "$current_run" | jq -r '.jobs[] | "\(.name): \(.status) \(.conclusion // "")"')
                echo "$jobs" | while read -r job; do
                    if [[ $job == *"completed"* ]]; then
                        if [[ $job == *"success"* ]]; then
                            print_status $GREEN "  ✅ $job"
                        elif [[ $job == *"failure"* ]]; then
                            print_status $RED "  ❌ $job"
                        else
                            print_status $YELLOW "  ⚠️  $job"
                        fi
                    else
                        print_status $BLUE "  🔄 $job"
                    fi
                done
                ;;
            "completed")
                case $conclusion in
                    "success")
                        print_status $GREEN "✅ $display_name completed successfully!"
                        ;;
                    "failure")
                        print_status $RED "❌ $display_name failed!"
                        print_status $YELLOW "🔗 Check details: $url"
                        ;;
                    "cancelled")
                        print_status $YELLOW "⚠️  $display_name was cancelled"
                        ;;
                    *)
                        print_status $YELLOW "⚠️  $display_name completed with status: $conclusion"
                        ;;
                esac
                break
                ;;
            *)
                print_status $YELLOW "❓ Unknown status: $current_status"
                ;;
        esac
        
        sleep 10
        echo -ne "\r\033[K" # Clear line
    done
}

# Function to monitor server health
monitor_server_health() {
    print_status $BLUE "🏥 Checking server health..."
    
    # Check backend
    print_status $YELLOW "🔍 Checking backend (https://syncli.cloud/api/health)..."
    if curl -f -s "https://syncli.cloud/api/health" > /dev/null 2>&1; then
        print_status $GREEN "✅ Backend is healthy"
    elif curl -f -s "https://syncli.cloud/health" > /dev/null 2>&1; then
        print_status $GREEN "✅ Backend is healthy"
    else
        print_status $RED "❌ Backend health check failed"
    fi
    
    # Check frontend
    print_status $YELLOW "🔍 Checking frontend (https://syncli.cloud/)..."
    if curl -f -s "https://syncli.cloud/" > /dev/null 2>&1; then
        print_status $GREEN "✅ Frontend is healthy"
    else
        print_status $RED "❌ Frontend health check failed"
    fi
}

# Function to show git status
show_git_status() {
    print_status $BLUE "📊 Current Git Status:"
    echo
    print_status $CYAN "Branch: $(git branch --show-current)"
    print_status $CYAN "Last commit: $(git log --oneline -1)"
    print_status $CYAN "Remote: $REPO_OWNER/$REPO_NAME"
    echo
}

# Main function
main() {
    print_header
    
    # Check prerequisites
    check_gh_cli
    check_auth
    
    show_git_status
    
    # Determine which workflows to monitor based on branch
    if [ "$BRANCH" = "main" ]; then
        print_status $GREEN "🎯 Monitoring PRODUCTION deployment on main branch"
        echo
        
        # Monitor CI first
        monitor_workflow "ci.yml" "CI Pipeline"
        echo
        
        # Monitor deployment
        monitor_workflow "deploy.yml" "Production Deployment"
        echo
        
        # Check server health after deployment
        sleep 30  # Wait for deployment to settle
        monitor_server_health
        
    elif [ "$BRANCH" = "develop" ]; then
        print_status $GREEN "🎯 Monitoring CI pipeline on develop branch"
        echo
        
        monitor_workflow "ci.yml" "CI Pipeline"
        
    else
        print_status $YELLOW "🎯 Monitoring CI pipeline on feature branch: $BRANCH"
        echo
        
        monitor_workflow "ci.yml" "CI Pipeline"
    fi
    
    echo
    print_status $PURPLE "=================================================="
    print_status $GREEN "🎉 Monitoring completed!"
    print_status $PURPLE "=================================================="
}

# Handle script arguments
case "${1:-}" in
    "--help"|"-h")
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Monitor GitHub Actions workflows for Attendance Tracker"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --health       Check server health only"
        echo "  --status       Show git status only"
        echo
        echo "Examples:"
        echo "  $0                    # Monitor workflows for current branch"
        echo "  $0 --health           # Check server health"
        echo "  $0 --status           # Show git status"
        exit 0
        ;;
    "--health")
        print_header
        monitor_server_health
        exit 0
        ;;
    "--status")
        print_header
        show_git_status
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_status $RED "❌ Unknown option: $1"
        print_status $YELLOW "Use --help for usage information"
        exit 1
        ;;
esac
