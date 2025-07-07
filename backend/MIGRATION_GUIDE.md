# Migration Guide

## ⚠️ Important: Preventing Data Loss

This project now uses Sequelize migrations to manage database schema changes safely.

## Quick Start

### 1. Create a new migration
```bash
npm run migrate:create -- new-feature-name
```

### 2. Edit the migration file
Edit the generated file in `migrations/` folder.

### 3. Run migrations (with automatic backup)
```bash
npm run migrate:safe
```

## Available Commands

- `npm run migrate` - Run pending migrations
- `npm run migrate:undo` - Undo last migration
- `npm run migrate:undo:all` - Undo all migrations
- `npm run migrate:create -- name` - Create new migration
- `npm run backup` - Backup database manually
- `npm run migrate:safe` - Backup then migrate (recommended)

## Best Practices

1. **Always backup before migrating**
   ```bash
   npm run backup
   ```

2. **Test migrations locally first**
   ```bash
   # On your local development database
   npm run migrate
   ```

3. **Never use DROP TABLE in migrations**
   - Use ALTER TABLE instead
   - Add/remove columns incrementally

4. **Review migration files before running**
   - Check the generated SQL
   - Ensure rollback (down) function works

5. **For production deployments**
   ```bash
   # 1. Backup production database
   npm run backup
   
   # 2. Run migrations on staging
   NODE_ENV=staging npm run migrate
   
   # 3. Test thoroughly
   
   # 4. Run on production
   NODE_ENV=production npm run migrate:safe
   ```

## Example Migration

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new column
    await queryInterface.addColumn('Users', 'last_activity', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    // Remove column
    await queryInterface.removeColumn('Users', 'last_activity');
  }
};
```

## Emergency Rollback

If something goes wrong:

```bash
# Rollback last migration
npm run migrate:undo

# Restore from backup if needed
psql -U username -d database_name < backups/backup_file.sql
```

## Environment Variables

Make sure your `.env` file contains:
```
DB_NAME=attendance_tracker_dev
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

## Troubleshooting

1. **Migration fails**: Check error message, fix migration file, try again
2. **Data corrupted**: Restore from backup
3. **Can't rollback**: Manually fix with SQL, then update migration history

Remember: **Always backup before migrating!**
