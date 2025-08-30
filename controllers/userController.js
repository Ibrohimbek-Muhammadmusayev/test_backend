// controllers/userController.js
const asyncHandler = require('express-async-handler');
const { User, Order, Cart, Product, OrderItem, Review, Language, Currency } = require('../models'); // Sequelize modellarini index.js dan import qilamiz
const fs = require('fs');
const path = require('path');
const { Op } = require("sequelize");

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (User specific)
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
    });

    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    let sellerInfo = undefined;

    if (user.status === 'seller') {
        // Sotilgan mahsulotlar soni
        const numSoldProducts = await OrderItem.count({
            where: { sellerId: user.id }
        });

        // Reyting
        const reviews = await Review.findAll({
            include: [{
                model: Product,
                as: 'product',
                where: { userId: user.id },
                attributes: []
            }],
            attributes: ['rating']
        });

        const avgRating = reviews.length
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        sellerInfo = {
            shopName: user.sellerInfo?.shopName || '',
            shopDescription: user.sellerInfo?.shopDescription || '',
            shopAddress: user.sellerInfo?.shopAddress || '',
            sellerRating: parseFloat(avgRating.toFixed(2)),
            numSoldProducts
        };
    }

    res.json({
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        status: user.status,
        isBlocked: user.isBlocked,
        profileImage: user.profileImage,
        preferredLanguage: user.preferredLanguage,
        preferredCurrency: user.preferredCurrency,
        settings: user.settings,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        sellerInfo
    });
});



// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private (User specific)
const updateUserProfile = asyncHandler(async (req, res) => {
    // Mongoose: User.findById(req.user._id);
    // Sequelize: findByPk ishlatamiz
    const user = await User.findByPk(req.user.id);

    if (user) {
        user.fullName = req.body.fullName || user.fullName;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
        
        // Til va valyuta sozlamalarini yangilash
        if (req.body.preferredLanguage) {
            user.preferredLanguage = req.body.preferredLanguage;
        }
        if (req.body.preferredCurrency) {
            user.preferredCurrency = req.body.preferredCurrency;
        }
        
        // User sozlamalarini yangilash
        if (req.body.settings) {
            user.settings = { ...user.settings, ...req.body.settings };
        }

        // Agar rasm yuklangan bo'lsa, uni yangilash
        if (req.processedImageUrls && req.processedImageUrls.length > 0) {
            // Eski rasmni o'chirish (agar default rasm bo'lmasa)
            if (user.profileImage && !user.profileImage.includes('default_profile_image')) {
                const oldFilename = user.profileImage.split('/').pop();
                const oldFilePath = path.join(__dirname, '../../uploads', oldFilename);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlink(oldFilePath, (err) => {
                        if (err) console.error('Failed to delete old profile image:', err);
                    });
                }
            }
            user.profileImage = req.processedImageUrls[0]; // Bitta rasm bo'lishi kerak
        }

        // user.save() ham Mongoose'dagi kabi ishlaydi, chunki user Sequelize instance'i
        const updatedUser = await user.save();

        res.json({
            id: updatedUser.id, // _id o'rniga id
            fullName: updatedUser.fullName,
            phoneNumber: updatedUser.phoneNumber,
            status: updatedUser.status,
            profileImage: updatedUser.profileImage,
            preferredLanguage: updatedUser.preferredLanguage,
            preferredCurrency: updatedUser.preferredCurrency,
            settings: updatedUser.settings,
            // sellerInfo: updatedUser.sellerInfo, // Bu yerda ham to'g'ri qaytarish kerak
            sellerInfo: updatedUser.status === 'seller' ? {
                shopName: updatedUser.sellerShopName,
                shopDescription: updatedUser.sellerShopDescription,
                shopAddress: updatedUser.sellerShopAddress,
                sellerRating: updatedUser.sellerRating,
                numSoldProducts: updatedUser.sellerNumSoldProducts
            } : undefined,
            accessToken: user.generateAccessToken(),
            refreshToken: user.generateRefreshToken()
        });
    } else {
        res.status(404);
        throw new Error('User not found.');
    }
});

