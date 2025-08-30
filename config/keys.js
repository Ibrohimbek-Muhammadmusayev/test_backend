const dotenv = require('dotenv');
dotenv.config();

// config/keys.js
module.exports = {
    jwtSecret: process.env.JWT_SECRET,           // access token secret
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET, // refresh token secret
    jwtAccessExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d'
};

