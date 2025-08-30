// models/ProductAttribute.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductAttribute = sequelize.define('ProductAttribute', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('text', 'color', 'size', 'number', 'boolean', 'select'),
    allowNull: false,
    defaultValue: 'text',
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isFilterable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: true, // masalan: "sm", "kg", "l"
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'product_attributes',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['type'] },
    { fields: ['isFilterable'] },
  ],
});

module.exports = ProductAttribute;