#!/bin/bash

# Setup convenient aliases for deployment

ALIAS_FILE="$HOME/.bashrc"
if [ -f "$HOME/.zshrc" ]; then
    ALIAS_FILE="$HOME/.zshrc"
fi

echo "🔧 Setting up deployment aliases..."

# Check if aliases already exist
if grep -q "# Attendance Tracker Aliases" "$ALIAS_FILE"; then
    echo "⚠️  Aliases already exist in $ALIAS_FILE"
    exit 0
fi

# Add aliases
cat >> "$ALIAS_FILE" << 'ALIASEOF'

# Attendance Tracker Aliases
alias att-deploy='./scripts/deploy-and-monitor.sh'
alias att-monitor='./scripts/monitor-deployment.sh'
alias att-health='./scripts/monitor-deployment.sh --health'
alias att-status='./scripts/monitor-deployment.sh --status'
ALIASEOF

echo "✅ Aliases added to $ALIAS_FILE"
echo ""
echo "🎉 You can now use:"
echo "  att-deploy 'commit message'  - Deploy and monitor"
echo "  att-monitor                  - Monitor current workflows"
echo "  att-health                   - Check server health"
echo "  att-status                   - Show git status"
echo ""
echo "🔄 Restart your terminal or run: source $ALIAS_FILE"
