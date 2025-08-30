const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const {
  Product,
  ProductVariant,
  Category,
  User,
  Review,
  Comment,
  ProductAttribute,
  AttributeValue,
  ProductVariantAttribute,
  Language
} = require('../models');

// --- GET all products ---
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const {
    search,
    category,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
    isFeatured,
    isSeasonal,
    isBestSeller,
    sellerId,
    brand,
    inStock,
    attributes // JSON string: {"color": "red", "size": "M"}
  } = req.query;

  let whereCondition = { isActive: true };
  let variantWhereCondition = { isActive: true };

  // --- Qidiruv ---
  if (search) {
    const searchCondition = { [Op.iLike]: `%${search}%` };
    whereCondition[Op.or] = [
      { name: searchCondition },
      { description: searchCondition },
      { shortDescription: searchCondition },
      { brand: searchCondition },
      { tags: { [Op.overlap]: [search] } }
    ];
  }

  // --- Kategoriya filtri ---
  if (category) {
    const categoryObj = await Category.findOne({ where: { name: category } });
    if (!categoryObj)
      return res.json({ products: [], page: 1, pages: 1, total: 0, limit: pageSize });
    whereCondition.categoryId = categoryObj.id;
  }

  // --- Brand filtri ---
  if (brand) whereCondition.brand = { [Op.iLike]: `%${brand}%` };

  // --- Reyting filtri ---
  if (minRating) whereCondition.rating = { [Op.gte]: parseFloat(minRating) };

  // --- Status filtrlari ---
  if (isFeatured) whereCondition.isFeatured = isFeatured === 'true';
  if (isSeasonal) whereCondition.isSeasonal = isSeasonal === 'true';
  if (isBestSeller) whereCondition.isBestSeller = isBestSeller === 'true';

  // --- Sotuvchi filtri ---
  if (sellerId) whereCondition.userId = sellerId;

  // --- Stok filtri ---
  if (inStock === 'true') {
    variantWhereCondition.countInStock = { [Op.gt]: 0 };
  }

  // --- Narx filtri (variantlar orqali) ---
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

  // --- Variant include konfiguratsiyasi ---
  const variantInclude = {
    model: ProductVariant,
    as: 'variants',
    where: variantWhereCondition,
    required: true,
    attributes: [
      'id', 'sku', 'size', 'color', 'price', 'discountPrice',
      'countInStock', 'weight', 'dimensions', 'images',
      'isDefault', 'sortOrder'
    ],
    include: []
  };

  // --- Attribute filtri ---
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

  // --- Sortlash ---
  let orderOptions = [['createdAt', 'DESC']];
  if (sortBy === 'price_asc') {
    orderOptions = [[{ model: ProductVariant, as: 'variants' }, 'price', 'ASC']];
  } else if (sortBy === 'price_desc') {
    orderOptions = [[{ model: ProductVariant, as: 'variants' }, 'price', 'DESC']];
  } else if (sortBy === 'top_rated') {
    orderOptions = [['rating', 'DESC']];
  } else if (sortBy === 'most_liked') {
    orderOptions = [['likes', 'DESC']];
  } else if (sortBy === 'name_asc') {
    orderOptions = [['name', 'ASC']];
  } else if (sortBy === 'name_desc') {
    orderOptions = [['name', 'DESC']];
  }

  // --- Umumiy sonni hisoblash ---
  const count = await Product.count({
    where: whereCondition,
    include: [variantInclude],
    distinct: true
  });

  // --- Mahsulotlarni olish ---
  const productsRaw = await Product.findAll({
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
    limit: pageSize,
    offset: pageSize * (page - 1),
    distinct: true
  });

  // --- Ma'lumotlarni qayta ishlash ---
  const products = await Promise.all(productsRaw.map(async (product) => {
    const productData = product.toJSON();
    
    // Til bo'yicha tarjima qilish
    const currentLanguage = req.languageCode || req.language?.current?.code || 'uz';
    const translatedContent = product.getTranslatedContent(currentLanguage);
    if (translatedContent) {
      Object.assign(productData, translatedContent);
    }
    
    // Narx oralig'ini hisoblash
    const prices = productData.variants.map(v => v.discountPrice || v.price);
    productData.priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };

    // Umumiy stok
    productData.totalStock = productData.variants.reduce((sum, v) => sum + v.countInStock, 0);

    // Asosiy variant
    productData.defaultVariant = productData.variants.find(v => v.isDefault) || productData.variants[0];

    // Tashqi maydonlarni olib tashlash
    delete productData.sellerName;
    delete productData.sellerProfileImage;

    return productData;
  }));

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    limit: pageSize
  });
});

