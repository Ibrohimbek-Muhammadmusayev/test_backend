// controllers/sellerDashboardController.js
const asyncHandler = require('express-async-handler');
const { Op, Sequelize } = require('sequelize');
const { 
  Product, 
  ProductVariant, 
  Order, 
  OrderItem, 
  Review, 
  User,
  Category,
  sequelize 
} = require('../models');

// @desc    Get seller dashboard overview
// @route   GET /api/seller/dashboard
// @access  Private (Seller only)
const getSellerDashboard = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;

  // Parallel queries for better performance
  const [
    totalProducts,
    totalVariants,
    totalOrders,
    totalRevenue,
    pendingOrders,
    completedOrders,
    averageRating,
    totalReviews,
    lowStockProducts,
    recentOrders
  ] = await Promise.all([
    // Total products
    Product.count({
      where: { userId: sellerId, isActive: true }
    }),

    // Total variants
    ProductVariant.count({
      include: [{
        model: Product,
        as: 'product',
        where: { userId: sellerId, isActive: true }
      }]
    }),

    // Total orders
    OrderItem.count({
      where: { sellerId: sellerId }
    }),

    // Total revenue
    OrderItem.sum('price', {
      where: { 
        sellerId: sellerId,
        '$order.status$': { [Op.in]: ['completed', 'delivered'] }
      },
      include: [{
        model: Order,
        as: 'order',
        attributes: []
      }]
    }),

    // Pending orders
    OrderItem.count({
      where: { sellerId: sellerId },
      include: [{
        model: Order,
        as: 'order',
        where: { status: { [Op.in]: ['pending', 'processing'] } }
      }]
    }),

    // Completed orders
    OrderItem.count({
      where: { sellerId: sellerId },
      include: [{
        model: Order,
        as: 'order',
        where: { status: { [Op.in]: ['completed', 'delivered'] } }
      }]
    }),

    // Average rating
    Review.findOne({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating']],
      include: [{
        model: Product,
        as: 'product',
        where: { userId: sellerId },
        attributes: []
      }],
      raw: true
    }),

    // Total reviews
    Review.count({
      include: [{
        model: Product,
        as: 'product',
        where: { userId: sellerId }
      }]
    }),

    // Low stock products
    ProductVariant.count({
      where: {
        countInStock: { [Op.lte]: Sequelize.col('minStockLevel') }
      },
      include: [{
        model: Product,
        as: 'product',
        where: { userId: sellerId, isActive: true }
      }]
    }),

    // Recent orders
    OrderItem.findAll({
      where: { sellerId: sellerId },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'status', 'createdAt'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['fullName', 'phoneNumber']
          }]
        },
        {
          model: Product,
          as: 'orderedProduct',
          attributes: ['name', 'images']
        },
        {
          model: ProductVariant,
          as: 'orderedVariant',
          attributes: ['size', 'color', 'sku']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    })
  ]);

  // Calculate growth rates (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [currentMonthRevenue, previousMonthRevenue] = await Promise.all([
    OrderItem.sum('price', {
      where: { 
        sellerId: sellerId,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      include: [{
        model: Order,
        as: 'order',
        where: { status: { [Op.in]: ['completed', 'delivered'] } }
      }]
    }),

    OrderItem.sum('price', {
      where: { 
        sellerId: sellerId,
        createdAt: { 
          [Op.gte]: sixtyDaysAgo,
          [Op.lt]: thirtyDaysAgo
        }
      },
      include: [{
        model: Order,
        as: 'order',
        where: { status: { [Op.in]: ['completed', 'delivered'] } }
      }]
    })
  ]);

  // Calculate growth percentage
  const revenueGrowth = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(2)
    : currentMonthRevenue > 0 ? 100 : 0;

  res.json({
    overview: {
      totalProducts,
      totalVariants,
      totalOrders,
      totalRevenue: totalRevenue || 0,
      pendingOrders,
      completedOrders,
      averageRating: parseFloat(averageRating?.avgRating || 0).toFixed(1),
      totalReviews,
      lowStockProducts,
      revenueGrowth: parseFloat(revenueGrowth)
    },
    recentOrders: recentOrders.map(item => ({
      id: item.id,
      orderId: item.order.id,
      customerName: item.order.user.fullName,
      customerPhone: item.order.user.phoneNumber,
      productName: item.orderedProduct.name,
      productImage: item.orderedProduct.images[0] || null,
      variant: {
        size: item.orderedVariant?.size,
        color: item.orderedVariant?.color,
        sku: item.orderedVariant?.sku
      },
      quantity: item.qty,
      price: item.price,
      status: item.order.status,
      orderDate: item.order.createdAt
    }))
  });
});

