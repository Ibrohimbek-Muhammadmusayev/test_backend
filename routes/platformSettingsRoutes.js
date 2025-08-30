const express = require('express');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { processAndSaveImage, upload } = require('../utils/imageUpload');

const {
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
} = require('../controllers/platformSettingsController');

const router = express.Router();

// Public routes
router.get('/public', getPublicSettings);
router.get('/currencies', getPublicCurrencies);
router.get('/languages', getPublicLanguages);
router.get('/translations/:code', getTranslations);

// Admin routes - Platform Settings
router.use('/admin', protect, authorizeRoles('admin'));
router.get('/admin', getPlatformSettings);
router.put('/admin', upload.fields([
  { name: 'siteLogo', maxCount: 1 },
  { name: 'siteFavicon', maxCount: 1 }
]), processAndSaveImage, updatePlatformSettings);

// Admin routes - Currencies
router.get('/admin/currencies', getCurrencies);
router.post('/admin/currencies', createCurrency);
router.put('/admin/currencies/:code', updateCurrency);
router.delete('/admin/currencies/:code', deleteCurrency);

// Admin routes - Languages
router.get('/admin/languages', getLanguages);
router.post('/admin/languages', createLanguage);
router.put('/admin/languages/:code', updateLanguage);
router.delete('/admin/languages/:code', deleteLanguage);
router.put('/admin/translations/:code', updateTranslations);

module.exports = router;