// utils/smsService.js
const axios = require('axios');

class SMSService {
  constructor() {
    // SMS xizmati sozlamalari
    this.config = {
      // Eskiz.uz SMS xizmati (O'zbekiston uchun mashhur)
      eskiz: {
        baseUrl: 'https://notify.eskiz.uz/api',
        login: process.env.ESKIZ_LOGIN || 'your-login',
        password: process.env.ESKIZ_PASSWORD || 'your-password',
        token: null,
        tokenExpiry: null
      },
      // Playmobile SMS xizmati
      playmobile: {
        baseUrl: 'https://send.smsxabar.uz/broker-api',
        login: process.env.PLAYMOBILE_LOGIN || 'your-login',
        password: process.env.PLAYMOBILE_PASSWORD || 'your-password'
      },
      // Test rejimi
      testMode: process.env.SMS_TEST_MODE === 'true' || true
    };

    // Multi-language message templates
    this.messageTemplates = {
      passwordReset: {
        uz: 'Market App: Parolingizni tiklash uchun kod: {code}. Kod 10 daqiqa davomida amal qiladi. Kodni hech kimga bermang!',
        ru: 'Market App: Код для восстановления пароля: {code}. Код действителен 10 минут. Никому не сообщайте код!',
        en: 'Market App: Password reset code: {code}. Code is valid for 10 minutes. Do not share the code with anyone!'
      },
      verification: {
        uz: 'Market App: Ro\'yxatdan o\'tishni tasdiqlash kodi: {code}. Kod 5 daqiqa davomida amal qiladi.',
        ru: 'Market App: Код подтверждения регистрации: {code}. Код действителен 5 минут.',
        en: 'Market App: Registration verification code: {code}. Code is valid for 5 minutes.'
      },
      orderStatus: {
        uz: {
          pending: 'Market App: {orderNumber} raqamli buyurtmangiz qabul qilindi. Tafsilotlar uchun ilovani oching.',
          confirmed: 'Market App: {orderNumber} raqamli buyurtmangiz tasdiqlandi. Tafsilotlar uchun ilovani oching.',
          processing: 'Market App: {orderNumber} raqamli buyurtmangiz tayyorlanmoqda. Tafsilotlar uchun ilovani oching.',
          shipped: 'Market App: {orderNumber} raqamli buyurtmangiz jo\'natildi. Tafsilotlar uchun ilovani oching.',
          delivered: 'Market App: {orderNumber} raqamli buyurtmangiz yetkazildi. Tafsilotlar uchun ilovani oching.',
          cancelled: 'Market App: {orderNumber} raqamli buyurtmangiz bekor qilindi. Tafsilotlar uchun ilovani oching.'
        },
        ru: {
          pending: 'Market App: Ваш заказ {orderNumber} принят. Откройте приложение для подробностей.',
          confirmed: 'Market App: Ваш заказ {orderNumber} подтвержден. Откройте приложение для подробностей.',
          processing: 'Market App: Ваш заказ {orderNumber} готовится. Откройте приложение для подробностей.',
          shipped: 'Market App: Ваш заказ {orderNumber} отправлен. Откройте приложение для подробностей.',
          delivered: 'Market App: Ваш заказ {orderNumber} доставлен. Откройте приложение для подробностей.',
          cancelled: 'Market App: Ваш заказ {orderNumber} отменен. Откройте приложение для подробностей.'
        },
        en: {
          pending: 'Market App: Your order {orderNumber} has been received. Open the app for details.',
          confirmed: 'Market App: Your order {orderNumber} has been confirmed. Open the app for details.',
          processing: 'Market App: Your order {orderNumber} is being prepared. Open the app for details.',
          shipped: 'Market App: Your order {orderNumber} has been shipped. Open the app for details.',
          delivered: 'Market App: Your order {orderNumber} has been delivered. Open the app for details.',
          cancelled: 'Market App: Your order {orderNumber} has been cancelled. Open the app for details.'
        }
      },
      welcome: {
        uz: 'Market App ga xush kelibsiz! Ro\'yxatdan o\'tganingiz uchun rahmat. Endi xarid qilishni boshlashingiz mumkin.',
        ru: 'Добро пожаловать в Market App! Спасибо за регистрацию. Теперь вы можете начать покупки.',
        en: 'Welcome to Market App! Thank you for registering. You can now start shopping.'
      },
      orderPayment: {
        uz: 'Market App: {orderNumber} raqamli buyurtmangiz uchun to\'lov muvaffaqiyatli amalga oshirildi. Summa: {amount}',
        ru: 'Market App: Оплата за заказ {orderNumber} успешно выполнена. Сумма: {amount}',
        en: 'Market App: Payment for order {orderNumber} has been successfully processed. Amount: {amount}'
      }
    };
  }

