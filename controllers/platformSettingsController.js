const asyncHandler = require('express-async-handler');
const { PlatformSettings, Currency, Language } = require('../models');

// @desc    Get platform settings
// @route   GET /api/admin/settings
// @access  Private (Admin only)
const getPlatformSettings = asyncHandler(async (req, res) => {
  let settings = await PlatformSettings.findOne();
  
  // If no settings exist, create default settings
  if (!settings) {
    settings = await PlatformSettings.create({});
  }
  
  res.json({
    success: true,
    settings
  });
});

// @desc    Update platform settings
// @route   PUT /api/admin/settings
// @access  Private (Admin only)
const updatePlatformSettings = asyncHandler(async (req, res) => {
  let settings = await PlatformSettings.findOne();
  
  if (!settings) {
    settings = await PlatformSettings.create(req.body);
  } else {
    await settings.update(req.body);
  }
  
  res.json({
    success: true,
    message: 'Platform settings updated successfully',
    settings
  });
});

// @desc    Get public settings (for frontend)
// @route   GET /api/settings/public
// @access  Public
const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.findOne({
    attributes: [
      'siteName',
      'siteDescription', 
      'siteLogo',
      'siteFavicon',
      'defaultCurrency',
      'supportedCurrencies',
      'defaultLanguage',
      'supportedLanguages',
      'registrationEnabled',
      'guestCheckoutEnabled',
      'reviewsEnabled',
      'wishlistEnabled',
      'socialMedia',
      'contactInfo',
      'metaTitle',
      'metaDescription',
      'metaKeywords',
      'features'
    ]
  });
  
  if (!settings) {
    return res.json({
      success: true,
      settings: {
        siteName: 'Market App',
        siteDescription: 'Professional E-commerce Platform',
        defaultCurrency: 'UZS',
        defaultLanguage: 'uz'
      }
    });
  }
  
  res.json({
    success: true,
    settings
  });
});

// @desc    Get all currencies
// @route   GET /api/admin/currencies
// @access  Private (Admin only)
const getCurrencies = asyncHandler(async (req, res) => {
  const currencies = await Currency.findAll({
    order: [['isDefault', 'DESC'], ['code', 'ASC']]
  });
  
  res.json({
    success: true,
    currencies
  });
});

// @desc    Create currency
// @route   POST /api/admin/currencies
// @access  Private (Admin only)
const createCurrency = asyncHandler(async (req, res) => {
  const { code, name, symbol, rate, isDefault, position, decimalPlaces } = req.body;
  
  // Check if currency already exists
  const existingCurrency = await Currency.findByPk(code);
  if (existingCurrency) {
    res.status(400);
    throw new Error('Currency already exists');
  }
  
  // If this is set as default, remove default from others
  if (isDefault) {
    await Currency.update({ isDefault: false }, { where: {} });
  }
  
  const currency = await Currency.create({
    code,
    name,
    symbol,
    rate,
    isDefault,
    position,
    decimalPlaces
  });
  
  res.status(201).json({
    success: true,
    message: 'Currency created successfully',
    currency
  });
});

// @desc    Update currency
// @route   PUT /api/admin/currencies/:code
// @access  Private (Admin only)
const updateCurrency = asyncHandler(async (req, res) => {
  const currency = await Currency.findByPk(req.params.code);
  
  if (!currency) {
    res.status(404);
    throw new Error('Currency not found');
  }
  
  // If this is set as default, remove default from others
  if (req.body.isDefault) {
    await Currency.update({ isDefault: false }, { where: {} });
  }
  
  await currency.update(req.body);
  
  res.json({
    success: true,
    message: 'Currency updated successfully',
    currency
  });
});

// @desc    Delete currency
// @route   DELETE /api/admin/currencies/:code
// @access  Private (Admin only)
const deleteCurrency = asyncHandler(async (req, res) => {
  const currency = await Currency.findByPk(req.params.code);
  
  if (!currency) {
    res.status(404);
    throw new Error('Currency not found');
  }
  
  if (currency.isDefault) {
    res.status(400);
    throw new Error('Cannot delete default currency');
  }
  
  await currency.destroy();
  
  res.json({
    success: true,
    message: 'Currency deleted successfully'
  });
});

