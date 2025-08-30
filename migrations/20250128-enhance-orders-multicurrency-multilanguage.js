'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add multi-currency support to orders
    await queryInterface.addColumn('orders', 'currency', {
      type: Sequelize.STRING(3),
      defaultValue: 'UZS',
      allowNull: false,
      references: {
        model: 'currencies',
        key: 'code'
      },
      comment: 'Order currency code'
    });

    await queryInterface.addColumn('orders', 'exchangeRate', {
      type: Sequelize.DECIMAL(10, 6),
      defaultValue: 1.0,
      allowNull: false,
      comment: 'Exchange rate at the time of order'
    });

    await queryInterface.addColumn('orders', 'baseCurrencyTotalPrice', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment: 'Total price in base currency (UZS)'
    });

    // Add multi-language support to orders
    await queryInterface.addColumn('orders', 'language', {
      type: Sequelize.STRING(5),
      defaultValue: 'uz',
      allowNull: false,
      references: {
        model: 'languages',
        key: 'code'
      },
      comment: 'Order language'
    });

    // Update orderStatus to use ENUM
    await queryInterface.changeColumn('orders', 'orderStatus', {
      type: Sequelize.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Order status'
    });

    // Add order notes and translations
    await queryInterface.addColumn('orders', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Order notes'
    });

    await queryInterface.addColumn('orders', 'translations', {
      type: Sequelize.JSON,
      defaultValue: {},
      allowNull: true,
      comment: 'Order status translations and notes in different languages'
    });

    // Add tracking information
    await queryInterface.addColumn('orders', 'trackingNumber', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Shipping tracking number'
    });

    await queryInterface.addColumn('orders', 'estimatedDelivery', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Estimated delivery date'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('orders', ['currency'], {
      name: 'orders_currency_idx'
    });

    await queryInterface.addIndex('orders', ['language'], {
      name: 'orders_language_idx'
    });

    await queryInterface.addIndex('orders', ['orderStatus'], {
      name: 'orders_status_idx'
    });

    await queryInterface.addIndex('orders', ['trackingNumber'], {
      name: 'orders_tracking_number_idx'
    });

    // Update existing orders with default values
    await queryInterface.sequelize.query(`
      UPDATE orders 
      SET 
        "baseCurrencyTotalPrice" = "totalPrice",
        "currency" = 'UZS',
        "language" = 'uz',
        "exchangeRate" = 1.0
      WHERE "baseCurrencyTotalPrice" = 0 OR "baseCurrencyTotalPrice" IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('orders', 'orders_currency_idx');
    await queryInterface.removeIndex('orders', 'orders_language_idx');
    await queryInterface.removeIndex('orders', 'orders_status_idx');
    await queryInterface.removeIndex('orders', 'orders_tracking_number_idx');

    // Remove columns
    await queryInterface.removeColumn('orders', 'currency');
    await queryInterface.removeColumn('orders', 'exchangeRate');
    await queryInterface.removeColumn('orders', 'baseCurrencyTotalPrice');
    await queryInterface.removeColumn('orders', 'language');
    await queryInterface.removeColumn('orders', 'notes');
    await queryInterface.removeColumn('orders', 'translations');
    await queryInterface.removeColumn('orders', 'trackingNumber');
    await queryInterface.removeColumn('orders', 'estimatedDelivery');

    // Revert orderStatus to STRING
    await queryInterface.changeColumn('orders', 'orderStatus', {
      type: Sequelize.STRING,
      defaultValue: 'pending'
    });
  }
};