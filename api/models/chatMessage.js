const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000] // Message content between 1 and 1000 characters
    }
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'pint_sessions',
      key: 'id'
    }
  }
}, {
  tableName: 'chat_messages',
  timestamps: true // This adds createdAt and updatedAt automatically
});

module.exports = ChatMessage;