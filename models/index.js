// models/index.js
const { sequelize } = require('../config/db');
const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Review = require('./Review');
const Comment = require('./Comment');
const SearchHistory = require('./SearchHistory');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Notification = require('./Notification');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Banner = require('./Banner');
const LikedProduct = require('./LikedProduct');
const ProductVariant = require('./ProductVariant');
const Group = require('./Group');
const GroupProduct = require('./GroupProduct');
const ProductAttribute = require('./ProductAttribute');
const AttributeValue = require('./AttributeValue');
const ProductVariantAttribute = require('./ProductVariantAttribute');
const PlatformSettings = require('./PlatformSettings');
const Currency = require('./Currency');
const Language = require('./Language');
const SellerApplication = require('./SellerApplication');
const PasswordReset = require('./PasswordReset');

// --- User assotsiatsiyalari ---
User.hasMany(Product, { foreignKey: 'userId', as: 'products' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
User.hasMany(SearchHistory, { foreignKey: 'userId', as: 'searchHistories' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
User.hasOne(Cart, { foreignKey: 'userId', as: 'cart', onDelete: 'CASCADE' });
User.hasMany(SellerApplication, { foreignKey: 'userId', as: 'sellerApplications' });

// --- Product assotsiatsiyalari ---
Product.belongsTo(User, { foreignKey: 'userId', as: 'seller' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews', onDelete: 'CASCADE' });
Product.hasMany(Comment, { foreignKey: 'productId', as: 'comments', onDelete: 'CASCADE' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'productOrderItems' });
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems' });
// Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants', onDelete: 'CASCADE' });
Product.belongsToMany(Group, { through: GroupProduct, foreignKey: 'productId', as: 'productGroups' });
Product.belongsToMany(User, { through: LikedProduct, as: 'usersWhoLiked', foreignKey: 'productId' });
Product.belongsTo(Group, { as: 'productGroup', foreignKey: 'groupId' });

// --- ProductVariant assotsiatsiyasi (eski) ---
// ProductVariant.belongsTo(Product, { foreignKey: 'productId', as: 'product' }); // Yangi qismda e'lon qilingan

// --- Order assotsiatsiyalari ---
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'orderItems', onDelete: 'CASCADE' });

// --- OrderItem assotsiatsiyalari ---
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'orderedProduct' });
OrderItem.belongsTo(User, { foreignKey: 'sellerId', as: 'orderSeller' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'orderedVariant' }); // 🔥 YETISHLANISHI KERAK

// --- Review assotsiatsiyalari ---
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Comment assotsiatsiyalari ---
Comment.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Category assotsiatsiyalari ---
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Category.hasMany(Category, { as: 'subCategories', foreignKey: 'parentCategoryId', onDelete: 'SET NULL' });
Category.belongsTo(Category, { as: 'parentCategory', foreignKey: 'parentCategoryId' });

// --- SearchHistory assotsiatsiyalari ---
SearchHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Notification assotsiatsiyalari ---
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Cart assotsiatsiyalari ---
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items', onDelete: 'CASCADE' });

// --- CartItem assotsiatsiyalari ---
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });

// --- Group assotsiatsiyalari ---
Group.belongsToMany(Product, { through: GroupProduct, foreignKey: 'groupId', as: 'groupProducts' });

// --- LikedProduct assotsiatsiyalari ---
User.belongsToMany(Product, { through: LikedProduct, as: 'likedProducts', foreignKey: 'userId' });

// --- Banner assotsiatsiyalari ---
Banner.belongsTo(Group, { as: 'bannerGroup', foreignKey: 'groupId' });

// --- ProductAttribute assotsiatsiyalari ---
ProductAttribute.hasMany(AttributeValue, { foreignKey: 'attributeId', as: 'values', onDelete: 'CASCADE' });

// --- AttributeValue assotsiatsiyalari ---
AttributeValue.belongsTo(ProductAttribute, { foreignKey: 'attributeId', as: 'attribute' });

// --- ProductVariant yangi assotsiatsiyalar ---
Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// --- ProductVariantAttribute assotsiatsiyalari ---
ProductVariant.hasMany(ProductVariantAttribute, { foreignKey: 'variantId', as: 'attributes', onDelete: 'CASCADE' });
ProductVariantAttribute.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });
ProductVariantAttribute.belongsTo(ProductAttribute, { foreignKey: 'attributeId', as: 'attribute' });
ProductVariantAttribute.belongsTo(AttributeValue, { foreignKey: 'attributeValueId', as: 'attributeValue' });

// --- ProductAttribute bilan ProductVariant bog'lanishi ---
ProductAttribute.belongsToMany(ProductVariant, {
  through: ProductVariantAttribute,
  foreignKey: 'attributeId',
  otherKey: 'variantId',
  as: 'variants'
});

ProductVariant.belongsToMany(ProductAttribute, {
  through: ProductVariantAttribute,
  foreignKey: 'variantId',
  otherKey: 'attributeId',
  as: 'productAttributes'
});

// --- SellerApplication assotsiatsiyalari ---
SellerApplication.belongsTo(User, { foreignKey: 'userId', as: 'applicant' });
SellerApplication.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// --- Eksport qilinadigan modellar ---
module.exports = {
  sequelize,
  User,
  Product,
  ProductVariant,
  Category,
  Review,
  Comment,
  SearchHistory,
  Order,
  OrderItem,
  Notification,
  Cart,
  CartItem,
  Banner,
  Group,
  GroupProduct,
  LikedProduct,
  ProductAttribute,
  AttributeValue,
  ProductVariantAttribute,
  PlatformSettings,
  Currency,
  Language,
  SellerApplication,
  PasswordReset
};
