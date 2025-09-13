const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const PintSession = sequelize.define('PintSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  pubName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  eta: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // For testing with SQLite, we'll use a simple JSON field
  // In production with PostGIS, this would be GEOMETRY('POINT')
  location: {
    type: sequelize.getDialect() === 'postgres' ? DataTypes.GEOMETRY('POINT') : DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'pint_sessions'
});

module.exports = PintSession;