// routes/orderRoutes.js
const express = require('express');
const {
    createOrder,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getAllOrders // Admin uchun
} = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, createOrder) // Yangi buyurtma yaratish
    .get(protect, authorizeRoles('admin'), getAllOrders); // Admin uchun barcha buyurtmalar

router.route('/myorders').get(protect, getMyOrders); // Foydalanuvchining buyurtmalari

router.route('/:id')
    .get(protect, getOrderById); // Buyurtmani ID bo'yicha olish

router.route('/:id/pay').put(protect, updateOrderToPaid); // Buyurtmani to'langan deb belgilash
router.route('/:id/deliver').put(protect, authorizeRoles('admin', 'seller'), updateOrderToDelivered); // Buyurtmani yetkazilgan deb belgilash

module.exports = router;