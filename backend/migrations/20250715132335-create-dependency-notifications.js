'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create dependency_notifications table
    await queryInterface.createTable('dependency_notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dependency_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'task_dependencies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      notification_type: {
        type: Sequelize.ENUM(
          'dependency_created',
          'dependency_updated',
          'dependency_removed',
          'dependency_violation',
          'dependency_warning',
          'dependency_resolved',
          'predecessor_started',
          'predecessor_completed',
          'successor_blocked',
          'successor_unblocked',
          'dependency_deadline_approaching',
          'critical_path_change'
        ),
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'critical'),
        defaultValue: 'normal'
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'delivered', 'failed', 'cancelled'),
        defaultValue: 'pending'
      },
      scheduled_at: {
        type: Sequelize.DATE
      },
      sent_at: {
        type: Sequelize.DATE
      },
      content: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Notification content including subject, body, and data'
      },
      recipients: {
        type: Sequelize.JSONB,
        defaultValue: [],
        comment: 'Array of recipient objects with userId, role, and channels'
      },
      channels: {
        type: Sequelize.JSONB,
        defaultValue: ['inApp'],
        comment: 'Array of notification channels: email, inApp, push'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Additional metadata including retry count, failure reason, etc.'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create dependency_notification_preferences table
    await queryInterface.createTable('dependency_notification_preferences', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      project_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Optional: preferences can be project-specific'
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      channels: {
        type: Sequelize.JSONB,
        defaultValue: {
          email: true,
          inApp: true,
          push: false
        }
      },
      events: {
        type: Sequelize.JSONB,
        defaultValue: {
          created: true,
          updated: true,
          violated: true,
          resolved: true,
          deadlineWarning: true,
          criticalPath: true
        }
      },
      frequency: {
        type: Sequelize.JSONB,
        defaultValue: {
          immediate: true,
          daily: false,
          weekly: false
        }
      },
      thresholds: {
        type: Sequelize.JSONB,
        defaultValue: {
          warningDays: 3,
          criticalHours: 24
        }
      },
      quiet_hours: {
        type: Sequelize.JSONB,
        defaultValue: null,
        comment: 'Optional quiet hours configuration'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create dependency_notification_logs table for tracking
    await queryInterface.createTable('dependency_notification_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      notification_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'dependency_notifications',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      channel: {
        type: Sequelize.ENUM('email', 'inApp', 'push'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced'),
        allowNull: false
      },
      delivered_at: {
        type: Sequelize.DATE
      },
      opened_at: {
        type: Sequelize.DATE
      },
      clicked_at: {
        type: Sequelize.DATE
      },
      failure_reason: {
        type: Sequelize.TEXT
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('dependency_notifications', ['dependency_id']);
    await queryInterface.addIndex('dependency_notifications', ['notification_type']);
    await queryInterface.addIndex('dependency_notifications', ['status']);
    await queryInterface.addIndex('dependency_notifications', ['scheduled_at']);
    await queryInterface.addIndex('dependency_notifications', ['priority', 'status']);

    await queryInterface.addIndex('dependency_notification_preferences', ['user_id']);
    await queryInterface.addIndex('dependency_notification_preferences', ['project_id']);
    await queryInterface.addIndex('dependency_notification_preferences', 
      ['user_id', 'project_id'], 
      {
        unique: true,
        name: 'unique_user_project_preferences'
      }
    );

    await queryInterface.addIndex('dependency_notification_logs', ['notification_id']);
    await queryInterface.addIndex('dependency_notification_logs', ['user_id']);
    await queryInterface.addIndex('dependency_notification_logs', ['channel']);
    await queryInterface.addIndex('dependency_notification_logs', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('dependency_notification_logs');
    await queryInterface.dropTable('dependency_notification_preferences');
    await queryInterface.dropTable('dependency_notifications');
  }
};
