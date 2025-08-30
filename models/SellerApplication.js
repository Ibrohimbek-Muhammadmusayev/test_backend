const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SellerApplication = sequelize.define('SellerApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Biznes nomi'
  },
  businessType: {
    type: DataTypes.ENUM('individual', 'company', 'entrepreneur'),
    allowNull: false,
    defaultValue: 'individual',
    comment: 'Biznes turi: individual - jismoniy shaxs, company - yuridik shaxs, entrepreneur - tadbirkor'
  },
  businessDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Biznes haqida ma\'lumot'
  },
  businessAddress: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Biznes manzili: {region, district, street, house, apartment}'
  },
  contactInfo: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Aloqa ma\'lumotlari: {phone, website, socialMedia}'
  },
  documents: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Hujjatlar: {passport, license, certificate, taxCertificate}'
  },
  bankDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Bank rekvizitlari: {bankName, accountNumber, inn, mfo}'
  },
  expectedProducts: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Sotmoqchi bo\'lgan mahsulotlar kategoriyalari va miqdori'
  },
  experience: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Savdo tajribasi'
  },
  monthlyVolume: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    comment: 'Oylik savdo hajmi (taxminiy)'
  },
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected', 'additional_info_required'),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Ariza holati'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin izohlari'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Rad etish sababi'
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Arizani ko\'rib chiqgan admin ID'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Ko\'rib chiqilgan vaqt'
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Tasdiqlangan vaqt'
  },
  contractSigned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Shartnoma imzolangan'
  },
  contractDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Shartnoma sanasi'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
    comment: 'Ariza muhimligi'
  },
  source: {
    type: DataTypes.ENUM('website', 'mobile_app', 'referral', 'advertisement', 'other'),
    defaultValue: 'website',
    comment: 'Ariza manbai'
  }
}, {
  tableName: 'seller_applications',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['businessType']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Instance methods
SellerApplication.prototype.approve = async function(adminId, notes = null) {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.approvedAt = new Date();
  this.adminNotes = notes;
  return await this.save();
};

SellerApplication.prototype.reject = async function(adminId, reason, notes = null) {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  this.adminNotes = notes;
  return await this.save();
};

SellerApplication.prototype.requestAdditionalInfo = async function(adminId, notes) {
  this.status = 'additional_info_required';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.adminNotes = notes;
  return await this.save();
};

SellerApplication.prototype.markContractSigned = async function() {
  this.contractSigned = true;
  this.contractDate = new Date();
  return await this.save();
};

// Static methods
SellerApplication.getPendingCount = async function() {
  return await this.count({
    where: { status: 'pending' }
  });
};

SellerApplication.getByStatus = async function(status, limit = 50, offset = 0) {
  return await this.findAndCountAll({
    where: { status },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        association: 'applicant',
        attributes: ['id', 'fullName', 'phoneNumber', 'profileImage']
      },
      {
        association: 'reviewer',
        attributes: ['id', 'fullName', 'phoneNumber'],
        required: false
      }
    ]
  });
};

module.exports = SellerApplication;