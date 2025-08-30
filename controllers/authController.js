// controllers/authController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const smsService = require('../utils/smsService');
const { Op } = require('sequelize');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, phoneNumber, password, preferredLanguage, preferredCurrency } = req.body;

    const userExists = await User.findOne({ where: { phoneNumber } });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists with this phone number.');
    }

    const user = await User.create({
        fullName,
        phoneNumber,
        password,
        status: 'user',
        preferredLanguage: preferredLanguage || 'uz', // Default to 'uz' if not provided
        preferredCurrency: preferredCurrency || 'UZS' // Default to 'UZS' if not provided
    });

    if (user) {
        res.status(201).json({
            id: user.id, // PostgreSQL-da _id emas, id bo'ladi
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            status: user.status,
            profileImage: user.profileImage,
            accessToken: user.generateAccessToken(),
            refreshToken: user.generateRefreshToken()
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data provided.');
    }
});

// @desc    Authenticate user & get tokens
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { phoneNumber, password } = req.body;
    // console.log(phoneNumber, password);

    const user = await User.findOne({ where: { phoneNumber } });

    if (user && (await user.matchPassword(password))) {
        if (user.isBlocked) {
            res.status(403);
            throw new Error('Your account has been blocked. Please contact support for more information.');
        }
        res.json({
            id: user.id, // PostgreSQL'da id ishlatiladi, _id emas
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            status: user.status,
            profileImage: user.profileImage,
            accessToken: user.generateAccessToken(),
            refreshToken: user.generateRefreshToken()
        });
    } else {
        res.status(401);
        throw new Error('Invalid phone number or password.');
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private (User specific)
const getUserProfile = asyncHandler(async (req, res) => {
    // req.user objekti `protect` middleware orqali qo'shilgan
    const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] } // passwordni chiqarishni xohlamasak
    });

    if (user) {
        res.json({
            id: user.id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            status: user.status,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            sellerInfo: user.status === 'seller' ? user.sellerInfo : undefined
        });
    } else {
        res.status(404);
        throw new Error('User not found.');
    }
});


// @desc    Refresh Access Token using Refresh Token
// @route   POST /api/auth/token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(400);
        throw new Error('Refresh Token is required.');
    }

    try {
        const decoded = jwt.verify(refreshToken, keys.jwtRefreshSecret); // ⚠️ Refresh secret bilan
        const user = await User.findByPk(decoded.id); // ⚠️ Sequelize uchun findByPk

        if (!user) {
            res.status(401);
            throw new Error('Invalid refresh token: User not found.');
        }

        if (user.isBlocked) {
            res.status(403);
            throw new Error('Your account has been blocked. Cannot refresh token.');
        }

        const newAccessToken = user.generateAccessToken();
        res.json({ accessToken: newAccessToken });

    } catch (error) {
        console.error(error);
        res.status(403);
        throw new Error('Invalid or expired refresh token.');
    }
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private (User specific)
const logoutUser = asyncHandler(async (req, res) => {
    // JWT stateless bo'lgani sababli, server tarafda token bekor qilinmaydi.
    // Front-end tarafda tokenlarni o'chirish orqali logout amalga oshiriladi.
    res.json({ message: 'Logged out successfully. Please clear tokens from client-side.' });
});

// @desc    Request password reset (send SMS code)
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordReset = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        res.status(400);
        throw new Error('Telefon raqami kiritilishi shart.');
    }

    // Foydalanuvchi mavjudligini tekshirish
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
        res.status(404);
        throw new Error('Bu telefon raqami bilan ro\'yxatdan o\'tgan foydalanuvchi topilmadi.');
    }

    // Oxirgi 5 daqiqada yuborilgan kodlarni tekshirish (spam oldini olish)
    const recentReset = await PasswordReset.findOne({
        where: {
            phoneNumber,
            createdAt: {
                [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) // 5 daqiqa oldin
            }
        },
        order: [['createdAt', 'DESC']]
    });

    if (recentReset && !recentReset.isUsed) {
        res.status(429);
        throw new Error('SMS kod allaqachon yuborilgan. 5 daqiqa kutib qayta urinib ko\'ring.');
    }

    // Yangi tasdiqlash kodi yaratish
    const resetCode = smsService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 daqiqa

    // Eski kodlarni bekor qilish
    await PasswordReset.update(
        { isUsed: true },
        {
            where: {
                phoneNumber,
                isUsed: false
            }
        }
    );

    // Yangi kod yaratish
    const passwordReset = await PasswordReset.create({
        phoneNumber,
        resetCode,
        expiresAt
    });

    try {
        // SMS yuborish (user ning preferred language bilan)
        const userLanguage = user.preferences?.language || 'uz';
        await smsService.sendPasswordResetSMS(phoneNumber, resetCode, userLanguage);
        
        const messages = {
            uz: 'Tasdiqlash kodi SMS orqali yuborildi.',
            ru: 'Код подтверждения отправлен по SMS.',
            en: 'Verification code sent via SMS.'
        };
        
        res.json({
            success: true,
            message: messages[userLanguage] || messages.uz,
            data: {
                phoneNumber,
                expiresIn: 10, // daqiqa
                resetId: passwordReset.id
            }
        });
    } catch (smsError) {
        // SMS yuborilmasa, yaratilgan kodni o'chirish
        await passwordReset.destroy();
        
        console.error('SMS yuborishda xatolik:', smsError);
        res.status(500);
        
        const userLanguage = user.preferences?.language || 'uz';
        const errorMessages = {
            uz: 'SMS yuborishda xatolik yuz berdi. Keyinroq qayta urinib ko\'ring.',
            ru: 'Ошибка при отправке SMS. Попробуйте позже.',
            en: 'Error sending SMS. Please try again later.'
        };
        
        throw new Error(errorMessages[userLanguage] || errorMessages.uz);
    }
});

