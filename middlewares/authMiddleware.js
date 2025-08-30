// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { User } = require('../models'); // User modelini import qilish
const keys = require('../config/keys'); // keys.js fayli JWT Secretni saqlashi kerak

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Bearer token formati: "Bearer TOKEN"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1]; // Tokenni ajratib olish

            const decoded = jwt.verify(token, keys.jwtSecret); // Tokenni tekshirish

            // Mongoose'dagi User.findById(decoded.id).select('-password') o'rniga
            // Sequelize'da findByPk ishlatamiz va attributes orqali passwordni exclude qilamiz
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] } // Parolni qaytarmaslik
            });

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found.' });
            }
            if (req.user.isBlocked) { // Foydalanuvchi bloklanganmi tekshirish
                return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
            }
            next(); // Agar hamma narsa to'g'ri bo'lsa, keyingisiga o'tish
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed or expired.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided.' });
    }
});

// Rolga asoslangan kirish nazorati
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // req.user.status maydoni User modelida 'role' kabi nomlangan bo'lishi mumkin.
        // Hozirgi kodingizda 'status' ishlatilgan, shuning uchun shunday qoldiramiz.
        if (!req.user || !roles.includes(req.user.status)) {
            return res.status(403).json({ message: `Access denied. Your role (${req.user.status}) is not authorized for this action.` });
        }
        next();
    };
};

// Admin faqat middleware
const adminOnly = (req, res, next) => {
    if (!req.user || req.user.status !== 'admin') {
        return res.status(403).json({
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Seller faqat middleware
const sellerOnly = (req, res, next) => {
    if (!req.user || req.user.status !== 'seller') {
        return res.status(403).json({
            message: 'Access denied. Seller privileges required.'
        });
    }
    next();
};

// Admin yoki Seller middleware
const adminOrSeller = (req, res, next) => {
    if (!req.user || !['admin', 'seller'].includes(req.user.status)) {
        return res.status(403).json({
            message: 'Access denied. Admin or Seller privileges required.'
        });
    }
    next();
};

module.exports = {
    protect,
    authorizeRoles,
    adminOnly,
    sellerOnly,
    adminOrSeller
};