module.exports = { getProducts };

// --- GET single product ---
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    where: { isActive: true },
    include: [
      {
        model: ProductVariant,
        as: 'variants',
        where: { isActive: true },
        required: false,
        attributes: [
          'id', 'sku', 'barcode', 'size', 'color', 'price', 'discountPrice',
          'costPrice', 'countInStock', 'minStockLevel', 'weight', 'dimensions',
          'images', 'isDefault', 'sortOrder'
        ],
        include: [
          {
            model: ProductVariantAttribute,
            as: 'attributes',
            include: [
              {
                model: ProductAttribute,
                as: 'attribute',
                attributes: ['id', 'name', 'displayName', 'type', 'unit']
              },
              {
                model: AttributeValue,
                as: 'attributeValue',
                attributes: ['id', 'value', 'displayValue', 'colorCode', 'imageUrl']
              }
            ]
          }
        ],
        order: [['isDefault', 'DESC'], ['sortOrder', 'ASC']]
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'parentCategoryId']
      },
      {
        model: User,
        as: 'seller',
        attributes: ['id', 'fullName', 'profileImage', 'sellerInfo']
      },
      {
        model: Review,
        as: 'reviews',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'profileImage']
          }
        ],
        order: [['createdAt', 'DESC']]
      },
      {
        model: Comment,
        as: 'comments',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'profileImage']
          }
        ],
        order: [['createdAt', 'DESC']]
      }
    ]
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  // Ma'lumotlarni qayta ishlash
  const productData = product.toJSON();

  // Til bo'yicha tarjima qilish
  const currentLanguage = req.languageCode || req.language?.current?.code || 'uz';
  const translatedContent = product.getTranslatedContent(currentLanguage);
  if (translatedContent) {
    Object.assign(productData, translatedContent);
  }

  // Mavjud tillarni qo'shish
  productData.availableLanguages = product.getAvailableLanguages();

  // Narx oralig'ini hisoblash
  if (productData.variants && productData.variants.length > 0) {
    const prices = productData.variants.map(v => v.discountPrice || v.price);
    productData.priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };

    // Umumiy stok
    productData.totalStock = productData.variants.reduce((sum, v) => sum + v.countInStock, 0);

    // Asosiy variant
    productData.defaultVariant = productData.variants.find(v => v.isDefault) || productData.variants[0];

    // Mavjud attributelarni guruhlash
    const availableAttributes = {};
    productData.variants.forEach(variant => {
      if (variant.attributes) {
        variant.attributes.forEach(attr => {
          const attrName = attr.attribute.name;
          if (!availableAttributes[attrName]) {
            availableAttributes[attrName] = {
              id: attr.attribute.id,
              name: attr.attribute.name,
              displayName: attr.attribute.displayName,
              type: attr.attribute.type,
              unit: attr.attribute.unit,
              values: []
            };
          }

          const value = attr.attributeValue || { value: attr.customValue };
          if (!availableAttributes[attrName].values.find(v => v.value === value.value)) {
            availableAttributes[attrName].values.push(value);
          }
        });
      }
    });

    productData.availableAttributes = Object.values(availableAttributes);
  }

  // Tashqi maydonlarni olib tashlash
  delete productData.sellerName;
  delete productData.sellerProfileImage;

  res.json(productData);
});

