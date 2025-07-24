require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'attendance_tracker_dev',
  process.env.DB_USER || 'kali',
  process.env.DB_PASSWORD || 'kali',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

async function migrateDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Drop all tables to start fresh
    console.log('🔄 Dropping existing tables...');
    
    // Drop tables in reverse order of dependencies
    const tablesToDrop = [
      'Labels',
      'BoardMembers', 
      'TaskAttachments',
      'TaskActivities',
      'TaskComments',
      'Tasks',
      'TaskLists',
      'Boards',
      'UserProjects',
      'Projects',
      'Notifications',
      'Attachments',
      'Attendances',
      'Sessions',
      'recurring_sessions',
      'Departments',
      'Users'
    ];

    for (const table of tablesToDrop) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
        console.log(`✅ Dropped table ${table}`);
      } catch (err) {
        console.log(`⚠️ Could not drop table ${table}: ${err.message}`);
      }
    }

    console.log('✅ All tables dropped.');

    // Create Users table first (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) DEFAULT 'user',
        "first_name" VARCHAR(255) NOT NULL,
        "last_name" VARCHAR(255) NOT NULL,
        "phone_number" VARCHAR(255),
        "department_id" INTEGER,
        "profile_picture" VARCHAR(255),
        "last_login" TIMESTAMP WITH TIME ZONE,
        "is_active" BOOLEAN DEFAULT true,
        "is_email_verified" BOOLEAN DEFAULT false,
        "email_verification_token" VARCHAR(255),
        "email_verification_expires" TIMESTAMP WITH TIME ZONE,
        "reset_password_token" VARCHAR(255),
        "reset_password_expires" TIMESTAMP WITH TIME ZONE,
        "failed_login_attempts" INTEGER DEFAULT 0,
        "account_locked_until" TIMESTAMP WITH TIME ZONE,
        "preferences" JSON DEFAULT '{"notifications":{"email":true,"inApp":true,"sms":false},"theme":"light","language":"en"}',
        "metadata" JSON DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create Departments table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Departments" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) UNIQUE NOT NULL,
        "code" VARCHAR(10) UNIQUE NOT NULL,
        "description" TEXT,
        "head_of_department_id" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "parent_department_id" INTEGER REFERENCES "Departments"("id") ON DELETE SET NULL,
        "is_active" BOOLEAN DEFAULT true,
        "metadata" JSON DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Add foreign key for department_id in Users table
    await sequelize.query(`
      ALTER TABLE "Users" 
      ADD CONSTRAINT "Users_department_id_fkey" 
      FOREIGN KEY ("department_id") 
      REFERENCES "Departments"("id") 
      ON DELETE SET NULL;
    `);

    // Create Sessions table (UUID primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Sessions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "facilitator_id" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "session_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "status" VARCHAR(50) DEFAULT 'scheduled',
        "location" VARCHAR(255),
        "is_virtual" BOOLEAN DEFAULT false,
        "meeting_link" VARCHAR(255),
        "meeting_type" VARCHAR(50) DEFAULT 'other',
        "tracking_enabled" BOOLEAN DEFAULT true,
        "attendance_window" INTEGER DEFAULT 15,
        "virtual_link" VARCHAR(255),
        "capacity" INTEGER,
        "category" VARCHAR(255),
        "tags" VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR(255)[],
        "is_recurring" BOOLEAN DEFAULT false,
        "recurring_pattern" JSONB,
        "parent_session_id" UUID REFERENCES "Sessions"("id"),
        "qr_code" TEXT,
        "metadata" JSONB DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "recurring_session_id" UUID
      );
    `);

    // Create RecurringSessions table (UUID primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "recurring_sessions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(255) NOT NULL,
        "facilitator_id" INTEGER NOT NULL REFERENCES "Users"("id"),
        "pattern_type" VARCHAR(50) NOT NULL,
        "days_of_week" INTEGER[],
        "day_of_month" INTEGER,
        "interval" INTEGER DEFAULT 1,
        "time" TIME NOT NULL,
        "duration" INTEGER NOT NULL,
        "room" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_date" TIMESTAMP WITH TIME ZONE,
        "is_active" BOOLEAN DEFAULT true,
        "exceptions" JSONB DEFAULT '[]',
        "last_generated" TIMESTAMP WITH TIME ZONE,
        "total_generated" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Add foreign key for recurring_session_id in Sessions
    await sequelize.query(`
      ALTER TABLE "Sessions" 
      ADD CONSTRAINT "Sessions_recurring_session_id_fkey"
      FOREIGN KEY ("recurring_session_id") 
      REFERENCES "recurring_sessions"("id") 
      ON DELETE SET NULL;
    `);

    // Create Attendances table (UUID primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Attendances" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "session_id" UUID NOT NULL REFERENCES "Sessions"("id") ON DELETE CASCADE,
        "status" VARCHAR(50) DEFAULT 'absent',
        "check_in_time" TIMESTAMP WITH TIME ZONE,
        "check_out_time" TIMESTAMP WITH TIME ZONE,
        "marked_via" VARCHAR(50) DEFAULT 'manual',
        "user_agent" VARCHAR(255),
        "marked_by" INTEGER REFERENCES "Users"("id"),
        "marked_at" TIMESTAMP WITH TIME ZONE,
        "notes" TEXT,
        "location" JSONB,
        "ip_address" VARCHAR(255),
        "device_info" JSONB,
        "is_late" BOOLEAN DEFAULT false,
        "late_minutes" INTEGER DEFAULT 0,
        "duration" INTEGER,
        "verification_method" VARCHAR(50) DEFAULT 'manual',
        "is_approved" BOOLEAN DEFAULT true,
        "approved_by" INTEGER REFERENCES "Users"("id"),
        "approved_at" TIMESTAMP WITH TIME ZONE,
        "metadata" JSONB DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE("user_id", "session_id")
      );
    `);

    // Create Attachments table (UUID primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Attachments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "filename" VARCHAR(255) NOT NULL,
        "original_name" VARCHAR(255) NOT NULL,
        "mime_type" VARCHAR(255) NOT NULL,
        "size" INTEGER NOT NULL,
        "path" VARCHAR(255) NOT NULL,
        "url" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "uploaded_by" INTEGER NOT NULL REFERENCES "Users"("id"),
        "session_id" UUID REFERENCES "Sessions"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create Notifications table (UUID primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Notifications" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "type" VARCHAR(50) DEFAULT 'info',
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "data" JSONB DEFAULT '{}',
        "read" BOOLEAN DEFAULT false,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "priority" VARCHAR(50) DEFAULT 'normal',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create Projects table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Projects" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "code" VARCHAR(50) UNIQUE NOT NULL,
        "description" TEXT,
        "department_id" INTEGER REFERENCES "Departments"("id") ON DELETE SET NULL,
        "project_manager_id" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "start_date" DATE,
        "end_date" DATE,
        "status" VARCHAR(50) DEFAULT 'active',
        "budget" DECIMAL(12,2),
        "is_active" BOOLEAN DEFAULT true,
        "metadata" JSON DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create UserProjects table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "UserProjects" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "project_id" INTEGER NOT NULL REFERENCES "Projects"("id") ON DELETE CASCADE,
        "role" VARCHAR(50) DEFAULT 'member',
        "joined_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "left_at" TIMESTAMP WITH TIME ZONE,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE("user_id", "project_id")
      );
    `);

    // Create Boards table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Boards" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "project_id" INTEGER REFERENCES "Projects"("id") ON DELETE CASCADE,
        "department_id" INTEGER REFERENCES "Departments"("id") ON DELETE SET NULL,
        "created_by" INTEGER NOT NULL REFERENCES "Users"("id"),
        "visibility" VARCHAR(50) DEFAULT 'private',
        "color" VARCHAR(7) DEFAULT '#0079BF',
        "is_archived" BOOLEAN DEFAULT false,
        "settings" JSON DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create TaskLists table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "TaskLists" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "board_id" INTEGER NOT NULL REFERENCES "Boards"("id") ON DELETE CASCADE,
        "position" INTEGER NOT NULL DEFAULT 0,
        "color" VARCHAR(7),
        "is_archived" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create Tasks table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Tasks" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "task_list_id" INTEGER NOT NULL REFERENCES "TaskLists"("id") ON DELETE CASCADE,
        "created_by" INTEGER NOT NULL REFERENCES "Users"("id"),
        "assigned_to" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        "priority" VARCHAR(50) DEFAULT 'medium',
        "status" VARCHAR(50) DEFAULT 'todo',
        "due_date" TIMESTAMP WITH TIME ZONE,
        "start_date" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "estimated_hours" DECIMAL(5,2),
        "actual_hours" DECIMAL(5,2),
        "position" INTEGER NOT NULL DEFAULT 0,
        "labels" VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR(255)[],
        "attachment_count" INTEGER DEFAULT 0,
        "comment_count" INTEGER DEFAULT 0,
        "is_archived" BOOLEAN DEFAULT false,
        "metadata" JSON DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create TaskComments table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "TaskComments" (
        "id" SERIAL PRIMARY KEY,
        "task_id" INTEGER NOT NULL REFERENCES "Tasks"("id") ON DELETE CASCADE,
        "user_id" INTEGER NOT NULL REFERENCES "Users"("id"),
        "content" TEXT NOT NULL,
        "parent_id" INTEGER REFERENCES "TaskComments"("id") ON DELETE CASCADE,
        "is_edited" BOOLEAN DEFAULT false,
        "edited_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create TaskActivities table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "TaskActivities" (
        "id" SERIAL PRIMARY KEY,
        "task_id" INTEGER NOT NULL REFERENCES "Tasks"("id") ON DELETE CASCADE,
        "user_id" INTEGER NOT NULL REFERENCES "Users"("id"),
        "board_id" INTEGER NOT NULL REFERENCES "Boards"("id") ON DELETE CASCADE,
        "action" VARCHAR(50) NOT NULL,
        "details" JSON DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create TaskAttachments table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "TaskAttachments" (
        "id" SERIAL PRIMARY KEY,
        "task_id" INTEGER NOT NULL REFERENCES "Tasks"("id") ON DELETE CASCADE,
        "uploaded_by" INTEGER NOT NULL REFERENCES "Users"("id"),
        "filename" VARCHAR(255) NOT NULL,
        "original_name" VARCHAR(255) NOT NULL,
        "mime_type" VARCHAR(255) NOT NULL,
        "size" INTEGER NOT NULL,
        "url" VARCHAR(255) NOT NULL,
        "attachment_type" VARCHAR(50) DEFAULT 'file',
        "metadata" JSON DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create BoardMembers table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "BoardMembers" (
        "id" SERIAL PRIMARY KEY,
        "board_id" INTEGER NOT NULL REFERENCES "Boards"("id") ON DELETE CASCADE,
        "user_id" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "role" VARCHAR(50) DEFAULT 'member',
        "joined_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE("board_id", "user_id")
      );
    `);

    // Create Labels table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Labels" (
        "id" SERIAL PRIMARY KEY,
        "board_id" INTEGER NOT NULL REFERENCES "Boards"("id") ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "color" VARCHAR(7) NOT NULL,
        "created_by" INTEGER NOT NULL REFERENCES "Users"("id"),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    console.log('🔄 Creating indexes...');
    
    // User indexes
    await sequelize.query('CREATE INDEX "idx_users_email" ON "Users" ("email");');
    await sequelize.query('CREATE INDEX "idx_users_department" ON "Users" ("department_id");');
    await sequelize.query('CREATE INDEX "idx_users_active" ON "Users" ("is_active");');
    
    // Session indexes
    await sequelize.query('CREATE INDEX "idx_sessions_facilitator" ON "Sessions" ("facilitator_id");');
    await sequelize.query('CREATE INDEX "idx_sessions_date" ON "Sessions" ("session_date");');
    await sequelize.query('CREATE INDEX "idx_sessions_status" ON "Sessions" ("status");');
    
    // Attendance indexes
    await sequelize.query('CREATE INDEX "idx_attendance_user" ON "Attendances" ("user_id");');
    await sequelize.query('CREATE INDEX "idx_attendance_session" ON "Attendances" ("session_id");');
    await sequelize.query('CREATE INDEX "idx_attendance_status" ON "Attendances" ("status");');
    
    // Task indexes
    await sequelize.query('CREATE INDEX "idx_tasks_list" ON "Tasks" ("task_list_id");');
    await sequelize.query('CREATE INDEX "idx_tasks_creator" ON "Tasks" ("created_by");');
    await sequelize.query('CREATE INDEX "idx_tasks_status" ON "Tasks" ("status");');
    
    // Board indexes
    await sequelize.query('CREATE INDEX "idx_boards_project" ON "Boards" ("project_id");');
    await sequelize.query('CREATE INDEX "idx_boards_department" ON "Boards" ("department_id");');
    
    console.log('✅ All indexes created.');

    // Create update trigger for updated_at
    console.log('🔄 Creating triggers...');
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updated_at" = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Apply trigger to all tables
    const tables = [
      'Users', 'Departments', 'Sessions', 'Attendances', 'Attachments',
      'Notifications', 'recurring_sessions', 'Projects', 'UserProjects',
      'Boards', 'TaskLists', 'Tasks', 'TaskComments', 'TaskActivities',
      'TaskAttachments', 'BoardMembers', 'Labels'
    ];

    for (const table of tables) {
      await sequelize.query(`
        CREATE TRIGGER update_${table}_updated_at 
        BEFORE UPDATE ON "${table}" 
        FOR EACH ROW 
        EXECUTE PROCEDURE update_updated_at_column();
      `);
    }

    console.log('✅ All triggers created.');
    console.log('✅ Database migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
migrateDatabase();
