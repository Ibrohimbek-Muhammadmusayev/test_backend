// config/db.js
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const DB_NAME = process.env.DB_DATABASE || 'your_db_name';
const DB_USER = process.env.DB_USER || 'your_db_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'your_db_password';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL bazasiga muvaffaqiyatli ulanish.');
        // Database sync server.js da amalga oshiriladi
    } catch (error) {
        console.error('❌ Baza bilan ulanishda xato:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
