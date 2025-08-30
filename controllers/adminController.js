// controllers/adminController.js
const asyncHandler = require('express-async-handler');
const { Op, Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const {
  User,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  Review,
  Category,
  SearchHistory,
  Cart,
  CartItem,
  sequelize
} = require('../models');

// @desc    Get admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getAdminDashboard = asyncHandler(async (req, res) => {
  // Parallel queries for better performance
  const [
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    totalRevenue,
    pendingOrders,
    completedOrders,
    totalReviews,
    averageRating,
    activeProducts,
    lowStockProducts,
    recentUsers,
    recentOrders,
    topSellers
  ] = await Promise.all([
    // Total users
    User.count({ where: { status: 'user' } }),

    // Total sellers
    User.count({ where: { status: 'seller' } }),

    // Total products
    Product.count({ where: { isActive: true } }),

    // Total orders
    Order.count(),

    // Total revenue
    Order.sum('totalPrice', {
      where: { orderStatus: { [Op.in]: ['completed', 'delivered'] } }
    }),

    // Pending orders
    Order.count({
      where: { orderStatus: { [Op.in]: ['pending', 'processing'] } }
    }),

    // Completed orders
    Order.count({
      where: { orderStatus: { [Op.in]: ['completed', 'delivered'] } }
    }),

    // Total reviews
    Review.count(),

    // Average rating
    Review.findOne({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating']],
      raw: true
    }),

    // Active products
    Product.count({ where: { isActive: true } }),

    // Low stock products
    ProductVariant.count({
      where: {
        countInStock: { [Op.lte]: Sequelize.col('minStockLevel') }
      }
    }),

    // Recent users (last 10)
    User.findAll({
      where: { status: { [Op.in]: ['user', 'seller'] } },
      attributes: ['id', 'fullName', 'phoneNumber', 'status', 'createdAt', 'profileImage'],
      order: [['createdAt', 'DESC']],
      limit: 10
    }),

    // Recent orders (last 10)
    Order.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['fullName', 'phoneNumber']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    }),

    // Top sellers by revenue - simplified query
    sequelize.query(`
      SELECT 
        u.id,
        u."fullName",
        u."profileImage",
        COUNT(DISTINCT p.id) as "productCount",
        COALESCE(SUM(oi.price * oi.qty), 0) as "totalRevenue"
      FROM users u
      LEFT JOIN products p ON u.id = p."userId"
      LEFT JOIN order_items oi ON p.id = oi."productId"
      LEFT JOIN orders o ON oi."orderId" = o.id
      WHERE u.status = 'seller'
        AND (o."orderStatus" IN ('completed', 'delivered') OR o."orderStatus" IS NULL)
      GROUP BY u.id, u."fullName", u."profileImage"
      ORDER BY "totalRevenue" DESC
      LIMIT 5
    `, {
      type: Sequelize.QueryTypes.SELECT
    })
  ]);

  // Calculate growth rates (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [
    currentMonthUsers,
    previousMonthUsers,
    currentMonthOrders,
    previousMonthOrders,
    currentMonthRevenue,
    previousMonthRevenue
  ] = await Promise.all([
    User.count({
      where: { 
        createdAt: { [Op.gte]: thirtyDaysAgo },
        status: { [Op.in]: ['user', 'seller'] }
      }
    }),

    User.count({
      where: { 
        createdAt: { 
          [Op.gte]: sixtyDaysAgo,
          [Op.lt]: thirtyDaysAgo
        },
        status: { [Op.in]: ['user', 'seller'] }
      }
    }),

    Order.count({
      where: { createdAt: { [Op.gte]: thirtyDaysAgo } }
    }),

    Order.count({
      where: { 
        createdAt: { 
          [Op.gte]: sixtyDaysAgo,
          [Op.lt]: thirtyDaysAgo
        }
      }
    }),

    Order.sum('totalPrice', {
      where: { 
        createdAt: { [Op.gte]: thirtyDaysAgo },
        orderStatus: { [Op.in]: ['completed', 'delivered'] }
      }
    }),

    Order.sum('totalPrice', {
      where: { 
        createdAt: { 
          [Op.gte]: sixtyDaysAgo,
          [Op.lt]: thirtyDaysAgo
        },
        orderStatus: { [Op.in]: ['completed', 'delivered'] }
      }
    })
  ]);

  // Calculate growth percentages
  const userGrowth = previousMonthUsers > 0 
    ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers * 100).toFixed(2)
    : currentMonthUsers > 0 ? 100 : 0;

  const orderGrowth = previousMonthOrders > 0 
    ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders * 100).toFixed(2)
    : currentMonthOrders > 0 ? 100 : 0;

  const revenueGrowth = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(2)
    : currentMonthRevenue > 0 ? 100 : 0;

  res.json({
    overview: {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue || 0,
      pendingOrders,
      completedOrders,
      totalReviews,
      averageRating: parseFloat(averageRating?.avgRating || 0).toFixed(1),
      activeProducts,
      lowStockProducts,
      growth: {
        users: parseFloat(userGrowth),
        orders: parseFloat(orderGrowth),
        revenue: parseFloat(revenueGrowth)
      }
    },
    recentUsers: recentUsers.map(user => ({
      id: user.id,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      status: user.status,
      profileImage: user.profileImage,
      joinedAt: user.createdAt
    })),
    recentOrders: recentOrders.map(order => ({
      id: order.id,
      customerName: order.user.fullName,
      customerPhone: order.user.phoneNumber,
      totalPrice: order.totalPrice,
      status: order.orderStatus,
      createdAt: order.createdAt
    })),
    topSellers: topSellers.map(seller => ({
      id: seller.id,
      fullName: seller.fullName,
      profileImage: seller.profileImage,
      productCount: parseInt(seller.productCount || 0),
      totalRevenue: parseFloat(seller.totalRevenue || 0)
    }))
  });
});

