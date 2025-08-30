// server.js
const http = require('http');
const { Server } = require('socket.io');
// const { connectDB } = require('../config/db');
const app = require('./app'); // app.js dan Express ilovasini import qiladi
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); // Parolni xeshlash uchun import qilish
const { setIoInstance } = require('./utils/notification'); // notification utility importi
const currencyConverter = require('./utils/currencyConverter'); // currency converter importi
const { initializeScheduledTasks } = require('./utils/scheduledTasks'); // scheduled tasks importi
const databaseSync = require('./utils/databaseSync'); // database sync utility importi

// MODELLARNI FAQAT `models/index.js` DAN IMPORT QILAMIZ!
// Bu yerda barcha modellar allaqon sequelize bilan bog'langan va assotsiatsiyalari belgilangan bo'ladi.
const { sequelize, User /* , Product, Category, Review, Comment, ... */ } = require('./models');
const { connectDB } = require('./config/db');
const seedPlatformData = require('./seeders/platformDataSeeder');

dotenv.config(); // .env faylidan muhit o'zgaruvchilarini yuklash - faylning eng boshida turishi shart!

const PORT = process.env.PORT || 5000;

// Admin foydalanuvchisini dastur ishga tushganda yaratish funksiyasi
const createDefaultAdmin = async () => {
    try {
        const adminExists = await User.findOne({ where: { status: 'admin' } });
        // console.log(process.env.ADMIN_DEFAULT_PASSWORD, process.env.ADMIN_DEFAULT_PHONE);

        if (!adminExists) {
            const defaultAdminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
            const defaultAdminPhone = process.env.ADMIN_DEFAULT_PHONE;

            await User.create({
                fullName: 'Super Admin',
                phoneNumber: defaultAdminPhone,
                password: defaultAdminPassword, // hash QILMAYMIZ
                status: 'admin',
                isBlocked: false,
                preferredLanguage: 'uz', // Default language
                preferredCurrency: 'UZS', // Default currency
            });
            console.log('✅ Default admin user created successfully!');
        } else {
            console.log('ℹ️ Admin user already exists. Skipping creation.');
        }
    } catch (error) {
        console.error(`❌ Error creating default admin: ${error.message}`);
    }
};

// --- HTTP va Socket.IO serverlarini sozlash ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Socket.IO instance'ini `notification` utility'ga o'rnatish
setIoInstance(io);

// Socket.IO ulanishlarini boshqarish
io.on('connection', (socket) => {
    console.log('A user connected for real-time notifications:', socket.id);

    socket.on('joinUserRoom', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their notification room.`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from real-time notifications:', socket.id);
    });
});


// --- Serverni ishga tushirish jarayoni ---
// Avval PostgreSQLga ulanish va jadvallarni sinxronlash, keyin serverni ishga tushirish
async function startApplication() {
    try {
        await connectDB(); // config/db.js dagi ulanish funksiyasini chaqiramiz

        // Database connection va model validation
        const connectionStatus = await databaseSync.checkConnection();
        if (!connectionStatus.success) {
            throw new Error(`Database connection failed: ${connectionStatus.error}`);
        }

        // Database info
        const dbInfo = await databaseSync.getDatabaseInfo();
        console.log(`📊 Database Info: ${dbInfo.dialect} - ${dbInfo.databaseName} (${dbInfo.modelsCount} models)`);

        // Automatic database sync based on environment (with error handling)
        try {
            await databaseSync.autoSync();
            console.log('✅ Database sync completed successfully');
        } catch (syncError) {
            console.error('⚠️  Database sync failed, but continuing with server startup:', syncError.message);
            console.log('💡 You can manually sync database using admin endpoints or migrations');
            
            // Try basic sync without alter
            try {
                console.log('🔄 Attempting basic sync without alter...');
                await sequelize.sync({ force: false });
                console.log('✅ Basic database sync completed');
            } catch (basicSyncError) {
                console.error('❌ Basic sync also failed:', basicSyncError.message);
                console.log('⚠️  Server will continue, but database schema might be outdated');
            }
        }

        // Model validation (with error handling)
        try {
            const validationResults = await databaseSync.validateModels();
            if (validationResults.summary.invalid > 0) {
                console.log(`⚠️  Warning: ${validationResults.summary.invalid} models have validation issues`);
            } else {
                console.log('✅ All models validated successfully');
            }
        } catch (validationError) {
            console.error('⚠️  Model validation failed:', validationError.message);
        }
        
        // Seed platform data (languages, currencies, settings) with error handling
        try {
            await seedPlatformData();
            console.log('✅ Platform data seeded successfully');
        } catch (seedError) {
            console.error('⚠️  Platform data seeding failed:', seedError.message);
            console.log('💡 You can manually seed data using admin endpoints');
        }

        // Server error handling
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} allaqon ishlatilmoqda. Boshqa port ishlatishga harakat qilinmoqda...`);
                
                // Boshqa portni topishga harakat qilish
                const alternativePort = PORT + 1;
                console.log(`🔄 Port ${alternativePort} da ishga tushirishga harakat qilinmoqda...`);
                
                server.listen(alternativePort, () => {
                    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${alternativePort}`);
                    console.log('🌐 Socket.IO server running for real-time notifications.');
                    console.log(`⚠️  Diqqat: Server ${PORT} o'rniga ${alternativePort} portida ishlamoqda!`);
                    createDefaultAdmin();
                });
            } else {
                console.error(`❌ Server error: ${err.message}`);
                process.exit(1);
            }
        });

        server.listen(PORT, () => {
            console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log('🌐 Socket.IO server running for real-time notifications.');
            
            // Ma'lumotlar bazasi tayyor bo'lgandan so'ng adminni yaratishga harakat qilish
            createDefaultAdmin();
            
            // Valyuta kurslarini yangilash
            setTimeout(async () => {
                console.log('🔄 Updating currency rates...');
                await currencyConverter.updateDatabaseRates();
            }, 5000); // 5 soniya kutib, keyin yangilash
            
            // Scheduled tasks'larni ishga tushirish
            setTimeout(() => {
                console.log('🕐 Initializing scheduled tasks...');
                initializeScheduledTasks();
            }, 10000); // 10 soniya kutib, keyin scheduled tasks'larni ishga tushirish
        });
    } catch (err) {
        console.error(`❌ Failed to start server due to database connection or sync error: ${err.message}`);
        process.exit(1);
    }
}

startApplication(); // Ilovani ishga tushirish