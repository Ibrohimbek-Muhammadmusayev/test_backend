const { SellerApplication, User, Notification } = require('../models');
const { Op } = require('sequelize');

// Seller Application yaratish (User tomonidan)
const createSellerApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Foydalanuvchi allaqachon seller emasligini tekshirish
    const user = await User.findByPk(userId);
    if (user.status === 'seller') {
      return res.status(400).json({
        message: 'Siz allaqachon seller sifatida ro\'yxatdan o\'tgansiz'
      });
    }

    // Mavjud pending yoki under_review arizani tekshirish
    const existingApplication = await SellerApplication.findOne({
      where: {
        userId,
        status: ['pending', 'under_review', 'additional_info_required']
      }
    });

    if (existingApplication) {
      return res.status(400).json({
        message: 'Sizning arizangiz allaqachon ko\'rib chiqilmoqda',
        application: existingApplication
      });
    }

    const {
      businessName,
      businessType,
      businessDescription,
      businessAddress,
      contactInfo,
      documents,
      bankDetails,
      expectedProducts,
      experience,
      monthlyVolume,
      source
    } = req.body;

    // Ariza yaratish
    const application = await SellerApplication.create({
      userId,
      businessName,
      businessType,
      businessDescription,
      businessAddress,
      contactInfo,
      documents,
      bankDetails,
      expectedProducts,
      experience,
      monthlyVolume,
      source: source || 'website',
      status: 'pending'
    });

    // Adminlarga bildirishnoma yuborish
    const admins = await User.findAll({
      where: { status: 'admin' }
    });

    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        title: 'Yangi Seller Arizasi',
        message: `${user.fullName} seller bo'lish uchun ariza yubordi`,
        type: 'seller_application',
        data: {
          applicationId: application.id,
          applicantName: user.fullName,
          businessName: application.businessName
        }
      });
    }

    res.status(201).json({
      message: 'Seller arizangiz muvaffaqiyatli yuborildi',
      application: {
        id: application.id,
        status: application.status,
        businessName: application.businessName,
        createdAt: application.createdAt
      }
    });
  } catch (error) {
    console.error('Create seller application error:', error);
    res.status(500).json({
      message: 'Ariza yuborishda xatolik yuz berdi',
      error: error.message
    });
  }
};

// Foydalanuvchining arizasini ko'rish
const getMyApplication = async (req, res) => {
  try {
    const userId = req.user.id;

    const application = await SellerApplication.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'fullName'],
          required: false
        }
      ]
    });

    if (!application) {
      return res.status(404).json({
        message: 'Sizning arizangiz topilmadi'
      });
    }

    res.json({
      application
    });
  } catch (error) {
    console.error('Get my application error:', error);
    res.status(500).json({
      message: 'Arizani olishda xatolik yuz berdi',
      error: error.message
    });
  }
};

// Arizani yangilash (faqat pending yoki additional_info_required holatida)
const updateMyApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const application = await SellerApplication.findOne({
      where: {
        userId,
        status: ['pending', 'additional_info_required']
      }
    });

    if (!application) {
      return res.status(404).json({
        message: 'Yangilanadigan ariza topilmadi yoki ariza allaqachon ko\'rib chiqilgan'
      });
    }

    // Statusni pending ga qaytarish (agar additional_info_required bo'lsa)
    if (application.status === 'additional_info_required') {
      updateData.status = 'pending';
      updateData.adminNotes = null;
    }

    await application.update(updateData);

    res.json({
      message: 'Ariza muvaffaqiyatli yangilandi',
      application
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({
      message: 'Arizani yangilashda xatolik yuz berdi',
      error: error.message
    });
  }
};

// Admin: Barcha arizalarni olish
const getAllApplications = async (req, res) => {
  try {
    const {
      status,
      businessType,
      priority,
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Filterlar
    if (status) where.status = status;
    if (businessType) where.businessType = businessType;
    if (priority) where.priority = priority;

    // Qidiruv
    if (search) {
      where[Op.or] = [
        { businessName: { [Op.iLike]: `%${search}%` } },
        { businessDescription: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { rows: applications, count } = await SellerApplication.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'fullName', 'phoneNumber', 'profileImage']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'fullName'],
          required: false
        }
      ]
    });

    res.json({
      applications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({
      message: 'Arizalarni olishda xatolik yuz berdi',
      error: error.message
    });
  }
};

// Admin: Bitta arizani ko'rish
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await SellerApplication.findByPk(id, {
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'fullName', 'phoneNumber', 'profileImage', 'createdAt']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'fullName', 'phoneNumber'],
          required: false
        }
      ]
    });

    if (!application) {
      return res.status(404).json({
        message: 'Ariza topilmadi'
      });
    }

    res.json({ application });
  } catch (error) {
    console.error('Get application by id error:', error);
    res.status(500).json({
      message: 'Arizani olishda xatolik yuz berdi',
      error: error.message
    });
  }
};

