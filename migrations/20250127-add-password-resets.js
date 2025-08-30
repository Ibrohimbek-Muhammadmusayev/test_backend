'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('password_resets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Telefon raqami'
      },
      resetCode: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'SMS orqali yuborilgan tasdiqlash kodi'
      },
      isUsed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Kod ishlatilganmi'
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Kodning amal qilish muddati'
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Noto\'g\'ri urinishlar soni'
      },
      maxAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        comment: 'Maksimal urinishlar soni'
      },
      isBlocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Kod bloklangan (ko\'p noto\'g\'ri urinish)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Indexlar qo'shish
    await queryInterface.addIndex('password_resets', ['phoneNumber'], {
      name: 'password_resets_phone_number_idx'
    });

    await queryInterface.addIndex('password_resets', ['resetCode'], {
      name: 'password_resets_reset_code_idx'
    });

    await queryInterface.addIndex('password_resets', ['expiresAt'], {
      name: 'password_resets_expires_at_idx'
    });

    await queryInterface.addIndex('password_resets', ['phoneNumber', 'isUsed'], {
      name: 'password_resets_phone_used_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('password_resets');
  }
};