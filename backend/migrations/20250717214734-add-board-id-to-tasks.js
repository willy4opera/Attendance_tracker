'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if column already exists
      const tableDescription = await queryInterface.describeTable('Tasks');
      if (tableDescription.board_id) {
        console.log('Column board_id already exists in Tasks table');
        return;
      }

      // Add board_id column to Tasks table
      await queryInterface.addColumn('Tasks', 'board_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Boards',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      console.log('Added board_id column to Tasks table');

      // Add index for board_id
      await queryInterface.addIndex('Tasks', ['board_id'], {
        name: 'tasks_board_id_idx'
      });

      console.log('Added index on board_id');

      // Populate board_id from TaskLists - using the actual column name
      const [results] = await queryInterface.sequelize.query(`
        UPDATE "Tasks" t
        SET board_id = tl.board_id
        FROM "TaskLists" tl
        WHERE t.task_list_id = tl.id
        RETURNING t.id
      `);

      console.log(`Updated ${results.length} tasks with board_id`);

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Check if column exists before trying to remove it
      const tableDescription = await queryInterface.describeTable('Tasks');
      if (!tableDescription.board_id) {
        console.log('Column board_id does not exist in Tasks table');
        return;
      }

      // Remove index first
      const indexes = await queryInterface.showIndex('Tasks');
      const indexExists = indexes.some(index => index.name === 'tasks_board_id_idx');
      
      if (indexExists) {
        await queryInterface.removeIndex('Tasks', 'tasks_board_id_idx');
        console.log('Removed index tasks_board_id_idx');
      }
      
      // Remove column
      await queryInterface.removeColumn('Tasks', 'board_id');
      console.log('Removed board_id column from Tasks table');

    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
