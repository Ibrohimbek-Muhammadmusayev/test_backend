const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductVariant = sequelize.define('ProductVariant', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true, // Har bir variant uchun noyob SKU
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Eski size va color saqlanadi backward compatibility uchun
  size: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discountPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, // Sotuvchi uchun xarid narxi
  },
  // Multi-currency support
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'UZS',
    references: {
      model: 'currencies',
      key: 'code'
    },
    comment: 'Currency code for this variant pricing'
  },
  // Multi-currency prices
  prices: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Prices in different currencies: {USD: 10.50, EUR: 9.20, etc.}'
  },
  discountPrices: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Discount prices in different currencies'
  },
  countInStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  minStockLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 5, // Minimal stok darajasi
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true, // kg da
  },
  dimensions: {
    type: DataTypes.JSONB,
    allowNull: true, // {length: 10, width: 5, height: 3}
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [], // Variant uchun maxsus rasmlar
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Asosiy variant
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Enhanced variant attributes
  variantAttributes: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Dynamic attributes like size, color, material, etc.'
  },
  // Variant-specific metadata
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional metadata for the variant'
  },
  // Availability settings
  availableFrom: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When this variant becomes available'
  },
  availableUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When this variant stops being available'
  },
  // Shipping information
  shippingWeight: {
    type: DataTypes.DECIMAL(8, 3),
    allowNull: true,
    comment: 'Shipping weight in kg'
  },
  shippingDimensions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Shipping dimensions: {length, width, height} in cm'
  },
}, {
  tableName: 'product_variants',
  timestamps: true,
  indexes: [
    { fields: ['productId'] },
    { fields: ['sku'] },
    { fields: ['isActive'] },
    { fields: ['isDefault'] },
    { fields: ['price'] },
    { fields: ['countInStock'] },
    { fields: ['currency'] },
    { fields: ['availableFrom'] },
    { fields: ['availableUntil'] },
  ],
});

// Instance methods
ProductVariant.prototype.getEffectivePrice = function(currencyCode = null) {
  const targetCurrency = currencyCode || this.currency;
  
  // Get price in target currency
  let price = this.price;
  let discountPrice = this.discountPrice;
  
  if (targetCurrency !== this.currency) {
    price = this.prices[targetCurrency] || this.price;
    discountPrice = this.discountPrices[targetCurrency] || this.discountPrice;
  }
  
  return discountPrice || price;
};

ProductVariant.prototype.getPriceInCurrency = function(currencyCode) {
  if (currencyCode === this.currency) {
    return this.price;
  }
  
  return this.prices[currencyCode] || null;
};

ProductVariant.prototype.getDiscountPriceInCurrency = function(currencyCode) {
  if (currencyCode === this.currency) {
    return this.discountPrice;
  }
  
  return this.discountPrices[currencyCode] || null;
};

ProductVariant.prototype.setPriceInCurrency = async function(currencyCode, price, discountPrice = null) {
  const prices = { ...this.prices };
  const discountPrices = { ...this.discountPrices };
  
  prices[currencyCode] = price;
  if (discountPrice !== null) {
    discountPrices[currencyCode] = discountPrice;
  }
  
  await this.update({ prices, discountPrices });
  return this;
};

ProductVariant.prototype.isInStock = function() {
  return this.countInStock > 0;
};

ProductVariant.prototype.isLowStock = function() {
  return this.countInStock <= this.minStockLevel;
};

ProductVariant.prototype.getDiscountPercentage = function(currencyCode = null) {
  const price = this.getPriceInCurrency(currencyCode || this.currency) || this.price;
  const discountPrice = this.getDiscountPriceInCurrency(currencyCode || this.currency) || this.discountPrice;
  
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};

ProductVariant.prototype.isAvailable = function() {
  const now = new Date();
  const availableFrom = this.availableFrom ? new Date(this.availableFrom) : null;
  const availableUntil = this.availableUntil ? new Date(this.availableUntil) : null;
  
  const afterStart = !availableFrom || now >= availableFrom;
  const beforeEnd = !availableUntil || now <= availableUntil;
  
  return this.isActive && this.isInStock() && afterStart && beforeEnd;
};

ProductVariant.prototype.getAttribute = function(attributeName) {
  return this.variantAttributes[attributeName] || null;
};

ProductVariant.prototype.setAttribute = async function(attributeName, value) {
  const variantAttributes = { ...this.variantAttributes };
  variantAttributes[attributeName] = value;
  
  await this.update({ variantAttributes });
  return this;
};

ProductVariant.prototype.getFormattedPrice = async function(currencyCode = null) {
  const Currency = require('./Currency');
  const targetCurrency = currencyCode || this.currency;
  
  const currency = await Currency.findByPk(targetCurrency);
  if (!currency) return null;
  
  const price = this.getEffectivePrice(targetCurrency);
  return currency.formatAmount(price);
};

// Static methods
ProductVariant.findByAttributes = async function(productId, attributes) {
  const variants = await ProductVariant.findAll({
    where: { productId, isActive: true }
  });
  
  return variants.filter(variant => {
    return Object.entries(attributes).every(([key, value]) =>
      variant.getAttribute(key) === value
    );
  });
};

module.exports = ProductVariant;