// Admin: Arizani tasdiqlash
const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const application = await SellerApplication.findByPk(id, {
      include: [{ model: User, as: 'applicant' }]
    });

    if (!application) {
      return res.status(404).json({
        message: 'Ariza topilmadi'
      });
    }

    if (application.status !== 'pending' && application.status !== 'under_review') {
      return res.status(400).json({
        message: 'Bu arizani tasdiqlash mumkin emas'
      });
    }

    // Arizani tasdiqlash
    await application.approve(adminId, notes);

    // Foydalanuvchini seller qilish
    await User.update(
      { status: 'seller' },
      { where: { id: application.userId } }
    );

    // Foydalanuvchiga bildirishnoma yuborish
    await Notification.create({
      userId: application.userId,
      title: 'Seller Arizangiz Tasdiqlandi!',
      message: 'Tabriklaymiz! Endi siz bizning platformamizda mahsulot sotishingiz mumkin.',
      type: 'seller_approved',
      data: {
        applicationId: application.id
      }
    });

    res.json({
      message: 'Ariza muvaffaqiyatli tasdiqlandi',
      application
    });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({
      message: 'Arizani tasdiqlashda xatolik yuz berdi',
      error: error.message
    });
  }
};

// Admin: Arizani rad etish
const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({
        message: 'Rad etish sababi kiritilishi shart'
      });
    }

    const application = await SellerApplication.findByPk(id, {
      include: [{ model: User, as: 'applicant' }]
    });

    if (!application) {
      return res.status(404).json({
        message: 'Ariza topilmadi'
      });
    }

    // Arizani rad etish
    await application.reject(adminId, reason, notes);

    // Foydalanuvchiga bildirishnoma yuborish
    await Notification.create({
      userId: application.userId,
      title: 'Seller Arizangiz Rad Etildi',
      message: `Arizangiz quyidagi sabab bilan rad etildi: ${reason}`,
      type: 'seller_rejected',
      data: {
        applicationId: application.id,
        reason: reason
      }
    });

    res.json({
      message: 'Ariza rad etildi',
      application
    });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      message: 'Arizani rad etishda xatolik yuz berdi',
      error: error.message
    });
  }
};

// Admin: Qo'shimcha ma'lumot so'rash
const requestAdditionalInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    if (!notes) {
      return res.status(400).json({
        message: 'Qo\'shimcha ma\'lumot haqida izoh kiritilishi shart'
      });
    }

    const application = await SellerApplication.findByPk(id, {
      include: [{ model: User, as: 'applicant' }]
    });

    if (!application) {
      return res.status(404).json({
        message: 'Ariza topilmadi'
      });
    }

    // Qo'shimcha ma'lumot so'rash
    await application.requestAdditionalInfo(adminId, notes);

    // Foydalanuvchiga bildirishnoma yuborish
    await Notification.create({
      userId: application.userId,
      title: 'Qo\'shimcha Ma\'lumot Kerak',
      message: 'Seller arizangiz uchun qo\'shimcha ma\'lumot talab qilinadi.',
      type: 'additional_info_required',
      data: {
        applicationId: application.id,
        notes: notes
      }
    });

    res.json({
      message: 'Qo\'shimcha ma\'lumot so\'raldi',
      application
    });
  } catch (error) {
    console.error('Request additional info error:', error);
    res.status(500).json({
      message: 'Qo\'shimcha ma\'lumot so\'rashda xatolik yuz berdi',
      error: error.message
    });
  }
};

// Admin: Ariza prioritetini o'zgartirish
const updateApplicationPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        message: 'Noto\'g\'ri prioritet qiymati'
      });
    }

    const application = await SellerApplication.findByPk(id);
    if (!application) {
      return res.status(404).json({
        message: 'Ariza topilmadi'
      });
    }

    await application.update({ priority });

    res.json({
      message: 'Prioritet yangilandi',
      application
    });
  } catch (error) {
    console.error('Update priority error:', error);
    res.status(500).json({
      message: 'Prioritetni yangilashda xatolik yuz berdi',
      error: error.message
    });
  }
};

// Admin: Statistika
const getApplicationStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      SellerApplication.count({ where: { status: 'pending' } }),
      SellerApplication.count({ where: { status: 'under_review' } }),
      SellerApplication.count({ where: { status: 'approved' } }),
      SellerApplication.count({ where: { status: 'rejected' } }),
      SellerApplication.count({ where: { status: 'additional_info_required' } }),
      SellerApplication.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Son 30 kun
          }
        }
      })
    ]);

    res.json({
      stats: {
        pending: stats[0],
        underReview: stats[1],
        approved: stats[2],
        rejected: stats[3],
        additionalInfoRequired: stats[4],
        last30Days: stats[5],
        total: stats[0] + stats[1] + stats[2] + stats[3] + stats[4]
      }
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      message: 'Statistikani olishda xatolik yuz berdi',
      error: error.message
    });
  }
};

module.exports = {
  createSellerApplication,
  getMyApplication,
  updateMyApplication,
  getAllApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  requestAdditionalInfo,
  updateApplicationPriority,
  getApplicationStats
};