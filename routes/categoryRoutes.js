// routes/categoryRoutes.js
const express = require("express");
const {
  getCategories,
  getCategoryById,
  addCategoryTranslation,
  getCategoryTranslations,
  deleteCategoryTranslation,
  getCategoryInLanguage
} = require("../controllers/categoryController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

// ✅ Barcha kategoriyalarni olish
router.get("/", getCategories);

// ✅ Bitta kategoriya ma'lumotini olish
router.get("/:id", getCategoryById);

// ✅ Kategoriya tarjimalarini olish
router.get("/:id/translations", getCategoryTranslations);

// ✅ Kategoriya tarjimasini qo'shish/yangilash
router.post("/:id/translations", protect, authorizeRoles('admin'), addCategoryTranslation);

// ✅ Kategoriya tarjimasini o'chirish
router.delete("/:id/translations/:language", protect, authorizeRoles('admin'), deleteCategoryTranslation);

// ✅ Kategoriyani ma'lum tilda olish
router.get("/:id/language/:language", getCategoryInLanguage);

module.exports = router;
