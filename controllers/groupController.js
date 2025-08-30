const Group = require('../models/Group');
const Product = require('../models/Product');
const Variant = require('../models/ProductVariant');
const Category = require('../models/Category');
const User = require('../models/User');
const { Op } = require("sequelize");

// ✅ umumiy product include (variant, category, seller bilan)
const productInclude = {
  model: Product,
  as: 'groupProducts',
  attributes: [
    'id',
    'name',
    'description',
    'images',
    'rating',
    'numReviews',
    'likes',
    'likedBy',
    'isFeatured',
    'isSeasonal',
    'isBestSeller',
    'createdAt',
    'updatedAt',
    'userId',
    'categoryId',
    'groupId'
  ],
  through: { attributes: [] },
  include: [
    {
      model: Variant,
      as: 'variants',
      attributes: ['size', 'color', 'price', 'discountPrice', 'countInStock']
    },
    {
      model: Category,
      as: 'category',
      attributes: ['id', 'name']
    },
    {
      model: User,
      as: 'seller',
      attributes: ['id', 'fullName', 'profileImage']
    }
  ]
};

// ✅ Barcha grouplarni olish (GET /groups)
// ✅ Barcha grouplarni olish (GET /groups)
const getGroups = async (req, res) => {
  try {
    // Querydan page, limit va searchni olish
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";

    const offset = (page - 1) * limit;

    // 🔎 Search filter
    const where = search
      ? {
          [Op.or]: [
            // { name: { [Op.like]: `%${search}%` } },
            { title: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    // 📊 Ma'lumotlarni olish
    const { rows: groups, count } = await Group.findAndCountAll({
      where,
      include: [productInclude],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      distinct: true, // JOIN bo‘lsa ham total to‘g‘ri chiqishi uchun
    });

    res.json({
      success: true,
      data: groups,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ID bo‘yicha Group + mahsulotlari
const getGroupWithProducts = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id, {
      include: [productInclude]
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group with products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Group yaratish
const createGroup = async (req, res) => {
  try {
    const { title, productIds } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Group title is required' });
    }

    const group = await Group.create({ title });

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      const existingProducts = await Product.findAll({ where: { id: productIds } });
      const existingProductIds = existingProducts.map(p => p.id);
      const invalidIds = productIds.filter(id => !existingProductIds.includes(id));

      if (invalidIds.length > 0) {
        return res.status(400).json({
          message: 'Some product IDs are invalid',
          invalidIds
        });
      }

      await group.setGroupProducts(existingProductIds);
    }

    const groupWithProducts = await Group.findByPk(group.id, {
      include: [productInclude]
    });

    res.status(201).json(groupWithProducts);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Groupni o‘zgartirish
const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, productIds } = req.body;

    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (title) {
      group.title = title;
      await group.save();
    }

    if (productIds && Array.isArray(productIds)) {
      const existingProducts = await Product.findAll({ where: { id: productIds } });
      const existingProductIds = existingProducts.map(p => p.id);
      const invalidIds = productIds.filter(id => !existingProductIds.includes(id));

      if (invalidIds.length > 0) {
        return res.status(400).json({
          message: 'Some product IDs are invalid',
          invalidIds
        });
      }

      await group.setGroupProducts(existingProductIds);
    }

    const updatedGroup = await Group.findByPk(id, {
      include: [productInclude]
    });

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Groupni o‘chirish
const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    await group.destroy();

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getGroups,
  getGroupWithProducts,
  createGroup,
  updateGroup,
  deleteGroup
};
