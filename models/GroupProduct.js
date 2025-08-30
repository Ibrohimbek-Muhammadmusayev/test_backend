const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GroupProduct = sequelize.define('GroupProduct', {
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'groups', // jadval nomi
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products', // jadval nomi
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'group_products',
  timestamps: false
});

module.exports = GroupProduct;
