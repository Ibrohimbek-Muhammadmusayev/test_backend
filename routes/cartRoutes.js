// routes/cartRoutes.js
const express = require('express');
const {
    getCart,
    addToCart,
    updateCartItemQty,
    removeCartItem,
    clearCart
} = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Barcha savat operatsiyalari foydalanuvchi uchun himoyalangan
router.use(protect); // Bu barcha quyi yo'llar uchun 'protect' middleware'ini qo'llaydi

router.route('/')
    .get(getCart) // Foydalanuvchi savatini olish
    .post(addToCart); // Savatga mahsulot qo'shish

// updateCartItemQty va removeCartItem uchun parametr nomini o'zgartiramiz
// Endi mahsulot ID'si emas, CartItem ID'si ishlatiladi
router.route('/:cartItemId') // Oldingi :productId o'rniga :cartItemId
    .put(updateCartItemQty) // Savatdagi mahsulot miqdorini yangilash
    .delete(removeCartItem); // Savatdan mahsulotni o'chirish

router.delete('/clear', clearCart); // Savatni butunlay tozalash uchun alohida yo'l

module.exports = router;