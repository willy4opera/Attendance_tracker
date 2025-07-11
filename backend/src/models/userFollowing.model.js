const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserFollowing = sequelize.define('UserFollowing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  followerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'follower_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  followedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'followed_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'UserFollowing',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['follower_id', 'followed_id']
    },
    {
      fields: ['follower_id']
    },
    {
      fields: ['followed_id']
    }
  ]
});

module.exports = UserFollowing;
