const asyncHandler = require('express-async-handler');
const { User, Product, Order, OrderItem, Category, ProductVariant } = require('../models');
const { Op } = require('sequelize');

// Helper function to convert data to CSV
const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return '';
  }

  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle null/undefined values and escape commas/quotes
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

// @desc    Export users to CSV
// @route   GET /api/admin/export/users?format=csv
// @access  Private (Admin only)
const exportUsers = asyncHandler(async (req, res) => {
  const { format = 'csv', status, startDate, endDate } = req.query;

  if (format !== 'csv') {
    res.status(400);
    throw new Error('Only CSV format is supported');
  }

  // Build where condition
  let whereCondition = {};
  if (status) {
    whereCondition.status = status;
  }
  if (startDate && endDate) {
    whereCondition.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  const users = await User.findAll({
    where: whereCondition,
    attributes: [
      'id',
      'fullName',
      'phoneNumber',
      'status',
      'isBlocked',
      'createdAt',
      'updatedAt'
    ],
    order: [['createdAt', 'DESC']]
  });

  const csvData = users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    status: user.status,
    isBlocked: user.isBlocked ? 'Yes' : 'No',
    createdAt: user.createdAt.toISOString().split('T')[0],
    updatedAt: user.updatedAt.toISOString().split('T')[0]
  }));

  const headers = ['id', 'fullName', 'phoneNumber', 'status', 'isBlocked', 'createdAt', 'updatedAt'];
  const csv = convertToCSV(csvData, headers);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
});

// @desc    Export products to CSV
// @route   GET /api/admin/export/products?format=csv
// @access  Private (Admin only)
const exportProducts = asyncHandler(async (req, res) => {
  const { format = 'csv', category, status, startDate, endDate } = req.query;

  if (format !== 'csv') {
    res.status(400);
    throw new Error('Only CSV format is supported');
  }

  // Build where condition
  let whereCondition = {};
  if (status) {
    whereCondition.isActive = status === 'active';
  }
  if (startDate && endDate) {
    whereCondition.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  const products = await Product.findAll({
    where: whereCondition,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['name']
      },
      {
        model: User,
        as: 'seller',
        attributes: ['fullName']
      },
      {
        model: ProductVariant,
        as: 'variants',
        attributes: ['price', 'discountPrice', 'countInStock']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  const csvData = products.map(product => {
    const variants = product.variants || [];
    const prices = variants.map(v => v.discountPrice || v.price);
    const stocks = variants.map(v => v.countInStock);
    
    return {
      id: product.id,
      name: product.name,
      category: product.category?.name || '',
      seller: product.seller?.fullName || '',
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      totalStock: stocks.reduce((sum, stock) => sum + stock, 0),
      rating: product.rating,
      numReviews: product.numReviews,
      likes: product.likes,
      isActive: product.isActive ? 'Yes' : 'No',
      createdAt: product.createdAt.toISOString().split('T')[0]
    };
  });

  const headers = [
    'id', 'name', 'category', 'seller', 'minPrice', 'maxPrice', 
    'totalStock', 'rating', 'numReviews', 'likes', 'isActive', 'createdAt'
  ];
  const csv = convertToCSV(csvData, headers);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=products_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
});

// @desc    Export orders to CSV
// @route   GET /api/admin/export/orders?format=csv
// @access  Private (Admin only)
const exportOrders = asyncHandler(async (req, res) => {
  const { format = 'csv', status, startDate, endDate } = req.query;

  if (format !== 'csv') {
    res.status(400);
    throw new Error('Only CSV format is supported');
  }

  // Build where condition
  let whereCondition = {};
  if (status) {
    whereCondition.orderStatus = status;
  }
  if (startDate && endDate) {
    whereCondition.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  const orders = await Order.findAll({
    where: whereCondition,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['fullName', 'phoneNumber']
      },
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            as: 'orderedProduct',
            attributes: ['name']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  const csvData = orders.map(order => ({
    id: order.id,
    customerName: order.user?.fullName || '',
    customerPhone: order.user?.phoneNumber || '',
    itemsCount: order.orderItems?.length || 0,
    totalPrice: order.totalPrice,
    orderStatus: order.orderStatus,
    paymentMethod: order.paymentMethod,
    isPaid: order.isPaid ? 'Yes' : 'No',
    isDelivered: order.isDelivered ? 'Yes' : 'No',
    shippingAddress: `${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}`,
    createdAt: order.createdAt.toISOString().split('T')[0],
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString().split('T')[0] : ''
  }));

  const headers = [
    'id', 'customerName', 'customerPhone', 'itemsCount', 'totalPrice', 
    'orderStatus', 'paymentMethod', 'isPaid', 'isDelivered', 
    'shippingAddress', 'createdAt', 'deliveredAt'
  ];
  const csv = convertToCSV(csvData, headers);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=orders_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
});

// @desc    Export sales report to CSV
// @route   GET /api/admin/export/sales?format=csv
// @access  Private (Admin only)
const exportSalesReport = asyncHandler(async (req, res) => {
  const { format = 'csv', startDate, endDate, groupBy = 'daily' } = req.query;

  if (format !== 'csv') {
    res.status(400);
    throw new Error('Only CSV format is supported');
  }

  let dateFormat;
  switch (groupBy) {
    case 'monthly':
      dateFormat = '%Y-%m';
      break;
    case 'yearly':
      dateFormat = '%Y';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }

  // Build where condition
  let whereCondition = {
    orderStatus: { [Op.in]: ['completed', 'delivered'] }
  };
  if (startDate && endDate) {
    whereCondition.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  const salesData = await Order.findAll({
    attributes: [
      [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat), 'period'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
      [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue'],
      [sequelize.fn('AVG', sequelize.col('totalPrice')), 'averageOrderValue']
    ],
    where: whereCondition,
    group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat)],
    order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat), 'ASC']],
    raw: true
  });

  const csvData = salesData.map(row => ({
    period: row.period,
    totalOrders: parseInt(row.totalOrders),
    totalRevenue: parseFloat(row.totalRevenue).toFixed(2),
    averageOrderValue: parseFloat(row.averageOrderValue).toFixed(2)
  }));

  const headers = ['period', 'totalOrders', 'totalRevenue', 'averageOrderValue'];
  const csv = convertToCSV(csvData, headers);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=sales_report_${groupBy}_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
});

module.exports = {
  exportUsers,
  exportProducts,
  exportOrders,
  exportSalesReport
};