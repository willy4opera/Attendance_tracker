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
        "firstName" VARCHAR(255) NOT NULL,
        "lastName" VARCHAR(255) NOT NULL,
        "phoneNumber" VARCHAR(255),
        "departmentId" INTEGER,
        "profilePicture" VARCHAR(255),
        "lastLogin" TIMESTAMP WITH TIME ZONE,
        "isActive" BOOLEAN DEFAULT true,
        "isEmailVerified" BOOLEAN DEFAULT false,
        "emailVerificationToken" VARCHAR(255),
        "emailVerificationExpires" TIMESTAMP WITH TIME ZONE,
        "resetPasswordToken" VARCHAR(255),
        "resetPasswordExpires" TIMESTAMP WITH TIME ZONE,
        "failedLoginAttempts" INTEGER DEFAULT 0,
        "accountLockedUntil" TIMESTAMP WITH TIME ZONE,
        "preferences" JSON DEFAULT '{"notifications":{"email":true,"inApp":true,"sms":false},"theme":"light","language":"en"}',
        "metadata" JSON DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create Departments table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Departments" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) UNIQUE NOT NULL,
        "code" VARCHAR(10) UNIQUE NOT NULL,
        "description" TEXT,
        "headOfDepartmentId" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "parentDepartmentId" INTEGER REFERENCES "Departments"("id") ON DELETE SET NULL,
        "isActive" BOOLEAN DEFAULT true,
        "metadata" JSON DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Add foreign key for departmentId in Users table
    await sequelize.query(`
      ALTER TABLE "Users" 
      ADD CONSTRAINT "Users_departmentId_fkey" 
      FOREIGN KEY ("departmentId") 
      REFERENCES "Departments"("id") 
      ON DELETE SET NULL;
    `);

    // Create Sessions table (UUID primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Sessions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "facilitatorId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "sessionDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "startTime" TIME NOT NULL,
        "endTime" TIME NOT NULL,
        "status" VARCHAR(50) DEFAULT 'scheduled',
        "location" VARCHAR(255),
        "isVirtual" BOOLEAN DEFAULT false,
        "meetingLink" VARCHAR(255),
        "meetingType" VARCHAR(50) DEFAULT 'other',
        "trackingEnabled" BOOLEAN DEFAULT true,
        "attendanceWindow" INTEGER DEFAULT 15,
        "virtualLink" VARCHAR(255),
        "capacity" INTEGER,
        "category" VARCHAR(255),
        "tags" VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR(255)[],
        "isRecurring" BOOLEAN DEFAULT false,
        "recurringPattern" JSONB,
        "parentSessionId" UUID REFERENCES "Sessions"("id"),
        "qrCode" TEXT,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create RecurringSessions table (UUID primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "recurring_sessions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(255) NOT NULL,
        "facilitatorId" INTEGER NOT NULL REFERENCES "Users"("id"),
        "patternType" VARCHAR(50) NOT NULL,
        "daysOfWeek" INTEGER[],
        "dayOfMonth" INTEGER,
        "interval" INTEGER DEFAULT 1,
        "time" TIME NOT NULL,
        "duration" INTEGER NOT NULL,
        "room" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endDate" TIMESTAMP WITH TIME ZONE,
        "isActive" BOOLEAN DEFAULT true,
        "exceptions" JSONB DEFAULT '[]',
        "lastGenerated" TIMESTAMP WITH TIME ZONE,
        "totalGenerated" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Add foreign key for recurringSessionId in Sessions
    await sequelize.query(`
      ALTER TABLE "Sessions" 
      ADD COLUMN "recurringSessionId" UUID REFERENCES "recurring_sessions"("id") ON DELETE SET NULL;
    `);

    // Create Attendances table (UUID primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Attendances" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "sessionId" UUID NOT NULL REFERENCES "Sessions"("id") ON DELETE CASCADE,
        "status" VARCHAR(50) DEFAULT 'absent',
        "checkInTime" TIMESTAMP WITH TIME ZONE,
        "checkOutTime" TIMESTAMP WITH TIME ZONE,
        "markedVia" VARCHAR(50) DEFAULT 'manual',
        "userAgent" VARCHAR(255),
        "markedBy" INTEGER REFERENCES "Users"("id"),
        "markedAt" TIMESTAMP WITH TIME ZONE,
        "notes" TEXT,
        "location" JSONB,
        "ipAddress" VARCHAR(255),
        "deviceInfo" JSONB,
        "isLate" BOOLEAN DEFAULT false,
        "lateMinutes" INTEGER DEFAULT 0,
        "duration" INTEGER,
        "verificationMethod" VARCHAR(50) DEFAULT 'manual',
        "isApproved" BOOLEAN DEFAULT true,
        "approvedBy" INTEGER REFERENCES "Users"("id"),
        "approvedAt" TIMESTAMP WITH TIME ZONE,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE("userId", "sessionId")
      );
    `);

    // Create Attachments table (UUID primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Attachments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "filename" VARCHAR(255) NOT NULL,
        "originalName" VARCHAR(255) NOT NULL,
        "mimeType" VARCHAR(255) NOT NULL,
        "size" INTEGER NOT NULL,
        "path" VARCHAR(255) NOT NULL,
        "url" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "uploadedBy" INTEGER NOT NULL REFERENCES "Users"("id"),
        "sessionId" UUID REFERENCES "Sessions"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create Notifications table (UUID primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Notifications" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "type" VARCHAR(50) DEFAULT 'info',
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "data" JSONB DEFAULT '{}',
        "read" BOOLEAN DEFAULT false,
        "readAt" TIMESTAMP WITH TIME ZONE,
        "priority" VARCHAR(50) DEFAULT 'normal',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create Projects table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Projects" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "code" VARCHAR(50) UNIQUE NOT NULL,
        "description" TEXT,
        "departmentId" INTEGER REFERENCES "Departments"("id") ON DELETE SET NULL,
        "projectManagerId" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
        "startDate" DATE,
        "endDate" DATE,
        "status" VARCHAR(50) DEFAULT 'active',
        "budget" DECIMAL(12,2),
        "isActive" BOOLEAN DEFAULT true,
        "metadata" JSON DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create UserProjects table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "UserProjects" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "projectId" INTEGER NOT NULL REFERENCES "Projects"("id") ON DELETE CASCADE,
        "role" VARCHAR(50) DEFAULT 'member',
        "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "leftAt" TIMESTAMP WITH TIME ZONE,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE("userId", "projectId")
      );
    `);

    // Create Boards table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Boards" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "projectId" INTEGER REFERENCES "Projects"("id") ON DELETE CASCADE,
        "departmentId" INTEGER REFERENCES "Departments"("id") ON DELETE SET NULL,
        "createdBy" INTEGER NOT NULL REFERENCES "Users"("id"),
        "visibility" VARCHAR(50) DEFAULT 'private',
        "color" VARCHAR(7) DEFAULT '#0079BF',
        "isArchived" BOOLEAN DEFAULT false,
        "settings" JSON DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create TaskLists table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "TaskLists" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "boardId" INTEGER NOT NULL REFERENCES "Boards"("id") ON DELETE CASCADE,
        "position" INTEGER NOT NULL DEFAULT 0,
        "color" VARCHAR(7),
        "isArchived" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create Tasks table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Tasks" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "taskListId" INTEGER NOT NULL REFERENCES "TaskLists"("id") ON DELETE CASCADE,
        "createdBy" INTEGER NOT NULL REFERENCES "Users"("id"),
        "assignedTo" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        "priority" VARCHAR(50) DEFAULT 'medium',
        "status" VARCHAR(50) DEFAULT 'todo',
        "dueDate" TIMESTAMP WITH TIME ZONE,
        "startDate" TIMESTAMP WITH TIME ZONE,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "estimatedHours" DECIMAL(5,2),
        "actualHours" DECIMAL(5,2),
        "position" INTEGER NOT NULL DEFAULT 0,
        "labels" VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR(255)[],
        "attachmentCount" INTEGER DEFAULT 0,
        "commentCount" INTEGER DEFAULT 0,
        "isArchived" BOOLEAN DEFAULT false,
        "metadata" JSON DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create TaskComments table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "TaskComments" (
        "id" SERIAL PRIMARY KEY,
        "taskId" INTEGER NOT NULL REFERENCES "Tasks"("id") ON DELETE CASCADE,
        "userId" INTEGER NOT NULL REFERENCES "Users"("id"),
        "content" TEXT NOT NULL,
        "parentId" INTEGER REFERENCES "TaskComments"("id") ON DELETE CASCADE,
        "isEdited" BOOLEAN DEFAULT false,
        "editedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create TaskActivities table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "TaskActivities" (
        "id" SERIAL PRIMARY KEY,
        "taskId" INTEGER NOT NULL REFERENCES "Tasks"("id") ON DELETE CASCADE,
        "userId" INTEGER NOT NULL REFERENCES "Users"("id"),
        "boardId" INTEGER NOT NULL REFERENCES "Boards"("id") ON DELETE CASCADE,
        "action" VARCHAR(50) NOT NULL,
        "details" JSON DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create TaskAttachments table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "TaskAttachments" (
        "id" SERIAL PRIMARY KEY,
        "taskId" INTEGER NOT NULL REFERENCES "Tasks"("id") ON DELETE CASCADE,
        "uploadedBy" INTEGER NOT NULL REFERENCES "Users"("id"),
        "filename" VARCHAR(255) NOT NULL,
        "originalName" VARCHAR(255) NOT NULL,
        "mimeType" VARCHAR(255) NOT NULL,
        "size" INTEGER NOT NULL,
        "url" VARCHAR(255) NOT NULL,
        "attachmentType" VARCHAR(50) DEFAULT 'file',
        "metadata" JSON DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create BoardMembers table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "BoardMembers" (
        "id" SERIAL PRIMARY KEY,
        "boardId" INTEGER NOT NULL REFERENCES "Boards"("id") ON DELETE CASCADE,
        "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
        "role" VARCHAR(50) DEFAULT 'member',
        "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE("boardId", "userId")
      );
    `);

    // Create Labels table (INTEGER primary key)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Labels" (
        "id" SERIAL PRIMARY KEY,
        "boardId" INTEGER NOT NULL REFERENCES "Boards"("id") ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "color" VARCHAR(7) NOT NULL,
        "createdBy" INTEGER NOT NULL REFERENCES "Users"("id"),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    console.log('🔄 Creating indexes...');
    
    // User indexes
    await sequelize.query('CREATE INDEX "idx_users_email" ON "Users" ("email");');
    await sequelize.query('CREATE INDEX "idx_users_department" ON "Users" ("departmentId");');
    await sequelize.query('CREATE INDEX "idx_users_active" ON "Users" ("isActive");');
    
    // Session indexes
    await sequelize.query('CREATE INDEX "idx_sessions_facilitator" ON "Sessions" ("facilitatorId");');
    await sequelize.query('CREATE INDEX "idx_sessions_date" ON "Sessions" ("sessionDate");');
    await sequelize.query('CREATE INDEX "idx_sessions_status" ON "Sessions" ("status");');
    
    // Attendance indexes
    await sequelize.query('CREATE INDEX "idx_attendance_user" ON "Attendances" ("userId");');
    await sequelize.query('CREATE INDEX "idx_attendance_session" ON "Attendances" ("sessionId");');
    await sequelize.query('CREATE INDEX "idx_attendance_status" ON "Attendances" ("status");');
    
    // Task indexes
    await sequelize.query('CREATE INDEX "idx_tasks_list" ON "Tasks" ("taskListId");');
    await sequelize.query('CREATE INDEX "idx_tasks_creator" ON "Tasks" ("createdBy");');
    await sequelize.query('CREATE INDEX "idx_tasks_status" ON "Tasks" ("status");');
    
    // Board indexes
    await sequelize.query('CREATE INDEX "idx_boards_project" ON "Boards" ("projectId");');
    await sequelize.query('CREATE INDEX "idx_boards_department" ON "Boards" ("departmentId");');
    
    console.log('✅ All indexes created.');

    // Create update trigger for updatedAt
    console.log('🔄 Creating triggers...');
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
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
