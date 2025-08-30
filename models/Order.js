// models/Order.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Multi-currency support
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'UZS',
    allowNull: false,
    references: {
      model: 'currencies',
      key: 'code'
    },
    comment: 'Order currency code'
  },
  exchangeRate: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 1.0,
    allowNull: false,
    comment: 'Exchange rate at the time of order'
  },
  // Multi-language support
  language: {
    type: DataTypes.STRING(5),
    defaultValue: 'uz',
    allowNull: false,
    references: {
      model: 'languages',
      key: 'code'
    },
    comment: 'Order language'
  },
  shippingAddress: {
    type: DataTypes.JSON, // { address, city, postalCode, country }
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  paymentResult: {
    type: DataTypes.JSON, // { id, status, update_time }
    allowNull: true,
  },
  taxPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0,
  },
  shippingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  // Prices in base currency (UZS) for consistency
  baseCurrencyTotalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Total price in base currency (UZS)'
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  orderStatus: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Order status'
  },
  // Order notes and translations
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Order notes'
  },
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Order status translations and notes in different languages'
  },
  // Tracking information
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Shipping tracking number'
  },
  estimatedDelivery: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Estimated delivery date'
  },
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['currency'] },
    { fields: ['language'] },
    { fields: ['orderStatus'] },
    { fields: ['isPaid'] },
    { fields: ['isDelivered'] },
    { fields: ['createdAt'] },
    { fields: ['trackingNumber'] }
  ]
});

// Instance methods
Order.prototype.getFormattedPrice = async function(targetCurrency = null) {
  const Currency = require('./Currency');
  
  const currencyCode = targetCurrency || this.currency;
  const currency = await Currency.findByPk(currencyCode);
  
  if (!currency) {
    return this.totalPrice.toString();
  }
  
  let amount = this.totalPrice;
  
  // Convert if different currency
  if (currencyCode !== this.currency) {
    const targetCurrencyRate = currency.rate;
    const originalCurrencyRate = this.exchangeRate;
    amount = (this.baseCurrencyTotalPrice * targetCurrencyRate);
  }
  
  return currency.formatAmount(amount);
};

Order.prototype.getStatusTranslation = function(language = 'uz') {
  const translations = this.translations || {};
  const statusTranslations = translations[language]?.status || {};
  
  const defaultTranslations = {
    uz: {
      pending: 'Kutilmoqda',
      confirmed: 'Tasdiqlandi',
      processing: 'Tayyorlanmoqda',
      shipped: 'Jo\'natildi',
      delivered: 'Yetkazildi',
      cancelled: 'Bekor qilindi',
      refunded: 'Qaytarildi'
    },
    ru: {
      pending: 'Ожидание',
      confirmed: 'Подтверждено',
      processing: 'Обрабатывается',
      shipped: 'Отправлено',
      delivered: 'Доставлено',
      cancelled: 'Отменено',
      refunded: 'Возвращено'
    },
    en: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    }
  };
  
  return statusTranslations[this.orderStatus] ||
         defaultTranslations[language]?.[this.orderStatus] ||
         this.orderStatus;
};

Order.prototype.updateStatus = async function(newStatus, notes = null, language = 'uz') {
  this.orderStatus = newStatus;
  
  if (notes) {
    const translations = this.translations || {};
    if (!translations[language]) translations[language] = {};
    if (!translations[language].notes) translations[language].notes = [];
    
    translations[language].notes.push({
      status: newStatus,
      note: notes,
      timestamp: new Date()
    });
    
    this.translations = translations;
  }
  
  // Update delivery status
  if (newStatus === 'delivered') {
    this.isDelivered = true;
    this.deliveredAt = new Date();
  }
  
  await this.save();
  
  // Send SMS notification to user about status change
  try {
    const User = require('./User');
    const smsService = require('../utils/smsService');
    
    const user = await User.findByPk(this.userId);
    if (user && user.phoneNumber) {
      await smsService.sendSMSToUser(user, 'orderStatus', { orderNumber: this.id }, newStatus);
    }
  } catch (smsError) {
    console.error('SMS yuborishda xatolik (Order status update):', smsError);
    // SMS xatoligi order status update ga ta'sir qilmasin
  }
  
  return this;
};

Order.prototype.convertToCurrency = async function(targetCurrencyCode) {
  const Currency = require('./Currency');
  
  if (targetCurrencyCode === this.currency) {
    return this; // Already in target currency
  }
  
  const targetCurrency = await Currency.findByPk(targetCurrencyCode);
  if (!targetCurrency) {
    throw new Error('Target currency not found');
  }
  
  // Convert from base currency to target currency
  const newTotalPrice = this.baseCurrencyTotalPrice * targetCurrency.rate;
  const newTaxPrice = this.taxPrice * targetCurrency.rate;
  const newShippingPrice = this.shippingPrice * targetCurrency.rate;
  
  return {
    ...this.toJSON(),
    currency: targetCurrencyCode,
    totalPrice: newTotalPrice,
    taxPrice: newTaxPrice,
    shippingPrice: newShippingPrice,
    exchangeRate: targetCurrency.rate,
    formattedTotalPrice: targetCurrency.formatAmount(newTotalPrice)
  };
};

// Static methods
Order.getOrdersByStatus = async function(status, options = {}) {
  const { userId, language = 'uz', currency, limit = 20, offset = 0 } = options;
  
  let where = { orderStatus: status };
  if (userId) where.userId = userId;
  if (currency) where.currency = currency;
  
  return await Order.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: require('./User'),
        as: 'user',
        attributes: ['id', 'fullName', 'phoneNumber', 'preferredLanguage', 'preferredCurrency']
      }
    ]
  });
};

Order.getOrderStats = async function(options = {}) {
  const { userId, startDate, endDate, currency } = options;
  const { Op, fn, col } = require('sequelize');
  
  let where = {};
  if (userId) where.userId = userId;
  if (currency) where.currency = currency;
  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [startDate, endDate]
    };
  }
  
  const stats = await Order.findAll({
    where,
    attributes: [
      'orderStatus',
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col('baseCurrencyTotalPrice')), 'totalAmount']
    ],
    group: ['orderStatus'],
    raw: true
  });
  
  return stats;
};

module.exports = Order;
