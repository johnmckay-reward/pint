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
  // We use the GEOMETRY type for storing geographic coordinates.
  // This is powerful for finding sessions "nearby" later on.
  location: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: false
  }
}, {
  tableName: 'pint_sessions'
});

module.exports = PintSession;