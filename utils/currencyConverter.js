const axios = require('axios');
const { Currency } = require('../models');

class CurrencyConverter {
  constructor() {
    this.apiKey = process.env.EXCHANGE_API_KEY; // exchangerate-api.com dan API key
    this.baseUrl = 'https://api.exchangerate-api.com/v4/latest';
    this.fallbackUrl = 'https://api.fixer.io/latest'; // Backup API
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 soat cache
  }

  /**
   * Real valyuta kurslarini API dan olish
   */
  async fetchRealRates(baseCurrency = 'USD') {
    try {
      const cacheKey = `rates_${baseCurrency}`;
      const cached = this.cache.get(cacheKey);
      
      // Cache tekshirish
      if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
        return cached.rates;
      }

      // Primary API dan olishga harakat
      let response;
      try {
        response = await axios.get(`${this.baseUrl}/${baseCurrency}`, {
          timeout: 5000
        });
      } catch (error) {
        // Fallback API ishlatish
        console.log('Primary API failed, using fallback...');
        response = await axios.get(`${this.fallbackUrl}?base=${baseCurrency}`, {
          timeout: 5000,
          params: this.apiKey ? { access_key: this.apiKey } : {}
        });
      }

      const rates = response.data.rates;
      
      // Cache ga saqlash
      this.cache.set(cacheKey, {
        rates,
        timestamp: Date.now()
      });

      return rates;
    } catch (error) {
      console.error('Failed to fetch real exchange rates:', error.message);
      
      // Fallback: database dan oxirgi ma'lum kurslarni olish
      return await this.getFallbackRates();
    }
  }

  /**
   * Database dan fallback kurslarni olish
   */
  async getFallbackRates() {
    try {
      const currencies = await Currency.findAll({
        where: { isActive: true }
      });

      const rates = {};
      currencies.forEach(currency => {
        rates[currency.code] = parseFloat(currency.rate);
      });

      return rates;
    } catch (error) {
      console.error('Failed to get fallback rates:', error.message);
      
      // Hard-coded fallback rates (oxirgi chora)
      return {
        USD: 1,
        UZS: 12300,
        RUB: 92,
        EUR: 0.85,
        GBP: 0.73
      };
    }
  }

  /**
   * Database dagi kurslarni real kurslar bilan yangilash
   */
  async updateDatabaseRates() {
    try {
      const realRates = await this.fetchRealRates('USD');
      
      for (const [currencyCode, rate] of Object.entries(realRates)) {
        await Currency.upsert({
          code: currencyCode,
          rate: rate,
          name: this.getCurrencyName(currencyCode),
          symbol: this.getCurrencySymbol(currencyCode),
          isActive: true
        });
      }

      console.log('✅ Currency rates updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update currency rates:', error.message);
      return false;
    }
  }

  /**
   * Pul miqdorini bir valyutadan boshqasiga o'tkazish
   */
  async convert(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) {
        return parseFloat(amount);
      }

      const rates = await this.fetchRealRates('USD');
      
      // USD ga o'tkazish
      const usdAmount = fromCurrency === 'USD' 
        ? amount 
        : amount / rates[fromCurrency];
      
      // Maqsadli valyutaga o'tkazish
      const convertedAmount = toCurrency === 'USD' 
        ? usdAmount 
        : usdAmount * rates[toCurrency];

      return parseFloat(convertedAmount.toFixed(8));
    } catch (error) {
      console.error('Currency conversion failed:', error.message);
      return amount; // Xatolik bo'lsa, asl miqdorni qaytarish
    }
  }

  /**
   * Bir nechta valyutaga o'tkazish
   */
  async convertToMultiple(amount, fromCurrency, toCurrencies) {
    const results = {};
    
    for (const toCurrency of toCurrencies) {
      results[toCurrency] = await this.convert(amount, fromCurrency, toCurrency);
    }
    
    return results;
  }

  /**
   * Valyuta nomini olish
   */
  getCurrencyName(code) {
    const names = {
      USD: 'US Dollar',
      UZS: 'Uzbek Som',
      RUB: 'Russian Ruble',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      CNY: 'Chinese Yuan',
      KRW: 'South Korean Won',
      TRY: 'Turkish Lira'
    };
    return names[code] || code;
  }

  /**
   * Valyuta belgisini olish
   */
  getCurrencySymbol(code) {
    const symbols = {
      USD: '$',
      UZS: 'so\'m',
      RUB: '₽',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      KRW: '₩',
      TRY: '₺'
    };
    return symbols[code] || code;
  }

  /**
   * Formatlangan narxni qaytarish
   */
  async formatPrice(amount, currency) {
    try {
      const currencyData = await Currency.findByPk(currency);
      
      if (!currencyData) {
        return `${amount} ${currency}`;
      }

      const formattedAmount = parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: currencyData.decimalPlaces,
        maximumFractionDigits: currencyData.decimalPlaces
      });

      return currencyData.position === 'before' 
        ? `${currencyData.symbol}${formattedAmount}`
        : `${formattedAmount} ${currencyData.symbol}`;
    } catch (error) {
      return `${amount} ${currency}`;
    }
  }
}

// Singleton instance
const currencyConverter = new CurrencyConverter();

// Har 30 daqiqada kurslarni yangilash
setInterval(async () => {
  await currencyConverter.updateDatabaseRates();
}, 30 * 60 * 1000); // 30 daqiqa

module.exports = currencyConverter;