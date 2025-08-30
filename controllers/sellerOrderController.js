// controllers/sellerOrderController.js
const asyncHandler = require('express-async-handler');
const { Op, Sequelize } = require('sequelize');
const { 
  Order, 
  OrderItem, 
  Product, 
  ProductVariant, 
  User,
  Notification
} = require('../models');
const { sendNotificationToUser } = require('../utils/notification');

// @desc    Get seller's orders
// @route   GET /api/seller/orders
// @access  Private (Seller only)
const getSellerOrders = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const {
    page = 1,
    limit = 10,
    status = 'all', // all, pending, processing, shipped, delivered, cancelled
    search,
    startDate,
    endDate,
    sortBy = 'newest' // newest, oldest, amount_high, amount_low
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  // Build where condition for OrderItems
  let orderItemWhere = { sellerId: sellerId };
  
  // Build where condition for Orders
  let orderWhere = {};
  
  // Status filter
  if (status !== 'all') {
    orderWhere.status = status;
  }

  // Date range filter
  if (startDate && endDate) {
    orderWhere.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  } else if (startDate) {
    orderWhere.createdAt = { [Op.gte]: new Date(startDate) };
  } else if (endDate) {
    orderWhere.createdAt = { [Op.lte]: new Date(endDate) };
  }

  // Search filter (customer name or order ID)
  if (search) {
    const searchCondition = { [Op.iLike]: `%${search.trim()}%` };
    orderWhere[Op.or] = [
      { id: isNaN(search) ? 0 : parseInt(search) },
      { '$user.fullName$': searchCondition },
      { '$user.phoneNumber$': searchCondition }
    ];
  }

  // Sorting
  let orderOptions = [['createdAt', 'DESC']];
  switch (sortBy) {
    case 'oldest':
      orderOptions = [['createdAt', 'ASC']];
      break;
    case 'amount_high':
      orderOptions = [['totalPrice', 'DESC']];
      break;
    case 'amount_low':
      orderOptions = [['totalPrice', 'ASC']];
      break;
  }

  // Get orders with seller's items
  const orders = await Order.findAll({
    where: orderWhere,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'fullName', 'phoneNumber', 'profileImage']
      },
      {
        model: OrderItem,
        as: 'orderItems',
        where: orderItemWhere,
        include: [
          {
            model: Product,
            as: 'orderedProduct',
            attributes: ['id', 'name', 'images']
          },
          {
            model: ProductVariant,
            as: 'orderedVariant',
            attributes: ['id', 'sku', 'size', 'color', 'price', 'discountPrice']
          }
        ]
      }
    ],
    order: orderOptions,
    limit: parseInt(limit),
    offset: offset,
    distinct: true
  });

  // Get total count
  const totalOrders = await Order.count({
    where: orderWhere,
    include: [{
      model: OrderItem,
      as: 'orderItems',
      where: orderItemWhere
    }],
    distinct: true
  });

  // Process orders data
  const processedOrders = orders.map(order => {
    const orderData = order.toJSON();
    
    // Calculate seller's total for this order
    const sellerTotal = orderData.orderItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.qty);
    }, 0);

    // Calculate seller's item count
    const sellerItemCount = orderData.orderItems.reduce((sum, item) => {
      return sum + item.qty;
    }, 0);

    return {
      ...orderData,
      sellerTotal: sellerTotal.toFixed(2),
      sellerItemCount,
      orderItems: orderData.orderItems.map(item => ({
        ...item,
        totalPrice: (parseFloat(item.price) * item.qty).toFixed(2)
      }))
    };
  });

  res.json({
    orders: processedOrders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalOrders,
      pages: Math.ceil(totalOrders / parseInt(limit))
    }
  });
});

// @desc    Get single order details for seller
// @route   GET /api/seller/orders/:id
// @access  Private (Seller only)
const getSellerOrder = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const orderId = req.params.id;

  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'fullName', 'phoneNumber', 'profileImage']
      },
      {
        model: OrderItem,
        as: 'orderItems',
        where: { sellerId: sellerId },
        include: [
          {
            model: Product,
            as: 'orderedProduct',
            attributes: ['id', 'name', 'images', 'description']
          },
          {
            model: ProductVariant,
            as: 'orderedVariant',
            attributes: ['id', 'sku', 'size', 'color', 'price', 'discountPrice', 'weight', 'dimensions']
          }
        ]
      }
    ]
  });

  if (!order || !order.orderItems || order.orderItems.length === 0) {
    res.status(404);
    throw new Error('Order not found or you do not have items in this order.');
  }

  // Calculate seller's totals
  const sellerTotal = order.orderItems.reduce((sum, item) => {
    return sum + (parseFloat(item.price) * item.qty);
  }, 0);

  const sellerItemCount = order.orderItems.reduce((sum, item) => {
    return sum + item.qty;
  }, 0);

  const orderData = order.toJSON();
  orderData.sellerTotal = sellerTotal.toFixed(2);
  orderData.sellerItemCount = sellerItemCount;

  res.json(orderData);
});

