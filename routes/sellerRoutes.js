// routes/sellerRoutes.js
const express = require('express');
const { getSellerProducts } = require('../controllers/sellerController');
const { authorizeRoles, protect, sellerOnly } = require('../middlewares/authMiddleware');
const { processAndSaveImage, upload } = require('../utils/imageUpload');
const {
  createProduct,
  getProductById,
  deleteProduct,
  updateProduct,
  addTranslation,
  getTranslations,
  deleteTranslation
} = require('../controllers/productController');

// Dashboard controllers
const {
  getSellerDashboard,
  getSellerSalesAnalytics,
  getSellerProductAnalytics
} = require('../controllers/sellerDashboardController');

// Seller product controllers
const {
  getSellerProducts: getSellerProductsList,
  getSellerProduct,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  toggleProductStatus
} = require('../controllers/sellerProductController');

// Seller order controllers
const {
  getSellerOrders,
  getSellerOrder,
  updateOrderItemStatus,
  getSellerOrderStatistics
} = require('../controllers/sellerOrderController');

const router = express.Router();

router.use(protect, sellerOnly);

// 📊 Dashboard va Analytics
router.get('/dashboard', getSellerDashboard);
router.get('/analytics/sales', getSellerSalesAnalytics);
router.get('/analytics/products', getSellerProductAnalytics);

// 🛍 Mahsulotlar boshqaruvi
router.get('/products', getSellerProductsList);
router.post('/products', upload.array('images', 10), processAndSaveImage, createSellerProduct);
router.get('/products/:id', getSellerProduct);
router.put('/products/:id', upload.array('images', 10), processAndSaveImage, updateSellerProduct);
router.delete('/products/:id', deleteSellerProduct);
router.patch('/products/:id/toggle-status', toggleProductStatus);

// 🌐 Mahsulot tarjimalari boshqaruvi
router.get('/products/:id/translations', getTranslations);
router.post('/products/:id/translations', addTranslation);
router.delete('/products/:id/translations/:language', deleteTranslation);

// 📦 Buyurtmalar boshqaruvi
router.get('/orders', getSellerOrders);
router.get('/orders/statistics', getSellerOrderStatistics);
router.get('/orders/:id', getSellerOrder);
router.patch('/orders/:orderId/items/:itemId/status', updateOrderItemStatus);

// Eski routelar (backward compatibility uchun)
router.get('/:id/products', getSellerProducts);

module.exports = router;