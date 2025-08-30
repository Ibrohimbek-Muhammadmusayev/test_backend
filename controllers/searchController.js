// controllers/searchController.js
const asyncHandler = require('express-async-handler');
const { Op, Sequelize } = require('sequelize');
const {
  Product,
  ProductVariant,
  Category,
  SearchHistory,
  User,
  ProductAttribute,
  AttributeValue,
  ProductVariantAttribute,
  sequelize
} = require('../models');

// Helper function to get user's preferred language
const getUserLanguage = (req) => {
  return req.query.language ||
         req.user?.preferences?.language ||
         req.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
         'uz';
};

// Helper function to create multi-language search conditions
const createMultiLanguageSearchCondition = (keyword, language = 'uz') => {
  const searchCondition = { [Op.iLike]: `%${keyword.trim()}%` };
  
  return {
    [Op.or]: [
      // Original fields
      { name: searchCondition },
      { description: searchCondition },
      { shortDescription: searchCondition },
      { brand: searchCondition },
      { tags: { [Op.overlap]: [keyword.trim()] } },
      // Translation fields
      {
        translations: {
          [language]: {
            name: searchCondition
          }
        }
      },
      {
        translations: {
          [language]: {
            description: searchCondition
          }
        }
      },
      {
        translations: {
          [language]: {
            shortDescription: searchCondition
          }
        }
      },
      {
        translations: {
          [language]: {
            brand: searchCondition
          }
        }
      },
      // Search in all translation languages
      {
        [Op.or]: [
          { 'translations.uz.name': searchCondition },
          { 'translations.uz.description': searchCondition },
          { 'translations.ru.name': searchCondition },
          { 'translations.ru.description': searchCondition },
          { 'translations.en.name': searchCondition },
          { 'translations.en.description': searchCondition }
        ]
      }
    ]
  };
};

// @desc    Advanced search with variant attributes (Multi-language support)
// @route   GET /api/search/advanced
// @access  Public
const advancedSearch = asyncHandler(async (req, res) => {
  const {
    keyword,
    category,
    minPrice,
    maxPrice,
    brand,
    attributes, // JSON string: {"color": "red", "size": "M"}
    inStock,
    sortBy,
    page = 1,
    limit = 10
  } = req.query;

  const language = getUserLanguage(req);
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let whereCondition = { isActive: true };
  let variantWhereCondition = { isActive: true };

  // Multi-language keyword search
  if (keyword) {
    whereCondition = {
      ...whereCondition,
      ...createMultiLanguageSearchCondition(keyword, language)
    };
  }

  // Multi-language category filter
  if (category) {
    const categoryObj = await Category.searchByName(category, language, { limit: 1 });
    if (categoryObj.categories && categoryObj.categories.length > 0) {
      whereCondition.categoryId = categoryObj.categories[0].id;
    }
  }

  // Multi-language brand filter
  if (brand) {
    const brandCondition = { [Op.iLike]: `%${brand}%` };
    whereCondition[Op.or] = [
      ...(whereCondition[Op.or] || []),
      { brand: brandCondition },
      {
        translations: {
          [language]: {
            brand: brandCondition
          }
        }
      }
    ];
  }

  // Stok filtri
  if (inStock === 'true') {
    variantWhereCondition.countInStock = { [Op.gt]: 0 };
  }

  // Narx filtri
  if (minPrice || maxPrice) {
    const priceCondition = {};
    if (minPrice && maxPrice) {
      priceCondition[Op.or] = [
        { price: { [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)] } },
        { discountPrice: { [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)] } }
      ];
    } else if (minPrice) {
      priceCondition[Op.or] = [
        { price: { [Op.gte]: parseFloat(minPrice) } },
        { discountPrice: { [Op.gte]: parseFloat(minPrice) } }
      ];
    } else if (maxPrice) {
      priceCondition[Op.or] = [
        { price: { [Op.lte]: parseFloat(maxPrice) } },
        { discountPrice: { [Op.lte]: parseFloat(maxPrice) } }
      ];
    }
    Object.assign(variantWhereCondition, priceCondition);
  }

  // Variant include
  const variantInclude = {
    model: ProductVariant,
    as: 'variants',
    where: variantWhereCondition,
    required: true,
    attributes: [
      'id', 'sku', 'price', 'discountPrice', 'countInStock',
      'images', 'isDefault', 'size', 'color'
    ],
    include: []
  };

  // Attribute filtri
  if (attributes) {
    try {
      const attributeFilters = JSON.parse(attributes);
      const attributeConditions = [];

      for (const [attrName, attrValue] of Object.entries(attributeFilters)) {
        attributeConditions.push({
          model: ProductVariantAttribute,
          as: 'attributes',
          required: true,
          include: [
            {
              model: ProductAttribute,
              as: 'attribute',
              where: { name: attrName },
              required: true
            },
            {
              model: AttributeValue,
              as: 'attributeValue',
              where: { value: attrValue },
              required: true
            }
          ]
        });
      }

      if (attributeConditions.length > 0) {
        variantInclude.include = attributeConditions;
      }
    } catch (error) {
      console.error('Invalid attributes filter:', error);
    }
  }

  // Sortlash
  let orderOptions = [['createdAt', 'DESC']];
  if (sortBy === 'price_asc') {
    orderOptions = [[{ model: ProductVariant, as: 'variants' }, 'price', 'ASC']];
  } else if (sortBy === 'price_desc') {
    orderOptions = [[{ model: ProductVariant, as: 'variants' }, 'price', 'DESC']];
  } else if (sortBy === 'name_asc') {
    orderOptions = [['name', 'ASC']];
  } else if (sortBy === 'rating_desc') {
    orderOptions = [['rating', 'DESC']];
  }

  // Umumiy soni
  const count = await Product.count({
    where: whereCondition,
    include: [variantInclude],
    distinct: true
  });

  // Mahsulotlarni olish
  const products = await Product.findAll({
    where: whereCondition,
    include: [
      variantInclude,
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      },
      {
        model: User,
        as: 'seller',
        attributes: ['id', 'fullName', 'profileImage']
      }
    ],
    order: orderOptions,
    limit: parseInt(limit),
    offset: offset,
    distinct: true
  });

  // Ma'lumotlarni qayta ishlash (Multi-language support)
  const processedProducts = products.map(product => {
    const productData = product.toJSON();
    
    // Add translated content
    const translatedContent = product.getTranslatedContent(language);
    Object.assign(productData, translatedContent);
    
    // Narx oralig'i
    const prices = productData.variants.map(v => v.discountPrice || v.price);
    productData.priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };

    // Umumiy stok
    productData.totalStock = productData.variants.reduce((sum, v) => sum + v.countInStock, 0);

    // Asosiy variant
    productData.defaultVariant = productData.variants.find(v => v.isDefault) || productData.variants[0];

    return productData;
  });

  res.json({
    products: processedProducts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / parseInt(limit))
    },
    language,
    searchTerm: keyword
  });
});

