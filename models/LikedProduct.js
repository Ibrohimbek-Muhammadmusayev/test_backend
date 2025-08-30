const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LikedProduct = sequelize.define('LikedProduct', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'liked_products',
  timestamps: false
});

module.exports = LikedProduct;