// @desc    Get admin analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Daily statistics for the period
  const dailyStats = await Order.findAll({
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'orders'],
      [Sequelize.fn('SUM', Sequelize.col('totalPrice')), 'revenue']
    ],
    where: {
      createdAt: { [Op.gte]: daysAgo }
    },
    group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
    order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']],
    raw: true
  });

  // User registration stats
  const userRegistrations = await User.findAll({
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'registrations']
    ],
    where: {
      createdAt: { [Op.gte]: daysAgo },
      status: { [Op.in]: ['user', 'seller'] }
    },
    group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
    order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']],
    raw: true
  });

  // Product creation stats
  const productCreations = await Product.findAll({
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'products']
    ],
    where: {
      createdAt: { [Op.gte]: daysAgo }
    },
    group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
    order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']],
    raw: true
  });

  // Top categories by sales - simplified query
  const topCategories = await sequelize.query(`
    SELECT 
      c.id,
      c.name,
      COUNT(oi.id) as "totalSales",
      COALESCE(SUM(oi.price * oi.qty), 0) as "totalRevenue"
    FROM categories c
    LEFT JOIN products p ON c.id = p."categoryId"
    LEFT JOIN order_items oi ON p.id = oi."productId"
    LEFT JOIN orders o ON oi."orderId" = o.id
    WHERE oi."createdAt" >= :daysAgo
      AND o."orderStatus" IN ('completed', 'delivered')
    GROUP BY c.id, c.name
    ORDER BY "totalRevenue" DESC
    LIMIT 10
  `, {
    replacements: { daysAgo },
    type: Sequelize.QueryTypes.SELECT
  });

  // Order status distribution
  const orderStatusDistribution = await Order.findAll({
    attributes: [
      'orderStatus',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    where: {
      createdAt: { [Op.gte]: daysAgo }
    },
    group: ['orderStatus'],
    raw: true
  });

  res.json({
    period: parseInt(period),
    dailyStats,
    userRegistrations,
    productCreations,
    topCategories: topCategories.map(category => ({
      id: category.id,
      name: category.name,
      totalSales: parseInt(category.totalSales || 0),
      totalRevenue: parseFloat(category.totalRevenue || 0)
    })),
    orderStatusDistribution
  });
});

