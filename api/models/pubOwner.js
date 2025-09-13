const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const bcrypt = require('bcryptjs');

const PubOwner = sequelize.define('PubOwner', {
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
  businessName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  pubId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'pubs',
      key: 'id'
    }
  }
}, {
  tableName: 'pub_owners',
  hooks: {
    beforeCreate: async (pubOwner) => {
      if (pubOwner.password) {
        const salt = await bcrypt.genSalt(10);
        pubOwner.password = await bcrypt.hash(pubOwner.password, salt);
      }
    },
    beforeUpdate: async (pubOwner) => {
      if (pubOwner.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        pubOwner.password = await bcrypt.hash(pubOwner.password, salt);
      }
    }
  }
});

module.exports = PubOwner;