'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Products jadvaliga translations maydoni qo'shish
    await queryInterface.addColumn('products', 'translations', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {},
      comment: 'Mahsulot tarjimalari: {"en": {"name": "Product", "description": "..."}, "uz": {"name": "Mahsulot", "description": "..."}}'
    });

    // Categories jadvaliga yangi maydonlar qo'shish
    await queryInterface.addColumn('categories', 'translations', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {},
      comment: 'Kategoriya tarjimalari: {"en": {"name": "Electronics", "description": "..."}, "uz": {"name": "Elektronika", "description": "..."}}'
    });

    await queryInterface.addColumn('categories', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });

    await queryInterface.addColumn('categories', 'sortOrder', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Products jadvaliga qo'shimcha maydonlar
    await queryInterface.addColumn('products', 'shortDescription', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'brand', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'tags', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    // Indekslar qo'shish
    await queryInterface.addIndex('categories', ['isActive'], {
      name: 'categories_is_active_idx'
    });

    await queryInterface.addIndex('categories', ['sortOrder'], {
      name: 'categories_sort_order_idx'
    });

    await queryInterface.addIndex('products', ['brand'], {
      name: 'products_brand_idx'
    });

    // Users jadvaliga til va valyuta sozlamalari qo'shish
    await queryInterface.addColumn('users', 'preferredLanguage', {
      type: Sequelize.STRING,
      defaultValue: 'uz',
      allowNull: false,
      comment: 'Foydalanuvchining afzal ko\'rgan tili (uz, en, ru, va h.k.)'
    });

    await queryInterface.addColumn('users', 'preferredCurrency', {
      type: Sequelize.STRING,
      defaultValue: 'UZS',
      allowNull: false,
      comment: 'Foydalanuvchining afzal ko\'rgan valyutasi (UZS, USD, EUR, va h.k.)'
    });

    await queryInterface.addColumn('users', 'settings', {
      type: Sequelize.JSON,
      defaultValue: {
        notifications: {
          push: true,
          sms: false
        },
        privacy: {
          showProfile: true,
          showActivity: false
        }
      },
      allowNull: true,
      comment: 'Foydalanuvchi sozlamalari (bildirishnomalar, maxfiylik, va h.k.)'
    });

    // Users uchun indekslar
    await queryInterface.addIndex('users', ['preferredLanguage'], {
      name: 'users_preferred_language_idx'
    });

    await queryInterface.addIndex('users', ['preferredCurrency'], {
      name: 'users_preferred_currency_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Indekslarni o'chirish
    await queryInterface.removeIndex('categories', 'categories_is_active_idx');
    await queryInterface.removeIndex('categories', 'categories_sort_order_idx');
    await queryInterface.removeIndex('products', 'products_brand_idx');
    await queryInterface.removeIndex('users', 'users_preferred_language_idx');
    await queryInterface.removeIndex('users', 'users_preferred_currency_idx');

    // Maydonlarni o'chirish
    await queryInterface.removeColumn('products', 'translations');
    await queryInterface.removeColumn('products', 'shortDescription');
    await queryInterface.removeColumn('products', 'brand');
    await queryInterface.removeColumn('products', 'tags');
    
    await queryInterface.removeColumn('categories', 'translations');
    await queryInterface.removeColumn('categories', 'isActive');
    await queryInterface.removeColumn('categories', 'sortOrder');

    await queryInterface.removeColumn('users', 'preferredLanguage');
    await queryInterface.removeColumn('users', 'preferredCurrency');
    await queryInterface.removeColumn('users', 'settings');
  }
};