// @desc    Verify reset code and reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { phoneNumber, resetCode, newPassword } = req.body;

    if (!phoneNumber || !resetCode || !newPassword) {
        res.status(400);
        throw new Error('Barcha maydonlar to\'ldirilishi shart.');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak.');
    }

    // Tasdiqlash kodini topish
    const passwordReset = await PasswordReset.findOne({
        where: {
            phoneNumber,
            resetCode,
            isUsed: false,
            isBlocked: false,
            expiresAt: {
                [Op.gt]: new Date() // Hali muddati o'tmagan
            }
        }
    });

    if (!passwordReset) {
        // Noto'g'ri kod kiritilgan bo'lsa, urinishlar sonini oshirish
        const existingReset = await PasswordReset.findOne({
            where: {
                phoneNumber,
                resetCode,
                isUsed: false
            }
        });

        if (existingReset) {
            existingReset.attempts += 1;
            
            if (existingReset.attempts >= existingReset.maxAttempts) {
                existingReset.isBlocked = true;
            }
            
            await existingReset.save();
            
            if (existingReset.isBlocked) {
                res.status(423);
                throw new Error('Ko\'p marta noto\'g\'ri kod kiritildi. Yangi kod so\'rang.');
            }
        }

        res.status(400);
        throw new Error('Noto\'g\'ri yoki muddati o\'tgan tasdiqlash kodi.');
    }

    // Foydalanuvchini topish
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
        res.status(404);
        throw new Error('Foydalanuvchi topilmadi.');
    }

    try {
        // Parolni yangilash
        user.password = newPassword;
        await user.save();

        // Tasdiqlash kodini ishlatilgan deb belgilash
        passwordReset.isUsed = true;
        await passwordReset.save();

        // Barcha eski kodlarni bekor qilish
        await PasswordReset.update(
            { isUsed: true },
            {
                where: {
                    phoneNumber,
                    isUsed: false,
                    id: { [Op.ne]: passwordReset.id }
                }
            }
        );

        res.json({
            success: true,
            message: 'Parol muvaffaqiyatli yangilandi.',
            data: {
                phoneNumber: user.phoneNumber,
                fullName: user.fullName
            }
        });

    } catch (error) {
        console.error('Parol yangilashda xatolik:', error);
        res.status(500);
        throw new Error('Parol yangilashda xatolik yuz berdi.');
    }
});

// @desc    Verify reset code (without changing password)
// @route   POST /api/auth/verify-reset-code
// @access  Public
const verifyResetCode = asyncHandler(async (req, res) => {
    const { phoneNumber, resetCode } = req.body;

    if (!phoneNumber || !resetCode) {
        res.status(400);
        throw new Error('Telefon raqami va tasdiqlash kodi kiritilishi shart.');
    }

    // Tasdiqlash kodini tekshirish
    const passwordReset = await PasswordReset.findOne({
        where: {
            phoneNumber,
            resetCode,
            isUsed: false,
            isBlocked: false,
            expiresAt: {
                [Op.gt]: new Date()
            }
        }
    });

    if (!passwordReset) {
        // Noto'g'ri kod kiritilgan bo'lsa, urinishlar sonini oshirish
        const existingReset = await PasswordReset.findOne({
            where: {
                phoneNumber,
                resetCode,
                isUsed: false
            }
        });

        if (existingReset) {
            existingReset.attempts += 1;
            
            if (existingReset.attempts >= existingReset.maxAttempts) {
                existingReset.isBlocked = true;
            }
            
            await existingReset.save();
        }

        res.status(400);
        throw new Error('Noto\'g\'ri yoki muddati o\'tgan tasdiqlash kodi.');
    }

    res.json({
        success: true,
        message: 'Tasdiqlash kodi to\'g\'ri.',
        data: {
            phoneNumber,
            resetId: passwordReset.id,
            expiresAt: passwordReset.expiresAt
        }
    });
});


module.exports = {
    registerUser,
    authUser,
    getUserProfile,
    refreshToken,
    logoutUser,
    requestPasswordReset,
    resetPassword,
    verifyResetCode
};