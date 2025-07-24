'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (!tableDescription.provider) {
      await queryInterface.addColumn('Users', 'provider', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'local'
      });
    }
    
    if (!tableDescription.google_id) {
      await queryInterface.addColumn('Users', 'google_id', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });
    }
    
    if (!tableDescription.facebook_id) {
      await queryInterface.addColumn('Users', 'facebook_id', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });
    }
    
    if (!tableDescription.github_id) {
      await queryInterface.addColumn('Users', 'github_id', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });
    }
    
    if (!tableDescription.linkedin_id) {
      await queryInterface.addColumn('Users', 'linkedin_id', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });
    }
    
    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addIndex('Users', ['provider'], {
      name: 'users_provider_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Users', 'users_provider_index');
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (tableDescription.provider) {
      await queryInterface.removeColumn('Users', 'provider');
    }
    
    if (tableDescription.google_id) {
      await queryInterface.removeColumn('Users', 'google_id');
    }
    
    if (tableDescription.facebook_id) {
      await queryInterface.removeColumn('Users', 'facebook_id');
    }
    
    if (tableDescription.github_id) {
      await queryInterface.removeColumn('Users', 'github_id');
    }
    
    if (tableDescription.linkedin_id) {
      await queryInterface.removeColumn('Users', 'linkedin_id');
    }

    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};
