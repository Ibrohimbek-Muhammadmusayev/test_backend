// utils/imageUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Papka yaratish uchun
const sharp = require('sharp'); // Rasmlarni qayta ishlash uchun

// Fayllarni xotirada saqlash uchun Multer storage
const multerStorage = multer.memoryStorage();

// Fayl filtri (faqat rasmlarga ruxsat berish)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
    }
};

const upload = multer({
    storage: multerStorage, // Xotiraga yuklash
    limits: { fileSize: 1024 * 1024 * 5 }, // Maksimal 5MB fayl hajmi
    fileFilter: fileFilter
});

// Middleware funksiyasi: rasmlarni WebP ga o'zgartirish va diskka saqlash
const processAndSaveImage = async (req, res, next) => {
    // Agar fayllar yo'q bo'lsa yoki fayl obyektida buffer bo'lmasa, keyingisiga o'tish
    if (!req.files && !req.file) { // req.files (array) va req.file (single) uchun tekshirish
        return next();
    }

    let filesToProcess = [];
    if (req.files) { // array() yoki fields() dan kelgan fayllar
        filesToProcess = req.files;
    } else if (req.file) { // single() dan kelgan fayl
        filesToProcess.push(req.file);
    }

    if (filesToProcess.length === 0) {
        return next();
    }

    // `uploads` papkasini yaratish, agar mavjud bo'lmasa
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    req.processedImageUrls = []; // Qayta ishlangan rasmlarning URL'larini saqlash uchun massiv

    await Promise.all(filesToProcess.map(async (file) => {
        const filename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`; // Noyob .webp fayl nomi
        const filepath = path.join(uploadDir, filename);

        try {
            await sharp(file.buffer) // Xotiradagi buferdan rasm o'qish
                .webp({ quality: 80 }) // WebP formatiga o'tkazish, sifat 80%
                .toFile(filepath); // Diskka saqlash

            // Server URL'ini shakllantirish
            const imageUrl = `/uploads/${filename}`;
            req.processedImageUrls.push(imageUrl);
        } catch (error) {
            console.error('Error processing image:', error);
            // Agar bir rasmda xato bo'lsa ham, boshqalarini qayta ishlashni davom ettiramiz
            // Lekin bu yerda to'g'ri xato boshqaruvi juda muhim.
            // Agar xato jiddiy bo'lsa, "next(error)" orqali global xato ishlovchisiga yuborish kerak.
            // Hozirda oddiylik uchun shunchaki konsolga chiqariladi.
        }
    }));

    if (req.processedImageUrls.length === 0 && filesToProcess.length > 0) {
        // Agar rasmlar bor edi-yu, lekin hech biri qayta ishlanmagan bo'lsa (xato tufayli)
        return res.status(500).json({ message: 'Failed to process images.' });
    }
    next(); // Keyingi middlewarega o'tish
};

module.exports = { upload, processAndSaveImage };