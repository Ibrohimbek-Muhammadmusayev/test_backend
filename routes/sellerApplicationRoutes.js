const express = require('express');
const router = express.Router();
const {
  createSellerApplication,
  getMyApplication,
  updateMyApplication,
  getAllApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  requestAdditionalInfo,
  updateApplicationPriority,
  getApplicationStats
} = require('../controllers/sellerApplicationController');

const { protect, authorizeRoles, adminOnly } = require('../middlewares/authMiddleware');

// User routes - Foydalanuvchi arizalari
router.post('/apply', protect, createSellerApplication);
router.get('/my-application', protect, getMyApplication);
router.put('/my-application', protect, updateMyApplication);

// Admin routes - Admin arizalarni boshqarish
router.get('/admin/all', protect, adminOnly, getAllApplications);
router.get('/admin/stats', protect, adminOnly, getApplicationStats);
router.get('/admin/:id', protect, adminOnly, getApplicationById);
router.put('/admin/:id/approve', protect, adminOnly, approveApplication);
router.put('/admin/:id/reject', protect, adminOnly, rejectApplication);
router.put('/admin/:id/request-info', protect, adminOnly, requestAdditionalInfo);
router.put('/admin/:id/priority', protect, adminOnly, updateApplicationPriority);

module.exports = router;