// routes/productRoutes.js
const express = require("express");
const {
  getProducts,
  getProductById,
  likeProduct,
  addTranslation,
  getTranslations,
  deleteTranslation,
  getProductInLanguage
} = require("../controllers/productController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// ✅ Barcha mahsulotlarni olish
router.get("/", getProducts);

// ✅ Bitta mahsulotni olish
router.get("/:id", getProductById);

// ✅ Mahsulotni yoqtirish
router.post('/:id/like', protect, likeProduct);

// ✅ Mahsulot tarjimalarini olish
router.get("/:id/translations", getTranslations);

// ✅ Mahsulot tarjimasini qo'shish/yangilash
router.post("/:id/translations", protect, addTranslation);

// ✅ Mahsulot tarjimasini o'chirish
router.delete("/:id/translations/:language", protect, deleteTranslation);

// ✅ Mahsulotni ma'lum tilda olish
router.get("/:id/language/:language", getProductInLanguage);

module.exports = router;
