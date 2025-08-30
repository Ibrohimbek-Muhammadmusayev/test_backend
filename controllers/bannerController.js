// controllers/bannerController.js
const asyncHandler = require('express-async-handler');
const { Banner, Group } = require('../models');
const fs = require('fs');
const path = require('path');

// @desc    Fetch all banners with filtering
// @route   GET /api/banners
// @access  Public
const getBanners = asyncHandler(async (req, res) => {
    const { position, type, active, language = 'uz' } = req.query;
    
    let where = {};
    
    if (position) where.position = position;
    if (type) where.type = type;
    if (active !== undefined) where.isActive = active === 'true';
    
    const banners = await Banner.findAll({
        where,
        include: [{ model: Group, as: 'group', attributes: ['id', 'name'] }],
        order: [['priority', 'DESC'], ['createdAt', 'DESC']]
    });
    
    // Filter by schedule and add translations
    const activeBanners = banners
        .filter(banner => active === 'true' ? banner.shouldBeActive() : true)
        .map(banner => ({
            ...banner.toJSON(),
            ...banner.getTranslatedContent(language),
            isExpired: banner.isExpired(),
            isScheduledActive: banner.isScheduledActive(),
            clickThroughRate: banner.getClickThroughRate()
        }));
    
    res.json(activeBanners);
});

// @desc    Fetch active banners by position
// @route   GET /api/banners/active/:position?
// @access  Public
const getActiveBanners = asyncHandler(async (req, res) => {
    const { position } = req.params;
    const { language = 'uz' } = req.query;
    
    const banners = await Banner.getActiveBanners(position, language);
    res.json(banners);
});

// @desc    Fetch single banner by ID
// @route   GET /api/banners/:id
// @access  Public
const getBannerById = asyncHandler(async (req, res) => {
    const { language = 'uz' } = req.query;
    const banner = await Banner.findByPk(req.params.id, {
        include: [{ model: Group, as: 'group', attributes: ['id', 'name'] }]
    });

    if (!banner) {
        res.status(404);
        throw new Error('Banner not found.');
    }
    
    const bannerData = {
        ...banner.toJSON(),
        ...banner.getTranslatedContent(language),
        isExpired: banner.isExpired(),
        isScheduledActive: banner.isScheduledActive(),
        clickThroughRate: banner.getClickThroughRate()
    };
    
    res.json(bannerData);
});

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        groupId,
        isActive,
        link,
        type,
        startDate,
        endDate,
        duration,
        autoDeactivate,
        typeData,
        translations,
        priority,
        position
    } = req.body;

    // Type validation
    const validTypes = ['product', 'game', 'advertisement'];
    if (!type || !validTypes.includes(type)) {
        res.status(400);
        throw new Error(`Invalid banner type. Allowed: ${validTypes.join(', ')}`);
    }

    // Type-specific validation
    if (type === 'product' && (!typeData || !typeData.groupId)) {
        res.status(400);
        throw new Error('Product banners require groupId in typeData');
    }

    if (type === 'game' && (!typeData || !typeData.gameId)) {
        res.status(400);
        throw new Error('Game banners require gameId in typeData');
    }

    // Group validation for product type
    if (type === 'product') {
        const group = await Group.findByPk(typeData.groupId);
        if (!group) {
            res.status(400);
            throw new Error('Invalid groupId in typeData. Group not found.');
        }
    }

    if (!req.processedImageUrls || req.processedImageUrls.length === 0) {
        res.status(400);
        throw new Error('Banner image is required.');
    }

    const imageUrl = req.processedImageUrls[0];

    // Calculate end date if duration is provided
    let calculatedEndDate = endDate;
    if (duration && !endDate) {
        const start = startDate ? new Date(startDate) : new Date();
        calculatedEndDate = new Date(start.getTime() + (duration * 24 * 60 * 60 * 1000));
    }

    const banner = await Banner.create({
        title,
        description,
        image: imageUrl,
        groupId: type === 'product' ? typeData.groupId : groupId,
        isActive: isActive === 'true' || isActive === true,
        link,
        type,
        startDate: startDate ? new Date(startDate) : null,
        endDate: calculatedEndDate ? new Date(calculatedEndDate) : null,
        duration: duration ? parseInt(duration) : null,
        autoDeactivate: autoDeactivate !== false,
        typeData: typeData || {},
        translations: translations || {},
        priority: priority ? parseInt(priority) : 0,
        position: position || 'top'
    });

    res.status(201).json(banner);
});

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        groupId,
        isActive,
        link,
        type,
        startDate,
        endDate,
        duration,
        autoDeactivate,
        typeData,
        translations,
        priority,
        position
    } = req.body;
    
    const banner = await Banner.findByPk(req.params.id);

    if (!banner) {
        res.status(404);
        throw new Error('Banner not found.');
    }

    // Type validation
    const validTypes = ['product', 'game', 'advertisement'];
    if (type !== undefined && !validTypes.includes(type)) {
        res.status(400);
        throw new Error(`Invalid banner type. Allowed: ${validTypes.join(', ')}`);
    }

    // Type-specific validation
    if (type === 'product' && typeData && !typeData.groupId) {
        res.status(400);
        throw new Error('Product banners require groupId in typeData');
    }

    if (type === 'game' && typeData && !typeData.gameId) {
        res.status(400);
        throw new Error('Game banners require gameId in typeData');
    }

    let newImageUrl = banner.image;
    if (req.processedImageUrls && req.processedImageUrls.length > 0) {
        const oldFilename = banner.image.split('/').pop();
        const oldFilePath = path.join(__dirname, '../../uploads', oldFilename);
        if (fs.existsSync(oldFilePath)) {
            fs.unlink(oldFilePath, (err) => {
                if (err) console.error('Failed to delete old banner image:', err);
            });
        }
        newImageUrl = req.processedImageUrls[0];
    }

    // Calculate end date if duration is provided
    let calculatedEndDate = endDate;
    if (duration && !endDate) {
        const start = startDate ? new Date(startDate) : (banner.startDate || new Date());
        calculatedEndDate = new Date(start.getTime() + (duration * 24 * 60 * 60 * 1000));
    }

    const updateData = {
        title: title || banner.title,
        description: description || banner.description,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : banner.isActive,
        link: link || banner.link,
        image: newImageUrl,
        type: type || banner.type,
        priority: priority !== undefined ? parseInt(priority) : banner.priority,
        position: position || banner.position
    };

    // Update scheduling fields
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (calculatedEndDate !== undefined) updateData.endDate = calculatedEndDate ? new Date(calculatedEndDate) : null;
    if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
    if (autoDeactivate !== undefined) updateData.autoDeactivate = autoDeactivate;

    // Update type-specific data
    if (typeData !== undefined) {
        updateData.typeData = { ...banner.typeData, ...typeData };
        if (type === 'product' || banner.type === 'product') {
            updateData.groupId = typeData.groupId || banner.groupId;
        }
    }

    // Update translations
    if (translations !== undefined) {
        updateData.translations = { ...banner.translations, ...translations };
    }

    await banner.update(updateData);

    res.json(banner);
});

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findByPk(req.params.id);

    if (!banner) {
        res.status(404);
        throw new Error('Banner not found.');
    }

    const filename = banner.image.split('/').pop();
    const filePath = path.join(__dirname, '../../uploads', filename);
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete banner image:', err);
        });
    }

    await banner.destroy();
    res.json({ message: 'Banner removed.' });
});

