'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('currencies', 'displayOrder', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Set default display order for existing currencies
    await queryInterface.sequelize.query(`
      UPDATE currencies 
      SET "displayOrder" = CASE 
        WHEN code = 'UZS' THEN 1
        WHEN code = 'USD' THEN 2
        WHEN code = 'EUR' THEN 3
        WHEN code = 'RUB' THEN 4
        ELSE 999
      END
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('currencies', 'displayOrder');
  }
};