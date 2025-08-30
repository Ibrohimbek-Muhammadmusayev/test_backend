// utils/databaseSync.js
const { sequelize } = require('../config/db');

class DatabaseSync {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    // Automatic sync based on environment
    async autoSync() {
        try {
            const syncOptions = this.isProduction 
                ? { force: false } // Production da faqat migration ishlatish
                : { alter: true }; // Development da avtomatik o'zgarishlar

            await sequelize.sync(syncOptions);
            
            console.log(`✅ Database synced successfully (${process.env.NODE_ENV || 'development'} mode)`);
            
            if (!this.isProduction) {
                console.log('🔄 Development mode: Database schema automatically updated to match models.');
            }
            
            return { success: true, mode: process.env.NODE_ENV || 'development' };
        } catch (error) {
            console.error('❌ Database sync failed:', error.message);
            throw error;
        }
    }

    // Force sync (DANGEROUS - only for development)
    async forceSync() {
        if (this.isProduction) {
            throw new Error('Force sync is not allowed in production environment!');
        }

        try {
            console.log('⚠️  WARNING: Force syncing database - all data will be lost!');
            await sequelize.sync({ force: true });
            console.log('✅ Database force synced successfully - all tables recreated');
            return { success: true, mode: 'force' };
        } catch (error) {
            console.error('❌ Database force sync failed:', error.message);
            throw error;
        }
    }

    // Alter sync (safe for development)
    async alterSync() {
        try {
            console.log('🔄 Altering database schema to match models...');
            await sequelize.sync({ alter: true });
            console.log('✅ Database schema altered successfully');
            return { success: true, mode: 'alter' };
        } catch (error) {
            console.error('❌ Database alter sync failed:', error.message);
            throw error;
        }
    }

    // Check database connection
    async checkConnection() {
        try {
            await sequelize.authenticate();
            console.log('✅ Database connection is healthy');
            return { success: true, status: 'connected' };
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            return { success: false, status: 'disconnected', error: error.message };
        }
    }

    // Get database info
    async getDatabaseInfo() {
        try {
            const dialect = sequelize.getDialect();
            const databaseName = sequelize.getDatabaseName();
            const models = Object.keys(sequelize.models);
            
            return {
                dialect,
                databaseName,
                modelsCount: models.length,
                models: models.sort(),
                environment: process.env.NODE_ENV || 'development'
            };
        } catch (error) {
            console.error('❌ Failed to get database info:', error.message);
            throw error;
        }
    }

    // Validate all models
    async validateModels() {
        try {
            const models = Object.keys(sequelize.models);
            const validationResults = {};

            for (const modelName of models) {
                try {
                    const model = sequelize.models[modelName];
                    await model.describe(); // Check if table exists and matches model
                    validationResults[modelName] = { valid: true };
                } catch (error) {
                    validationResults[modelName] = { 
                        valid: false, 
                        error: error.message 
                    };
                }
            }

            const validModels = Object.values(validationResults).filter(r => r.valid).length;
            const totalModels = models.length;

            console.log(`📊 Model validation: ${validModels}/${totalModels} models are valid`);

            return {
                summary: {
                    total: totalModels,
                    valid: validModels,
                    invalid: totalModels - validModels
                },
                details: validationResults
            };
        } catch (error) {
            console.error('❌ Model validation failed:', error.message);
            throw error;
        }
    }
}

// Export singleton instance
const databaseSync = new DatabaseSync();

module.exports = databaseSync;