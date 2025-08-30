// routes/searchRoutes.js
const express = require('express');
const {
  searchAll,
  advancedSearch,
  getSearchSuggestions,
  getSearchHistory,
  saveSearchHistory,
  deleteHistoryItem,
  clearSearchHistory,
  getPopularSearches,
  getAllSearches,
  getTopSearchQueries
} = require('../controllers/searchController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// @route   GET /api/search
// @desc    Simple search products and categories
// @access  Public
router.get('/', searchAll);

// @route   GET /api/search/advanced
// @desc    Advanced search with variant attributes
// @access  Public
router.get('/advanced', advancedSearch);

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/suggestions', getSearchSuggestions);

// @route   POST /api/search/history
// @desc    Save search history
// @access  Private
router.post('/history', protect, saveSearchHistory);

// @route   GET /api/search/history
// @desc    Get user's search history
// @access  Private
router.get('/history', protect, getSearchHistory);

// @route   DELETE /api/search/history/:id
// @desc    Delete specific search history item
// @access  Private
router.delete('/history/:id', protect, deleteHistoryItem);

// @route   DELETE /api/search/history
// @desc    Clear all search history
// @access  Private
router.delete('/history', protect, clearSearchHistory);

// @route   GET /api/search/popular
// @desc    Get popular searches (Admin only)
// @access  Private (Admin)
router.get('/popular', protect, getPopularSearches);

// @route   GET /api/search/all
// @desc    Get all searches (Admin only)
// @access  Private (Admin)
router.get('/all', protect, getAllSearches);

// @route   GET /api/search/statistics
// @desc    Get search statistics (Admin only)
// @access  Private (Admin)
router.get('/statistics', protect, getTopSearchQueries);

module.exports = router;