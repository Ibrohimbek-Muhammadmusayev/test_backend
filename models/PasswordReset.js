// models/PasswordReset.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class PasswordReset extends Model {}

PasswordReset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Telefon raqami'
    },
    resetCode: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'SMS orqali yuborilgan tasdiqlash kodi'
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Kod ishlatilganmi'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Kodning amal qilish muddati'
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Noto\'g\'ri urinishlar soni'
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      comment: 'Maksimal urinishlar soni'
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Kod bloklangan (ko\'p noto\'g\'ri urinish)'
    }
  },
  {
    sequelize,
    modelName: 'PasswordReset',
    tableName: 'password_resets',
    timestamps: true,
    indexes: [
      {
        fields: ['phoneNumber']
      },
      {
        fields: ['resetCode']
      },
      {
        fields: ['expiresAt']
      }
    ]
  }
);

module.exports = PasswordReset;