# 🚀 Deployment Scripts

This directory contains scripts to help you deploy and monitor your Attendance Tracker application.

## 📋 Prerequisites

1. **GitHub CLI** - Install and authenticate:
   ```bash
   # Install GitHub CLI
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
   sudo apt update && sudo apt install gh
   
   # Authenticate
   gh auth login
   ```

2. **Git repository** - Must be connected to GitHub with proper remote origin

## 🛠️ Scripts

### 1. `monitor-deployment.sh`
Monitors GitHub Actions workflows in real-time after you push code.

```bash
# Monitor workflows for current branch
./scripts/monitor-deployment.sh

# Check server health only
./scripts/monitor-deployment.sh --health

# Show git status only
./scripts/monitor-deployment.sh --status

# Show help
./scripts/monitor-deployment.sh --help
```

**Features:**
- ✅ Real-time workflow status updates
- 🎯 Branch-specific monitoring (main = deployment, develop/feature = CI only)
- 🏥 Server health checks after deployment
- 🎨 Colored output with status indicators
- 📊 Job-level progress tracking

### 2. `deploy-and-monitor.sh`
One-command deploy: commits, pushes, and monitors the deployment.

```bash
# Deploy with commit message
./scripts/deploy-and-monitor.sh "Fix user authentication bug"

# Deploy feature
./scripts/deploy-and-monitor.sh "Add new dashboard widget"
```

**Features:**
- 📝 Auto-commits all changes
- 📤 Pushes to current branch
- 🔍 Automatically starts monitoring
- 🚀 Perfect for quick deployments

## 🌊 Workflow Behavior

### **Main Branch** (Production)
When you push to `main`:
1. 🧪 **CI Pipeline** runs (tests, linting, security scans)
2. 🚀 **Deployment Pipeline** runs (builds, migrates, deploys to production)
3. 🏥 **Health checks** verify the deployment
4. 🌐 **Available at:** https://syncli.cloud/

### **Develop Branch** (Staging)
When you push to `develop`:
1. 🧪 **CI Pipeline** runs (tests, linting, security scans)
2. 📊 **Results** help ensure code quality before merging to main

### **Feature Branches**
When you push to feature branches:
1. 🧪 **CI Pipeline** runs (tests, linting, security scans)
2. 📊 **Results** shown in PR status checks

## 📱 Usage Examples

### Quick Development Workflow
```bash
# Make your changes
echo "console.log('New feature');" >> frontend/src/components/NewFeature.js

# Deploy and monitor in one command
./scripts/deploy-and-monitor.sh "Add new feature component"
```

### Manual Monitoring
```bash
# Push manually
git add .
git commit -m "Update user interface"
git push origin main

# Then monitor
./scripts/monitor-deployment.sh
```

### Health Check Only
```bash
# Quick server health check
./scripts/monitor-deployment.sh --health
```

## 🎯 Output Examples

### Successful Deployment
```
🚀 ATTENDANCE TRACKER DEPLOYMENT MONITOR
==================================================

📋 Workflow ID: 1234567890
🌐 URL: https://github.com/user/repo/actions/runs/1234567890

🔄 Workflow is running...
  ✅ test-backend: completed success
  ✅ test-frontend: completed success
  🔄 deploy: in_progress

✅ Production Deployment completed successfully!

🏥 Checking server health...
✅ Backend is healthy
✅ Frontend is healthy

🎉 Monitoring completed!
```

### Failed Deployment
```
❌ Production Deployment failed!
🔗 Check details: https://github.com/user/repo/actions/runs/1234567890
```

## 🔧 Troubleshooting

### GitHub CLI Issues
```bash
# Check if authenticated
gh auth status

# Re-authenticate if needed
gh auth login
```

### Permission Issues
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### Workflow Not Found
- Make sure you're on the correct branch
- Check that workflows exist in `.github/workflows/`
- Verify the repository is connected to GitHub

## 🌐 Server Information

- **Production URL:** https://syncli.cloud/
- **Backend API:** https://syncli.cloud/api/
- **Frontend:** https://syncli.cloud/
- **Backend Port:** 5000 (proxied via nginx)
- **Frontend Port:** 5173 (proxied via nginx)

Happy deploying! 🚀
