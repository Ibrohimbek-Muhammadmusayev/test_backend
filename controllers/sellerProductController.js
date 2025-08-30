// controllers/sellerProductController.js
const asyncHandler = require('express-async-handler');
const { Op, Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const { 
  Product, 
  ProductVariant, 
  Category, 
  Review, 
  Comment,
  ProductAttribute,
  AttributeValue,
  ProductVariantAttribute
} = require('../models');

// @desc    Get seller's products with pagination and filters
// @route   GET /api/seller/products
// @access  Private (Seller only)
const getSellerProducts = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const {
    page = 1,
    limit = 10,
    search,
    category,
    status = 'all', // all, active, inactive
    sortBy = 'newest' // newest, oldest, name_asc, name_desc, price_asc, price_desc
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  let whereCondition = { userId: sellerId };

  // Search filter
  if (search) {
    const searchCondition = { [Op.iLike]: `%${search.trim()}%` };
    whereCondition[Op.or] = [
      { name: searchCondition },
      { description: searchCondition },
      { brand: searchCondition }
    ];
  }

  // Category filter
  if (category) {
    const categoryObj = await Category.findOne({ where: { name: category } });
    if (categoryObj) {
      whereCondition.categoryId = categoryObj.id;
    }
  }

  // Status filter
  if (status === 'active') {
    whereCondition.isActive = true;
  } else if (status === 'inactive') {
    whereCondition.isActive = false;
  }

  // Sorting
  let orderOptions = [['createdAt', 'DESC']];
  switch (sortBy) {
    case 'oldest':
      orderOptions = [['createdAt', 'ASC']];
      break;
    case 'name_asc':
      orderOptions = [['name', 'ASC']];
      break;
    case 'name_desc':
      orderOptions = [['name', 'DESC']];
      break;
    case 'price_asc':
      orderOptions = [[{ model: ProductVariant, as: 'variants' }, 'price', 'ASC']];
      break;
    case 'price_desc':
      orderOptions = [[{ model: ProductVariant, as: 'variants' }, 'price', 'DESC']];
      break;
  }

  // Get total count
  const totalProducts = await Product.count({ where: whereCondition });

  // Get products
  const products = await Product.findAll({
    where: whereCondition,
    include: [
      {
        model: ProductVariant,
        as: 'variants',
        attributes: [
          'id', 'sku', 'price', 'discountPrice', 'countInStock', 
          'isDefault', 'size', 'color', 'images'
        ]
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }
    ],
    order: orderOptions,
    limit: parseInt(limit),
    offset: offset
  });

  // Process products data
  const processedProducts = products.map(product => {
    const productData = product.toJSON();
    
    // Calculate price range
    if (productData.variants && productData.variants.length > 0) {
      const prices = productData.variants.map(v => v.discountPrice || v.price);
      productData.priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
      
      // Total stock
      productData.totalStock = productData.variants.reduce((sum, v) => sum + v.countInStock, 0);
      
      // Default variant
      productData.defaultVariant = productData.variants.find(v => v.isDefault) || productData.variants[0];
    }

    return productData;
  });

  res.json({
    products: processedProducts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalProducts,
      pages: Math.ceil(totalProducts / parseInt(limit))
    }
  });
});

// @desc    Get single product for seller
// @route   GET /api/seller/products/:id
// @access  Private (Seller only)
const getSellerProduct = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const productId = req.params.id;

  const product = await Product.findOne({
    where: { id: productId, userId: sellerId },
    include: [
      {
        model: ProductVariant,
        as: 'variants',
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
        ]
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      },
      {
        model: Review,
        as: 'reviews',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'profileImage']
        }],
        order: [['createdAt', 'DESC']],
        limit: 10
      }
    ]
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found or you do not have permission to view it.');
  }

  res.json(product);
});

