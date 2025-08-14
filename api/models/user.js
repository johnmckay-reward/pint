const { DataTypes } = require('sequelize');
const sequelize = require('../db');

// Define the User model
const User = sequelize.define('User', {
  // Model attributes are defined here
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  favouriteTipple: {
    type: DataTypes.STRING,
    allowNull: true // A user might not have a favourite
  },
  profilePictureUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  // Other model options go here
  tableName: 'users'
});

module.exports = User;