// --- CREATE product ---
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    category,
    isFeatured,
    isSeasonal,
    isBestSeller,
    variants,
    translations,
    brand,
    tags
  } = req.body;
  const imageUrls = req.processedImageUrls;

  // --- Tasdiqlashlar ---
  if (!imageUrls || imageUrls.length === 0) throw new Error('At least one image is required.');
  if (imageUrls.length > 5) throw new Error('Maximum 5 images allowed.');

  const categoryObj = await Category.findByPk(category);
  if (!categoryObj) throw new Error('Category not found.');

  // --- Variants majburiy ---
  if (!variants) {
    throw new Error('At least one variant is required.');
  }

  let parsedVariants;
  try {
    parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
  } catch (err) {
    throw new Error('Variants must be a valid JSON array.');
  }

  if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
    throw new Error('Variants must be a non-empty array.');
  }

  // Har bir variantni tekshirish
  for (const v of parsedVariants) {
    if (!v.price) {
      throw new Error('Each variant must include a price.');
    }

    if (v.discountPrice !== undefined && v.discountPrice !== null) {
      if (Number(v.discountPrice) === Number(v.price)) {
        throw new Error('Price and discountPrice cannot be the same.');
      }
      if (Number(v.discountPrice) > Number(v.price)) {
        throw new Error('Discount price cannot be greater than the original price.');
      }
    }
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

  // Tags ni tayyorlash
  let parsedTags = [];
  if (tags) {
    try {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch (err) {
      parsedTags = Array.isArray(tags) ? tags : [tags];
    }
  }

  // --- Product yaratish ---
  const product = await Product.create({
    userId: req.user.id,
    sellerName: req.user.fullName,
    sellerProfileImage: req.user.profileImage,
    name,
    description,
    shortDescription,
    brand,
    tags: parsedTags,
    images: imageUrls,
    rating: 0,
    numReviews: 0,
    likes: 0,
    likedBy: [],
    isFeatured: isFeatured === 'true',
    isSeasonal: isSeasonal === 'true',
    isBestSeller: isBestSeller === 'true',
    categoryId: categoryObj.id,
    translations: parsedTranslations
  });

  // --- Variants yaratish ---
  for (const v of parsedVariants) {
    await ProductVariant.create({
      productId: product.id,
      size: v.size || null,
      color: v.color || null,
      price: v.price,
      discountPrice: v.discountPrice || null,
      countInStock: v.countInStock || 0
    });
  }

  // --- To'liq product qaytarish ---
  const fullProduct = await Product.findByPk(product.id, {
    include: [
      { model: ProductVariant, as: 'variants', attributes: ['id', 'size', 'color', 'price', 'discountPrice', 'countInStock'] },
      { model: Category, as: 'category', attributes: ['name'] },
      { model: User, as: 'seller', attributes: ['id', 'fullName', 'profileImage'] }
    ]
  });

  res.status(201).json(fullProduct);
});



// --- UPDATE product ---
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    brand,
    tags,
    isFeatured,
    isSeasonal,
    isBestSeller,
    variants,
    category,
    translations
  } = req.body;
  const product = await Product.findByPk(req.params.id);

  if (!product) throw new Error('Product not found.');
  if (req.user.status !== 'admin' && product.userId !== req.user.id) throw new Error('Not authorized.');

  const updateFields = {
    name: name || product.name,
    description: description || product.description,
    shortDescription: shortDescription || product.shortDescription,
    brand: brand || product.brand,
    isFeatured: isFeatured !== undefined ? isFeatured === 'true' : product.isFeatured,
    isSeasonal: isSeasonal !== undefined ? isSeasonal === 'true' : product.isSeasonal,
    isBestSeller: isBestSeller !== undefined ? isBestSeller === 'true' : product.isBestSeller
  };

  // Tags ni yangilash
  if (tags) {
    try {
      updateFields.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch (err) {
      updateFields.tags = Array.isArray(tags) ? tags : [tags];
    }
  }

  // Tarjimalarni yangilash
  if (translations) {
    try {
      const parsedTranslations = typeof translations === 'string' ? JSON.parse(translations) : translations;
      updateFields.translations = { ...product.translations, ...parsedTranslations };
    } catch (err) {
      throw new Error('Translations must be a valid JSON object.');
    }
  }

  if (category) {
    const categoryObj = await Category.findByPk(category);
    if (!categoryObj) throw new Error('Category not found.');
    updateFields.categoryId = categoryObj.id;
  }

  if (req.processedImageUrls && req.processedImageUrls.length > 0) {
    for (const imageUrl of product.images) {
      const filename = imageUrl.split('/').pop();
      const filePath = path.join(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    updateFields.images = req.processedImageUrls;
  }

  await product.update(updateFields);

  if (variants && Array.isArray(variants)) {
    await ProductVariant.destroy({ where: { productId: product.id } });
    for (const v of variants) {
      await ProductVariant.create({
        productId: product.id,
        size: v.size,
        color: v.color,
        price: v.price,
        discountPrice: v.discountPrice,
        countInStock: v.countInStock
      });
    }
  }

  const fullProduct = await Product.findByPk(product.id, {
    include: [
      { model: ProductVariant, as: 'variants', attributes: ['id', 'size', 'color', 'price', 'discountPrice', 'countInStock'] },
      { model: Category, as: 'category', attributes: ['name'] },
      { model: User, as: 'seller', attributes: ['id', 'fullName', 'profileImage'] }
    ]
  });

  res.json(fullProduct);
});

// --- DELETE product ---
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new Error('Product not found.');
  if (req.user.status !== 'admin' && product.userId !== req.user.id) throw new Error('Not authorized.');

  for (const imageUrl of product.images) {
    const filename = imageUrl.split('/').pop();
    const filePath = path.join(__dirname, '../../uploads', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await ProductVariant.destroy({ where: { productId: product.id } });
  await product.destroy();

  res.json({ message: 'Product removed.' });
});

// --- LIKE product ---
const likeProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  // User ID ni olish
  const userId = req.user.id;

  // likedBy arrayda user oldin like bosganmi?
  if (product.likedBy.includes(userId)) {
    res.status(400);
    throw new Error("You already liked this product.");
  }

  // Like qo‘shish
  product.likes += 1;
  product.likedBy = [...product.likedBy, userId];

  await product.save();

  res.json({
    message: "Product liked successfully",
    likes: product.likes,
  });
});

