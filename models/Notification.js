// models/Notification.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      this.setDataValue('title', value.trim());
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'order',
      'order_status',
      'order_delivered',
      'order_cancelled',
      'promotion',
      'system',
      'comment',
      'product',
      'admin_message',
      'seller_notification',
      'payment',
      'shipping',
      'review',
      'low_stock',
      'new_user',
      'welcome'
    ),
    defaultValue: 'system',
    allowNull: false,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Enhanced notification features
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal',
    comment: 'Notification priority level'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Notification category for grouping'
  },
  // Sender information
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID of user who sent this notification (for admin messages)'
  },
  senderType: {
    type: DataTypes.ENUM('admin', 'system', 'seller', 'user'),
    defaultValue: 'system',
    comment: 'Type of sender'
  },
  // Related entity information
  relatedEntityType: {
    type: DataTypes.ENUM('order', 'product', 'user', 'banner', 'category', 'review'),
    allowNull: true,
    comment: 'Type of related entity'
  },
  relatedEntityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of related entity'
  },
  // Delivery settings
  deliveryMethod: {
    type: DataTypes.JSON,
    defaultValue: { push: true, sms: false },
    comment: 'How this notification should be delivered'
  },
  // Scheduling
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When to send this notification (for scheduled notifications)'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When this notification was actually sent'
  },
  // Expiration
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When this notification expires'
  },
  // Action buttons
  actions: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Action buttons for the notification: [{label, action, url}]'
  },
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional metadata for the notification'
  },
  // Multi-language support
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Translations for title and message in different languages'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['read'] },
    { fields: ['type'] },
    { fields: ['priority'] },
    { fields: ['category'] },
    { fields: ['senderId'] },
    { fields: ['senderType'] },
    { fields: ['relatedEntityType', 'relatedEntityId'] },
    { fields: ['scheduledFor'] },
    { fields: ['sentAt'] },
    { fields: ['expiresAt'] },
  ],
});

// Instance methods
Notification.prototype.markAsRead = async function() {
  this.read = true;
  await this.save();
  return this;
};

Notification.prototype.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > new Date(this.expiresAt);
};

Notification.prototype.shouldBeSent = function() {
  if (this.sentAt) return false; // Already sent
  if (this.isExpired()) return false; // Expired
  
  if (this.scheduledFor) {
    return new Date() >= new Date(this.scheduledFor);
  }
  
  return true; // Send immediately
};

Notification.prototype.getTranslatedContent = function(language = 'uz') {
  const translations = this.translations || {};
  
  return {
    title: translations[language]?.title || this.title,
    message: translations[language]?.message || this.message
  };
};

Notification.prototype.setTranslation = async function(language, content) {
  const translations = this.translations || {};
  translations[language] = {
    ...translations[language],
    ...content
  };
  
  this.translations = translations;
  await this.save();
  return this;
};

Notification.prototype.markAsSent = async function() {
  this.sentAt = new Date();
  await this.save();
  return this;
};

// Static methods
Notification.createOrderNotification = async function(orderId, userId, sellerId, type = 'order') {
  const notifications = [];
  
  // Notification for customer
  const customerNotification = await Notification.create({
    userId: userId,
    title: 'Order Update',
    message: `Your order #${orderId} has been ${type === 'order' ? 'placed' : 'updated'}.`,
    type: type,
    relatedEntityType: 'order',
    relatedEntityId: orderId,
    link: `/orders/${orderId}`,
    priority: 'high',
    senderType: 'system'
  });
  notifications.push(customerNotification);
  
  // Notification for seller
  if (sellerId) {
    const sellerNotification = await Notification.create({
      userId: sellerId,
      title: 'New Order',
      message: `You have received a new order #${orderId}.`,
      type: 'seller_notification',
      relatedEntityType: 'order',
      relatedEntityId: orderId,
      link: `/seller/orders/${orderId}`,
      priority: 'high',
      senderType: 'system'
    });
    notifications.push(sellerNotification);
  }
  
  return notifications;
};

Notification.createAdminMessage = async function(userIds, title, message, senderId, options = {}) {
  const notifications = [];
  
  for (const userId of userIds) {
    const notification = await Notification.create({
      userId: userId,
      title: title,
      message: message,
      type: 'admin_message',
      senderId: senderId,
      senderType: 'admin',
      priority: options.priority || 'normal',
      category: options.category || 'admin',
      link: options.link || null,
      image: options.image || null,
      actions: options.actions || [],
      expiresAt: options.expiresAt || null,
      deliveryMethod: options.deliveryMethod || { push: true, sms: false }
    });
    notifications.push(notification);
  }
  
  return notifications;
};

Notification.broadcastMessage = async function(title, message, senderId, options = {}) {
  const User = require('./User');
  
  // Get all active users (or filter by criteria)
  const users = await User.findAll({
    where: { isBlocked: false },
    attributes: ['id']
  });
  
  const userIds = users.map(user => user.id);
  return await Notification.createAdminMessage(userIds, title, message, senderId, options);
};

Notification.getUnreadCount = async function(userId) {
  return await Notification.count({
    where: {
      userId: userId,
      read: false
    }
  });
};

Notification.markAllAsRead = async function(userId) {
  return await Notification.update(
    { read: true },
    {
      where: {
        userId: userId,
        read: false
      }
    }
  );
};

Notification.cleanupExpired = async function() {
  const { Op } = require('sequelize');
  
  const expiredCount = await Notification.destroy({
    where: {
      expiresAt: {
        [Op.lt]: new Date()
      }
    }
  });
  
  return expiredCount;
};

module.exports = Notification;