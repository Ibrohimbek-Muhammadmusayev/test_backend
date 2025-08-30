// models/Banner.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Group = require('./Group');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'groups',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('product', 'game', 'advertisement'),
    allowNull: false,
    defaultValue: 'product',
  },
  // Time scheduling fields
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Banner start date and time'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Banner end date and time'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in days (7, 14, or custom)'
  },
  autoDeactivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Automatically deactivate when time expires'
  },
  // Type-specific data
  typeData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Type-specific configuration data'
  },
  // Multi-language support
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Translations for title and description in different languages'
  },
  // Priority and positioning
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Banner display priority (higher number = higher priority)'
  },
  position: {
    type: DataTypes.ENUM('top', 'middle', 'bottom', 'sidebar', 'popup'),
    defaultValue: 'top',
    comment: 'Banner display position'
  },
  // Analytics
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times banner was viewed'
  },
  clickCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times banner was clicked'
  }
}, {
  tableName: 'banners',
  timestamps: true,
  indexes: [
    { fields: ['groupId'] },
    { fields: ['isActive'] },
    { fields: ['type'] },
    { fields: ['startDate'] },
    { fields: ['endDate'] },
    { fields: ['priority'] },
    { fields: ['position'] },
  ],
});

// Instance methods
Banner.prototype.isExpired = function() {
  if (!this.endDate) return false;
  return new Date() > new Date(this.endDate);
};

Banner.prototype.isScheduledActive = function() {
  const now = new Date();
  const startOk = !this.startDate || now >= new Date(this.startDate);
  const endOk = !this.endDate || now <= new Date(this.endDate);
  return startOk && endOk;
};

Banner.prototype.shouldBeActive = function() {
  return this.isActive && this.isScheduledActive() && !this.isExpired();
};

Banner.prototype.getTranslatedContent = function(language = 'uz') {
  const translations = this.translations || {};
  
  return {
    title: translations[language]?.title || this.title,
    description: translations[language]?.description || this.description
  };
};

Banner.prototype.setTranslation = async function(language, content) {
  const translations = this.translations || {};
  translations[language] = {
    ...translations[language],
    ...content
  };
  
  this.translations = translations;
  await this.save();
  return this;
};

Banner.prototype.incrementView = async function() {
  this.viewCount += 1;
  await this.save();
};

Banner.prototype.incrementClick = async function() {
  this.clickCount += 1;
  await this.save();
};

Banner.prototype.getClickThroughRate = function() {
  if (this.viewCount === 0) return 0;
  return ((this.clickCount / this.viewCount) * 100).toFixed(2);
};

// Static methods
Banner.getActiveBanners = async function(position = null, language = 'uz') {
  const where = {
    isActive: true
  };
  
  if (position) {
    where.position = position;
  }
  
  const banners = await Banner.findAll({
    where,
    include: [{ model: Group, as: 'group', attributes: ['id', 'name'] }],
    order: [['priority', 'DESC'], ['createdAt', 'DESC']]
  });
  
  // Filter by schedule and add translations
  return banners
    .filter(banner => banner.shouldBeActive())
    .map(banner => ({
      ...banner.toJSON(),
      ...banner.getTranslatedContent(language)
    }));
};

Banner.checkAndDeactivateExpired = async function() {
  const expiredBanners = await Banner.findAll({
    where: {
      isActive: true,
      autoDeactivate: true,
      endDate: {
        [require('sequelize').Op.lt]: new Date()
      }
    }
  });
  
  for (const banner of expiredBanners) {
    await banner.update({ isActive: false });
  }
  
  return expiredBanners.length;
};

// ✅ Assotsiatsiya
Banner.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

module.exports = Banner;
