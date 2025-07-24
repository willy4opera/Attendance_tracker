#!/bin/bash

# Environment File Generator Script
# This script processes environment templates and generates production .env files

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${1}${2}${NC}"
}

# Function to process environment template
process_env_template() {
    local template_file=$1
    local output_file=$2
    local env_prefix=${3:-""}
    
    if [ ! -f "$template_file" ]; then
        print_status $RED "❌ Template file not found: $template_file"
        return 1
    fi
    
    print_status $YELLOW "📝 Processing template: $template_file → $output_file"
    
    # Create a temporary file to process the template
    local temp_file=$(mktemp)
    
    # Copy template to temp file
    cp "$template_file" "$temp_file"
    
    # Process each environment variable
    while IFS='=' read -r key value; do
        if [[ $key =~ ^\s*# ]] || [[ -z $key ]]; then
            continue
        fi
        
        # Remove any whitespace from key
        key=$(echo "$key" | xargs)
        
        # Check if this is a variable placeholder (${VAR_NAME})
        if [[ $value =~ \$\{([^}]+)\} ]]; then
            var_name="${BASH_REMATCH[1]}"
            
            # Try to get the value from environment variables
            env_var_name="${env_prefix}${var_name}"
            env_value=""
            
            # Check for the environment variable
            if [ ! -z "${!env_var_name:-}" ]; then
                env_value="${!env_var_name}"
            elif [ ! -z "${!var_name:-}" ]; then
                env_value="${!var_name}"
            else
                print_status $YELLOW "⚠️  No value found for ${var_name}, using placeholder"
                env_value="REPLACE_${var_name}_HERE"
            fi
            
            # Replace the placeholder in the temp file
            sed -i "s|\${${var_name}}|${env_value}|g" "$temp_file"
        fi
    done < "$template_file"
    
    # Move the processed file to the output location
    mv "$temp_file" "$output_file"
    chmod 600 "$output_file"
    
    print_status $GREEN "✅ Generated: $output_file"
}

# Main function
main() {
    print_status $GREEN "🔧 Generating production environment files..."
    
    # Process backend environment
    if [ -f ".env.production.template" ]; then
        process_env_template ".env.production.template" "backend/.env"
    fi
    
    # Process frontend environment
    if [ -f ".env.frontend.production.template" ]; then
        process_env_template ".env.frontend.production.template" "frontend/.env"
    fi
    
    print_status $GREEN "✅ Environment file generation completed!"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_status $RED "❌ Please run this script from the project root directory"
    exit 1
fi

main "$@"
