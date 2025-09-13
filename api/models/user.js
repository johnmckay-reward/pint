const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const bcrypt = require('bcryptjs'); // Import bcrypt

// Generate a unique referral code based on display name
function generateReferralCode(displayName) {
  const cleanName = displayName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${cleanName.substring(0, 4)}${randomSuffix}`;
}

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
  },
  role: {
    type: DataTypes.ENUM('user', 'pub_owner', 'admin'),
    allowNull: false,
    defaultValue: 'user'
  },
  referralCode: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  referredById: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
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
      
      // Generate a unique referral code
      if (!user.referralCode) {
        user.referralCode = generateReferralCode(user.displayName);
      }
    }
  }
});

module.exports = User;