// @desc    Get all languages
// @route   GET /api/admin/languages
// @access  Private (Admin only)
const getLanguages = asyncHandler(async (req, res) => {
  const languages = await Language.findAll({
    order: [['isDefault', 'DESC'], ['code', 'ASC']]
  });
  
  res.json({
    success: true,
    languages
  });
});

// @desc    Create language
// @route   POST /api/admin/languages
// @access  Private (Admin only)
const createLanguage = asyncHandler(async (req, res) => {
  const { code, name, nativeName, flag, isDefault, direction, translations } = req.body;
  
  // Check if language already exists
  const existingLanguage = await Language.findByPk(code);
  if (existingLanguage) {
    res.status(400);
    throw new Error('Language already exists');
  }
  
  // If this is set as default, remove default from others
  if (isDefault) {
    await Language.update({ isDefault: false }, { where: {} });
  }
  
  const language = await Language.create({
    code,
    name,
    nativeName,
    flag,
    isDefault,
    direction,
    translations
  });
  
  res.status(201).json({
    success: true,
    message: 'Language created successfully',
    language
  });
});

// @desc    Update language
// @route   PUT /api/admin/languages/:code
// @access  Private (Admin only)
const updateLanguage = asyncHandler(async (req, res) => {
  const language = await Language.findByPk(req.params.code);
  
  if (!language) {
    res.status(404);
    throw new Error('Language not found');
  }
  
  // If this is set as default, remove default from others
  if (req.body.isDefault) {
    await Language.update({ isDefault: false }, { where: {} });
  }
  
  await language.update(req.body);
  
  res.json({
    success: true,
    message: 'Language updated successfully',
    language
  });
});

// @desc    Delete language
// @route   DELETE /api/admin/languages/:code
// @access  Private (Admin only)
const deleteLanguage = asyncHandler(async (req, res) => {
  const language = await Language.findByPk(req.params.code);
  
  if (!language) {
    res.status(404);
    throw new Error('Language not found');
  }
  
  if (language.isDefault) {
    res.status(400);
    throw new Error('Cannot delete default language');
  }
  
  await language.destroy();
  
  res.json({
    success: true,
    message: 'Language deleted successfully'
  });
});

// @desc    Get public currencies (for frontend)
// @route   GET /api/currencies
// @access  Public
const getPublicCurrencies = asyncHandler(async (req, res) => {
  const currencies = await Currency.findAll({
    where: { isActive: true },
    attributes: ['code', 'name', 'symbol', 'rate', 'isDefault', 'position', 'decimalPlaces'],
    order: [['isDefault', 'DESC'], ['code', 'ASC']]
  });
  
  res.json({
    success: true,
    currencies
  });
});

// @desc    Get public languages (for frontend)
// @route   GET /api/languages
// @access  Public
const getPublicLanguages = asyncHandler(async (req, res) => {
  const languages = await Language.findAll({
    where: { isActive: true },
    attributes: ['code', 'name', 'nativeName', 'flag', 'isDefault', 'direction'],
    order: [['isDefault', 'DESC'], ['code', 'ASC']]
  });
  
  res.json({
    success: true,
    languages
  });
});

// @desc    Get translations for a language
// @route   GET /api/translations/:code
// @access  Public
const getTranslations = asyncHandler(async (req, res) => {
  const language = await Language.findByPk(req.params.code);
  
  if (!language) {
    res.status(404);
    throw new Error('Language not found');
  }
  
  res.json({
    success: true,
    translations: language.translations || {}
  });
});

// @desc    Update translations for a language
// @route   PUT /api/admin/translations/:code
// @access  Private (Admin only)
const updateTranslations = asyncHandler(async (req, res) => {
  const language = await Language.findByPk(req.params.code);
  
  if (!language) {
    res.status(404);
    throw new Error('Language not found');
  }
  
  await language.update({
    translations: req.body.translations
  });
  
  res.json({
    success: true,
    message: 'Translations updated successfully',
    translations: language.translations
  });
});

module.exports = {
  getPlatformSettings,
  updatePlatformSettings,
  getPublicSettings,
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  getLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  getPublicCurrencies,
  getPublicLanguages,
  getTranslations,
  updateTranslations
};