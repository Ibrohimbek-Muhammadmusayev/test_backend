const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PlatformSettings = sequelize.define('PlatformSettings', {
  // Site Configuration
  siteName: {
    type: DataTypes.STRING,
    defaultValue: 'Market App'
  },
  siteDescription: {
    type: DataTypes.TEXT,
    defaultValue: 'Professional E-commerce Platform'
  },
  siteLogo: {
    type: DataTypes.STRING,
    defaultValue: '/uploads/logo/default-logo.png'
  },
  siteFavicon: {
    type: DataTypes.STRING,
    defaultValue: '/uploads/logo/favicon.ico'
  },
  
  // Business Configuration
  platformCommission: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 5.00, // 5% commission
    comment: 'Platform commission percentage'
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 10.00
  },
  maxOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 10000.00
  },
  freeShippingThreshold: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 100.00
  },
  
  // Currency Settings
  defaultCurrency: {
    type: DataTypes.STRING(3),
    defaultValue: 'UZS'
  },
  supportedCurrencies: {
    type: DataTypes.JSON,
    defaultValue: [
      { code: 'UZS', name: 'O\'zbek so\'mi', symbol: 'so\'m', rate: 1 },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.000082 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.000076 },
      { code: 'RUB', name: 'Russian Ruble', symbol: '₽', rate: 0.0076 }
    ]
  },
  
  // Language Settings
  defaultLanguage: {
    type: DataTypes.STRING(5),
    defaultValue: 'uz'
  },
  supportedLanguages: {
    type: DataTypes.JSON,
    defaultValue: [
      { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'en', name: 'English', flag: '🇺🇸' }
    ]
  },
  
  // System Settings
  maintenanceMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  registrationEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  guestCheckoutEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  reviewsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  wishlistEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // File Upload Settings
  maxFileSize: {
    type: DataTypes.INTEGER,
    defaultValue: 5242880, // 5MB in bytes
    comment: 'Maximum file size in bytes'
  },
  allowedFileTypes: {
    type: DataTypes.JSON,
    defaultValue: ['jpg', 'jpeg', 'png', 'webp', 'gif']
  },
  maxImagesPerProduct: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  
  
  // SMS Settings
  smsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  smsProvider: {
    type: DataTypes.STRING,
    allowNull: true
  },
  smsApiKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Social Media Links
  socialMedia: {
    type: DataTypes.JSON,
    defaultValue: {
      facebook: '',
      instagram: '',
      twitter: '',
      telegram: '',
      youtube: ''
    }
  },
  
  // Contact Information
  contactInfo: {
    type: DataTypes.JSON,
    defaultValue: {
      phone: '+998901234567',
      address: 'Toshkent, O\'zbekiston',
      workingHours: '9:00 - 18:00'
    }
  },
  
  // SEO Settings
  metaTitle: {
    type: DataTypes.STRING,
    defaultValue: 'Market App - Professional E-commerce Platform'
  },
  metaDescription: {
    type: DataTypes.TEXT,
    defaultValue: 'Professional e-commerce platform for online shopping'
  },
  metaKeywords: {
    type: DataTypes.TEXT,
    defaultValue: 'e-commerce, online shopping, marketplace'
  },
  
  // Analytics
  googleAnalyticsId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  facebookPixelId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Terms and Policies
  termsOfService: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  privacyPolicy: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  returnPolicy: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // SMS Notification Settings
  smsNotifications: {
    type: DataTypes.JSON,
    defaultValue: {
      orderConfirmation: true,
      orderStatusUpdate: true,
      passwordReset: true,
      verificationCode: true
    }
  },
  
  // Security Settings
  passwordMinLength: {
    type: DataTypes.INTEGER,
    defaultValue: 6
  },
  sessionTimeout: {
    type: DataTypes.INTEGER,
    defaultValue: 3600, // 1 hour in seconds
  },
  maxLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  
  // Feature Flags
  features: {
    type: DataTypes.JSON,
    defaultValue: {
      multiVendor: true,
      subscriptions: false,
      digitalProducts: false,
      affiliateProgram: false,
      loyaltyProgram: false,
      coupons: true,
      flashSales: true,
      productComparison: true,
      productRecommendations: true
    }
  }
}, {
  tableName: 'platform_settings',
  timestamps: true
});

module.exports = PlatformSettings;