// config/corsOptions.js
const corsOptions = {
    // origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Front-end URL'ingizni shu yerga kiriting
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Agar cookie orqali token yuborilishi kerak bo'lsa
    optionsSuccessStatus: 204
};

module.exports = corsOptions;