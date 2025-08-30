// controllers/notificationController.js
const asyncHandler = require('express-async-handler');
const { Notification, User } = require('../models');
const { Op } = require('sequelize');
const { sendNotificationToUser } = require('../utils/notification');

// @desc    Get user's notifications with filtering and pagination
// @route   GET /api/notifications
// @access  Private (User specific)
const getMyNotifications = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        type,
        category,
        priority,
        unreadOnly = false,
        language = 'uz'
    } = req.query;
    
    let where = { userId: req.user.id };
    
    if (type) where.type = type;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (unreadOnly === 'true') where.read = false;
    
    const offset = (page - 1) * limit;
    
    const notifications = await Notification.findAndCountAll({
        where,
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'fullName', 'profileImage'],
                required: false
            }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });
    
    // Add translations and additional data
    const notificationsWithTranslations = notifications.rows.map(notification => ({
        ...notification.toJSON(),
        ...notification.getTranslatedContent(language),
        isExpired: notification.isExpired()
    }));
    
    res.json({
        notifications: notificationsWithTranslations,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: notifications.count,
            pages: Math.ceil(notifications.count / limit)
        },
        unreadCount: await Notification.getUnreadCount(req.user.id)
    });
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private (User specific)
const getNotificationStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const stats = await Notification.findAll({
        where: { userId },
        attributes: [
            'type',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('SUM', sequelize.literal('CASE WHEN read = false THEN 1 ELSE 0 END')), 'unread']
        ],
        group: ['type'],
        raw: true
    });
    
    const totalUnread = await Notification.getUnreadCount(userId);
    const totalCount = await Notification.count({ where: { userId } });
    
    res.json({
        byType: stats,
        total: {
            count: totalCount,
            unread: totalUnread,
            read: totalCount - totalUnread
        }
    });
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (User specific)
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        where: {
            id: req.params.id,
            userId: req.user.id,
        },
    });

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found or you are not authorized.');
    }

    await notification.markAsRead();
    res.json({ message: 'Notification marked as read.' });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (User specific)
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        where: {
            id: req.params.id,
            userId: req.user.id,
        },
    });

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found or you are not authorized.');
    }

    await notification.destroy();
    res.json({ message: 'Notification removed.' });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private (User specific)
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const updatedCount = await Notification.markAllAsRead(req.user.id);
    res.json({
        message: 'All notifications marked as read.',
        updatedCount
    });
});

// @desc    Create notification (Admin only)
// @route   POST /api/admin/notifications
// @access  Private (Admin only)
const createNotification = asyncHandler(async (req, res) => {
    const {
        userId,
        title,
        message,
        type = 'admin_message',
        priority = 'normal',
        category,
        link,
        image,
        actions,
        expiresAt,
        deliveryMethod,
        translations
    } = req.body;

    if (!userId || !message) {
        res.status(400);
        throw new Error("UserId and message are required");
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    const notification = await Notification.create({
        userId,
        title: title || "New Notification",
        message,
        type,
        priority,
        category,
        link,
        image,
        actions: actions || [],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        deliveryMethod: deliveryMethod || { push: true, sms: false },
        translations: translations || {},
        senderId: req.user.id,
        senderType: 'admin'
    });

    // Send notification via socket
    sendNotificationToUser(userId, notification);

    res.status(201).json(notification);
});

// @desc    Send notification to multiple users
// @route   POST /api/admin/notifications/bulk
// @access  Private (Admin only)
const sendBulkNotifications = asyncHandler(async (req, res) => {
    const {
        userIds,
        title,
        message,
        type = 'admin_message',
        priority = 'normal',
        category,
        link,
        image,
        actions,
        expiresAt,
        deliveryMethod,
        translations
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400);
        throw new Error("UserIds array is required");
    }

    if (!message) {
        res.status(400);
        throw new Error("Message is required");
    }

    const notifications = await Notification.createAdminMessage(
        userIds,
        title || "New Notification",
        message,
        req.user.id,
        {
            type,
            priority,
            category,
            link,
            image,
            actions,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            deliveryMethod: deliveryMethod || { push: true, sms: false }
        }
    );

    // Send notifications via socket
    notifications.forEach(notification => {
        sendNotificationToUser(notification.userId, notification);
    });

    res.status(201).json({
        message: `${notifications.length} notifications sent successfully`,
        notifications
    });
});

// @desc    Broadcast notification to all users
// @route   POST /api/admin/notifications/broadcast
// @access  Private (Admin only)
const broadcastNotification = asyncHandler(async (req, res) => {
    const {
        title,
        message,
        type = 'admin_message',
        priority = 'normal',
        category,
        link,
        image,
        actions,
        expiresAt,
        deliveryMethod,
        translations
    } = req.body;

    if (!message) {
        res.status(400);
        throw new Error("Message is required");
    }

    const notifications = await Notification.broadcastMessage(
        title || "System Announcement",
        message,
        req.user.id,
        {
            type,
            priority,
            category,
            link,
            image,
            actions,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            deliveryMethod: deliveryMethod || { push: true, sms: false }
        }
    );

    // Send notifications via socket to all users
    notifications.forEach(notification => {
        sendNotificationToUser(notification.userId, notification);
    });

    res.status(201).json({
        message: `Broadcast sent to ${notifications.length} users`,
        count: notifications.length
    });
});

// @desc    Get all notifications (Admin only)
// @route   GET /api/admin/notifications
// @access  Private (Admin only)
const getAllNotifications = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        type,
        priority,
        senderType,
        userId
    } = req.query;
    
    let where = {};
    
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (senderType) where.senderType = senderType;
    if (userId) where.userId = userId;
    
    const offset = (page - 1) * limit;
    
    const notifications = await Notification.findAndCountAll({
        where,
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'fullName', 'phoneNumber']
            },
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'fullName', 'profileImage'],
                required: false
            }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });
    
    res.json({
        notifications: notifications.rows,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: notifications.count,
            pages: Math.ceil(notifications.count / limit)
        }
    });
});

// @desc    Clean up expired notifications
// @route   DELETE /api/admin/notifications/cleanup
// @access  Private (Admin only)
const cleanupExpiredNotifications = asyncHandler(async (req, res) => {
    const deletedCount = await Notification.cleanupExpired();
    
    res.json({
        message: `${deletedCount} expired notifications cleaned up`,
        deletedCount
    });
});

module.exports = {
    getMyNotifications,
    getNotificationStats,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead,
    createNotification,
    sendBulkNotifications,
    broadcastNotification,
    getAllNotifications,
    cleanupExpiredNotifications
};