const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Pub = sequelize.define('Pub', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  partnershipTier: {
    type: DataTypes.ENUM('none', 'basic', 'premium'),
    allowNull: false,
    defaultValue: 'none'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  openingHours: {
    type: DataTypes.JSON,
    allowNull: true
  },
  photoUrls: {
    type: DataTypes.JSON,
    allowNull: true
  },
  location: {
    type: sequelize.getDialect() === 'postgres' ? DataTypes.GEOMETRY('POINT') : DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'pubs'
});

module.exports = Pub;