// @desc    Update user password
// @route   PUT /api/users/profile/password
// @access  Private (User specific)
const updateUserPassword = asyncHandler(async (req, res) => {
    // Mongoose: User.findById(req.user._id);
    // Sequelize: findByPk ishlatamiz
    const user = await User.findByPk(req.user.id);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        res.status(400);
        throw new Error('Please enter both old and new passwords.');
    }

    // user.matchPassword Mongoose'dagi kabi ishlaydi, chunki uni User.prototype ga qo'shdik
    if (user && (await user.matchPassword(oldPassword))) {
        user.password = newPassword; // Sequelize hook (beforeUpdate) avtomatik xeshladi
        await user.save();
        res.json({ message: 'Password updated successfully.' });
    } else {
        res.status(401);
        throw new Error('Invalid old password.');
    }
});

// @desc    Update seller profile info
// @route   PUT /api/users/profile/seller-info
// @access  Private (Seller only)
const updateSellerProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user || user.status !== 'seller') {
        res.status(404);
        throw new Error('User not found or not a seller.');
    }

    const sellerInfo = user.sellerInfo || {};
    sellerInfo.shopName = req.body.shopName || sellerInfo.shopName;
    sellerInfo.shopDescription = req.body.shopDescription || sellerInfo.shopDescription;
    sellerInfo.shopAddress = req.body.shopAddress || sellerInfo.shopAddress;

    // Sotilgan mahsulotlar soni (OrderItem orqali)
    const numSoldProducts = await OrderItem.count({
        where: { sellerId: user.id }
    });

    // Reytingni hisoblash
    const reviews = await Review.findAll({
        include: [{
            model: Product,
            as: 'product',
            where: { userId: user.id }, // bu yerda userId sellerId sifatida ishlatiladi
            attributes: []
        }],
        attributes: ['rating']
    });

    const avgRating = reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    sellerInfo.numSoldProducts = numSoldProducts;
    sellerInfo.sellerRating = parseFloat(avgRating.toFixed(2));

    user.sellerInfo = sellerInfo;
    const updatedUser = await user.save();

    res.json({
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        status: updatedUser.status,
        profileImage: updatedUser.profileImage,
        sellerInfo: updatedUser.sellerInfo
    });
});



// @desc    Get user's orders
// @route   GET /api/users/my-orders
// @access  Private (User specific)

const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: OrderItem,
                as: 'orderItems',
                attributes: ['id', 'qty', 'price', 'size', 'color'],
                include: [
                    {
                        model: Product,
                        as: 'orderedProduct', // alias models/index.js bilan mos
                        attributes: ['id', 'name', 'price', 'images']
                    }
                ]
            }
        ]
    });

    res.json(orders);
});