// --- ADD/UPDATE translation ---
const addTranslation = asyncHandler(async (req, res) => {
  const { language, name, description, shortDescription } = req.body;
  const product = await Product.findByPk(req.params.id);

  if (!product) throw new Error('Product not found.');
  if (req.user.status !== 'admin' && product.userId !== req.user.id) throw new Error('Not authorized.');

  // Tilni tekshirish
  const languageObj = await Language.findOne({ where: { code: language, isActive: true } });
  if (!languageObj) throw new Error('Language not supported.');

  // Tarjima qo'shish
  const translationData = {};
  if (name) translationData.name = name;
  if (description) translationData.description = description;
  if (shortDescription) translationData.shortDescription = shortDescription;

  await product.setTranslation(language, translationData);

  res.json({
    message: 'Translation added successfully',
    language,
    translation: translationData
  });
});

// --- GET translations ---
const getTranslations = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) throw new Error('Product not found.');

  res.json({
    translations: product.translations || {},
    availableLanguages: product.getAvailableLanguages()
  });
});

// --- DELETE translation ---
const deleteTranslation = asyncHandler(async (req, res) => {
  const { language } = req.params;
  const product = await Product.findByPk(req.params.id);

  if (!product) throw new Error('Product not found.');
  if (req.user.status !== 'admin' && product.userId !== req.user.id) throw new Error('Not authorized.');

  // Tarjimani o'chirish
  const translations = { ...product.translations };
  delete translations[language];

  await product.update({ translations });

  res.json({
    message: 'Translation deleted successfully',
    language
  });
});

// --- GET product in specific language ---
const getProductInLanguage = asyncHandler(async (req, res) => {
  const { language } = req.params;
  const product = await Product.findByPk(req.params.id, {
    where: { isActive: true },
    include: [
      {
        model: ProductVariant,
        as: 'variants',
        where: { isActive: true },
        required: false,
        attributes: [
          'id', 'sku', 'barcode', 'size', 'color', 'price', 'discountPrice',
          'costPrice', 'countInStock', 'minStockLevel', 'weight', 'dimensions',
          'images', 'isDefault', 'sortOrder'
        ]
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'parentCategoryId']
      },
      {
        model: User,
        as: 'seller',
        attributes: ['id', 'fullName', 'profileImage', 'sellerInfo']
      }
    ]
  });

  if (!product) throw new Error('Product not found.');

  // Tilni tekshirish
  const languageObj = await Language.findOne({ where: { code: language, isActive: true } });
  if (!languageObj) throw new Error('Language not supported.');

  const productData = product.toJSON();
  
  // Tarjima qilish
  const translatedContent = product.getTranslatedContent(language);
  if (translatedContent) {
    Object.assign(productData, translatedContent);
  }

  res.json(productData);
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  likeProduct,
  addTranslation,
  getTranslations,
  deleteTranslation,
  getProductInLanguage
};
