// models/Product.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sellerName: { type: DataTypes.STRING, allowNull: true },
  sellerProfileImage: { type: DataTypes.STRING, allowNull: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  shortDescription: { type: DataTypes.STRING, allowNull: true },
  
  // Multi-language support
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Translations for name, description, shortDescription in different languages'
  },
  images: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
  rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  numReviews: { type: DataTypes.INTEGER, defaultValue: 0 },
  likes: { type: DataTypes.INTEGER, defaultValue: 0 },
  likedBy: { type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: [] },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  isSeasonal: { type: DataTypes.BOOLEAN, defaultValue: false },
  isBestSeller: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  brand: { type: DataTypes.STRING, allowNull: true },
  model: { type: DataTypes.STRING, allowNull: true },
  tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  metaTitle: { type: DataTypes.STRING, allowNull: true },
  metaDescription: { type: DataTypes.TEXT, allowNull: true },
  slug: { type: DataTypes.STRING, allowNull: true, unique: true },
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['description'] },
    { fields: ['categoryId'] },
    { fields: ['userId'] },
    { fields: ['rating'] },
    { fields: ['isActive'] },
    { fields: ['brand'] },
    { fields: ['slug'] },
    { fields: ['tags'], using: 'gin' },
  ],
});

// Instance methods
Product.prototype.updateRating = async function() {
  const Review = require('./Review');
  const reviews = await Review.findAll({ where: { productId: this.id } });
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
    this.rating = Math.round((totalRating / reviews.length) * 10) / 10;
  } else {
    this.rating = 0;
  }
  this.numReviews = reviews.length;
  await this.save();
};

// Mahsulotning eng arzon narxini topish (multi-currency support)
Product.prototype.getMinPrice = async function(currencyCode = 'UZS') {
  const ProductVariant = require('./ProductVariant');
  const variants = await ProductVariant.findAll({
    where: { productId: this.id, isActive: true }
  });
  
  if (variants.length === 0) return 0;
  
  const prices = variants.map(v => v.getEffectivePrice(currencyCode));
  return Math.min(...prices);
};

// Mahsulotning eng qimmat narxini topish (multi-currency support)
Product.prototype.getMaxPrice = async function(currencyCode = 'UZS') {
  const ProductVariant = require('./ProductVariant');
  const variants = await ProductVariant.findAll({
    where: { productId: this.id, isActive: true }
  });
  
  if (variants.length === 0) return 0;
  
  const prices = variants.map(v => v.getEffectivePrice(currencyCode));
  return Math.max(...prices);
};

// Get price range in specific currency
Product.prototype.getPriceRange = async function(currencyCode = 'UZS') {
  const minPrice = await this.getMinPrice(currencyCode);
  const maxPrice = await this.getMaxPrice(currencyCode);
  
  return {
    min: minPrice,
    max: maxPrice,
    currency: currencyCode,
    isSinglePrice: minPrice === maxPrice
  };
};

// Get formatted price range
Product.prototype.getFormattedPriceRange = async function(currencyCode = 'UZS') {
  const Currency = require('./Currency');
  const currency = await Currency.findByPk(currencyCode);
  
  if (!currency) return null;
  
  const priceRange = await this.getPriceRange(currencyCode);
  
  if (priceRange.isSinglePrice) {
    return currency.formatAmount(priceRange.min);
  }
  
  return `${currency.formatAmount(priceRange.min)} - ${currency.formatAmount(priceRange.max)}`;
};

// Mahsulot stokda bormi
Product.prototype.isInStock = async function() {
  const ProductVariant = require('./ProductVariant');
  const totalStock = await ProductVariant.sum('countInStock', {
    where: { productId: this.id, isActive: true }
  });
  return totalStock > 0;
};

// Umumiy stok miqdori
Product.prototype.getTotalStock = async function() {
  const ProductVariant = require('./ProductVariant');
  const totalStock = await ProductVariant.sum('countInStock', {
    where: { productId: this.id, isActive: true }
  });
  return totalStock || 0;
};

