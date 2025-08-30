// controllers/cartController.js
const asyncHandler = require('express-async-handler');
const {
  Cart,
  CartItem,
  Product,
  ProductVariant,
  ProductVariantAttribute,
  ProductAttribute,
  AttributeValue
} = require('../models');
const { Op } = require('sequelize');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private (User)
const getCart = asyncHandler(async (req, res) => {
    // User ID bo'yicha savatni topamiz va uning itemlarini, har bir itemga bog'liq mahsulotni ham yuklaymiz
    const cart = await Cart.findOne({
        where: { userId: req.user.id },
        include: [{
            model: CartItem,
            as: 'items', // models/index.js da belgilangan alias
            include: [{
                model: Product,
                as: 'product', // models/index.js da belgilangan alias
                attributes: ['id', 'name', 'images', 'price', 'countInStock'] // Faqat kerakli maydonlar
            }]
        }]
    });

    if (cart) {
        res.json(cart);
    } else {
        // Agar savat topilmasa, bo'sh savat qaytaramiz
        res.json({ message: 'Cart is empty or not found.', items: [] });
    }
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private (User)
const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, qty, attributes } = req.body;

  // Variant ID majburiy
  if (!variantId) {
    res.status(400);
    throw new Error('Variant ID is required.');
  }

  // Mahsulot va variantni tekshirish
  const product = await Product.findByPk(productId, {
    where: { isActive: true }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  const variant = await ProductVariant.findByPk(variantId, {
    where: {
      productId: productId,
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
            attributes: ['name', 'displayName']
          },
          {
            model: AttributeValue,
            as: 'attributeValue',
            attributes: ['value', 'displayValue']
          }
        ]
      }
    ]
  });

  if (!variant) {
    res.status(404);
    throw new Error('Product variant not found.');
  }

  // Stokni tekshirish
  if (variant.countInStock < qty) {
    res.status(400);
    throw new Error(`Not enough stock for this variant. Only ${variant.countInStock} available.`);
  }

  // Foydalanuvchi savatini topamiz yoki yaratamiz
  let cart = await Cart.findOne({ where: { userId: req.user.id } });

  if (!cart) {
    cart = await Cart.create({ userId: req.user.id });
  }

  // Variant savatda bormi tekshirish
  let cartItem = await CartItem.findOne({
    where: {
      cartId: cart.id,
      productId: productId,
      variantId: variantId
    }
  });

  if (cartItem) {
    // Agar variant mavjud bo'lsa, miqdorini yangilash
    const newQty = cartItem.qty + qty;
    
    // Yangi miqdor stokdan oshmasligi kerak
    if (newQty > variant.countInStock) {
      res.status(400);
      throw new Error(`Cannot add ${qty} more items. Only ${variant.countInStock - cartItem.qty} more available.`);
    }
    
    cartItem.qty = newQty;
    await cartItem.save();
  } else {
    // Variant attributelarini JSON formatda saqlash
    const variantAttributes = {};
    if (variant.attributes) {
      variant.attributes.forEach(attr => {
        const value = attr.attributeValue?.value || attr.customValue;
        const displayValue = attr.attributeValue?.displayValue || attr.customValue;
        variantAttributes[attr.attribute.name] = {
          value,
          displayValue: displayValue || value,
          displayName: attr.attribute.displayName
        };
      });
    }

    // Yangi CartItem yaratish
    await CartItem.create({
      cartId: cart.id,
      productId: productId,
      variantId: variantId,
      name: product.name,
      image: variant.images && variant.images.length > 0 ? variant.images[0] :
             (product.images && product.images.length > 0 ? product.images[0] : null),
      price: variant.discountPrice || variant.price,
      originalPrice: variant.price,
      qty: qty,
      size: variant.size || null, // Backward compatibility
      color: variant.color || null, // Backward compatibility
      variantAttributes: variantAttributes,
      sku: variant.sku
    });
  }

  // Savatni yangilangan itemlar bilan qayta yuklash
  const updatedCart = await Cart.findOne({
    where: { userId: req.user.id },
    include: [{
      model: CartItem,
      as: 'items',
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'images', 'brand']
        },
        {
          model: ProductVariant,
          as: 'variant',
          attributes: ['id', 'sku', 'price', 'discountPrice', 'countInStock', 'images']
        }
      ]
    }]
  });

  res.status(200).json(updatedCart);
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:cartItemId
// @access  Private (User)
const updateCartItemQty = asyncHandler(async (req, res) => {
    const { qty } = req.body;
    const { cartItemId } = req.params; // Parametr nomini cartItemId ga o'zgartirdik

    if (!qty || qty <= 0) {
        res.status(400);
        throw new Error('Quantity must be a positive number.');
    }

    // Foydalanuvchi savatini topamiz
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (!cart) {
        res.status(404);
        throw new Error('Cart not found.');
    }

    // CartItem ni ID va savat ID si bo'yicha topamiz
    const cartItem = await CartItem.findOne({
        where: {
            id: cartItemId,
            cartId: cart.id // Bu item shu foydalanuvchining savatiga tegishli ekanligini tasdiqlash
        }
    });

    if (!cartItem) {
        res.status(404);
        throw new Error('Cart item not found in your cart.');
    }

    // Mahsulot stokini tekshirish
    const productInDb = await Product.findByPk(cartItem.productId);
    if (!productInDb || productInDb.countInStock < qty) {
        res.status(400);
        throw new Error(`Not enough stock for ${productInDb.name}. Only ${productInDb.countInStock} available.`);
    }

    cartItem.qty = qty;
    await cartItem.save();

    // Savatni yangilangan itemlar bilan qayta yuklash
    const updatedCart = await Cart.findOne({
        where: { userId: req.user.id },
        include: [{
            model: CartItem,
            as: 'items',
            include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'images', 'price', 'countInStock'] }]
        }]
    });

    res.json(updatedCart);
});


// @desc    Remove item from cart
// @route   DELETE /api/cart/:cartItemId
// @access  Private (User)
const removeCartItem = asyncHandler(async (req, res) => {
    const { cartItemId } = req.params; // Parametr nomini cartItemId ga o'zgartirdik

    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (!cart) {
        res.status(404);
        throw new Error('Cart not found.');
    }

    // CartItem ni ID va savat ID si bo'yicha topamiz va o'chiramiz
    const deletedCount = await CartItem.destroy({
        where: {
            id: cartItemId,
            cartId: cart.id
        }
    });

    if (deletedCount === 0) {
        res.status(404);
        throw new Error('Cart item not found in your cart or already removed.');
    }

    // Savatni qolgan itemlar bilan qayta yuklash
    const updatedCart = await Cart.findOne({
        where: { userId: req.user.id },
        include: [{
            model: CartItem,
            as: 'items',
            include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'images', 'price', 'countInStock'] }]
        }]
    });

    res.json(updatedCart);
});

// @desc    Clear user's cart
// @route   DELETE /api/cart/clear
// @access  Private (User)
const clearCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });

    if (!cart) {
        res.status(404);
        throw new Error('Cart not found.');
    }

    // Savatdagi barcha itemlarni o'chirish
    await CartItem.destroy({
        where: { cartId: cart.id }
    });

    res.json({ message: 'Cart cleared successfully.' });
});

module.exports = {
    getCart,
    addToCart,
    updateCartItemQty,
    removeCartItem,
    clearCart
};