// models/User.js
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const { sequelize } = require('../config/db');

class User extends Model {
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  generateAccessToken() {
    if (!keys.jwtSecret) throw new Error('JWT secret is missing!');
    return jwt.sign({ id: this.id, status: this.status }, keys.jwtSecret, {
        expiresIn: keys.jwtAccessExpiresIn,
    });
  }

  generateRefreshToken() {
      if (!keys.jwtRefreshSecret) throw new Error('JWT refresh secret is missing!');
      return jwt.sign({ id: this.id, status: this.status }, keys.jwtRefreshSecret, {
          expiresIn: keys.jwtRefreshExpiresIn,
      });
  }

  // Instance methods for user preferences
  async updateLanguagePreference(languageCode) {
    const Language = require('./Language');
    
    // Verify language exists and is active
    const language = await Language.findOne({
      where: { code: languageCode, isActive: true }
    });
    
    if (!language) {
      throw new Error('Invalid or inactive language code');
    }
    
    this.preferredLanguage = languageCode;
    await this.save();
    return this;
  }

  async updateCurrencyPreference(currencyCode) {
    const Currency = require('./Currency');
    
    // Verify currency exists and is active
    const currency = await Currency.findOne({
      where: { code: currencyCode, isActive: true }
    });
    
    if (!currency) {
      throw new Error('Invalid or inactive currency code');
    }
    
    this.preferredCurrency = currencyCode;
    await this.save();
    return this;
  }

  async updateSettings(newSettings) {
    const currentSettings = this.settings || {};
    
    // Deep merge settings
    const mergedSettings = {
      ...currentSettings,
      ...newSettings,
      notifications: {
        ...currentSettings.notifications,
        ...newSettings.notifications
      },
      privacy: {
        ...currentSettings.privacy,
        ...newSettings.privacy
      },
      display: {
        ...currentSettings.display,
        ...newSettings.display
      },
      shopping: {
        ...currentSettings.shopping,
        ...newSettings.shopping
      }
    };
    
    this.settings = mergedSettings;
    await this.save();
    return this;
  }

  async getPreferences() {
    const Language = require('./Language');
    const Currency = require('./Currency');
    
    const [language, currency] = await Promise.all([
      Language.findByPk(this.preferredLanguage),
      Currency.findByPk(this.preferredCurrency)
    ]);
    
    return {
      language: language ? {
        code: language.code,
        name: language.name,
        nativeName: language.nativeName,
        flag: language.flag,
        direction: language.direction
      } : null,
      currency: currency ? {
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        position: currency.position
      } : null,
      timezone: this.timezone,
      country: this.country,
      dateFormat: this.dateFormat,
      timeFormat: this.timeFormat,
      settings: this.settings
    };
  }

  getSetting(path) {
    const keys = path.split('.');
    let value = this.settings;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    
    return value;
  }

  async setSetting(path, value) {
    const keys = path.split('.');
    const settings = { ...this.settings };
    let current = settings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    this.settings = settings;
    await this.save();
    return this;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,    // Oddiy butun son
      autoIncrement: true,        // Har yangi yozuv qo'shilganda avtomatik oshadi
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profileImage: {
      type: DataTypes.STRING,
      defaultValue: '/uploads/profile/default_profile_image.png',
    },
    status: {
      type: DataTypes.ENUM('admin', 'seller', 'user'),
      defaultValue: 'user',
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    sellerInfo: {
      type: DataTypes.JSONB, // Postgres uchun JSONB eng yaxshi variant
      allowNull: true,
    },
    // User til va valyuta sozlamalari
    preferredLanguage: {
      type: DataTypes.STRING(5),
      defaultValue: 'uz',
      allowNull: false,
      references: {
        model: 'languages',
        key: 'code'
      },
      comment: 'User\'s preferred language code'
    },
    preferredCurrency: {
      type: DataTypes.STRING(3),
      defaultValue: 'UZS',
      allowNull: false,
      references: {
        model: 'currencies',
        key: 'code'
      },
      comment: 'User\'s preferred currency code'
    },
    // User sozlamalari
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        notifications: {
          push: true,
          sms: false,
          orderUpdates: true,
          promotions: true
        },
        privacy: {
          showProfile: true,
          showActivity: false,
          showPurchaseHistory: false
        },
        display: {
          theme: 'light',
          compactView: false,
          showPricesInMultipleCurrencies: false
        },
        shopping: {
          savePaymentMethods: false,
          autoApplyCoupons: true,
          showRecommendations: true
        }
      },
      allowNull: true,
      comment: 'User preferences and settings'
    },
    // Location and timezone
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Asia/Tashkent',
      comment: 'User\'s timezone'
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: true,
      comment: 'User\'s country code (ISO 3166-1 alpha-2)'
    },
    // Additional preferences
    dateFormat: {
      type: DataTypes.STRING,
      defaultValue: 'DD/MM/YYYY',
      comment: 'Preferred date format'
    },
    timeFormat: {
      type: DataTypes.ENUM('12h', '24h'),
      defaultValue: '24h',
      comment: 'Preferred time format'
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Static methods
User.getByPreferences = async function(languageCode, currencyCode) {
  const where = {};
  
  if (languageCode) where.preferredLanguage = languageCode;
  if (currencyCode) where.preferredCurrency = currencyCode;
  
  return await User.findAll({
    where,
    attributes: ['id', 'fullName', 'preferredLanguage', 'preferredCurrency']
  });
};

User.getActiveLanguages = async function() {
  const { Op } = require('sequelize');
  
  const languages = await User.findAll({
    attributes: [
      'preferredLanguage',
      [sequelize.fn('COUNT', sequelize.col('id')), 'userCount']
    ],
    where: {
      isBlocked: false,
      preferredLanguage: { [Op.ne]: null }
    },
    group: ['preferredLanguage'],
    order: [[sequelize.literal('userCount'), 'DESC']]
  });
  
  return languages;
};

User.getActiveCurrencies = async function() {
  const { Op } = require('sequelize');
  
  const currencies = await User.findAll({
    attributes: [
      'preferredCurrency',
      [sequelize.fn('COUNT', sequelize.col('id')), 'userCount']
    ],
    where: {
      isBlocked: false,
      preferredCurrency: { [Op.ne]: null }
    },
    group: ['preferredCurrency'],
    order: [[sequelize.literal('userCount'), 'DESC']]
  });
  
  return currencies;
};

module.exports = User;
