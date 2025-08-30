// routes/adminRoutes.js
const express = require('express');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { processAndSaveImage, upload } = require('./../utils/imageUpload');

// --- Controller importlari ---
const {
    getAdminDashboard,
    getAdminAnalytics,
    getSellerPerformance,
    getSystemStatistics
} = require('../controllers/adminController');

const {
    getAllUsers,
    blockUser,
    makeSeller,
    deleteUser
} = require('../controllers/userController');

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    addTranslation,
    getTranslations,
    deleteTranslation
} = require('../controllers/productController');

const {
    getAllOrders,
    getOrderById
} = require('../controllers/orderController');

const {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategories,
    addCategoryTranslation,
    getCategoryTranslations,
    deleteCategoryTranslation
} = require('../controllers/categoryController');

const {
    createBanner,
    updateBanner,
    deleteBanner,
    getBanners,
    checkExpiredBanners,
    setBannerTranslation
} = require('../controllers/bannerController');

const { getAllSellers, getSellerProfile, getSellerProducts } = require('../controllers/sellerController');
const { getPopularSearches, getAllSearches, getTopSearchQueries } = require('../controllers/searchController');
const { createGroup, getGroupWithProducts, getGroups, updateGroup, deleteGroup } = require('../controllers/groupController');
const { createNotification } = require('../controllers/notificationController');

// --- Yangi controller importlari ---
const {
    updateOrderStatus,
    bulkUpdateOrderStatus,
    getOrderStatusStats
} = require('../controllers/orderStatusController');

const {
    bulkDeleteUsers,
    bulkUpdateUserStatus,
    bulkUpdateProductStatus,
    bulkDeleteProducts,
    bulkUpdateProductCategory,
    bulkSendNotifications,
    broadcastNotification
} = require('../controllers/bulkOperationsController');

const {
    exportUsers,
    exportProducts,
    exportOrders,
    exportSalesReport
} = require('../controllers/exportController');

const {
    uploadFiles,
    deleteFile,
    getFileInfo,
    listFiles,
    cleanupUnusedFiles
} = require('../controllers/fileController');

const router = express.Router();

// --- Admin uchun middleware ---
router.use(protect, authorizeRoles('admin'));

// 📊 Dashboard va Statistika
router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getAdminAnalytics);
router.get('/sellers/performance', getSellerPerformance);
router.get('/statistics', getSystemStatistics);

// 👥 User boshqaruvi
router.get('/users', getAllUsers);
router.delete("/users/delete/:id", deleteUser);
router.put('/users/:id/block', blockUser);
router.put('/:id/make-seller', makeSeller);

// 🛍 Mahsulot boshqaruvi
router.get('/products', getProducts);
router.post('/products', upload.array('images', 5), processAndSaveImage, createProduct);
router.get('/products/:id', getProductById);
router.put('/products/:id', upload.array('images', 5), processAndSaveImage, updateProduct);
// router.delete('/products/:id', deleteProductComment);
router.delete('/products/:id', deleteProduct);
// router.delete('/products/:id/comments/:commentId', deleteProductComment);

// 🌐 Mahsulot tarjimalari boshqaruvi
router.get('/products/:id/translations', getTranslations);
router.post('/products/:id/translations', addTranslation);
router.delete('/products/:id/translations/:language', deleteTranslation);

// 📦 Buyurtma boshqaruvi
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/bulk/status', bulkUpdateOrderStatus);
router.get('/orders/status/stats', getOrderStatusStats);

// 🗂 Kategoriya boshqaruvi
router.get('/categories', getCategories);
router.post('/categories', upload.single('image'), processAndSaveImage, createCategory);
router.put('/categories/:id', upload.single('image'), processAndSaveImage, updateCategory);
router.delete('/categories/:id', deleteCategory);

// 🌐 Kategoriya tarjimalari boshqaruvi
router.get('/categories/:id/translations', getCategoryTranslations);
router.post('/categories/:id/translations', addCategoryTranslation);
router.delete('/categories/:id/translations/:language', deleteCategoryTranslation);

// 🖼 Banner boshqaruvi
router.get('/banners', getBanners);
router.post('/banners', upload.single('image'), processAndSaveImage, createBanner);
router.put('/banners/:id', upload.single('image'), processAndSaveImage, updateBanner);
router.delete('/banners/:id', deleteBanner);
router.post('/banners/check-expired', checkExpiredBanners);
router.put('/banners/:id/translations/:language', setBannerTranslation);

// Seller kuzatish bolimi
router.get('/seller', getAllSellers); // Barcha sellerlarni olish
router.get('/seller/:id', getSellerProfile); // Ma'lum bir seller profilini ko'rish
router.get('/seller/:id/products', getSellerProducts); // Ma'lum bir seller mahsulotlarini ko'rish

// Search holatlari
router.get('/search/popular', getPopularSearches); // eng kop qidirilgan narsalarni olib keladi
router.get('/search/all', getAllSearches); // bu hamma qidirilgan narsalarni olib keladi
router.get('/search/statistic', protect, getTopSearchQueries); // eng kop qidirilgan narsalarni statistikasi

// Group boshqaruvi
router.post('/groups', protect, authorizeRoles('admin'), createGroup);
router.get('/groups', getGroups); // Barcha grouplarni olish
router.get('/groups/:id', getGroupWithProducts); // Bitta groupni mahsulotlari bilan olish
router.put('/groups/:id', protect, authorizeRoles('admin'), updateGroup); // Groupni yangilash (faqat admin)
router.delete('/groups/:id', protect, authorizeRoles('admin'), deleteGroup); // Groupni o‘chirish (faqat admin)

// Notification boshqaruvi
router.post("/notification/send/", createNotification);
router.post("/notifications/bulk", bulkSendNotifications);
router.post("/notifications/broadcast", broadcastNotification);

// 🔄 Bulk Operations
router.delete('/users/bulk', bulkDeleteUsers);
router.put('/users/bulk/status', bulkUpdateUserStatus);
router.put('/products/bulk/status', bulkUpdateProductStatus);
router.delete('/products/bulk', bulkDeleteProducts);
router.put('/products/bulk/category', bulkUpdateProductCategory);

// 📤 Export Functions
router.get('/export/users', exportUsers);
router.get('/export/products', exportProducts);
router.get('/export/orders', exportOrders);
router.get('/export/sales', exportSalesReport);

// 📁 File Management
router.post('/upload', upload.array('files', 10), uploadFiles);
router.delete('/files', deleteFile);
router.get('/files/info', getFileInfo);
router.get('/files', listFiles);
router.delete('/files/cleanup', cleanupUnusedFiles);

module.exports = router;
