// middlewares/errorHandler.js
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Xato funksiyasiga uzatish
};

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Agar status 200 bo'lsa ham, xato 500 ga o'zgaradi
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Faqat developmentda stackni ko'rsatish
    });
};

module.exports = { notFound, errorHandler };