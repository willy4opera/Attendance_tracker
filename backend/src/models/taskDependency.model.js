const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskDependency = sequelize.define('TaskDependency', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  predecessorTaskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'predecessor_task_id',
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  successorTaskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'successor_task_id',
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  dependencyType: {
    type: DataTypes.ENUM('FS', 'SS', 'FF', 'SF'),
    allowNull: false,
    defaultValue: 'FS',
    field: 'dependency_type',
    comment: 'FS=Finish-to-Start, SS=Start-to-Start, FF=Finish-to-Finish, SF=Start-to-Finish'
  },
  lagTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'lag_time',
    comment: 'Lag time in hours'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    field: 'updated_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'task_dependencies',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['predecessor_task_id']
    },
    {
      fields: ['successor_task_id']
    },
    {
      fields: ['dependency_type']
    },
    {
      fields: ['is_active']
    },
    {
      unique: true,
      fields: ['predecessor_task_id', 'successor_task_id', 'dependency_type'],
      name: 'unique_task_dependency'
    }
  ]
});

// Instance methods
TaskDependency.prototype.getDependencyInfo = function() {
  const typeDescriptions = {
    'FS': 'Finish-to-Start',
    'SS': 'Start-to-Start',
    'FF': 'Finish-to-Finish',
    'SF': 'Start-to-Finish'
  };
  
  return {
    type: this.dependencyType,
    description: typeDescriptions[this.dependencyType],
    lagTime: this.lagTime,
    isActive: this.isActive
  };
};

TaskDependency.prototype.canProceed = async function(predecessorStatus, successorStatus) {
  if (!this.isActive) return true;
  
  switch (this.dependencyType) {
    case 'FS':
      return predecessorStatus === 'completed';
    case 'SS':
      return ['in_progress', 'completed'].includes(predecessorStatus);
    case 'FF':
      return predecessorStatus === 'completed' || successorStatus !== 'completed';
    case 'SF':
      return ['in_progress', 'completed'].includes(predecessorStatus) || successorStatus !== 'completed';
    default:
      return false;
  }
};

// Class methods
TaskDependency.validateDependency = async function(predecessorId, successorId, type, existingId = null) {
  // Check for circular dependencies
  const hasCircular = await this.hasCircularDependency(predecessorId, successorId);
  if (hasCircular) {
    throw new Error('Circular dependency detected');
  }
  
  // Check for duplicate dependencies
  const whereClause = {
    predecessorTaskId: predecessorId,
    successorTaskId: successorId,
    dependencyType: type
  };
  
  if (existingId) {
    whereClause.id = { [Op.ne]: existingId };
  }
  
  const existing = await this.findOne({ where: whereClause });
  if (existing) {
    throw new Error('This dependency already exists');
  }
  
  return true;
};

TaskDependency.hasCircularDependency = async function(predecessorId, successorId, visited = new Set()) {
  if (visited.has(successorId)) {
    return true;
  }
  
  if (predecessorId === successorId) {
    return true;
  }
  
  visited.add(successorId);
  
  // Get all dependencies where the successor is a predecessor
  const dependencies = await this.findAll({
    where: {
      predecessorTaskId: successorId,
      isActive: true
    }
  });
  
  for (const dep of dependencies) {
    if (dep.successorTaskId === predecessorId) {
      return true;
    }
    
    const hasCircular = await this.hasCircularDependency(
      predecessorId, 
      dep.successorTaskId, 
      new Set(visited)
    );
    
    if (hasCircular) {
      return true;
    }
  }
  
  return false;
};

TaskDependency.getDependencyChain = async function(taskId, direction = 'forward') {
  const chain = [];
  const visited = new Set();
  
  async function traverse(currentTaskId) {
    if (visited.has(currentTaskId)) return;
    visited.add(currentTaskId);
    
    const whereClause = direction === 'forward' 
      ? { predecessorTaskId: currentTaskId, isActive: true }
      : { successorTaskId: currentTaskId, isActive: true };
    
    const dependencies = await TaskDependency.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.Task,
          as: 'predecessorTask',
          attributes: ['id', 'title', 'status', 'start_date', 'due_date']
        },
        {
          model: sequelize.models.Task,
          as: 'successorTask',
          attributes: ['id', 'title', 'status', 'start_date', 'due_date']
        }
      ]
    });
    
    for (const dep of dependencies) {
      chain.push(dep);
      const nextTaskId = direction === 'forward' 
        ? dep.successorTaskId 
        : dep.predecessorTaskId;
      await traverse(nextTaskId);
    }
  }
  
  await traverse(taskId);
  return chain;
};

module.exports = TaskDependency;