// @desc    Get user's cart
// @route   GET /api/users/my-cart
// @access  Private (User specific)
const getMyCart = asyncHandler(async (req, res) => {
    // Mongoose: Cart.findOne({ user: req.user._id }).populate('items.product', 'name images price');
    // Sequelize: Cart.findOne({ where: { userId: req.user.id }, include: [{ model: Product, as: 'product_alias', attributes: ['name', 'images', 'price'] }] });
    // 'items.product' o'rniga Sequelize assotsiatsiyasidan foydalanamiz.
    // Cart modelidagi 'items' ustuni JSON turi bo'lishi mumkin yoki alohida CartItem modeli bo'lishi mumkin.
    // Hozircha, Cart modelining 'items' ustuni JSON tipida array bo'lishini taxmin qilamiz va u ichida product id saqlaydi.
    // Agar Cartda alohida `CartItem` modeli bo'lsa, uni ham `include` qilish kerak bo'ladi.
    // Oddiy JSON array bo'lsa, avval cartni olib, keyin productlarni qo'lda qidirish qulayroq bo'ladi.

    const cart = await Cart.findOne({ where: { userId: req.user.id } });

    if (cart) {
        // Agar cart.items json array bo'lsa va u productId ni saqlasa
        if (cart.items && cart.items.length > 0) {
            const productIds = cart.items.map(item => item.productId);
            const products = await Product.findAll({
                where: { id: productIds },
                attributes: ['id', 'name', 'images', 'price']
            });

            // Cart itemlari bilan product ma'lumotlarini birlashtiramiz
            const populatedItems = cart.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                    ...item.toJSON(), // Cart itemining o'zini JSON formatiga o'tkazish
                    product: product ? product.toJSON() : null // Topilgan product ma'lumotlarini qo'shish
                };
            });
            res.json({ ...cart.toJSON(), items: populatedItems });
        } else {
            res.json({ message: 'Cart is empty or not found.', items: [] });
        }
    } else {
        res.json({ message: 'Cart is empty or not found.', items: [] });
    }
});


// @desc    Get user's liked products
// @route   GET /api/users/my-liked-products
// @access  Private (User specific)
const getMyLikedProducts = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        include: [{
            model: Product,
            as: 'likedProducts', // models/index.js dagi alias bilan bir xil bo‘lishi kerak
            attributes: ['id', 'name', 'images', 'price', 'rating', 'numReviews', 'likes'],
            through: { attributes: [] } // Oraliq jadvaldagi ustunlarni yashirish
        }]
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.likedProducts);
});


// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
    const { status, name, phone } = req.query;

    let where = {};

    if (status) {
        where.status = status; // 'admin', 'seller', 'user'
    }

    if (name) {
        where.fullName = {
            [Op.iLike]: `%${name}%` // ism bo‘yicha qidirish
        };
    }

    if (phone) {
        where.phoneNumber = {
            [Op.iLike]: `%${phone}%` // raqam bo‘yicha qidirish
        };
    }

    const users = await User.findAll({
        where,
        attributes: { exclude: ["password"] },
    });

    res.json({
        success: true,
        count: users.length,
        data: users,
    });
});

// @desc    Block/Unblock a user (Admin only)
// @route   PUT /api/users/:id/block
// @access  Private (Admin only)
const blockUser = asyncHandler(async (req, res) => {
    // Mongoose: User.findById(req.params.id);
    // Sequelize: User.findByPk(req.params.id);
    const user = await User.findByPk(req.params.id);

    if (user) {
        // Adminni o'zini bloklashga ruxsat bermaslik
        if (user.status === 'admin') {
            res.status(400);
            throw new Error('Cannot block an admin user.');
        }

        user.isBlocked = !user.isBlocked; // Holatni teskarisiga o'zgartirish
        await user.save(); // Sequelize instance'i uchun save() ishlashi kerak
        res.json({ message: `User ${user.fullName} is now ${user.isBlocked ? 'blocked' : 'unblocked'}.` });
    } else {
        res.status(404);
        throw new Error('User not found.');
    }
});

const makeSeller = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    // ✅ Adminni seller qilish taqiqlanadi
    if (user.status === 'admin') {
        res.status(400);
        throw new Error('Cannot change an admin to seller.');
    }

    // ✅ Allaqachon seller bo‘lsa
    if (user.status === 'seller') {
        return res.json({ message: `User ${user.fullName} is already a seller.` });
    }

    // ✅ Oddiy user bo‘lsa, sellerga o‘tkazamiz
    user.status = 'seller';
    await user.save();

    res.json({ message: `User ${user.fullName} is now a seller.` });
});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User topilmadi",
        });
    }

    // Admin userni o‘chirish mumkin emas
    if (user.status === "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin foydalanuvchini o‘chirishga ruxsat berilmagan",
        });
    }

    await user.destroy();

    res.json({
        success: true,
        message: "User muvaffaqiyatli o‘chirildi",
    });
});



