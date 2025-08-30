// app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // path modulini import qilish

const { notFound, errorHandler } = require('./middlewares/errorHandler');
const corsOptions = require('./config/corsOptions');

// Routes importlari
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const searchRoutes = require('./routes/searchRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const groupRoutes = require('./routes/groupRoutes');
const variantRoutes = require('./routes/variantRoutes');
const platformSettingsRoutes = require('./routes/platformSettingsRoutes');
const sellerApplicationRoutes = require('./routes/sellerApplicationRoutes');
const adminDatabaseRoutes = require('./routes/adminDatabaseRoutes');

dotenv.config();

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

// --- Statik fayllar (public papkasi) ---
// Bu barcha public papkasidagi fayllarga to'g'ridan-to'g'ri kirishni ta'minlaydi.
// Masalan, public/index.html ga /index.html orqali kirish mumkin.
app.use(express.static(path.join(__dirname, 'public')));

// Rasmlar saqlangan 'uploads' papkasini statik qilish
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// HTML Documentation Routes
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

app.get('/admin-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-docs.html'));
});

app.get('/seller-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'seller-docs.html'));
});

app.get('/user-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user-docs.html'));
});

// API docs redirect for backward compatibility
app.get('/api/docs', (req, res) => {
  res.redirect('/api-docs');
});

// --- HTML sahifa uchun route (agar index.html public ichida bo'lsa, bu shart emas) ---
// Agar sizning index.html faylingiz `public` papkasida bo'lsa va siz uni `/` manzilda ko'rsatmoqchi bo'lsangiz,
// u holda `/` uchun maxsus route belgilash shart emas.
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html')); // Agar index.html public ichida bo'lsa
// });
// Agar public papkada index.html bo'lsa va yuqoridagi static middleware ishlatilsa,
// `/` manzil avtomatik ravishda `public/index.html` ga xizmat qiladi.

// API yo'nalishlari
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin/', adminRoutes);
app.use('/api/users/notifications', notificationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/settings', platformSettingsRoutes);
app.use('/api/seller-applications', sellerApplicationRoutes);
app.use('/api/admin/database', adminDatabaseRoutes);


// --- 404 xatolikni HTML sahifa bilan qaytarish ---
// Barcha yuqoridagi yo'nalishlar bilan mos kelmagan har qanday so'rov bu yerga keladi.
app.use((req, res, next) => {
    // Brauzerga 404 statusini o'rnatamiz
    res.status(404);

    // Agar so'rov API uchun bo'lsa (masalan, /api/ bilan boshlansa), JSON javob qaytaramiz
    if (req.accepts('json') && req.originalUrl.startsWith('/api')) {
        res.json({
            message: `Not Found - ${req.originalUrl}`,
            error: {
                code: 404,
                details: 'The requested API resource could not be found.'
            }
        });
    } else {
        // Aks holda (agar brauzerdan kelgan oddiy GET so'rov bo'lsa), public/404.html sahifasini yuboramiz.
        // `express.static` allaqachon `public` ichidagi fayllarni avtomatik tarzda topadi.
        // Shuning uchun bu yerda path.join() ga hojat yo'q, agar fayl to'g'ridan-to'g'ri public ichida bo'lsa.
        // Ammo xavfsizlik va aniqlik uchun `sendFile` ni ishlatish afzalroq.
        res.sendFile(path.join(__dirname, 'public', '404.html'));
    }
});

// Xatolarni boshqarish (umumiy errorHandler middleware)
app.use(notFound);
app.use(errorHandler);

module.exports = app;