require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'kali',
    password: process.env.DB_PASSWORD || 'kali',
    database: process.env.DB_NAME || 'attendance_tracker_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    seederStorage: 'sequelize',
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'SequelizeMeta',
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true
    }
  },
  test: {
    username: process.env.DB_USER || 'kali',
    password: process.env.DB_PASSWORD || 'kali',
    database: process.env.DB_NAME || 'attendance_tracker_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    seederStorage: 'sequelize',
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'SequelizeMeta',
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};
