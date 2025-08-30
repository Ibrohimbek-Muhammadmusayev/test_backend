// controllers/categoryController.js
const asyncHandler = require('express-async-handler');
const { Category, Product, Language } = require('../models'); // Category va Product modellarini import qilamiz
const { Op } = require('sequelize'); // Sequelize operatorlari uchun
const fs = require('fs');
const path = require('path');

// @desc    Fetch all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const { language, tree, search, page = 1, limit = 20 } = req.query;
    
    // Get user's preferred language
    const user = req.user ? await User.findByPk(req.user.id) : null;
    const currentLanguage = language || user?.preferredLanguage || req.languageCode || 'uz';
    
    // If tree structure is requested
    if (tree === 'true') {
        const categoryTree = await Category.getCategoryTree(currentLanguage);
        return res.json({
            categories: categoryTree,
            language: currentLanguage,
            structure: 'tree'
        });
    }
    
    // If search is requested
    if (search) {
        const searchResults = await Category.searchByName(search, currentLanguage, {
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });
        
        return res.json({
            ...searchResults,
            language: currentLanguage,
            searchTerm: search,
            pagination: {
                ...searchResults.pagination,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    }
    
    // Default: get all active categories with translations
    const translatedCategories = await Category.getActiveCategories(currentLanguage, {
        includeParent: true,
        sortBy: 'sortOrder',
        sortOrder: 'ASC'
    });

    res.json({
        categories: translatedCategories,
        language: currentLanguage,
        total: translatedCategories.length
    });
});

// @desc    Fetch single category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
    const { language, includeProducts } = req.query;
    
    // Get user's preferred language
    const user = req.user ? await User.findByPk(req.user.id) : null;
    const currentLanguage = language || user?.preferredLanguage || req.languageCode || 'uz';
    
    const includeOptions = [{
        model: Category,
        as: 'parentCategory',
        attributes: ['id', 'name', 'translations']
    }];
    
    // Include products if requested
    if (includeProducts === 'true') {
        includeOptions.push({
            model: Product,
            as: 'products',
            where: { isActive: true },
            required: false,
            attributes: ['id', 'name', 'images', 'translations'],
            limit: 10 // Limit products for performance
        });
    }
    
    const category = await Category.findOne({
        where: {
            id: req.params.id,
            isActive: true
        },
        include: includeOptions
    });

    if (!category) {
        res.status(404);
        throw new Error('Category not found.');
    }

    // Get full translated data
    const categoryData = category.getFullTranslatedData(currentLanguage);
    
    // Translate parent category if exists
    if (category.parentCategory) {
        categoryData.parentCategory = category.parentCategory.getFullTranslatedData(currentLanguage);
    }
    
    // Translate products if included
    if (categoryData.products) {
        categoryData.products = categoryData.products.map(product => {
            const translatedContent = product.translations?.[currentLanguage] || {};
            return {
                ...product,
                name: translatedContent.name || product.name,
                description: translatedContent.description || product.description
            };
        });
    }

    res.json({
        category: categoryData,
        language: currentLanguage
    });
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
    const { name, description, parentCategory, translations, sortOrder } = req.body;

    // Nom noyobligini tekshirish
    const categoryExists = await Category.findOne({ where: { name: name } });
    if (categoryExists) {
        res.status(400);
        throw new Error('Category with this name already exists.');
    }

    let imageUrl;
    if (req.processedImageUrls && req.processedImageUrls.length > 0) {
        imageUrl = req.processedImageUrls[0];
    } else {
        imageUrl = `${process.env.BASE_URL}/uploads/default_category_image.webp`; // Default rasm
    }

    // Tarjimalarni tayyorlash
    let parsedTranslations = {};
    if (translations) {
        try {
            parsedTranslations = typeof translations === 'string' ? JSON.parse(translations) : translations;
        } catch (err) {
            throw new Error('Translations must be a valid JSON object.');
        }
    }

    const category = await Category.create({
        name,
        description,
        image: imageUrl,
        parentCategoryId: parentCategory || null,
        translations: parsedTranslations,
        sortOrder: sortOrder || 0,
        isActive: true
    });

    // Yaratilgan kategoriyani parentCategory nomi bilan birga qaytarish uchun
    const createdCategoryWithParent = await Category.findByPk(category.id, {
        include: [{
            model: Category,
            as: 'parentCategory',
            attributes: ['id', 'name', 'translations']
        }]
    });

    res.status(201).json(createdCategoryWithParent);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
    const { name, description, parentCategory, translations, sortOrder, isActive } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (category) {
        // Nom o'zgarganda noyoblikni tekshirish
        if (name && name !== category.name) {
            const nameExists = await Category.findOne({
                where: {
                    name: name,
                    id: { [Op.ne]: req.params.id } // Jori kategoriyadan boshqa nomlar orasida tekshirish
                }
            });
            if (nameExists) {
                res.status(400);
                throw new Error('Category with this name already exists.');
            }
        }

        // Rasmni yangilash
        let newImageUrl = category.image; // Hozirgi rasmni saqlab qolamiz
        if (req.processedImageUrls && req.processedImageUrls.length > 0) {
            // Eski rasmni o'chirish (agar default rasm bo'lmasa va yangi rasm yuklangan bo'lsa)
            if (category.image && !category.image.includes('default_category_image')) {
                const oldFilename = category.image.split('/').pop();
                const oldFilePath = path.join(__dirname, '../../uploads', oldFilename);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlink(oldFilePath, (err) => {
                        if (err) console.error('Failed to delete old category image:', err);
                    });
                }
            }
            newImageUrl = req.processedImageUrls[0]; // Yangi rasm URL
        }

        // Tarjimalarni yangilash
        let updatedTranslations = category.translations;
        if (translations) {
            try {
                const parsedTranslations = typeof translations === 'string' ? JSON.parse(translations) : translations;
                updatedTranslations = { ...category.translations, ...parsedTranslations };
            } catch (err) {
                throw new Error('Translations must be a valid JSON object.');
            }
        }

        await category.update({
            name: name || category.name,
            description: description || category.description,
            parentCategoryId: parentCategory !== undefined ? parentCategory : category.parentCategoryId,
            image: newImageUrl,
            translations: updatedTranslations,
            sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder,
            isActive: isActive !== undefined ? isActive : category.isActive
        });

        // Yangilangan kategoriyani parentCategory nomi bilan birga qaytarish uchun
        const updatedCategoryWithParent = await Category.findByPk(category.id, {
            include: [{
                model: Category,
                as: 'parentCategory',
                attributes: ['id', 'name', 'translations']
            }]
        });

        res.json(updatedCategoryWithParent);
    } else {
        res.status(404);
        throw new Error('Category not found.');
    }
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByPk(req.params.id);

    if (category) {
        // Kategoriya rasmini serverdan o'chirish (agar default rasm bo'lmasa)
        if (category.image && !category.image.includes('default_category_image')) {
            const filename = category.image.split('/').pop();
            const filePath = path.join(__dirname, '../../uploads', filename);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Failed to delete category image:', err);
                });
            }
        }

        // Agar bu kategoriya boshqa mahsulotlar tomonidan ishlatilayotgan bo'lsa, tekshirish tavsiya etiladi.
        // Hozircha bu tekshiruv yo'q, lekin mantiqan to'g'ri bo'ladi.
        // Masalan:
        const productsUsingCategory = await Product.count({ where: { categoryId: category.id } });
        if (productsUsingCategory > 0) {
            res.status(400);
            throw new Error('Cannot delete category as it is associated with products.');
        }

        // Agar bu kategoriya boshqa kategoriyalar uchun parentCategory bo'lsa, ularni NULL qilish
        await Category.update(
            { parentCategoryId: null },
            { where: { parentCategoryId: category.id } }
        );

        await category.destroy(); // deleteOne() o'rniga destroy()
        res.json({ message: 'Category removed.' });
    } else {
        res.status(404);
        throw new Error('Category not found.');
    }
});

