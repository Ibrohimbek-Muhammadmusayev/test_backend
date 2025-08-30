// models/CartItem.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cartId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'carts',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  variantId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Backward compatibility uchun null bo'lishi mumkin
    references: {
      model: 'product_variants',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, // Chegirma bo'lmagan narx
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  // Backward compatibility uchun saqlanadi
  size: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Yangi maydonlar
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  variantAttributes: {
    type: DataTypes.JSONB,
    allowNull: true, // Variant attributelari: {"color": {"value": "red", "displayValue": "Qizil"}}
  },
  addedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'cart_items',
  timestamps: true,
  indexes: [
    { fields: ['cartId'] },
    { fields: ['productId'] },
    { fields: ['variantId'] },
    { fields: ['cartId', 'variantId'], unique: true }, // Bir savatda bir variant faqat bir marta
  ],
});

// Instance methods
CartItem.prototype.getTotalPrice = function() {
  return parseFloat(this.price) * this.qty;
};

CartItem.prototype.getDiscountAmount = function() {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return (parseFloat(this.originalPrice) - parseFloat(this.price)) * this.qty;
};

CartItem.prototype.getDiscountPercentage = function() {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
};

module.exports = CartItem;