// @desc    Get seller sales analytics
// @route   GET /api/seller/analytics/sales
// @access  Private (Seller only)
const getSellerSalesAnalytics = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const { period = '30' } = req.query; // days

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Daily sales for the period
  const dailySales = await OrderItem.findAll({
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('OrderItem.createdAt')), 'date'],
      [Sequelize.fn('SUM', Sequelize.col('OrderItem.price')), 'revenue'],
      [Sequelize.fn('COUNT', Sequelize.col('OrderItem.id')), 'orders']
    ],
    where: {
      sellerId: sellerId,
      createdAt: { [Op.gte]: daysAgo }
    },
    include: [{
      model: Order,
      as: 'order',
      where: { status: { [Op.in]: ['completed', 'delivered'] } },
      attributes: []
    }],
    group: [Sequelize.fn('DATE', Sequelize.col('OrderItem.createdAt'))],
    order: [[Sequelize.fn('DATE', Sequelize.col('OrderItem.createdAt')), 'ASC']],
    raw: true
  });

  // Top selling products
  const topProducts = await OrderItem.findAll({
    attributes: [
      'productId',
      [Sequelize.fn('SUM', Sequelize.col('qty')), 'totalSold'],
      [Sequelize.fn('SUM', Sequelize.col('OrderItem.price')), 'totalRevenue']
    ],
    where: {
      sellerId: sellerId,
      createdAt: { [Op.gte]: daysAgo }
    },
    include: [
      {
        model: Product,
        as: 'orderedProduct',
        attributes: ['name', 'images']
      },
      {
        model: Order,
        as: 'order',
        where: { status: { [Op.in]: ['completed', 'delivered'] } },
        attributes: []
      }
    ],
    group: ['productId', 'orderedProduct.id'],
    order: [[Sequelize.fn('SUM', Sequelize.col('qty')), 'DESC']],
    limit: 10
  });

  // Sales by category
  const salesByCategory = await OrderItem.findAll({
    attributes: [
      [Sequelize.fn('SUM', Sequelize.col('OrderItem.price')), 'revenue'],
      [Sequelize.fn('COUNT', Sequelize.col('OrderItem.id')), 'orders']
    ],
    where: {
      sellerId: sellerId,
      createdAt: { [Op.gte]: daysAgo }
    },
    include: [
      {
        model: Product,
        as: 'orderedProduct',
        attributes: [],
        include: [{
          model: Category,
          as: 'category',
          attributes: ['name']
        }]
      },
      {
        model: Order,
        as: 'order',
        where: { status: { [Op.in]: ['completed', 'delivered'] } },
        attributes: []
      }
    ],
    group: ['orderedProduct->category.id', 'orderedProduct->category.name'],
    order: [[Sequelize.fn('SUM', Sequelize.col('OrderItem.price')), 'DESC']]
  });

  res.json({
    period: parseInt(period),
    dailySales,
    topProducts: topProducts.map(item => ({
      productId: item.productId,
      productName: item.orderedProduct.name,
      productImage: item.orderedProduct.images[0] || null,
      totalSold: parseInt(item.dataValues.totalSold),
      totalRevenue: parseFloat(item.dataValues.totalRevenue)
    })),
    salesByCategory: salesByCategory.map(item => ({
      categoryName: item.orderedProduct?.category?.name || 'Uncategorized',
      revenue: parseFloat(item.dataValues.revenue),
      orders: parseInt(item.dataValues.orders)
    }))
  });
});

// @desc    Get seller product performance
// @route   GET /api/seller/analytics/products
// @access  Private (Seller only)
const getSellerProductAnalytics = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;

  // Product performance metrics
  const productPerformance = await Product.findAll({
    where: { userId: sellerId, isActive: true },
    attributes: [
      'id', 'name', 'images', 'rating', 'numReviews', 'likes', 'createdAt'
    ],
    include: [
      {
        model: ProductVariant,
        as: 'variants',
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('variants.countInStock')), 'totalStock'],
          [Sequelize.fn('MIN', Sequelize.col('variants.price')), 'minPrice'],
          [Sequelize.fn('MAX', Sequelize.col('variants.price')), 'maxPrice']
        ]
      },
      {
        model: OrderItem,
        as: 'productOrderItems',
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('productOrderItems.qty')), 'totalSold'],
          [Sequelize.fn('SUM', Sequelize.col('productOrderItems.price')), 'totalRevenue']
        ],
        required: false
      }
    ],
    group: ['Product.id'],
    order: [['createdAt', 'DESC']]
  });

  // Low stock alerts
  const lowStockProducts = await ProductVariant.findAll({
    where: {
      countInStock: { [Op.lte]: Sequelize.col('minStockLevel') }
    },
    include: [{
      model: Product,
      as: 'product',
      where: { userId: sellerId, isActive: true },
      attributes: ['id', 'name', 'images']
    }],
    attributes: ['id', 'sku', 'size', 'color', 'countInStock', 'minStockLevel'],
    order: [['countInStock', 'ASC']]
  });

  res.json({
    productPerformance: productPerformance.map(product => ({
      id: product.id,
      name: product.name,
      image: product.images[0] || null,
      rating: product.rating,
      numReviews: product.numReviews,
      likes: product.likes,
      totalStock: parseInt(product.variants[0]?.dataValues.totalStock || 0),
      priceRange: {
        min: parseFloat(product.variants[0]?.dataValues.minPrice || 0),
        max: parseFloat(product.variants[0]?.dataValues.maxPrice || 0)
      },
      totalSold: parseInt(product.productOrderItems[0]?.dataValues.totalSold || 0),
      totalRevenue: parseFloat(product.productOrderItems[0]?.dataValues.totalRevenue || 0),
      createdAt: product.createdAt
    })),
    lowStockAlerts: lowStockProducts.map(variant => ({
      variantId: variant.id,
      productId: variant.product.id,
      productName: variant.product.name,
      productImage: variant.product.images[0] || null,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      currentStock: variant.countInStock,
      minStockLevel: variant.minStockLevel
    }))
  });
});

module.exports = {
  getSellerDashboard,
  getSellerSalesAnalytics,
  getSellerProductAnalytics
};