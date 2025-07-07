# Attendance Tracker - Deployment Guide

This guide provides comprehensive instructions for deploying the Attendance Tracker application in various environments.

## Table of Contents

1. [Production Deployment - Linux Server](#production-deployment---linux-server)
2. [Development Setup](#development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Environment Variables](#environment-variables)
5. [Common Issues and Solutions](#common-issues-and-solutions)
6. [Security Checklist](#security-checklist)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Production Deployment - Linux Server

### Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- Domain name (optional but recommended)
- SSL certificate (can use Let's Encrypt)

### 1. System Preparation

#### Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Required Dependencies
```bash
# Node.js and npm (using NodeSource repository for latest LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Redis (if using for sessions/caching)
sudo apt install -y redis-server

# Additional tools
sudo apt install -y git nginx build-essential
```

#### Verify Installations
```bash
node -v  # Should show v18.x or later
npm -v   # Should show 9.x or later
psql --version  # Should show 14.x or later
redis-server --version  # Should show 6.x or later
```

### 2. Database Setup

#### Configure PostgreSQL
```bash
# Switch to postgres user
sudo -i -u postgres
psql

# Create database and user
CREATE DATABASE attendance_tracker;
CREATE USER attendance_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE attendance_tracker TO attendance_user;
\q
exit
```

#### Configure PostgreSQL Authentication
Edit `/etc/postgresql/14/main/pg_hba.conf`:
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Ensure this line exists:
```
local   all             all                                     md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 3. Application Setup

#### Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/yourusername/Attendance_tracker.git
sudo chown -R $USER:$USER /var/www/Attendance_tracker
cd /var/www/Attendance_tracker
```

#### Backend Setup
```bash
cd backend
npm install --production

# Copy and configure environment variables
cp .env.example .env
nano .env  # Edit with your production values
```

#### Frontend Setup
```bash
cd ../frontend
npm install
npm run build  # Creates production build in 'build' directory
```

### 4. Process Management with PM2

#### Install PM2
```bash
sudo npm install -g pm2
```

#### Create PM2 Configuration
Create `ecosystem.config.js` in the backend directory:
```javascript
module.exports = {
  apps: [{
    name: 'attendance-backend',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### Start Application
```bash
cd /var/www/Attendance_tracker/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd  # Follow the instructions provided
```

### 5. Nginx Configuration

#### Create Nginx Server Block
```bash
sudo nano /etc/nginx/sites-available/attendance-tracker
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        root /var/www/Attendance_tracker/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads directory (if needed)
    location /uploads {
        alias /var/www/Attendance_tracker/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Enable Site and Restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/attendance-tracker /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### 6. SSL Setup with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is set up automatically
sudo certbot renew --dry-run  # Test renewal
```

### 7. Firewall Configuration

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Development Setup

### Quick Start

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/Attendance_tracker.git
   cd Attendance_tracker
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your local database credentials
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm start
   ```

4. **Database Setup**
   - Install PostgreSQL locally
   - Create database: `createdb attendance_tracker`
   - Run migrations (if available) or let Sequelize auto-sync

---

## Docker Deployment

### Docker Compose Setup

Create `docker-compose.yml` in project root:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: attendance_tracker
      POSTGRES_USER: attendance_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    depends_on:
      - postgres
      - redis
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://attendance_user:${DB_PASSWORD}@postgres:5432/attendance_tracker
      REDIS_URL: redis://redis:6379
    ports:
      - "5000:5000"
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "3000:80"

volumes:
  postgres_data:
```

### Backend Dockerfile

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### Frontend Dockerfile

Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Environment Variables

### Backend (.env)

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance_tracker
DB_USER=attendance_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_very_long_random_string_here
REFRESH_TOKEN_SECRET=another_very_long_random_string_here
JWT_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d

# Email Configuration (if using)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=https://your-domain.com

# File Upload
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Redis (if using)
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)

```bash
# API Configuration
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_WEBSOCKET_URL=wss://your-domain.com

# Other frontend-specific variables
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

---

## Common Issues and Solutions

### 1. Database Connection Issues

**Problem**: Cannot connect to PostgreSQL
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in `.env` file
- Check pg_hba.conf authentication method
- Ensure database and user exist

### 2. Permission Issues

**Problem**: EACCES permission denied
```
Error: EACCES: permission denied, mkdir '/var/www/Attendance_tracker/backend/uploads'
```

**Solution**:
```bash
sudo chown -R $USER:$USER /var/www/Attendance_tracker
chmod -R 755 /var/www/Attendance_tracker
```

### 3. SSL Certificate Issues

**Problem**: SSL certificate errors with PostgreSQL

**Solution**:
```bash
# Fix SSL certificate permissions
sudo chown postgres:ssl-cert /etc/ssl/private/ssl-cert-snakeoil.key
sudo chmod 640 /etc/ssl/private/ssl-cert-snakeoil.key
sudo usermod -a -G ssl-cert postgres
```

### 4. Port Already in Use

**Problem**: Port 5000 is already in use

**Solution**:
```bash
# Find process using port
sudo lsof -i :5000

# Kill process if needed
sudo kill -9 <PID>

# Or change port in .env file
```

### 5. Memory Issues

**Problem**: Node.js heap out of memory

**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Or in PM2 config
env: {
  NODE_OPTIONS: '--max-old-space-size=4096'
}
```

---

## Security Checklist

### Application Security

- [ ] Use strong, unique passwords for database
- [ ] Generate cryptographically secure JWT secrets
- [ ] Enable CORS with specific origins only
- [ ] Implement rate limiting
- [ ] Validate and sanitize all user inputs
- [ ] Use HTTPS everywhere
- [ ] Keep dependencies updated
- [ ] Implement proper error handling (don't expose stack traces)
- [ ] Use environment variables for sensitive data
- [ ] Implement proper session management

### Server Security

- [ ] Configure firewall (UFW/iptables)
- [ ] Disable root SSH login
- [ ] Use SSH keys instead of passwords
- [ ] Keep system packages updated
- [ ] Install and configure fail2ban
- [ ] Set up regular automated backups
- [ ] Monitor server logs
- [ ] Use non-root user for application
- [ ] Configure SELinux/AppArmor if available
- [ ] Regular security audits

### Database Security

- [ ] Use strong passwords
- [ ] Restrict database access to localhost only
- [ ] Regular backups with encryption
- [ ] Use SSL for database connections
- [ ] Principle of least privilege for database users
- [ ] Keep PostgreSQL updated
- [ ] Enable query logging for audit trails

---

## Monitoring and Maintenance

### PM2 Monitoring

```bash
# View all processes
pm2 list

# Monitor in real-time
pm2 monit

# View logs
pm2 logs attendance-backend

# View detailed process info
pm2 show attendance-backend
```

### Log Management

Create log rotation configuration:
```bash
sudo nano /etc/logrotate.d/attendance-tracker
```

Add:
```
/var/www/Attendance_tracker/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Database Backup

Create backup script:
```bash
#!/bin/bash
# /home/user/scripts/backup-attendance.sh

BACKUP_DIR="/home/user/backups"
DB_NAME="attendance_tracker"
DB_USER="attendance_user"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/attendance_$DATE.sql.gz

# Delete backups older than 30 days
find $BACKUP_DIR -name "attendance_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /home/user/scripts/backup-attendance.sh
```

### Health Checks

Create health check endpoint in backend:
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'connected' // Add actual DB check
  });
});
```

### Update Procedure

1. **Backup everything**
   ```bash
   # Backup database
   pg_dump -U attendance_user attendance_tracker > backup_$(date +%Y%m%d).sql
   
   # Backup application files
   tar -czf attendance_backup_$(date +%Y%m%d).tar.gz /var/www/Attendance_tracker
   ```

2. **Update application**
   ```bash
   cd /var/www/Attendance_tracker
   git pull origin main
   
   # Update backend
   cd backend
   npm install --production
   pm2 reload attendance-backend
   
   # Update frontend
   cd ../frontend
   npm install
   npm run build
   ```

3. **Run migrations** (if applicable)
   ```bash
   cd backend
   npm run migrate
   ```

4. **Verify deployment**
   - Check application logs
   - Test critical features
   - Monitor for errors

---

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## Support

For issues and questions:
- Check the [Common Issues](#common-issues-and-solutions) section
- Review application logs
- Check server resources (CPU, memory, disk space)
- Contact system administrator or development team

Last updated: $(date +%Y-%m-%d)
