const { sequelize } = require('../src/models');

// Increase timeout for database operations
jest.setTimeout(30000);

// Global setup
beforeAll(async () => {
  // Ensure we're using test database
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must be run with NODE_ENV=test');
  }
  
  // Sync database
  await sequelize.sync({ force: true });
});

// Global teardown
afterAll(async () => {
  await sequelize.close();
});

// Clean up after each test
afterEach(async () => {
  // Clean all tables except migrations
  const models = Object.values(sequelize.models);
  await Promise.all(
    models.map(model => model.destroy({ where: {}, truncate: true, cascade: true }))
  );
});

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};
