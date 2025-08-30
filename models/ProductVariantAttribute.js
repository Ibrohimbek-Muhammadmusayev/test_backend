// models/ProductVariantAttribute.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductVariantAttribute = sequelize.define('ProductVariantAttribute', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  variantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'product_variants',
      key: 'id',
    },
    onDelete: 'CASCADE',
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
  attributeValueId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'attribute_values',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  customValue: {
    type: DataTypes.STRING,
    allowNull: true, // Agar predefined value yo'q bo'lsa
  },
  numericValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, // Raqamli qiymatlar uchun
  },
}, {
  tableName: 'product_variant_attributes',
  timestamps: true,
  indexes: [
    { fields: ['variantId'] },
    { fields: ['attributeId'] },
    { fields: ['attributeValueId'] },
    { fields: ['variantId', 'attributeId'], unique: true },
  ],
});

module.exports = ProductVariantAttribute;