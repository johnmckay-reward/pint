const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const bcrypt = require('bcryptjs'); // Import bcrypt

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  favouriteTipple: {
    type: DataTypes.STRING,
    allowNull: true
  },
  profilePictureUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subscriptionTier: {
    type: DataTypes.ENUM('free', 'plus'),
    allowNull: false,
    defaultValue: 'free'
  }
}, {
  tableName: 'users',
  hooks: {
    // This hook runs automatically before a new user is created.
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

module.exports = User;