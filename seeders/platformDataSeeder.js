const { PlatformSettings, Currency, Language } = require('../models');

const seedPlatformData = async () => {
  try {
    console.log('🌱 Seeding platform data...');

    // 1. Create default platform settings
    const existingSettings = await PlatformSettings.findOne();
    if (!existingSettings) {
      await PlatformSettings.create({
        siteName: 'Market App',
        siteDescription: 'Professional E-commerce Platform for Uzbekistan',
        siteLogo: '/uploads/logo/default-logo.png',
        siteFavicon: '/uploads/logo/favicon.ico',
        platformCommission: 5.00,
        minOrderAmount: 10000.00, // 10,000 UZS
        maxOrderAmount: 50000000.00, // 50,000,000 UZS
        freeShippingThreshold: 100000.00, // 100,000 UZS
        defaultCurrency: 'UZS',
        defaultLanguage: 'uz',
        maintenanceMode: false,
        registrationEnabled: true,
        guestCheckoutEnabled: true,
        reviewsEnabled: true,
        wishlistEnabled: true,
        maxFileSize: 5242880, // 5MB
        allowedFileTypes: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        maxImagesPerProduct: 10,
        contactInfo: {
          phone: '+998901234567',
          address: 'Toshkent, O\'zbekiston',
          workingHours: '9:00 - 18:00'
        },
        socialMedia: {
          facebook: 'https://facebook.com/marketapp',
          instagram: 'https://instagram.com/marketapp',
          twitter: 'https://twitter.com/marketapp',
          telegram: 'https://t.me/marketapp',
          youtube: 'https://youtube.com/marketapp'
        },
        metaTitle: 'Market App - Professional E-commerce Platform',
        metaDescription: 'Professional e-commerce platform for online shopping in Uzbekistan',
        metaKeywords: 'e-commerce, online shopping, marketplace, uzbekistan',
        features: {
          multiVendor: true,
          subscriptions: false,
          digitalProducts: false,
          affiliateProgram: false,
          loyaltyProgram: false,
          coupons: true,
          flashSales: true,
          productComparison: true,
          productRecommendations: true
        }
      });
      console.log('✅ Default platform settings created');
    }

    // 2. Create default currencies
    const currencies = [
      {
        code: 'UZS',
        name: 'O\'zbek so\'mi',
        symbol: 'so\'m',
        rate: 1.0,
        isDefault: true,
        isActive: true,
        position: 'after',
        decimalPlaces: 0,
        thousandsSeparator: ' ',
        decimalSeparator: ','
      },
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        rate: 0.000082,
        isDefault: false,
        isActive: true,
        position: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.'
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        rate: 0.000076,
        isDefault: false,
        isActive: true,
        position: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.'
      },
      {
        code: 'RUB',
        name: 'Russian Ruble',
        symbol: '₽',
        rate: 0.0076,
        isDefault: false,
        isActive: true,
        position: 'after',
        decimalPlaces: 2,
        thousandsSeparator: ' ',
        decimalSeparator: ','
      }
    ];

    for (const currencyData of currencies) {
      const existingCurrency = await Currency.findByPk(currencyData.code);
      if (!existingCurrency) {
        await Currency.create(currencyData);
        console.log(`✅ Currency ${currencyData.code} created`);
      }
    }

    // 3. Create default languages
    const languages = [
      {
        code: 'uz',
        name: 'O\'zbekcha',
        nativeName: 'O\'zbekcha',
        flag: '🇺🇿',
        isDefault: true,
        isActive: true,
        direction: 'ltr',
        translations: {
          // Common translations
          'welcome': 'Xush kelibsiz',
          'home': 'Bosh sahifa',
          'products': 'Mahsulotlar',
          'categories': 'Kategoriyalar',
          'cart': 'Savatcha',
          'checkout': 'To\'lov',
          'login': 'Kirish',
          'register': 'Ro\'yxatdan o\'tish',
          'logout': 'Chiqish',
          'profile': 'Profil',
          'orders': 'Buyurtmalar',
          'search': 'Qidirish',
          'add_to_cart': 'Savatchaga qo\'shish',
          'buy_now': 'Hozir sotib olish',
          'price': 'Narx',
          'quantity': 'Miqdor',
          'total': 'Jami',
          'shipping': 'Yetkazib berish',
          'payment': 'To\'lov',
          'contact': 'Aloqa',
          'about': 'Biz haqimizda',
          'terms': 'Foydalanish shartlari',
          'privacy': 'Maxfiylik siyosati',
          'loading': 'Yuklanmoqda...',
          'error': 'Xatolik',
          'success': 'Muvaffaqiyat',
          'cancel': 'Bekor qilish',
          'save': 'Saqlash',
          'edit': 'Tahrirlash',
          'delete': 'O\'chirish',
          'confirm': 'Tasdiqlash',
          'yes': 'Ha',
          'no': 'Yo\'q'
        }
      },
      {
        code: 'ru',
        name: 'Русский',
        nativeName: 'Русский',
        flag: '🇷🇺',
        isDefault: false,
        isActive: true,
        direction: 'ltr',
        translations: {
          'welcome': 'Добро пожаловать',
          'home': 'Главная',
          'products': 'Товары',
          'categories': 'Категории',
          'cart': 'Корзина',
          'checkout': 'Оформление заказа',
          'login': 'Войти',
          'register': 'Регистрация',
          'logout': 'Выйти',
          'profile': 'Профиль',
          'orders': 'Заказы',
          'search': 'Поиск',
          'add_to_cart': 'В корзину',
          'buy_now': 'Купить сейчас',
          'price': 'Цена',
          'quantity': 'Количество',
          'total': 'Итого',
          'shipping': 'Доставка',
          'payment': 'Оплата',
          'contact': 'Контакты',
          'about': 'О нас',
          'terms': 'Условия использования',
          'privacy': 'Политика конфиденциальности',
          'loading': 'Загрузка...',
          'error': 'Ошибка',
          'success': 'Успех',
          'cancel': 'Отмена',
          'save': 'Сохранить',
          'edit': 'Редактировать',
          'delete': 'Удалить',
          'confirm': 'Подтвердить',
          'yes': 'Да',
          'no': 'Нет'
        }
      },
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
        isDefault: false,
        isActive: true,
        direction: 'ltr',
        translations: {
          'welcome': 'Welcome',
          'home': 'Home',
          'products': 'Products',
          'categories': 'Categories',
          'cart': 'Cart',
          'checkout': 'Checkout',
          'login': 'Login',
          'register': 'Register',
          'logout': 'Logout',
          'profile': 'Profile',
          'orders': 'Orders',
          'search': 'Search',
          'add_to_cart': 'Add to Cart',
          'buy_now': 'Buy Now',
          'price': 'Price',
          'quantity': 'Quantity',
          'total': 'Total',
          'shipping': 'Shipping',
          'payment': 'Payment',
          'contact': 'Contact',
          'about': 'About Us',
          'terms': 'Terms of Service',
          'privacy': 'Privacy Policy',
          'loading': 'Loading...',
          'error': 'Error',
          'success': 'Success',
          'cancel': 'Cancel',
          'save': 'Save',
          'edit': 'Edit',
          'delete': 'Delete',
          'confirm': 'Confirm',
          'yes': 'Yes',
          'no': 'No'
        }
      }
    ];

    for (const languageData of languages) {
      const existingLanguage = await Language.findByPk(languageData.code);
      if (!existingLanguage) {
        await Language.create(languageData);
        console.log(`✅ Language ${languageData.code} created`);
      }
    }

    console.log('🎉 Platform data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding platform data:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  const { sequelize } = require('../models');
  
  sequelize.authenticate()
    .then(() => {
      console.log('📡 Database connected successfully');
      return seedPlatformData();
    })
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedPlatformData;