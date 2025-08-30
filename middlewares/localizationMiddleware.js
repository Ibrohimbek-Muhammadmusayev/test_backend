const { PlatformSettings, Currency, Language, User } = require('../models');
const currencyConverter = require('../utils/currencyConverter');

// Currency middleware - har bir requestda currency ma'lumotlarini qo'shadi
const currencyMiddleware = async (req, res, next) => {
  try {
    // User ning valyuta sozlamasini olish (agar login qilgan bo'lsa)
    let userCurrency = null;
    if (req.user && req.user.id) {
      const user = await User.findByPk(req.user.id, {
        attributes: ['preferredCurrency']
      });
      if (user) {
        userCurrency = user.preferredCurrency;
      }
    }

    // Get currency from header, query parameter, user preference, or use default
    const requestedCurrency = req.headers['x-currency'] ||
                             req.query.currency ||
                             userCurrency;
    
    // Get all active currencies
    const currencies = await Currency.findAll({
      where: { isActive: true },
      order: [['isDefault', 'DESC'], ['code', 'ASC']]
    });
    
    // Find requested currency or default
    let currentCurrency = currencies.find(c => c.code === requestedCurrency);
    if (!currentCurrency) {
      currentCurrency = currencies.find(c => c.isDefault) || currencies[0];
    }
    
    // Add currency info to request
    req.currency = {
      current: currentCurrency,
      available: currencies,
      userPreferred: userCurrency,
      convert: async (amount, fromCurrency = 'UZS') => {
        if (!amount || !currentCurrency) return amount;
        
        // Real valyuta konvertatsiyasi
        return await currencyConverter.convert(amount, fromCurrency, currentCurrency.code);
      },
      convertSync: (amount, fromCurrency = 'UZS') => {
        if (!amount || !currentCurrency) return amount;
        
        // Sinxron konvertatsiya (database kurslaridan)
        const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1;
        const toRate = currentCurrency.rate || 1;
        
        return (amount / fromRate) * toRate;
      },
      format: (amount) => {
        if (!amount || !currentCurrency) return amount;
        
        const formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: currentCurrency.decimalPlaces || 2,
          maximumFractionDigits: currentCurrency.decimalPlaces || 2
        }).format(amount);
        
        return currentCurrency.position === 'before'
          ? `${currentCurrency.symbol}${formatted}`
          : `${formatted} ${currentCurrency.symbol}`;
      }
    };
    
    next();
  } catch (error) {
    console.error('Currency middleware error:', error);
    // Continue without currency info if error occurs
    req.currency = {
      current: { code: 'UZS', symbol: 'so\'m', rate: 1 },
      available: [],
      userPreferred: null,
      convert: (amount) => amount,
      format: (amount) => amount
    };
    next();
  }
};

// Language middleware - har bir requestda language ma'lumotlarini qo'shadi
const languageMiddleware = async (req, res, next) => {
  try {
    // User ning til sozlamasini olish (agar login qilgan bo'lsa)
    let userLanguage = null;
    if (req.user && req.user.id) {
      const user = await User.findByPk(req.user.id, {
        attributes: ['preferredLanguage']
      });
      if (user) {
        userLanguage = user.preferredLanguage;
      }
    }

    // Get language from header, query parameter, user preference, or use default
    const requestedLanguage = req.headers['x-language'] ||
                             req.query.lang ||
                             userLanguage ||  // User ning sozlamasi
                             req.headers['accept-language']?.split(',')[0]?.split('-')[0];
    
    // Get all active languages
    const languages = await Language.findAll({
      where: { isActive: true },
      order: [['isDefault', 'DESC'], ['code', 'ASC']]
    });
    
    // Find requested language or default
    let currentLanguage = languages.find(l => l.code === requestedLanguage);
    if (!currentLanguage) {
      currentLanguage = languages.find(l => l.isDefault) || languages[0];
    }
    
    // Add language info to request
    req.language = {
      current: currentLanguage,
      available: languages,
      userPreferred: userLanguage,
      translate: (key, defaultValue = key) => {
        if (!currentLanguage || !currentLanguage.translations) {
          return defaultValue;
        }
        return currentLanguage.translations[key] || defaultValue;
      },
      t: (key, defaultValue = key) => {
        // Alias for translate function
        if (!currentLanguage || !currentLanguage.translations) {
          return defaultValue;
        }
        return currentLanguage.translations[key] || defaultValue;
      }
    };

    // Qisqa yo'l uchun req.language ga to'g'ridan-to'g'ri til kodini ham qo'shamiz
    req.languageCode = currentLanguage?.code || 'uz';
    
    next();
  } catch (error) {
    console.error('Language middleware error:', error);
    // Continue without language info if error occurs
    req.language = {
      current: { code: 'uz', name: 'O\'zbekcha' },
      available: [],
      userPreferred: null,
      translate: (key, defaultValue = key) => defaultValue,
      t: (key, defaultValue = key) => defaultValue
    };
    req.languageCode = 'uz';
    next();
  }
};

// Platform settings middleware - har bir requestda platform sozlamalarini qo'shadi
const platformSettingsMiddleware = async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await PlatformSettings.create({});
    }
    
    // Add platform settings to request
    req.platformSettings = settings;
    
    // Add helper functions
    req.platformSettings.isFeatureEnabled = (featureName) => {
      return settings.features && settings.features[featureName] === true;
    };
    
    req.platformSettings.getContactInfo = () => {
      return settings.contactInfo || {};
    };
    
    req.platformSettings.getSocialMedia = () => {
      return settings.socialMedia || {};
    };
    
    next();
  } catch (error) {
    console.error('Platform settings middleware error:', error);
    // Continue with default settings if error occurs
    req.platformSettings = {
      siteName: 'Market App',
      defaultCurrency: 'UZS',
      defaultLanguage: 'uz',
      isFeatureEnabled: () => false,
      getContactInfo: () => ({}),
      getSocialMedia: () => ({})
    };
    next();
  }
};

// Combined middleware that applies all localization middlewares
const localizationMiddleware = [
  platformSettingsMiddleware,
  currencyMiddleware,
  languageMiddleware
];

module.exports = {
  currencyMiddleware,
  languageMiddleware,
  platformSettingsMiddleware,
  localizationMiddleware
};