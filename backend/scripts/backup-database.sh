#!/bin/bash

# Load environment variables
source .env

# Set defaults if not in .env
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-attendance_tracker_dev}
DB_USER=${DB_USER:-kali}

# Create backups directory if it doesn't exist
mkdir -p backups

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup filename
BACKUP_FILE="backups/backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "🔄 Starting database backup..."
echo "📁 Database: $DB_NAME"
echo "📄 Backup file: $BACKUP_FILE"

# Perform backup
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    echo "📏 File size: $(ls -lh $BACKUP_FILE | awk '{print $5}')"
    
    # Keep only last 10 backups
    ls -t backups/backup_*.sql | tail -n +11 | xargs -r rm
    echo "🗑️  Old backups cleaned up (keeping last 10)"
else
    echo "❌ Backup failed!"
    exit 1
fi
