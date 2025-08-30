// models/AttributeValue.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AttributeValue = sequelize.define('AttributeValue', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  attributeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'product_attributes',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  displayValue: {
    type: DataTypes.STRING,
    allowNull: true, // Agar ko'rsatish uchun boshqa nom kerak bo'lsa
  },
  colorCode: {
    type: DataTypes.STRING,
    allowNull: true, // Rang uchun hex kod: #FF0000
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true, // Rang yoki boshqa attribut uchun rasm
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'attribute_values',
  timestamps: true,
  indexes: [
    { fields: ['attributeId'] },
    { fields: ['value'] },
    { fields: ['isActive'] },
    { fields: ['attributeId', 'value'], unique: true },
  ],
});

module.exports = AttributeValue;