// models/Category.js
const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Unique indeks avtomatik yaratiladi
  },
  image: {
    type: DataTypes.STRING, // Kategoriya rasmi (icon)
    defaultValue: `/uploads/default_category_image.webp`,
    allowNull: true, // Agar default qiymat bo'lsa, null bo'lishi mumkin
  },
  description: {
    type: DataTypes.TEXT, // Uzunroq matnlar uchun TEXT
    allowNull: true,
  },
  // Ko'p tilni qo'llab-quvvatlash uchun tarjimalar
  translations: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Kategoriya tarjimalari: {"en": {"name": "Electronics", "description": "..."}, "uz": {"name": "Elektronika", "description": "..."}}'
  },
  // Kategoriya holati
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  // Kategoriya tartibi
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  // parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' } o'rniga parentCategoryId
  // Assotsiatsiya orqali bog'lanadi, Sequelize avtomatik ravishda foreign key qo'shadi.
}, {
  tableName: 'categories', // Jadval nomi
  timestamps: true, // `createdAt` va `updatedAt` maydonlari avtomatik qo'shiladi
  indexes: [
    {
      fields: ['name'], // Kategoriya nomi bo'yicha tez qidirish uchun indeks
    },
    {
      fields: ['parentCategoryId'], // Ichki kategoriyalar uchun indeks
      where: {
        parentCategoryId: { // NULL bo'lmagan qiymatlar uchun indeks (PostgreSQL)
          [Op.ne]: null
        }
      }
    },
    {
      fields: ['isActive'], // Faol kategoriyalar uchun indeks
    },
    {
      fields: ['sortOrder'], // Tartiblash uchun indeks
    }
  ],
});

// Ko'p tilni qo'llab-quvvatlash metodlari
Category.prototype.getTranslatedContent = function(languageCode = 'uz') {
  const translations = this.translations || {};
  
  return {
    name: translations[languageCode]?.name || this.name,
    description: translations[languageCode]?.description || this.description
  };
};

Category.prototype.setTranslation = async function(languageCode, translationData) {
  const translations = { ...this.translations };
  translations[languageCode] = {
    ...translations[languageCode],
    ...translationData
  };
  
  await this.update({ translations });
  return translations[languageCode];
};

Category.prototype.getAvailableLanguages = function() {
  const translations = this.translations || {};
  const languages = Object.keys(translations);
  
  // Always include default language if category has content
  if (this.name && !languages.includes('uz')) {
    languages.unshift('uz');
  }
  
  return languages;
};

Category.prototype.getFullTranslatedData = function(languageCode = 'uz') {
  const categoryData = this.toJSON();
  const translatedContent = this.getTranslatedContent(languageCode);
  
  return {
    ...categoryData,
    ...translatedContent,
    currentLanguage: languageCode,
    availableLanguages: this.getAvailableLanguages()
  };
};

// Static methods
Category.getActiveCategories = async function(languageCode = 'uz', options = {}) {
  const { includeParent = true, sortBy = 'sortOrder', sortOrder = 'ASC' } = options;
  
  const queryOptions = {
    where: { isActive: true },
    order: [[sortBy, sortOrder], ['createdAt', 'DESC']]
  };
  
  if (includeParent) {
    queryOptions.include = [{
      model: Category,
      as: 'parentCategory',
      attributes: ['id', 'name', 'translations']
    }];
  }
  
  const categories = await Category.findAll(queryOptions);
  
  return categories.map(category => category.getFullTranslatedData(languageCode));
};

Category.searchByName = async function(searchTerm, languageCode = 'uz', options = {}) {
  const { limit = 20, offset = 0 } = options;
  const { Op } = require('sequelize');
  
  const categories = await Category.findAndCountAll({
    where: {
      isActive: true,
      [Op.or]: [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } },
        // Search in translations
        {
          translations: {
            [languageCode]: {
              name: { [Op.iLike]: `%${searchTerm}%` }
            }
          }
        },
        {
          translations: {
            [languageCode]: {
              description: { [Op.iLike]: `%${searchTerm}%` }
            }
          }
        }
      ]
    },
    limit,
    offset,
    order: [['sortOrder', 'ASC'], ['name', 'ASC']]
  });
  
  return {
    categories: categories.rows.map(category => category.getFullTranslatedData(languageCode)),
    total: categories.count,
    pagination: {
      limit,
      offset,
      totalPages: Math.ceil(categories.count / limit)
    }
  };
};

Category.getCategoryTree = async function(languageCode = 'uz') {
  const categories = await Category.findAll({
    where: { isActive: true },
    order: [['sortOrder', 'ASC'], ['name', 'ASC']]
  });
  
  const categoryMap = new Map();
  const rootCategories = [];
  
  // Create category map with translations
  categories.forEach(category => {
    const translatedCategory = category.getFullTranslatedData(languageCode);
    translatedCategory.children = [];
    categoryMap.set(category.id, translatedCategory);
  });
  
  // Build tree structure
  categories.forEach(category => {
    const translatedCategory = categoryMap.get(category.id);
    
    if (category.parentCategoryId) {
      const parent = categoryMap.get(category.parentCategoryId);
      if (parent) {
        parent.children.push(translatedCategory);
      }
    } else {
      rootCategories.push(translatedCategory);
    }
  });
  
  return rootCategories;
};

// Assotsiatsiyalar (Bu yerda ham, lekin asosan models/index.js da belgilash tavsiya etiladi)
// Category.hasMany(Category, {
//   as: 'subCategories',
//   foreignKey: 'parentCategoryId',
// });

// Category.belongsTo(Category, {
//   as: 'parentCategory',
//   foreignKey: 'parentCategoryId',
// });

module.exports = Category;