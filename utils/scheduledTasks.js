// utils/scheduledTasks.js
const cron = require('node-cron');
const { Banner } = require('../models');

// Check and deactivate expired banners every hour
const scheduleExpiredBannerCheck = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🕐 Checking for expired banners...');
      const deactivatedCount = await Banner.checkAndDeactivateExpired();
      
      if (deactivatedCount > 0) {
        console.log(`✅ Deactivated ${deactivatedCount} expired banners`);
      } else {
        console.log('✅ No expired banners found');
      }
    } catch (error) {
      console.error('❌ Error checking expired banners:', error);
    }
  });
  
  console.log('📅 Scheduled task for expired banner check initialized');
};

// Check and deactivate expired banners every day at midnight
const scheduleDailyBannerCheck = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🌙 Daily banner expiration check...');
      const deactivatedCount = await Banner.checkAndDeactivateExpired();
      
      if (deactivatedCount > 0) {
        console.log(`✅ Daily check: Deactivated ${deactivatedCount} expired banners`);
        
        // You could also send notifications to admins here
        // await sendAdminNotification(`${deactivatedCount} banners expired and were deactivated`);
      }
    } catch (error) {
      console.error('❌ Error in daily banner check:', error);
    }
  });
  
  console.log('📅 Daily banner expiration check scheduled');
};

// Initialize all scheduled tasks
const initializeScheduledTasks = () => {
  scheduleExpiredBannerCheck();
  scheduleDailyBannerCheck();
  
  console.log('🚀 All scheduled tasks initialized');
};

module.exports = {
  initializeScheduledTasks,
  scheduleExpiredBannerCheck,
  scheduleDailyBannerCheck
};