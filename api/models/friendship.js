const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Friendship = sequelize.define('Friendship', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  addresseeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined'),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  tableName: 'friendships',
  timestamps: true,
  indexes: [
    // Ensure no duplicate friendship requests between same users
    {
      unique: true,
      fields: ['requesterId', 'addresseeId']
    },
    // Index for efficient queries
    {
      fields: ['requesterId', 'status']
    },
    {
      fields: ['addresseeId', 'status']
    }
  ]
});

module.exports = Friendship;