const express = require('express');
const { 
  getGroups, 
  getGroupWithProducts, 
} = require('../controllers/groupController');

const router = express.Router();

router.get('/', getGroups); // Barcha grouplarni olish
router.get('/:id', getGroupWithProducts); // Bitta groupni mahsulotlari bilan olish

module.exports = router;
