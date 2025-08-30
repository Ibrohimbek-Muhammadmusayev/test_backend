// routes/variantRoutes.js
const express = require('express');
const {
  getVariantById,
  getVariantsByProduct,
  getProductAttributes,
  findVariantByAttributes,
  checkVariantStock
} = require('../controllers/variantController');

const router = express.Router();

// @route   GET /api/variants/:id
// @desc    Get variant by ID with full details
// @access  Public
router.get('/:id', getVariantById);

// @route   GET /api/variants/:id/stock
// @desc    Check variant stock
// @access  Public
router.get('/:id/stock', checkVariantStock);

// @route   GET /api/products/:productId/variants
// @desc    Get variants by product ID
// @access  Public
router.get('/products/:productId/variants', getVariantsByProduct);

// @route   GET /api/products/:productId/attributes
// @desc    Get available attribute values for a product
// @access  Public
router.get('/products/:productId/attributes', getProductAttributes);

// @route   POST /api/products/:productId/variants/find
// @desc    Find variant by attributes
// @access  Public
router.post('/products/:productId/variants/find', findVariantByAttributes);

module.exports = router;