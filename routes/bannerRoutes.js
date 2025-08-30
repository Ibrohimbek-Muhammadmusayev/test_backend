// routes/bannerRoutes.js
const express = require("express");
const {
    getBanners,
    getActiveBanners,
    getBannerById,
    trackBannerView,
    trackBannerClick
} = require("../controllers/bannerController");

const router = express.Router();

// Public routes
router.get("/", getBanners);
router.get("/active", getActiveBanners); // Route for all active banners
router.get("/active/:position", getActiveBanners); // Route for specific position
router.post("/:id/view", trackBannerView);
router.post("/:id/click", trackBannerClick);
router.get("/:id", getBannerById); // Move this to the end to avoid conflicts

module.exports = router;