// @desc    Get seller performance analytics
// @route   GET /api/admin/sellers/performance
// @access  Private (Admin only)
const getSellerPerformance = asyncHandler(async (req, res) => {
  const { period = '30', limit = 20 } = req.query;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Seller performance metrics - simplified query
  const sellerPerformance = await sequelize.query(`
    SELECT 
      u.id,
      u."fullName",
      u."profileImage",
      u."createdAt",
      COUNT(DISTINCT p.id) as "totalProducts",
      COUNT(oi.id) as "totalOrders",
      COALESCE(SUM(oi.price * oi.qty), 0) as "totalRevenue",
      COALESCE(AVG(r.rating), 0) as "averageRating",
      COUNT(r.id) as "totalReviews"
    FROM users u
    LEFT JOIN products p ON u.id = p."userId"
    LEFT JOIN order_items oi ON p.id = oi."productId" AND oi."createdAt" >= :daysAgo
    LEFT JOIN orders o ON oi."orderId" = o.id AND o."orderStatus" IN ('completed', 'delivered')
    LEFT JOIN reviews r ON p.id = r."productId"
    WHERE u.status = 'seller'
    GROUP BY u.id, u."fullName", u."profileImage", u."createdAt"
    ORDER BY "totalRevenue" DESC
    LIMIT :limit
  `, {
    replacements: { daysAgo, limit: parseInt(limit) },
    type: Sequelize.QueryTypes.SELECT
  });

  res.json({
    period: parseInt(period),
    sellers: sellerPerformance.map(seller => ({
      id: seller.id,
      fullName: seller.fullName,
      profileImage: seller.profileImage,
      joinedAt: seller.createdAt,
      metrics: {
        totalProducts: parseInt(seller.totalProducts || 0),
        totalOrders: parseInt(seller.totalOrders || 0),
        totalRevenue: parseFloat(seller.totalRevenue || 0),
        averageRating: parseFloat(seller.averageRating || 0).toFixed(1),
        totalReviews: parseInt(seller.totalReviews || 0)
      }
    }))
  });
});

// @desc    Get system statistics
// @route   GET /api/admin/statistics
// @access  Private (Admin only)
const getSystemStatistics = asyncHandler(async (req, res) => {
  // Database statistics
  const [
    totalUsers,
    totalSellers,
    totalProducts,
    totalVariants,
    totalOrders,
    totalOrderItems,
    totalReviews,
    totalCategories,
    totalSearches,
    totalCarts
  ] = await Promise.all([
    User.count(),
    User.count({ where: { status: 'seller' } }),
    Product.count(),
    ProductVariant.count(),
    Order.count(),
    OrderItem.count(),
    Review.count(),
    Category.count(),
    SearchHistory.count(),
    Cart.count()
  ]);

  // Storage statistics
  const storageStats = {
    totalImages: 0,
    totalSize: 0
  };

  try {
    const uploadsPath = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath, { withFileTypes: true });
      files.forEach(file => {
        if (file.isFile()) {
          const filePath = path.join(uploadsPath, file.name);
          const stats = fs.statSync(filePath);
          storageStats.totalImages++;
          storageStats.totalSize += stats.size;
        }
      });
    }
  } catch (error) {
    console.error('Error reading uploads directory:', error);
  }

  // Convert bytes to MB
  storageStats.totalSizeMB = (storageStats.totalSize / (1024 * 1024)).toFixed(2);

  res.json({
    database: {
      totalUsers,
      totalSellers,
      totalProducts,
      totalVariants,
      totalOrders,
      totalOrderItems,
      totalReviews,
      totalCategories,
      totalSearches,
      totalCarts
    },
    storage: storageStats
  });
});

module.exports = {
  getAdminDashboard,
  getAdminAnalytics,
  getSellerPerformance,
  getSystemStatistics
};
