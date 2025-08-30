// routes/userRoutes.js
const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    getMyOrders,
    getMyCart,
    getMyLikedProducts,
    updateSellerProfile,
    getUserPreferences,
    updateUserLanguage,
    updateUserCurrency,
    updateUserSettings,
    updateUserSetting,
    getPreferenceOptions,
    getUserPreferenceStats
} = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { upload, processAndSaveImage } = require('../utils/imageUpload'); // Rasm yuklash uchun

const router = express.Router();

// Public routes
router.get('/preferences/options', getPreferenceOptions);

// Protected routes
// Foydalanuvchi profili
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/profile/password', protect, updateUserPassword);

// Foydalanuvchining rasmini yuklash
router.put(
    '/profile/image',
    protect,
    upload.single('profileImage'), // 'profileImage' field nomi
    processAndSaveImage,
    updateUserProfile
);

// Foydalanuvchining buyurtmalari, savati va layk bosgan mahsulotlari
router.get('/profile/my-orders', protect, getMyOrders);
router.get('/profile/my-cart', protect, getMyCart);
router.get('/profile/my-liked-products', protect, getMyLikedProducts);

// Seller profilini yangilash (faqat 'seller' statusdagilar uchun)
router.put('/profile/seller-info', protect, authorizeRoles('seller'), updateSellerProfile);

// 🌐 User preferences management
router.get('/profile/preferences', protect, getUserPreferences);
router.put('/profile/language', protect, updateUserLanguage);
router.put('/profile/currency', protect, updateUserCurrency);
router.put('/profile/settings', protect, updateUserSettings);
router.put('/profile/settings/:path', protect, updateUserSetting);

// Admin routes
router.get('/preferences/stats', protect, authorizeRoles('admin'), getUserPreferenceStats);

module.exports = router;