// @desc    Update order item status
// @route   PATCH /api/seller/orders/:orderId/items/:itemId/status
// @access  Private (Seller only)
const updateOrderItemStatus = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const { orderId, itemId } = req.params;
  const { status, trackingNumber, notes } = req.body;

  // Valid statuses for seller
  const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status. Valid statuses: ' + validStatuses.join(', '));
  }

  // Find order item
  const orderItem = await OrderItem.findOne({
    where: { 
      id: itemId, 
      sellerId: sellerId 
    },
    include: [
      {
        model: Order,
        as: 'order',
        where: { id: orderId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'fullName']
        }]
      },
      {
        model: Product,
        as: 'orderedProduct',
        attributes: ['name']
      }
    ]
  });

  if (!orderItem) {
    res.status(404);
    throw new Error('Order item not found or you do not have permission to update it.');
  }

  // Update order item status
  await orderItem.update({
    status: status,
    trackingNumber: trackingNumber || null,
    notes: notes || null,
    updatedAt: new Date()
  });

  // Check if all items in the order have the same status
  const allOrderItems = await OrderItem.findAll({
    where: { orderId: orderId }
  });

  const allItemsStatus = allOrderItems.every(item => item.status === status);
  
  // Update main order status if all items have the same status
  if (allItemsStatus) {
    await Order.update(
      { status: status },
      { where: { id: orderId } }
    );
  }

  // Send notification to customer
  let notificationMessage = '';
  switch (status) {
    case 'processing':
      notificationMessage = `Your order item "${orderItem.orderedProduct.name}" is being processed.`;
      break;
    case 'shipped':
      notificationMessage = `Your order item "${orderItem.orderedProduct.name}" has been shipped.`;
      if (trackingNumber) {
        notificationMessage += ` Tracking number: ${trackingNumber}`;
      }
      break;
    case 'delivered':
      notificationMessage = `Your order item "${orderItem.orderedProduct.name}" has been delivered.`;
      break;
    case 'cancelled':
      notificationMessage = `Your order item "${orderItem.orderedProduct.name}" has been cancelled.`;
      break;
  }

  // Send notification
  await sendNotificationToUser(orderItem.order.user.id, {
    type: 'order_status_update',
    message: notificationMessage,
    orderId: orderId,
    orderItemId: itemId
  });

  res.json({
    message: 'Order item status updated successfully.',
    orderItem: {
      id: orderItem.id,
      status: status,
      trackingNumber: trackingNumber,
      notes: notes
    }
  });
});

// @desc    Get seller order statistics
// @route   GET /api/seller/orders/statistics
// @access  Private (Seller only)
const getSellerOrderStatistics = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const { period = '30' } = req.query; // days

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Get statistics
  const [
    totalOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    averageOrderValue
  ] = await Promise.all([
    // Total orders
    OrderItem.count({
      where: { 
        sellerId: sellerId,
        createdAt: { [Op.gte]: daysAgo }
      }
    }),

    // Pending orders
    OrderItem.count({
      where: { sellerId: sellerId },
      include: [{
        model: Order,
        as: 'order',
        where: { 
          status: 'pending',
          createdAt: { [Op.gte]: daysAgo }
        }
      }]
    }),

    // Processing orders
    OrderItem.count({
      where: { sellerId: sellerId },
      include: [{
        model: Order,
        as: 'order',
        where: { 
          status: 'processing',
          createdAt: { [Op.gte]: daysAgo }
        }
      }]
    }),

    // Shipped orders
    OrderItem.count({
      where: { sellerId: sellerId },
      include: [{
        model: Order,
        as: 'order',
        where: { 
          status: 'shipped',
          createdAt: { [Op.gte]: daysAgo }
        }
      }]
    }),

    // Delivered orders
    OrderItem.count({
      where: { sellerId: sellerId },
      include: [{
        model: Order,
        as: 'order',
        where: { 
          status: 'delivered',
          createdAt: { [Op.gte]: daysAgo }
        }
      }]
    }),

    // Cancelled orders
    OrderItem.count({
      where: { sellerId: sellerId },
      include: [{
        model: Order,
        as: 'order',
        where: { 
          status: 'cancelled',
          createdAt: { [Op.gte]: daysAgo }
        }
      }]
    }),

    // Total revenue
    OrderItem.sum('price', {
      where: { 
        sellerId: sellerId,
        createdAt: { [Op.gte]: daysAgo }
      },
      include: [{
        model: Order,
        as: 'order',
        where: { status: { [Op.in]: ['delivered', 'completed'] } }
      }]
    }),

    // Average order value
    OrderItem.findOne({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('price')), 'avgValue']],
      where: { 
        sellerId: sellerId,
        createdAt: { [Op.gte]: daysAgo }
      },
      include: [{
        model: Order,
        as: 'order',
        where: { status: { [Op.in]: ['delivered', 'completed'] } }
      }],
      raw: true
    })
  ]);

  res.json({
    period: parseInt(period),
    statistics: {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue || 0,
      averageOrderValue: parseFloat(averageOrderValue?.avgValue || 0).toFixed(2)
    }
  });
});

module.exports = {
  getSellerOrders,
  getSellerOrder,
  updateOrderItemStatus,
  getSellerOrderStatistics
};