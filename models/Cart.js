// models/Cart.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
// Product va User modellarini bu yerda import qilish shart emas, chunki assotsiatsiyalar models/index.js da belgilanadi.

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true } o'rniga userId
  // userId ustuni assotsiatsiya orqali avtomatik yaratiladi
  // unique: true xususiyati ham assotsiatsiyada yoki shu yerda alohida indeks sifatida belgilanadi.
}, {
  tableName: 'carts', // Jadval nomi
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId'], // Har bir user uchun bitta savat bo'lishini ta'minlaydi
    },
  ],
});

module.exports = Cart;