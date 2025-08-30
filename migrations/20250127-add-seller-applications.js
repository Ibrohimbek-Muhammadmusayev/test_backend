'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('seller_applications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      businessName: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Biznes nomi'
      },
      businessType: {
        type: Sequelize.ENUM('individual', 'company', 'entrepreneur'),
        allowNull: false,
        defaultValue: 'individual',
        comment: 'Biznes turi'
      },
      businessDescription: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Biznes haqida ma\'lumot'
      },
      businessAddress: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Biznes manzili'
      },
      contactInfo: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Aloqa ma\'lumotlari'
      },
      documents: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Hujjatlar'
      },
      bankDetails: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Bank rekvizitlari'
      },
      expectedProducts: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Sotmoqchi bo\'lgan mahsulotlar'
      },
      experience: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Savdo tajribasi'
      },
      monthlyVolume: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Oylik savdo hajmi'
      },
      status: {
        type: Sequelize.ENUM('pending', 'under_review', 'approved', 'rejected', 'additional_info_required'),
        defaultValue: 'pending',
        allowNull: false,
        comment: 'Ariza holati'
      },
      adminNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Admin izohlari'
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Rad etish sababi'
      },
      reviewedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Ko\'rib chiqgan admin ID'
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Ko\'rib chiqilgan vaqt'
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Tasdiqlangan vaqt'
      },
      contractSigned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Shartnoma imzolangan'
      },
      contractDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Shartnoma sanasi'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
        comment: 'Ariza muhimligi'
      },
      source: {
        type: Sequelize.ENUM('website', 'mobile_app', 'referral', 'advertisement', 'other'),
        defaultValue: 'website',
        comment: 'Ariza manbai'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indekslar qo'shish
    await queryInterface.addIndex('seller_applications', ['userId'], {
      name: 'seller_applications_user_id_idx'
    });

    await queryInterface.addIndex('seller_applications', ['status'], {
      name: 'seller_applications_status_idx'
    });

    await queryInterface.addIndex('seller_applications', ['businessType'], {
      name: 'seller_applications_business_type_idx'
    });

    await queryInterface.addIndex('seller_applications', ['priority'], {
      name: 'seller_applications_priority_idx'
    });

    await queryInterface.addIndex('seller_applications', ['createdAt'], {
      name: 'seller_applications_created_at_idx'
    });

    await queryInterface.addIndex('seller_applications', ['reviewedBy'], {
      name: 'seller_applications_reviewed_by_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Indekslarni o'chirish
    await queryInterface.removeIndex('seller_applications', 'seller_applications_user_id_idx');
    await queryInterface.removeIndex('seller_applications', 'seller_applications_status_idx');
    await queryInterface.removeIndex('seller_applications', 'seller_applications_business_type_idx');
    await queryInterface.removeIndex('seller_applications', 'seller_applications_priority_idx');
    await queryInterface.removeIndex('seller_applications', 'seller_applications_created_at_idx');
    await queryInterface.removeIndex('seller_applications', 'seller_applications_reviewed_by_idx');

    // Jadvalni o'chirish
    await queryInterface.dropTable('seller_applications');
  }
};