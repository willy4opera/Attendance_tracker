const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.\n');
    
    // Check if Users table has firstName column
    const userColumns = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'Users' AND table_schema = 'public'`,
      { type: QueryTypes.SELECT }
    );
    
    const hasFirstName = userColumns.some(col => col.column_name === 'firstName');
    
    if (!hasFirstName) {
      console.log('📝 Adding firstName and lastName columns to Users table...');
      
      // First add columns as nullable
      await sequelize.query(`
        ALTER TABLE "Users" 
        ADD COLUMN IF NOT EXISTS "firstName" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "lastName" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "phoneNumber" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "departmentId" INTEGER,
        ADD COLUMN IF NOT EXISTS "profilePicture" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS "isEmailVerified" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "emailVerificationToken" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "resetPasswordToken" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "accountLockedUntil" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "preferences" JSONB DEFAULT '{"notifications":{"email":true,"inApp":true,"sms":false},"theme":"light","language":"en"}',
        ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'
      `);
      
      // Update existing records with default values
      await sequelize.query(`
        UPDATE "Users" 
        SET 
          "firstName" = COALESCE("firstName", split_part(email, '@', 1)),
          "lastName" = COALESCE("lastName", 'User'),
          "isActive" = COALESCE("isActive", true),
          "isEmailVerified" = COALESCE("isEmailVerified", false)
        WHERE "firstName" IS NULL OR "lastName" IS NULL
      `);
      
      // Now make firstName and lastName NOT NULL
      await sequelize.query(`
        ALTER TABLE "Users" 
        ALTER COLUMN "firstName" SET NOT NULL,
        ALTER COLUMN "lastName" SET NOT NULL
      `);
      
      console.log('✅ User table updated successfully!');
    }
    
    // Create new tables
    console.log('\n📝 Creating new tables...');
    
    // Import all models
    require('./src/models');
    
    // Sync new tables only (won't affect existing tables)
    await sequelize.sync({ alter: false });
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Tables in database:');
    
    const tables = await sequelize.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      { type: QueryTypes.SELECT }
    );
    
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the migration
migrateDatabase();