  // Get message template in user's preferred language
  getMessageTemplate(templateType, language = 'uz', subType = null) {
    const templates = this.messageTemplates[templateType];
    if (!templates) return null;

    if (subType) {
      return templates[language]?.[subType] || templates['uz']?.[subType] || templates['en']?.[subType];
    }

    return templates[language] || templates['uz'] || templates['en'];
  }

  // Replace placeholders in message template
  formatMessage(template, variables = {}) {
    let message = template;
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
    });
    return message;
  }

  // Tasdiqlash kodini generatsiya qilish
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 xonali kod
  }

  // Telefon raqamini formatlash
  formatPhoneNumber(phoneNumber) {
    // +998901234567 formatiga keltirish
    let formatted = phoneNumber.replace(/\D/g, ''); // Faqat raqamlar
    
    if (formatted.startsWith('998')) {
      formatted = '+' + formatted;
    } else if (formatted.startsWith('8')) {
      formatted = '+99' + formatted;
    } else if (formatted.length === 9) {
      formatted = '+998' + formatted;
    }
    
    return formatted;
  }

  // Eskiz.uz orqali token olish
  async getEskizToken() {
    try {
      if (this.config.eskiz.token && this.config.eskiz.tokenExpiry > Date.now()) {
        return this.config.eskiz.token;
      }

      const response = await axios.post(`${this.config.eskiz.baseUrl}/auth/login`, {
        login: this.config.eskiz.login,
        password: this.config.eskiz.password
      });

      if (response.data && response.data.data && response.data.data.token) {
        this.config.eskiz.token = response.data.data.token;
        this.config.eskiz.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 soat
        return this.config.eskiz.token;
      }

      throw new Error('Token olinmadi');
    } catch (error) {
      console.error('Eskiz token olishda xatolik:', error.message);
      throw new Error('SMS xizmati bilan bog\'lanishda xatolik');
    }
  }

  // Eskiz.uz orqali SMS yuborish
  async sendSMSViaEskiz(phoneNumber, message) {
    try {
      const token = await this.getEskizToken();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await axios.post(
        `${this.config.eskiz.baseUrl}/message/sms/send`,
        {
          mobile_phone: formattedPhone,
          message: message,
          from: '4546' // Eskiz.uz default sender
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data?.data?.id || null,
        provider: 'eskiz'
      };
    } catch (error) {
      console.error('Eskiz SMS yuborishda xatolik:', error.message);
      throw error;
    }
  }

  // Playmobile orqali SMS yuborish
  async sendSMSViaPlaymobile(phoneNumber, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await axios.post(
        `${this.config.playmobile.baseUrl}/send`,
        {
          messages: [
            {
              recipient: formattedPhone,
              'message-id': `msg_${Date.now()}`,
              sms: {
                originator: '3700',
                content: {
                  text: message
                }
              }
            }
          ]
        },
        {
          auth: {
            username: this.config.playmobile.login,
            password: this.config.playmobile.password
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.['message-id'] || null,
        provider: 'playmobile'
      };
    } catch (error) {
      console.error('Playmobile SMS yuborishda xatolik:', error.message);
      throw error;
    }
  }

  // Test rejimida SMS yuborish (console.log)
  async sendTestSMS(phoneNumber, message) {
    console.log('=== TEST SMS ===');
    console.log(`Telefon: ${phoneNumber}`);
    console.log(`Xabar: ${message}`);
    console.log('================');
    
    return {
      success: true,
      messageId: `test_${Date.now()}`,
      provider: 'test'
    };
  }

  // Asosiy SMS yuborish funksiyasi
  async sendSMS(phoneNumber, message, provider = 'auto') {
    try {
      // Test rejimida
      if (this.config.testMode) {
        return await this.sendTestSMS(phoneNumber, message);
      }

      // Provider tanlash
      if (provider === 'eskiz' || provider === 'auto') {
        try {
          return await this.sendSMSViaEskiz(phoneNumber, message);
        } catch (error) {
          if (provider === 'eskiz') throw error;
          // Auto rejimida eskiz ishlamasa, playmobile'ga o'tish
        }
      }

      if (provider === 'playmobile' || provider === 'auto') {
        return await this.sendSMSViaPlaymobile(phoneNumber, message);
      }

      throw new Error('Noma\'lum SMS provider');
    } catch (error) {
      console.error('SMS yuborishda xatolik:', error.message);
      throw new Error('SMS yuborilmadi. Keyinroq qayta urinib ko\'ring.');
    }
  }

  // Parolni tiklash uchun SMS yuborish (Multi-language support)
  async sendPasswordResetSMS(phoneNumber, resetCode, language = 'uz') {
    const template = this.getMessageTemplate('passwordReset', language);
    const message = this.formatMessage(template, { code: resetCode });
    return await this.sendSMS(phoneNumber, message);
  }

  // Ro'yxatdan o'tish tasdiqlash SMS (Multi-language support)
  async sendVerificationSMS(phoneNumber, verificationCode, language = 'uz') {
    const template = this.getMessageTemplate('verification', language);
    const message = this.formatMessage(template, { code: verificationCode });
    return await this.sendSMS(phoneNumber, message);
  }

  // Buyurtma holati haqida SMS (Multi-language support)
  async sendOrderStatusSMS(phoneNumber, orderNumber, status, language = 'uz') {
    const template = this.getMessageTemplate('orderStatus', language, status);
    const message = this.formatMessage(template, { orderNumber });
    return await this.sendSMS(phoneNumber, message);
  }

  // Xush kelibsiz SMS (Multi-language support)
  async sendWelcomeSMS(phoneNumber, language = 'uz') {
    const template = this.getMessageTemplate('welcome', language);
    return await this.sendSMS(phoneNumber, template);
  }

  // Buyurtma to'lovi haqida SMS (Multi-language support)
  async sendOrderPaymentSMS(phoneNumber, orderNumber, amount, language = 'uz') {
    const template = this.getMessageTemplate('orderPayment', language);
    const message = this.formatMessage(template, { orderNumber, amount });
    return await this.sendSMS(phoneNumber, message);
  }

  // User ning preferred language ni aniqlash
  getUserLanguage(user) {
    return user?.preferences?.language || 'uz';
  }

  // User bilan SMS yuborish (automatic language detection)
  async sendSMSToUser(user, templateType, variables = {}, subType = null) {
    if (!user || !user.phoneNumber) {
      throw new Error('User yoki telefon raqami topilmadi');
    }

    const language = this.getUserLanguage(user);
    const template = this.getMessageTemplate(templateType, language, subType);
    
    if (!template) {
      throw new Error(`Template topilmadi: ${templateType}`);
    }

    const message = this.formatMessage(template, variables);
    return await this.sendSMS(user.phoneNumber, message);
  }
}

// Singleton pattern
const smsService = new SMSService();
module.exports = smsService;