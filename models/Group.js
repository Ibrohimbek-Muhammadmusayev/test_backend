const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Group = sequelize.define('Group', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'groups', // FK mos bo'lishi uchun
  timestamps: true
});

module.exports = Group;
