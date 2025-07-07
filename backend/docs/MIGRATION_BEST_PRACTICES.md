# Migration Best Practices to Prevent Data Loss

## 1. Use Proper Migration Tools

Instead of raw SQL scripts that drop tables, use a migration tool like:
- **Sequelize Migrations** (built into Sequelize)
- **node-pg-migrate**
- **db-migrate**

## 2. Never Use DROP TABLE in Production

- Use `ALTER TABLE` commands instead
- Add new columns with `ALTER TABLE ADD COLUMN`
- Remove columns with `ALTER TABLE DROP COLUMN`
- Modify columns with `ALTER TABLE ALTER COLUMN`

## 3. Always Backup Before Migrations

```bash
# Backup database before any migration
pg_dump -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 4. Use Sequelize Migrations Properly

```bash
# Initialize migrations
npx sequelize-cli init

# Create a new migration
npx sequelize-cli migration:generate --name add-new-column

# Run migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo
```

## 5. Example Safe Migration

```javascript
// migrations/20240101000000-add-phone-to-users.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'phone');
  }
};
```

## 6. Development vs Production Strategies

### Development:
- Can use `sync({ alter: true })` for quick changes
- Can drop and recreate tables if needed

### Production:
- NEVER use `sync()` or `DROP TABLE`
- Always use versioned migrations
- Test migrations on staging first
- Keep rollback scripts ready

## 7. Migration Workflow

1. **Create migration file**
2. **Test on local database**
3. **Backup production database**
4. **Run migration on staging**
5. **Verify data integrity**
6. **Run migration on production**
7. **Verify again**

## 8. Environment-Specific Configurations

```javascript
// config/database.js
const config = {
  development: {
    // Allow sync in development
    sync: { alter: true }
  },
  production: {
    // Never sync in production
    sync: false,
    // Use migrations only
    migrationStorageTableName: 'sequelize_migrations'
  }
};
```
