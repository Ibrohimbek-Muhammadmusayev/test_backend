const asyncHandler = require('express-async-handler');
const { Order, OrderItem, User, Product, Notification } = require('../models');
const { Op } = require('sequelize');

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;

  // Validate status
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid order status');
  }

  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'fullName', 'phoneNumber']
      },
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            as: 'orderedProduct',
            attributes: ['id', 'name']
          }
        ]
      }
    ]
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Update order status
  const oldStatus = order.orderStatus;
  await order.update({ 
    orderStatus: status,
    ...(status === 'delivered' && { 
      isDelivered: true, 
      deliveredAt: new Date() 
    })
  });

  // Create notification for user
  const statusMessages = {
    pending: 'Buyurtmangiz qabul qilindi',
    processing: 'Buyurtmangiz tayyorlanmoqda',
    shipped: 'Buyurtmangiz jo\'natildi',
    delivered: 'Buyurtmangiz yetkazildi',
    cancelled: 'Buyurtmangiz bekor qilindi'
  };

  await Notification.create({
    userId: order.userId,
    title: 'Buyurtma holati o\'zgartirildi',
    message: `#${order.id} - ${statusMessages[status]}`,
    type: 'order',
    link: `/orders/${order.id}`,
    read: false
  });

  res.json({
    success: true,
    message: `Order status updated from ${oldStatus} to ${status}`,
    order: {
      id: order.id,
      orderStatus: order.orderStatus,
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt,
      updatedAt: order.updatedAt
    }
  });
});

// @desc    Bulk update order status
// @route   PUT /api/admin/orders/bulk/status
// @access  Private (Admin only)
const bulkUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('Order IDs array is required');
  }

  // Validate status
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid order status');
  }

  // Update orders
  const updateData = { 
    orderStatus: status,
    ...(status === 'delivered' && { 
      isDelivered: true, 
      deliveredAt: new Date() 
    })
  };

  const [updatedCount] = await Order.update(updateData, {
    where: { id: { [Op.in]: ids } }
  });

  // Get updated orders for notifications
  const orders = await Order.findAll({
    where: { id: { [Op.in]: ids } },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'fullName']
      }
    ]
  });

  // Create notifications for users
  const statusMessages = {
    pending: 'Buyurtmangiz qabul qilindi',
    processing: 'Buyurtmangiz tayyorlanmoqda',
    shipped: 'Buyurtmangiz jo\'natildi',
    delivered: 'Buyurtmangiz yetkazildi',
    cancelled: 'Buyurtmangiz bekor qilindi'
  };

  const notifications = orders.map(order => ({
    userId: order.userId,
    title: 'Buyurtma holati o\'zgartirildi',
    message: `#${order.id} - ${statusMessages[status]}`,
    type: 'order',
    link: `/orders/${order.id}`,
    read: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await Notification.bulkCreate(notifications);

  res.json({
    success: true,
    message: `${updatedCount} orders updated to ${status}`,
    updatedCount
  });
});

// @desc    Get order status statistics
// @route   GET /api/admin/orders/status/stats
// @access  Private (Admin only)
const getOrderStatusStats = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  const statusStats = await Order.findAll({
    attributes: [
      'orderStatus',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalValue']
    ],
    where: {
      createdAt: { [Op.gte]: daysAgo }
    },
    group: ['orderStatus'],
    raw: true
  });

  // Get daily status changes
  const dailyStatusChanges = await Order.findAll({
    attributes: [
      [sequelize.fn('DATE', sequelize.col('updatedAt')), 'date'],
      'orderStatus',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      updatedAt: { [Op.gte]: daysAgo }
    },
    group: [
      sequelize.fn('DATE', sequelize.col('updatedAt')),
      'orderStatus'
    ],
    order: [[sequelize.fn('DATE', sequelize.col('updatedAt')), 'ASC']],
    raw: true
  });

  res.json({
    success: true,
    period: parseInt(period),
    statusStats: statusStats.map(stat => ({
      status: stat.orderStatus,
      count: parseInt(stat.count),
      totalValue: parseFloat(stat.totalValue || 0)
    })),
    dailyStatusChanges
  });
});

module.exports = {
  updateOrderStatus,
  bulkUpdateOrderStatus,
  getOrderStatusStats
};