// @desc    Add/Update category translation
// @route   POST /api/categories/:id/translations
// @access  Private/Admin
const addCategoryTranslation = asyncHandler(async (req, res) => {
    const { language, name, description } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
        res.status(404);
        throw new Error('Category not found.');
    }

    // Tilni tekshirish
    const languageObj = await Language.findOne({ where: { code: language, isActive: true } });
    if (!languageObj) {
        res.status(400);
        throw new Error('Language not supported.');
    }

    // Tarjima qo'shish
    const translationData = {};
    if (name) translationData.name = name;
    if (description) translationData.description = description;

    await category.setTranslation(language, translationData);

    res.json({
        message: 'Translation added successfully',
        language,
        translation: translationData
    });
});

// @desc    Get category translations
// @route   GET /api/categories/:id/translations
// @access  Public
const getCategoryTranslations = asyncHandler(async (req, res) => {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
        res.status(404);
        throw new Error('Category not found.');
    }

    res.json({
        translations: category.translations || {},
        availableLanguages: category.getAvailableLanguages()
    });
});

// @desc    Delete category translation
// @route   DELETE /api/categories/:id/translations/:language
// @access  Private/Admin
const deleteCategoryTranslation = asyncHandler(async (req, res) => {
    const { language } = req.params;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
        res.status(404);
        throw new Error('Category not found.');
    }

    // Tarjimani o'chirish
    const translations = { ...category.translations };
    delete translations[language];

    await category.update({ translations });

    res.json({
        message: 'Translation deleted successfully',
        language
    });
});

// @desc    Get category in specific language
// @route   GET /api/categories/:id/language/:language
// @access  Public
const getCategoryInLanguage = asyncHandler(async (req, res) => {
    const { language } = req.params;
    const category = await Category.findByPk(req.params.id, {
        where: { isActive: true },
        include: [{
            model: Category,
            as: 'parentCategory',
            attributes: ['id', 'name', 'translations']
        }]
    });

    if (!category) {
        res.status(404);
        throw new Error('Category not found.');
    }

    // Tilni tekshirish
    const languageObj = await Language.findOne({ where: { code: language, isActive: true } });
    if (!languageObj) {
        res.status(400);
        throw new Error('Language not supported.');
    }

    const categoryData = category.toJSON();
    
    // Tarjima qilish
    const translatedContent = category.getTranslatedContent(language);
    if (translatedContent) {
        Object.assign(categoryData, translatedContent);
    }

    // Parent kategoriya tarjimasi
    if (categoryData.parentCategory) {
        const parentTranslatedContent = category.parentCategory.getTranslatedContent(language);
        if (parentTranslatedContent) {
            Object.assign(categoryData.parentCategory, parentTranslatedContent);
        }
    }

    res.json(categoryData);
});

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryTranslation,
    getCategoryTranslations,
    deleteCategoryTranslation,
    getCategoryInLanguage
};