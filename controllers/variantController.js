// controllers/variantController.js
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { 
  ProductVariant, 
  Product, 
  ProductAttribute, 
  AttributeValue, 
  ProductVariantAttribute 
} = require('../models');

// @desc    Get variant by ID with full details
// @route   GET /api/variants/:id
// @access  Public
const getVariantById = asyncHandler(async (req, res) => {
  const variant = await ProductVariant.findByPk(req.params.id, {
    where: { isActive: true },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'description', 'images', 'brand']
      },
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
  });

  if (!variant) {
    res.status(404);
    throw new Error('Variant not found.');
  }

  // Ma'lumotlarni qayta ishlash
  const variantData = variant.toJSON();
  
  // Effective price hisoblash
  variantData.effectivePrice = variant.getEffectivePrice();
  variantData.discountPercentage = variant.getDiscountPercentage();
  variantData.inStock = variant.isInStock();
  variantData.lowStock = variant.isLowStock();

  res.json(variantData);
});

// @desc    Get variants by product ID
// @route   GET /api/products/:productId/variants
// @access  Public
const getVariantsByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { attributes, inStock, sortBy } = req.query;

  let whereCondition = { 
    productId: parseInt(productId),
    isActive: true 
  };

  // Stok filtri
  if (inStock === 'true') {
    whereCondition.countInStock = { [Op.gt]: 0 };
  }

  // Sortlash
  let orderOptions = [['isDefault', 'DESC'], ['sortOrder', 'ASC']];
  if (sortBy === 'price_asc') orderOptions = [['price', 'ASC']];
  else if (sortBy === 'price_desc') orderOptions = [['price', 'DESC']];
  else if (sortBy === 'stock_desc') orderOptions = [['countInStock', 'DESC']];

  const variants = await ProductVariant.findAll({
    where: whereCondition,
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
    order: orderOptions
  });

  // Attribute filtri
  let filteredVariants = variants;
  if (attributes) {
    try {
      const attributeFilters = JSON.parse(attributes);
      filteredVariants = variants.filter(variant => {
        return Object.entries(attributeFilters).every(([attrName, attrValue]) => {
          return variant.attributes.some(attr => 
            attr.attribute.name === attrName && 
            (attr.attributeValue?.value === attrValue || attr.customValue === attrValue)
          );
        });
      });
    } catch (error) {
      console.error('Invalid attributes filter:', error);
    }
  }

  // Ma'lumotlarni qayta ishlash
  const processedVariants = filteredVariants.map(variant => {
    const variantData = variant.toJSON();
    variantData.effectivePrice = variant.getEffectivePrice();
    variantData.discountPercentage = variant.getDiscountPercentage();
    variantData.inStock = variant.isInStock();
    variantData.lowStock = variant.isLowStock();
    return variantData;
  });

  res.json(processedVariants);
});

// @desc    Get available attribute values for a product
// @route   GET /api/products/:productId/attributes
// @access  Public
const getProductAttributes = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const variants = await ProductVariant.findAll({
    where: { 
      productId: parseInt(productId),
      isActive: true,
      countInStock: { [Op.gt]: 0 } // Faqat stokda bor variantlar
    },
    include: [
      {
        model: ProductVariantAttribute,
        as: 'attributes',
        include: [
          {
            model: ProductAttribute,
            as: 'attribute',
            where: { isFilterable: true },
            attributes: ['id', 'name', 'displayName', 'type', 'unit']
          },
          {
            model: AttributeValue,
            as: 'attributeValue',
            attributes: ['id', 'value', 'displayValue', 'colorCode', 'imageUrl', 'sortOrder']
          }
        ]
      }
    ]
  });

  // Attributelarni guruhlash
  const groupedAttributes = {};
  
  variants.forEach(variant => {
    variant.attributes.forEach(attr => {
      const attrName = attr.attribute.name;
      
      if (!groupedAttributes[attrName]) {
        groupedAttributes[attrName] = {
          id: attr.attribute.id,
          name: attr.attribute.name,
          displayName: attr.attribute.displayName,
          type: attr.attribute.type,
          unit: attr.attribute.unit,
          values: []
        };
      }

      const value = attr.attributeValue || { 
        value: attr.customValue,
        displayValue: attr.customValue 
      };

      // Takrorlanishni oldini olish
      if (!groupedAttributes[attrName].values.find(v => v.value === value.value)) {
        groupedAttributes[attrName].values.push(value);
      }
    });
  });

  // Qiymatlarni sortlash
  Object.values(groupedAttributes).forEach(attr => {
    attr.values.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  });

  res.json(Object.values(groupedAttributes));
});

// @desc    Find variant by attributes
// @route   POST /api/products/:productId/variants/find
// @access  Public
const findVariantByAttributes = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { attributes } = req.body; // { "color": "red", "size": "M" }

  if (!attributes || Object.keys(attributes).length === 0) {
    res.status(400);
    throw new Error('Attributes are required.');
  }

  // Barcha variantlarni olish
  const variants = await ProductVariant.findAll({
    where: { 
      productId: parseInt(productId),
      isActive: true 
    },
    include: [
      {
        model: ProductVariantAttribute,
        as: 'attributes',
        include: [
          {
            model: ProductAttribute,
            as: 'attribute',
            attributes: ['name']
          },
          {
            model: AttributeValue,
            as: 'attributeValue',
            attributes: ['value']
          }
        ]
      }
    ]
  });

  // Mos variantni topish
  const matchingVariant = variants.find(variant => {
    return Object.entries(attributes).every(([attrName, attrValue]) => {
      return variant.attributes.some(attr => 
        attr.attribute.name === attrName && 
        (attr.attributeValue?.value === attrValue || attr.customValue === attrValue)
      );
    });
  });

  if (!matchingVariant) {
    res.status(404);
    throw new Error('No variant found with specified attributes.');
  }

  // To'liq ma'lumot bilan qaytarish
  const fullVariant = await ProductVariant.findByPk(matchingVariant.id, {
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
  });

  const variantData = fullVariant.toJSON();
  variantData.effectivePrice = fullVariant.getEffectivePrice();
  variantData.discountPercentage = fullVariant.getDiscountPercentage();
  variantData.inStock = fullVariant.isInStock();
  variantData.lowStock = fullVariant.isLowStock();

  res.json(variantData);
});

// @desc    Check variant stock
// @route   GET /api/variants/:id/stock
// @access  Public
const checkVariantStock = asyncHandler(async (req, res) => {
  const variant = await ProductVariant.findByPk(req.params.id, {
    where: { isActive: true },
    attributes: ['id', 'countInStock', 'minStockLevel']
  });

  if (!variant) {
    res.status(404);
    throw new Error('Variant not found.');
  }

  res.json({
    variantId: variant.id,
    countInStock: variant.countInStock,
    minStockLevel: variant.minStockLevel,
    inStock: variant.isInStock(),
    lowStock: variant.isLowStock(),
    available: variant.countInStock > 0
  });
});

module.exports = {
  getVariantById,
  getVariantsByProduct,
  getProductAttributes,
  findVariantByAttributes,
  checkVariantStock
};