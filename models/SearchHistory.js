// models/SearchHistory.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SearchHistory = sequelize.define('SearchHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  query: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('product', 'category', 'all'),
    allowNull: false,
  },
}, {
  tableName: 'search_histories',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['query'] },
  ],
});

module.exports = SearchHistory;
