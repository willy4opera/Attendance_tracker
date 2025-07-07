const { sequelize } = require('./src/config/database');

// Import all models to ensure they are registered
require('./src/models');

async function syncDatabase() {
  try {
    console.log('🔄 Starting database synchronization...\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.\n');
    
    // Sync all models with the database
    // alter: true will update existing tables to match the model definitions
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database synchronized successfully!\n');
    console.log('📋 Tables created/updated:');
    console.log('  - Users (updated with departmentId)');
    console.log('  - Departments');
    console.log('  - Projects'); 
    console.log('  - UserProjects');
    console.log('  - Boards');
    console.log('  - TaskLists');
    console.log('  - Tasks');
    console.log('  - TaskComments');
    console.log('  - TaskActivities');
    console.log('  - TaskAttachments');
    console.log('  - BoardMembers');
    console.log('  - Labels');
    console.log('\n✨ All models are ready to use!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error synchronizing database:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the sync
syncDatabase();
