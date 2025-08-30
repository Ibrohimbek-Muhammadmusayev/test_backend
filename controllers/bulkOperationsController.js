const asyncHandler = require('express-async-handler');
const { User, Product, Order, Notification } = require('../models');
const { Op } = require('sequelize');

// @desc    Bulk delete users
// @route   DELETE /api/admin/users/bulk
// @access  Private (Admin only)
const bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('User IDs array is required');
  }

  // Check if trying to delete admin users
  const adminUsers = await User.findAll({
    where: { 
      id: { [Op.in]: ids },
      status: 'admin'
    }
  });

  if (adminUsers.length > 0) {
    res.status(400);
    throw new Error('Cannot delete admin users');
  }

  // Delete users
  const deletedCount = await User.destroy({
    where: { id: { [Op.in]: ids } }
  });

  res.json({
    success: true,
    message: `${deletedCount} users deleted successfully`,
    deletedCount
  });
});

// @desc    Bulk update user status
// @route   PUT /api/admin/users/bulk/status
// @access  Private (Admin only)
const bulkUpdateUserStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('User IDs array is required');
  }

  const validStatuses = ['user', 'seller', 'blocked'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  // Update users
  const [updatedCount] = await User.update(
    { 
      status,
      isBlocked: status === 'blocked'
    },
    { where: { id: { [Op.in]: ids } } }
  );

  res.json({
    success: true,
    message: `${updatedCount} users updated to ${status}`,
    updatedCount
  });
});

// @desc    Bulk update product status
// @route   PUT /api/admin/products/bulk/status
// @access  Private (Admin only)
const bulkUpdateProductStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('Product IDs array is required');
  }

  const validStatuses = ['active', 'inactive'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  // Update products
  const [updatedCount] = await Product.update(
    { isActive: status === 'active' },
    { where: { id: { [Op.in]: ids } } }
  );

  res.json({
    success: true,
    message: `${updatedCount} products updated to ${status}`,
    updatedCount
  });
});

// @desc    Bulk delete products
// @route   DELETE /api/admin/products/bulk
// @access  Private (Admin only)
const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('Product IDs array is required');
  }

  // Delete products
  const deletedCount = await Product.destroy({
    where: { id: { [Op.in]: ids } }
  });

  res.json({
    success: true,
    message: `${deletedCount} products deleted successfully`,
    deletedCount
  });
});

// @desc    Bulk update product category
// @route   PUT /api/admin/products/bulk/category
// @access  Private (Admin only)
const bulkUpdateProductCategory = asyncHandler(async (req, res) => {
  const { ids, categoryId } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('Product IDs array is required');
  }

  if (!categoryId) {
    res.status(400);
    throw new Error('Category ID is required');
  }

  // Update products
  const [updatedCount] = await Product.update(
    { categoryId },
    { where: { id: { [Op.in]: ids } } }
  );

  res.json({
    success: true,
    message: `${updatedCount} products moved to new category`,
    updatedCount
  });
});

// @desc    Bulk send notifications
// @route   POST /api/admin/notifications/bulk
// @access  Private (Admin only)
const bulkSendNotifications = asyncHandler(async (req, res) => {
  const { userIds, title, message, type = 'general', link, image } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    res.status(400);
    throw new Error('User IDs array is required');
  }

  if (!title || !message) {
    res.status(400);
    throw new Error('Title and message are required');
  }

  // Create notifications for all users
  const notifications = userIds.map(userId => ({
    userId,
    title,
    message,
    type,
    link,
    image,
    read: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await Notification.bulkCreate(notifications);

  res.json({
    success: true,
    message: `Notifications sent to ${userIds.length} users`,
    sentCount: userIds.length
  });
});

// @desc    Bulk send notifications to all users
// @route   POST /api/admin/notifications/broadcast
// @access  Private (Admin only)
const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, type = 'general', link, image, userType = 'all' } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error('Title and message are required');
  }

  // Get users based on type
  let whereCondition = {};
  if (userType === 'users') {
    whereCondition.status = 'user';
  } else if (userType === 'sellers') {
    whereCondition.status = 'seller';
  } else if (userType === 'active') {
    whereCondition.isBlocked = false;
  }

  const users = await User.findAll({
    where: whereCondition,
    attributes: ['id']
  });

  if (users.length === 0) {
    res.status(400);
    throw new Error('No users found for the specified criteria');
  }

  // Create notifications for all users
  const notifications = users.map(user => ({
    userId: user.id,
    title,
    message,
    type,
    link,
    image,
    read: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await Notification.bulkCreate(notifications);

  res.json({
    success: true,
    message: `Broadcast notification sent to ${users.length} users`,
    sentCount: users.length
  });
});

module.exports = {
  bulkDeleteUsers,
  bulkUpdateUserStatus,
  bulkUpdateProductStatus,
  bulkDeleteProducts,
  bulkUpdateProductCategory,
  bulkSendNotifications,
  broadcastNotification
};