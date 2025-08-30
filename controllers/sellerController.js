// controllers/sellerController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all sellers
// @route   GET /api/sellers
// @access  Public
const getAllSellers = asyncHandler(async (req, res) => {
    const sellers = await User.findAll({
        where: { status: 'seller' },
        attributes: { exclude: ['password'] }
    });

    res.json(sellers);
});


// @desc    Get a specific seller's profile
// @route   GET /api/sellers/:id
// @access  Public
const getSellerProfile = asyncHandler(async (req, res) => {
    const seller = await User.findOne({
        where: { id: req.params.id, status: 'seller' },
        attributes: { 
            exclude: ['password', 'phoneNumber', 'createdAt', 'updatedAt', 'isBlocked'] 
        }
    });

    if (!seller) {
        res.status(404);
        throw new Error('Seller not found or user is not a seller.');
    }

    const sellerData = seller.toJSON();
    
    // Agar sellerInfo yo'q bo'lsa, {} qilib yuboramiz
    if (!sellerData.sellerInfo) {
        sellerData.sellerInfo = {};
    }

    res.json(sellerData);
});



// @desc    Get products by a specific seller
// @route   GET /api/sellers/:id/products?limit=...&page=...
// @access  Public
const getSellerProducts = asyncHandler(async (req, res) => {
    const pageSize = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    // Seller bor-yo'qligini tekshirish
    const sellerExists = await User.findOne({
        where: { id: req.params.id, status: 'seller' }
    });

    if (!sellerExists) {
        res.status(404);
        throw new Error('Seller not found.');
    }

    // Umumiy mahsulotlar soni
    const count = await Product.count({
        where: { userId: req.params.id } // `userId` ustuni bor deb hisoblayman
    });

    // Mahsulotlar ro'yxati
    const products = await Product.findAll({
        where: { userId: req.params.id },
        include: [
            {
                model: Category,
                as: 'category',
                attributes: ['name']
            }
        ],
        order: [['createdAt', 'DESC']],
        limit: pageSize,
        offset: pageSize * (page - 1)
    });

    res.json({
        products,
        page,
        pages: Math.ceil(count / pageSize),
        total: count,
        limit: pageSize
    });
});


module.exports = {
    getAllSellers,
    getSellerProfile,
    getSellerProducts
};