// @desc    Simple search products and categories (Multi-language support)
// @route   GET /api/search?keyword=...&limit=...
// @access  Public (saving history is private)
const searchAll = asyncHandler(async (req, res) => {
    const keyword = req.query.search?.trim();
    const limit = parseInt(req.query.limit) || 10;
    const language = getUserLanguage(req);

    if (!keyword) {
        return res.status(400).json({
            message: language === 'uz' ? 'Qidiruv kaliti talab qilinadi.' :
                     language === 'ru' ? 'Требуется ключевое слово для поиска.' :
                     'Search keyword is required.'
        });
    }

    // Multi-language product search
    const products = await Product.findAll({
        where: {
            isActive: true,
            ...createMultiLanguageSearchCondition(keyword, language)
        },
        limit,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'translations']
          },
          {
            model: ProductVariant,
            as: 'variants',
            where: { isActive: true },
            required: false,
            attributes: ['id', 'price', 'discountPrice', 'countInStock', 'isDefault'],
            limit: 1,
            order: [['isDefault', 'DESC']]
          }
        ]
    });

    // Multi-language category search using Category.searchByName
    const categorySearchResult = await Category.searchByName(keyword, language, { limit });
    const categories = categorySearchResult.categories || [];

    // Ma'lumotlarni qayta ishlash (Multi-language support)
    const processedProducts = products.map(product => {
      const productData = product.toJSON();
      
      // Add translated content
      const translatedContent = product.getTranslatedContent(language);
      Object.assign(productData, translatedContent);
      
      // Add translated category name
      if (productData.category) {
        const categoryTranslated = productData.category.getTranslatedContent ?
          productData.category.getTranslatedContent(language) :
          { name: productData.category.name };
        productData.category = { ...productData.category, ...categoryTranslated };
      }
      
      if (productData.variants && productData.variants.length > 0) {
        const variant = productData.variants[0];
        productData.price = variant.discountPrice || variant.price;
        productData.inStock = variant.countInStock > 0;
      }
      productData.type = 'product';
      return productData;
    });

    // Process categories with translations
    const processedCategories = categories.map(category => {
      const categoryData = category.toJSON();
      const translatedContent = category.getTranslatedContent(language);
      return {
        ...categoryData,
        ...translatedContent,
        type: 'category'
      };
    });

    res.json({
        results: [
            ...processedProducts,
            ...processedCategories
        ],
        language,
        searchTerm: keyword,
        totalResults: processedProducts.length + processedCategories.length
    });
});

