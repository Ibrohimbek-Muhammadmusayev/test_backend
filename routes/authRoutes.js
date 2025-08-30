// routes/authRoutes.js
const express = require('express');
const {
    registerUser,
    authUser,
    getUserProfile,
    refreshToken,
    logoutUser,
    requestPasswordReset,
    resetPassword,
    verifyResetCode
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/token', refreshToken); // Refresh token orqali yangi Access Token olish
router.post('/logout', protect, logoutUser); // Foydalanuvchini tizimdan chiqarish

// Password reset routes
router.post('/forgot-password', requestPasswordReset); // Parolni tiklash uchun SMS kod so'rash
router.post('/verify-reset-code', verifyResetCode); // Tasdiqlash kodini tekshirish
router.post('/reset-password', resetPassword); // Parolni yangilash

// router.get('/profile', protect, getUserProfile); // Foydalanuvchi profilini ko'rish

module.exports = router;