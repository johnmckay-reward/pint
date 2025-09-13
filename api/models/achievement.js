const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Achievement = sequelize.define('Achievement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  iconUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique identifier for programmatic access'
  }
}, {
  tableName: 'achievements'
});

module.exports = Achievement;