// @desc    Get search suggestions (Multi-language support)
// @route   GET /api/search/suggestions
// @access  Public
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const language = getUserLanguage(req);
  
  if (!q || q.length < 2) {
    return res.json([]);
  }

  const searchCondition = { [Op.iLike]: `%${q.trim()}%` };
  
  // Multi-language mahsulot nomlari
  const products = await Product.findAll({
    where: {
      isActive: true,
      ...createMultiLanguageSearchCondition(q, language)
    },
    attributes: ['name', 'translations'],
    limit: 5
  });

  // Multi-language brand nomlari
  const brands = await Product.findAll({
    where: {
      isActive: true,
      [Op.or]: [
        { brand: searchCondition },
        {
          translations: {
            [language]: {
              brand: searchCondition
            }
          }
        }
      ],
      brand: { [Op.ne]: null }
    },
    attributes: ['brand', 'translations'],
    limit: 3
  });

  // Multi-language kategoriya nomlari
  const categorySearchResult = await Category.searchByName(q, language, { limit: 3 });
  const categories = categorySearchResult.categories || [];

  const suggestions = [
    // Product suggestions with translations
    ...products.map(p => {
      const translatedContent = p.getTranslatedContent(language);
      return {
        text: translatedContent.name,
        type: 'product',
        language
      };
    }),
    // Brand suggestions with translations
    ...brands.map(b => {
      const translatedContent = b.getTranslatedContent(language);
      return {
        text: translatedContent.brand || b.brand,
        type: 'brand',
        language
      };
    }).filter(b => b.text), // Filter out null brands
    // Category suggestions with translations
    ...categories.map(c => {
      const translatedContent = c.getTranslatedContent(language);
      return {
        text: translatedContent.name,
        type: 'category',
        language
      };
    })
  ];

  // Remove duplicates
  const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
    index === self.findIndex(s => s.text === suggestion.text && s.type === suggestion.type)
  );

  res.json({
    suggestions: uniqueSuggestions,
    language,
    query: q
  });
});

const saveSearchHistory = asyncHandler(async (req, res) => {
    const { query, type } = req.body;
    const language = getUserLanguage(req);

    if (!query) {
        const message = language === 'uz' ? 'Qidiruv so\'zi talab qilinadi' :
                       language === 'ru' ? 'Требуется поисковый запрос' :
                       'Search query is required';
        return res.status(400).json({ message });
    }

    // Agar foydalanuvchi admin bo'lsa — saqlamaymiz
    if (req.user.status === 'admin') {
        const message = language === 'uz' ? 'Admin qidiruv tarixi saqlanmaydi' :
                       language === 'ru' ? 'История поиска администратора не сохраняется' :
                       'Admins search history is not saved';
        return res.status(200).json({ message });
    }

    const history = await SearchHistory.create({
        userId: req.user.id,
        query,
        type: type || 'all'
    });

    res.status(201).json(history);
});

const getPopularSearches = asyncHandler(async (req, res) => {
    // Faqat adminlar kirishi mumkin
    if (req.user.status !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const limit = parseInt(req.query.limit) || 10; // nechta chiqishi kerak

    const popularSearches = await SearchHistory.findAll({
        attributes: [
            'query',
            [Sequelize.fn('COUNT', Sequelize.col('query')), 'count'] // necha marta qidirilganini sanash
        ],
        group: ['query'], // guruhlash
        order: [[Sequelize.literal('count'), 'DESC']], // eng ko‘pdan eng kamgacha
        limit: limit
    });

    res.json(popularSearches);
});

const getAllSearches = asyncHandler(async (req, res) => {
    if (req.user.status !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const searches = await SearchHistory.findAll({
        include: [
            {
                model: User,
                as: 'user', // assotsiatsiyadagi alias
                attributes: ['id', 'fullName', 'phoneNumber', 'status']
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    res.json(searches);
});

// Eng ko‘p qidirilgan so‘zlar statistikasi
async function getTopSearchQueries(req, res) {
  try {
    // Faqat adminlar ko‘ra oladi
    if (req.user.status !== 'admin') {
      return res.status(403).json({ success: false, message: 'Ruxsat yo‘q' });
    }

    const stats = await SearchHistory.findAll({
      attributes: [
        'query',
        [sequelize.fn('COUNT', sequelize.col('query')), 'count']
      ],
      group: ['query'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 10 // eng ko‘p 10 tasi
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
}


// @desc    Get user's search history
// @route   GET /api/search/history
// @access  Private (User specific)
const getSearchHistory = asyncHandler(async (req, res) => {
    const history = await SearchHistory.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
        limit: 20
    });
    res.json(history);
});

const deleteHistoryItem = asyncHandler(async (req, res) => {
    const item = await SearchHistory.findOne({
        where: { id: req.params.id, userId: req.user.id }
    });

    if (!item) {
        return res.status(404).json({ message: 'History item not found' });
    }

    await item.destroy();
    res.json({ message: 'History item deleted' });
});

const clearSearchHistory = asyncHandler(async (req, res) => {
    await SearchHistory.destroy({
        where: { userId: req.user.id }
    });

    res.json({ message: 'All search history cleared' });
});

module.exports = {
    searchAll,
    advancedSearch,
    getSearchSuggestions,
    getSearchHistory,
    saveSearchHistory,
    deleteHistoryItem,
    clearSearchHistory,
    getPopularSearches,
    getAllSearches,
    getTopSearchQueries
};