// @desc    Track banner view
// @route   POST /api/banners/:id/view
// @access  Public
const trackBannerView = asyncHandler(async (req, res) => {
    const banner = await Banner.findByPk(req.params.id);

    if (!banner) {
        res.status(404);
        throw new Error('Banner not found.');
    }

    await banner.incrementView();
    res.json({ message: 'View tracked successfully' });
});

// @desc    Track banner click
// @route   POST /api/banners/:id/click
// @access  Public
const trackBannerClick = asyncHandler(async (req, res) => {
    const banner = await Banner.findByPk(req.params.id);

    if (!banner) {
        res.status(404);
        throw new Error('Banner not found.');
    }

    await banner.incrementClick();
    res.json({ message: 'Click tracked successfully' });
});

// @desc    Check and deactivate expired banners
// @route   POST /api/admin/banners/check-expired
// @access  Private/Admin
const checkExpiredBanners = asyncHandler(async (req, res) => {
    const deactivatedCount = await Banner.checkAndDeactivateExpired();
    res.json({
        message: `${deactivatedCount} expired banners deactivated`,
        deactivatedCount
    });
});

// @desc    Set banner translation
// @route   PUT /api/banners/:id/translations/:language
// @access  Private/Admin
const setBannerTranslation = asyncHandler(async (req, res) => {
    const { language } = req.params;
    const { title, description } = req.body;
    
    const banner = await Banner.findByPk(req.params.id);

    if (!banner) {
        res.status(404);
        throw new Error('Banner not found.');
    }

    await banner.setTranslation(language, { title, description });
    
    res.json({
        message: 'Translation updated successfully',
        translations: banner.translations
    });
});

module.exports = {
    getBanners,
    getActiveBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    trackBannerView,
    trackBannerClick,
    checkExpiredBanners,
    setBannerTranslation
};
