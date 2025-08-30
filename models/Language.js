const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Language = sequelize.define('Language', {
  code: {
    type: DataTypes.STRING(5),
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nativeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  flag: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  direction: {
    type: DataTypes.ENUM('ltr', 'rtl'),
    defaultValue: 'ltr'
  },
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Translation key-value pairs'
  }
}, {
  tableName: 'languages',
  timestamps: true
});

module.exports = Language;