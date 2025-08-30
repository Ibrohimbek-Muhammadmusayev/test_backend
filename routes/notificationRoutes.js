// routes/notificationRoutes.js
const express = require('express');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const {
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
} = require('../controllers/notificationController');

const router = express.Router();

// User routes (protected)
router.use(protect);

router.get('/', getMyNotifications);
router.get('/stats', getNotificationStats);
router.put('/:id/read', markNotificationAsRead);
router.delete('/:id', deleteNotification);
router.put('/mark-all-read', markAllNotificationsAsRead);

// Admin routes
router.use('/admin', authorizeRoles('admin'));
router.get('/admin', getAllNotifications);
router.post('/admin', createNotification);
router.post('/admin/bulk', sendBulkNotifications);
router.post('/admin/broadcast', broadcastNotification);
router.delete('/admin/cleanup', cleanupExpiredNotifications);

module.exports = router;