// @desc    Get user preferences with full details
// @route   GET /api/users/profile/preferences
// @access  Private (User specific)
const getUserPreferences = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    const preferences = await user.getPreferences();
    res.json({
        success: true,
        preferences
    });
});

// @desc    Update user language preference
// @route   PUT /api/users/profile/language
// @access  Private (User specific)
const updateUserLanguage = asyncHandler(async (req, res) => {
    const { language } = req.body;
    
    if (!language) {
        res.status(400);
        throw new Error('Language code is required.');
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    try {
        await user.updateLanguagePreference(language);
        const preferences = await user.getPreferences();
        
        res.json({
            success: true,
            message: 'Language preference updated successfully',
            language: preferences.language
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Update user currency preference
// @route   PUT /api/users/profile/currency
// @access  Private (User specific)
const updateUserCurrency = asyncHandler(async (req, res) => {
    const { currency } = req.body;
    
    if (!currency) {
        res.status(400);
        throw new Error('Currency code is required.');
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    try {
        await user.updateCurrencyPreference(currency);
        const preferences = await user.getPreferences();
        
        res.json({
            success: true,
            message: 'Currency preference updated successfully',
            currency: preferences.currency
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Update user settings
// @route   PUT /api/users/profile/settings
// @access  Private (User specific)
const updateUserSettings = asyncHandler(async (req, res) => {
    const { settings } = req.body;
    
    if (!settings) {
        res.status(400);
        throw new Error('Settings are required.');
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    try {
        await user.updateSettings(settings);
        
        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings: user.settings
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Update specific user setting
// @route   PUT /api/users/profile/settings/:path
// @access  Private (User specific)
const updateUserSetting = asyncHandler(async (req, res) => {
    const { path } = req.params;
    const { value } = req.body;
    
    if (!path) {
        res.status(400);
        throw new Error('Setting path is required.');
    }

    if (value === undefined) {
        res.status(400);
        throw new Error('Setting value is required.');
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    try {
        await user.setSetting(path, value);
        
        res.json({
            success: true,
            message: `Setting '${path}' updated successfully`,
            value: user.getSetting(path)
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Get available languages and currencies
// @route   GET /api/users/preferences/options
// @access  Public
const getPreferenceOptions = asyncHandler(async (req, res) => {
    const [languages, currencies] = await Promise.all([
        Language.findAll({
            where: { isActive: true },
            attributes: ['code', 'name', 'nativeName', 'flag', 'direction'],
            order: [['isDefault', 'DESC'], ['name', 'ASC']]
        }),
        Currency.findAll({
            where: { isActive: true },
            attributes: ['code', 'name', 'symbol', 'position', 'country', 'flag'],
            order: [['isDefault', 'DESC'], ['displayOrder', 'ASC'], ['name', 'ASC']]
        })
    ]);

    res.json({
        success: true,
        options: {
            languages,
            currencies
        }
    });
});

// @desc    Get user statistics by preferences (Admin only)
// @route   GET /api/admin/users/preferences/stats
// @access  Private (Admin only)
const getUserPreferenceStats = asyncHandler(async (req, res) => {
    const [languageStats, currencyStats] = await Promise.all([
        User.getActiveLanguages(),
        User.getActiveCurrencies()
    ]);

    res.json({
        success: true,
        stats: {
            languages: languageStats,
            currencies: currencyStats
        }
    });
});

module.exports = {
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    updateSellerProfile,
    getMyOrders,
    getMyCart,
    getMyLikedProducts,
    getAllUsers,
    blockUser,
    makeSeller,
    deleteUser,
    getUserPreferences,
    updateUserLanguage,
    updateUserCurrency,
    updateUserSettings,
    updateUserSetting,
    getPreferenceOptions,
    getUserPreferenceStats
};