// Asosiy variantni olish
Product.prototype.getDefaultVariant = async function() {
  const ProductVariant = require('./ProductVariant');
  let defaultVariant = await ProductVariant.findOne({
    where: { productId: this.id, isDefault: true, isActive: true }
  });
  
  if (!defaultVariant) {
    defaultVariant = await ProductVariant.findOne({
      where: { productId: this.id, isActive: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
    });
  }
  
  return defaultVariant;
};

// Slug yaratish
Product.prototype.generateSlug = function() {
  if (!this.name) return null;
  return this.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-') + '-' + this.id;
};

// Get translated content
Product.prototype.getTranslatedContent = function(language = 'uz') {
  const translations = this.translations || {};
  
  return {
    name: translations[language]?.name || this.name,
    description: translations[language]?.description || this.description,
    shortDescription: translations[language]?.shortDescription || this.shortDescription,
    brand: translations[language]?.brand || this.brand,
    metaTitle: translations[language]?.metaTitle || this.metaTitle,
    metaDescription: translations[language]?.metaDescription || this.metaDescription
  };
};

// Set translation for specific language
Product.prototype.setTranslation = async function(language, content) {
  const translations = this.translations || {};
  translations[language] = {
    ...translations[language],
    ...content
  };
  
  this.translations = translations;
  await this.save();
  return this;
};

// Get available languages for this product
Product.prototype.getAvailableLanguages = function() {
  const translations = this.translations || {};
  const languages = Object.keys(translations);
  
  // Always include default language if product has content
  if (this.name && !languages.includes('uz')) {
    languages.unshift('uz');
  }
  
  return languages;
};

// Get available currencies for this product
Product.prototype.getAvailableCurrencies = async function() {
  const ProductVariant = require('./ProductVariant');
  const variants = await ProductVariant.findAll({
    where: { productId: this.id, isActive: true },
    attributes: ['currency', 'prices']
  });
  
  const currencies = new Set();
  
  variants.forEach(variant => {
    currencies.add(variant.currency);
    if (variant.prices) {
      Object.keys(variant.prices).forEach(curr => currencies.add(curr));
    }
  });
  
  return Array.from(currencies);
};

// Get product with variants in specific currency
Product.prototype.getWithVariantsInCurrency = async function(currencyCode = 'UZS', language = 'uz') {
  const ProductVariant = require('./ProductVariant');
  const Currency = require('./Currency');
  
  const variants = await ProductVariant.findAll({
    where: { productId: this.id, isActive: true },
    order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
  });
  
  const currency = await Currency.findByPk(currencyCode);
  
  const variantsWithPrices = await Promise.all(
    variants.map(async variant => {
      const effectivePrice = variant.getEffectivePrice(currencyCode);
      const formattedPrice = currency ? currency.formatAmount(effectivePrice) : effectivePrice;
      
      return {
        ...variant.toJSON(),
        effectivePrice,
        formattedPrice,
        discountPercentage: variant.getDiscountPercentage(currencyCode),
        isAvailable: variant.isAvailable()
      };
    })
  );
  
  return {
    ...this.getTranslatedContent(language),
    id: this.id,
    images: this.images,
    rating: this.rating,
    numReviews: this.numReviews,
    likes: this.likes,
    isFeatured: this.isFeatured,
    isSeasonal: this.isSeasonal,
    isBestSeller: this.isBestSeller,
    isActive: this.isActive,
    brand: this.brand,
    model: this.model,
    tags: this.tags,
    slug: this.slug,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    variants: variantsWithPrices,
    priceRange: await this.getPriceRange(currencyCode),
    formattedPriceRange: await this.getFormattedPriceRange(currencyCode),
    availableCurrencies: await this.getAvailableCurrencies(),
    totalStock: await this.getTotalStock(),
    isInStock: await this.isInStock()
  };
};

// Get available attributes across all variants
Product.prototype.getAvailableAttributes = async function() {
  const ProductVariant = require('./ProductVariant');
  const variants = await ProductVariant.findAll({
    where: { productId: this.id, isActive: true },
    attributes: ['variantAttributes', 'size', 'color'] // Include legacy fields
  });
  
  const attributeMap = new Map();
  
  variants.forEach(variant => {
    // Handle legacy size and color
    if (variant.size) {
      if (!attributeMap.has('size')) attributeMap.set('size', new Set());
      attributeMap.get('size').add(variant.size);
    }
    if (variant.color) {
      if (!attributeMap.has('color')) attributeMap.set('color', new Set());
      attributeMap.get('color').add(variant.color);
    }
    
    // Handle dynamic attributes
    if (variant.variantAttributes) {
      Object.entries(variant.variantAttributes).forEach(([key, value]) => {
        if (!attributeMap.has(key)) attributeMap.set(key, new Set());
        attributeMap.get(key).add(value);
      });
    }
  });
  
  // Convert to object with arrays
  const result = {};
  attributeMap.forEach((values, key) => {
    result[key] = Array.from(values).sort();
  });
  
  return result;
};

// Find variants by attributes
Product.prototype.findVariantsByAttributes = async function(attributes) {
  const ProductVariant = require('./ProductVariant');
  return await ProductVariant.findByAttributes(this.id, attributes);
};

// Static method to search products with currency support
Product.searchWithCurrency = async function(searchParams) {
  const {
    query,
    categoryId,
    minPrice,
    maxPrice,
    currencyCode = 'UZS',
    language = 'uz',
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = searchParams;
  
  const { Op } = require('sequelize');
  const ProductVariant = require('./ProductVariant');
  
  let where = { isActive: true };
  
  if (query) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${query}%` } },
      { description: { [Op.iLike]: `%${query}%` } },
      { tags: { [Op.contains]: [query] } }
    ];
  }
  
  if (categoryId) {
    where.categoryId = categoryId;
  }
  
  const offset = (page - 1) * limit;
  
  const products = await Product.findAndCountAll({
    where,
    include: [{
      model: ProductVariant,
      as: 'variants',
      where: { isActive: true },
      required: true
    }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder]],
    distinct: true
  });
  
  // Filter by price range if specified
  let filteredProducts = products.rows;
  if (minPrice || maxPrice) {
    filteredProducts = await Promise.all(
      products.rows.map(async product => {
        const priceRange = await product.getPriceRange(currencyCode);
        const inRange = (!minPrice || priceRange.min >= minPrice) &&
                       (!maxPrice || priceRange.max <= maxPrice);
        return inRange ? product : null;
      })
    );
    filteredProducts = filteredProducts.filter(p => p !== null);
  }
  
  // Add currency-specific data
  const productsWithCurrency = await Promise.all(
    filteredProducts.map(product =>
      product.getWithVariantsInCurrency(currencyCode, language)
    )
  );
  
  return {
    products: productsWithCurrency,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: products.count,
      pages: Math.ceil(products.count / limit)
    }
  };
};

module.exports = Product;
