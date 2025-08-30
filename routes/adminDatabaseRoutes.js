// routes/adminDatabaseRoutes.js
const express = require('express');
const router = express.Router();
const {
    getDatabaseInfo,
    syncDatabase,
    forceSyncDatabase,
    validateModels,
    checkDatabaseHealth
} = require('../controllers/adminDatabaseController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(adminOnly);

// @route   GET /api/admin/database/info
// @desc    Get comprehensive database information
// @access  Private (Admin only)
router.get('/info', getDatabaseInfo);

// @route   GET /api/admin/database/health
// @desc    Check database connection health
// @access  Private (Admin only)
router.get('/health', checkDatabaseHealth);

// @route   GET /api/admin/database/validate
// @desc    Validate all models against database schema
// @access  Private (Admin only)
router.get('/validate', validateModels);

// @route   POST /api/admin/database/sync
// @desc    Sync database schema with models (safe alter mode)
// @access  Private (Admin only)
router.post('/sync', syncDatabase);

// @route   POST /api/admin/database/force-sync
// @desc    Force sync database (DANGEROUS - development only)
// @access  Private (Admin only)
router.post('/force-sync', forceSyncDatabase);

module.exports = router;