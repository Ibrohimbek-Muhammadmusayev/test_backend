const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Currency = sequelize.define('Currency', {
  code: {
    type: DataTypes.STRING(3),
    primaryKey: true,
    allowNull: false,
    unique: true,
    validate: {
      isUppercase: true,
      len: [3, 3]
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  nativeName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Currency name in its native language'
  },
  symbol: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  rate: {
    type: DataTypes.DECIMAL(15, 8),
    allowNull: false,
    defaultValue: 1.0,
    comment: 'Exchange rate relative to base currency',
    validate: {
      min: 0.00000001
    }
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  position: {
    type: DataTypes.ENUM('before', 'after'),
    defaultValue: 'after',
    comment: 'Symbol position relative to amount'
  },
  decimalPlaces: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    validate: {
      min: 0,
      max: 8
    }
  },
  thousandsSeparator: {
    type: DataTypes.STRING(1),
    defaultValue: ','
  },
  decimalSeparator: {
    type: DataTypes.STRING(1),
    defaultValue: '.'
  },
  // Additional currency information
  country: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Primary country using this currency'
  },
  flag: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Country flag emoji or icon'
  },
  // Auto-update settings
  autoUpdate: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether to auto-update exchange rates'
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time exchange rate was updated'
  },
  // Display settings
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Order for displaying in lists'
  },
  // Rounding settings
  roundingMode: {
    type: DataTypes.ENUM('round', 'floor', 'ceil'),
    defaultValue: 'round',
    comment: 'How to round converted amounts'
  }
}, {
  tableName: 'currencies',
  timestamps: true,
  indexes: [
    { fields: ['isDefault'] },
    { fields: ['isActive'] },
    { fields: ['displayOrder'] },
    { fields: ['autoUpdate'] }
  ]
});

// Instance methods
Currency.prototype.formatAmount = function(amount) {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return '0';
  
  // Apply rounding
  let roundedAmount;
  const multiplier = Math.pow(10, this.decimalPlaces);
  
  switch (this.roundingMode) {
    case 'floor':
      roundedAmount = Math.floor(numAmount * multiplier) / multiplier;
      break;
    case 'ceil':
      roundedAmount = Math.ceil(numAmount * multiplier) / multiplier;
      break;
    default:
      roundedAmount = Math.round(numAmount * multiplier) / multiplier;
  }
  
  // Format with separators
  const parts = roundedAmount.toFixed(this.decimalPlaces).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandsSeparator);
  
  const formattedAmount = parts.join(this.decimalSeparator);
  
  // Add symbol
  return this.position === 'before'
    ? `${this.symbol}${formattedAmount}`
    : `${formattedAmount}${this.symbol}`;
};

Currency.prototype.convertFrom = function(amount, fromCurrency) {
  if (!fromCurrency || fromCurrency.code === this.code) {
    return parseFloat(amount);
  }
  
  // Convert to base currency first, then to target currency
  const baseAmount = parseFloat(amount) / parseFloat(fromCurrency.rate);
  return baseAmount * parseFloat(this.rate);
};

Currency.prototype.convertTo = function(amount, toCurrency) {
  if (!toCurrency || toCurrency.code === this.code) {
    return parseFloat(amount);
  }
  
  // Convert to base currency first, then to target currency
  const baseAmount = parseFloat(amount) / parseFloat(this.rate);
  return baseAmount * parseFloat(toCurrency.rate);
};

// Static methods
Currency.getDefault = async function() {
  return await Currency.findOne({ where: { isDefault: true, isActive: true } });
};

Currency.getActive = async function() {
  return await Currency.findAll({
    where: { isActive: true },
    order: [['displayOrder', 'ASC'], ['code', 'ASC']]
  });
};

Currency.setDefault = async function(currencyCode) {
  // Remove default from all currencies
  await Currency.update({ isDefault: false }, { where: {} });
  
  // Set new default
  const currency = await Currency.findByPk(currencyCode);
  if (currency) {
    await currency.update({ isDefault: true, isActive: true });
    return currency;
  }
  
  throw new Error('Currency not found');
};

module.exports = Currency;