// @desc    Create new product
// @route   POST /api/seller/products
// @access  Private (Seller only)
const createSellerProduct = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const { 
    name, 
    description, 
    shortDescription,
    brand,
    categoryId, 
    tags,
    isFeatured, 
    isSeasonal, 
    isBestSeller, 
    variants 
  } = req.body;
  
  const imageUrls = req.processedImageUrls;

  // Validations
  if (!name || !description || !categoryId) {
    res.status(400);
    throw new Error('Name, description, and category are required.');
  }

  if (!imageUrls || imageUrls.length === 0) {
    res.status(400);
    throw new Error('At least one image is required.');
  }

  if (imageUrls.length > 10) {
    res.status(400);
    throw new Error('Maximum 10 images allowed.');
  }

  // Check category exists
  const category = await Category.findByPk(categoryId);
  if (!category) {
    res.status(404);
    throw new Error('Category not found.');
  }

  // Validate variants
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    res.status(400);
    throw new Error('At least one variant is required.');
  }

  let parsedVariants;
  try {
    parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
  } catch (err) {
    res.status(400);
    throw new Error('Invalid variants format.');
  }

  // Validate each variant
  for (const variant of parsedVariants) {
    if (!variant.price || variant.price <= 0) {
      res.status(400);
      throw new Error('Each variant must have a valid price.');
    }

    if (variant.discountPrice && variant.discountPrice >= variant.price) {
      res.status(400);
      throw new Error('Discount price must be less than original price.');
    }
  }

  // Create product
  const product = await Product.create({
    userId: sellerId,
    sellerName: req.user.fullName,
    sellerProfileImage: req.user.profileImage,
    name,
    description,
    shortDescription,
    brand,
    images: imageUrls,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
    categoryId,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    isSeasonal: isSeasonal === 'true' || isSeasonal === true,
    isBestSeller: isBestSeller === 'true' || isBestSeller === true,
    rating: 0,
    numReviews: 0,
    likes: 0,
    likedBy: []
  });

  // Create variants
  for (let i = 0; i < parsedVariants.length; i++) {
    const variant = parsedVariants[i];
    
    await ProductVariant.create({
      productId: product.id,
      sku: variant.sku || `${product.id}-${i + 1}`,
      size: variant.size || null,
      color: variant.color || null,
      price: variant.price,
      discountPrice: variant.discountPrice || null,
      costPrice: variant.costPrice || null,
      countInStock: variant.countInStock || 0,
      minStockLevel: variant.minStockLevel || 5,
      weight: variant.weight || null,
      dimensions: variant.dimensions || null,
      images: variant.images || [],
      isDefault: i === 0, // First variant is default
      sortOrder: i
    });
  }

  // Get created product with variants
  const createdProduct = await Product.findByPk(product.id, {
    include: [
      {
        model: ProductVariant,
        as: 'variants'
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }
    ]
  });

  res.status(201).json(createdProduct);
});

// @desc    Update product
// @route   PUT /api/seller/products/:id
// @access  Private (Seller only)
const updateSellerProduct = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const productId = req.params.id;
  
  const product = await Product.findOne({
    where: { id: productId, userId: sellerId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found or you do not have permission to update it.');
  }

  const { 
    name, 
    description, 
    shortDescription,
    brand,
    categoryId, 
    tags,
    isFeatured, 
    isSeasonal, 
    isBestSeller,
    isActive
  } = req.body;

  // Update fields
  const updateFields = {};
  if (name) updateFields.name = name;
  if (description) updateFields.description = description;
  if (shortDescription !== undefined) updateFields.shortDescription = shortDescription;
  if (brand !== undefined) updateFields.brand = brand;
  if (tags) updateFields.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
  if (isFeatured !== undefined) updateFields.isFeatured = isFeatured === 'true' || isFeatured === true;
  if (isSeasonal !== undefined) updateFields.isSeasonal = isSeasonal === 'true' || isSeasonal === true;
  if (isBestSeller !== undefined) updateFields.isBestSeller = isBestSeller === 'true' || isBestSeller === true;
  if (isActive !== undefined) updateFields.isActive = isActive === 'true' || isActive === true;

  // Update category if provided
  if (categoryId) {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      res.status(404);
      throw new Error('Category not found.');
    }
    updateFields.categoryId = categoryId;
  }

  // Update images if provided
  if (req.processedImageUrls && req.processedImageUrls.length > 0) {
    // Delete old images
    for (const imageUrl of product.images) {
      const filename = imageUrl.split('/').pop();
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    updateFields.images = req.processedImageUrls;
  }

  // Update product
  await product.update(updateFields);

  // Get updated product
  const updatedProduct = await Product.findByPk(product.id, {
    include: [
      {
        model: ProductVariant,
        as: 'variants'
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }
    ]
  });

  res.json(updatedProduct);
});

// @desc    Delete product
// @route   DELETE /api/seller/products/:id
// @access  Private (Seller only)
const deleteSellerProduct = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const productId = req.params.id;

  const product = await Product.findOne({
    where: { id: productId, userId: sellerId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found or you do not have permission to delete it.');
  }

  // Delete product images
  for (const imageUrl of product.images) {
    const filename = imageUrl.split('/').pop();
    const filePath = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Delete product (variants will be deleted automatically due to CASCADE)
  await product.destroy();

  res.json({ message: 'Product deleted successfully.' });
});

// @desc    Toggle product status (active/inactive)
// @route   PATCH /api/seller/products/:id/toggle-status
// @access  Private (Seller only)
const toggleProductStatus = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const productId = req.params.id;

  const product = await Product.findOne({
    where: { id: productId, userId: sellerId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found or you do not have permission to modify it.');
  }

  // Toggle status
  product.isActive = !product.isActive;
  await product.save();

  res.json({
    message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully.`,
    isActive: product.isActive
  });
});

module.exports = {
  getSellerProducts,
  getSellerProduct,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  toggleProductStatus
};