// controllers/adminDatabaseController.js
const asyncHandler = require('express-async-handler');
const databaseSync = require('../utils/databaseSync');

// @desc    Get database information
// @route   GET /api/admin/database/info
// @access  Private (Admin only)
const getDatabaseInfo = asyncHandler(async (req, res) => {
    try {
        const dbInfo = await databaseSync.getDatabaseInfo();
        const connectionStatus = await databaseSync.checkConnection();
        const validationResults = await databaseSync.validateModels();

        res.json({
            success: true,
            data: {
                ...dbInfo,
                connection: connectionStatus,
                validation: validationResults
            }
        });
    } catch (error) {
        res.status(500);
        throw new Error(`Database info retrieval failed: ${error.message}`);
    }
});

// @desc    Sync database schema with models (alter mode)
// @route   POST /api/admin/database/sync
// @access  Private (Admin only)
const syncDatabase = asyncHandler(async (req, res) => {
    try {
        const result = await databaseSync.alterSync();
        
        res.json({
            success: true,
            message: 'Database schema synchronized successfully',
            data: result
        });
    } catch (error) {
        res.status(500);
        throw new Error(`Database sync failed: ${error.message}`);
    }
});

// @desc    Force sync database (DANGEROUS - development only)
// @route   POST /api/admin/database/force-sync
// @access  Private (Admin only)
const forceSyncDatabase = asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.status(403);
        throw new Error('Force sync is not allowed in production environment!');
    }

    const { confirm } = req.body;
    if (confirm !== 'I_UNDERSTAND_THIS_WILL_DELETE_ALL_DATA') {
        res.status(400);
        throw new Error('Confirmation required. This operation will delete all data!');
    }

    try {
        const result = await databaseSync.forceSync();
        
        res.json({
            success: true,
            message: 'Database force synchronized successfully - ALL DATA WAS DELETED!',
            data: result,
            warning: 'All existing data has been permanently deleted'
        });
    } catch (error) {
        res.status(500);
        throw new Error(`Database force sync failed: ${error.message}`);
    }
});

// @desc    Validate all models
// @route   GET /api/admin/database/validate
// @access  Private (Admin only)
const validateModels = asyncHandler(async (req, res) => {
    try {
        const validationResults = await databaseSync.validateModels();
        
        res.json({
            success: true,
            message: 'Model validation completed',
            data: validationResults
        });
    } catch (error) {
        res.status(500);
        throw new Error(`Model validation failed: ${error.message}`);
    }
});

// @desc    Check database connection
// @route   GET /api/admin/database/health
// @access  Private (Admin only)
const checkDatabaseHealth = asyncHandler(async (req, res) => {
    try {
        const connectionStatus = await databaseSync.checkConnection();
        
        if (connectionStatus.success) {
            res.json({
                success: true,
                message: 'Database connection is healthy',
                data: connectionStatus
            });
        } else {
            res.status(503).json({
                success: false,
                message: 'Database connection failed',
                data: connectionStatus
            });
        }
    } catch (error) {
        res.status(500);
        throw new Error(`Database health check failed: ${error.message}`);
    }
});

module.exports = {
    getDatabaseInfo,
    syncDatabase,
    forceSyncDatabase,
    validateModels,
    checkDatabaseHealth
};