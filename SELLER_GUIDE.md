# 🛍️ Seller Panel - To'liq Qo'llanma

> **Market App Seller Panel** - Professional E-commerce Platform sotuvchilar uchun
> **Version:** 3.0 (Enhanced with Real Currency Rates & Multi-language Support)
> **Base URL:** `http://localhost:5000/api`

---

## 📋 Mundarija

1. [🚀 Kirish va Ro'yxatdan O'tish](#kirish-va-royxatdan-otish)
2. [📊 Seller Dashboard](#seller-dashboard)
3. [🛍️ Mahsulotlar Boshqaruvi](#mahsulotlar-boshqaruvi)
4. [🌐 Ko'p Tilni Qo'llab-quvvatlash](#kop-tilni-qollab-quvvatlash)
5. [📦 Buyurtmalar Boshqaruvi](#buyurtmalar-boshqaruvi)
6. [👤 Profil Boshqaruvi](#profil-boshqaruvi)
7. [📈 Tahlil va Hisobotlar](#tahlil-va-hisobotlar)
8. [💰 Moliyaviy Ma'lumotlar](#moliyaviy-malumotlar)
9. [🔔 Bildirishnomalar](#bildirishnomalar)
10. [⚙️ Sozlamalar](#sozlamalar)
11. [📱 Mobil Qo'llab-quvvatlash](#mobil-qollab-quvvatlash)
12. [🆘 Yordam va Qo'llab-quvvatlash](#yordam-va-qollab-quvvatlash)

---

## 🚀 Kirish va Ro'yxatdan O'tish

### Seller Sifatida Kirish
```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "998901234567",
  "password": "seller_password"
}
```

**Javob:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "fullName": "John Seller",
    "phoneNumber": "998901234567",
    "status": "seller",
    "preferredLanguage": "uz",
    "preferredCurrency": "UZS",
    "sellerInfo": {
      "shopName": "John's Electronics",
      "shopDescription": "Quality electronics store",
      "shopAddress": "Toshkent, O'zbekiston",
      "sellerRating": 4.5,
      "numSoldProducts": 150
    }
  }
}
```

### Seller Bo'lish Uchun Ariza
Oddiy user seller bo'lish uchun admin bilan bog'lanishi kerak yoki admin tomonidan tayinlanishi kerak.

---

## 📊 Seller Dashboard

### Asosiy Dashboard Ma'lumotlari
```http
GET /api/seller/dashboard
Authorization: Bearer {seller_token}
```

**Javob:**
```json
{
  "overview": {
    "totalProducts": 45,
    "activeProducts": 42,
    "totalOrders": 156,
    "pendingOrders": 8,
    "completedOrders": 148,
    "totalRevenue": 15670000,
    "thisMonthRevenue": 2340000,
    "averageRating": 4.5,
    "totalReviews": 89
  },
  "recentOrders": [
    {
      "id": 123,
      "customerName": "Ali Valiyev",
      "productName": "iPhone 15",
      "quantity": 1,
      "amount": 12000000,
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "topProducts": [
    {
      "id": 45,
      "name": "Samsung Galaxy S24",
      "soldCount": 25,
      "revenue": 7500000,
      "rating": 4.8
    }
  ],
  "salesChart": {
    "labels": ["Yan", "Fev", "Mar", "Apr", "May"],
    "data": [1200000, 1500000, 1800000, 2000000, 2340000]
  }
}
```

### Sotuv Tahlili
```http
GET /api/seller/analytics/sales?period=30
Authorization: Bearer {seller_token}
```

### Mahsulot Tahlili
```http
GET /api/seller/analytics/products?period=30
Authorization: Bearer {seller_token}
```

---

## 🛍️ Mahsulotlar Boshqaruvi

### Barcha Mahsulotlarni Olish
```http
GET /api/seller/products?page=1&limit=20&status=active
Authorization: Bearer {seller_token}
```

**Query Parametrlari:**
- `page`: Sahifa raqami (default: 1)
- `limit`: Sahifadagi elementlar soni (default: 20)
- `status`: active, inactive, pending
- `search`: Mahsulot nomi bo'yicha qidirish
- `category`: Kategoriya ID si

### Yangi Mahsulot Yaratish
```http
POST /api/seller/products
Authorization: Bearer {seller_token}
Content-Type: multipart/form-data

{
  "name": "iPhone 15 Pro Max",
  "description": "Apple kompaniyasining eng so'nggi smartfoni",
  "shortDescription": "Premium flagman telefon",
  "brand": "Apple",
  "category": 5,
  "tags": ["smartphone", "premium", "5G"],
  "variants": [
    {
      "price": 12000000,
      "discountPrice": 11500000,
      "countInStock": 10,
      "size": "256GB",
      "color": "Natural Titanium",
      "sku": "IPH15PM-256-NT",
      "weight": "221g",
      "dimensions": "159.9×76.7×8.25mm"
    },
    {
      "price": 14000000,
      "discountPrice": 13500000,
      "countInStock": 5,
      "size": "512GB", 
      "color": "Natural Titanium",
      "sku": "IPH15PM-512-NT"
    }
  ],
  "images": [file1, file2, file3, file4, file5]
}
```

### Mahsulotni Yangilash
```http
PUT /api/seller/products/123
Authorization: Bearer {seller_token}
Content-Type: multipart/form-data

{
  "name": "iPhone 15 Pro Max (Updated)",
  "description": "Yangilangan tavsif",
  "variants": [
    {
      "id": 456,
      "price": 11800000,
      "countInStock": 15
    }
  ]
}
```

### Mahsulotni O'chirish
```http
DELETE /api/seller/products/123
Authorization: Bearer {seller_token}
```

### Mahsulot Statusini O'zgartirish
```http
PATCH /api/seller/products/123/toggle-status
Authorization: Bearer {seller_token}
```

---

## 🌐 Ko'p Tilni Qo'llab-quvvatlash

### Mahsulot Tarjimalarini Ko'rish
```http
GET /api/seller/products/123/translations
Authorization: Bearer {seller_token}
```

**Javob:**
```json
{
  "translations": {
    "en": {
      "name": "iPhone 15 Pro Max",
      "description": "Latest Apple smartphone with advanced features",
      "shortDescription": "Premium flagship phone"
    },
    "ru": {
      "name": "iPhone 15 Pro Max",
      "description": "Новейший смартфон Apple с передовыми функциями",
      "shortDescription": "Премиум флагманский телефон"
    }
  },
  "availableLanguages": ["uz", "en", "ru"]
}
```

### Yangi Tarjima Qo'shish
```http
POST /api/seller/products/123/translations
Authorization: Bearer {seller_token}
Content-Type: application/json

{
  "language": "en",
  "name": "iPhone 15 Pro Max",
  "description": "Latest Apple smartphone with advanced camera system, A17 Pro chip, and titanium design",
  "shortDescription": "Premium flagship smartphone"
}
```

### Tarjimani Yangilash
```http
POST /api/seller/products/123/translations
Authorization: Bearer {seller_token}
Content-Type: application/json

{
  "language": "ru",
  "name": "iPhone 15 Pro Max",
  "description": "Обновленное описание на русском языке",
  "shortDescription": "Премиум смартфон"
}
```

### Tarjimani O'chirish
```http
DELETE /api/seller/products/123/translations/en
Authorization: Bearer {seller_token}
```

### Ko'p Tilda Mahsulot Yaratish
```http
POST /api/seller/products
Authorization: Bearer {seller_token}
Content-Type: multipart/form-data

{
  "name": "Samsung Galaxy S24 Ultra",
  "description": "Samsung kompaniyasining flagman smartfoni",
  "shortDescription": "Professional kamera bilan",
  "brand": "Samsung",
  "category": 5,
  "translations": {
    "en": {
      "name": "Samsung Galaxy S24 Ultra",
      "description": "Samsung's flagship smartphone with professional camera",
      "shortDescription": "Professional camera smartphone"
    },
    "ru": {
      "name": "Samsung Galaxy S24 Ultra", 
      "description": "Флагманский смартфон Samsung с профессиональной камерой",
      "shortDescription": "Смартфон с профессиональной камерой"
    }
  },
  "variants": [...],
  "images": [...]
}
```

---

## 📦 Buyurtmalar Boshqaruvi

### Barcha Buyurtmalarni Olish
```http
GET /api/seller/orders?page=1&limit=20&status=pending
Authorization: Bearer {seller_token}
```

**Query Parametrlari:**
- `status`: pending, processing, shipped, delivered, cancelled
- `startDate`: Boshlanish sanasi (YYYY-MM-DD)
- `endDate`: Tugash sanasi (YYYY-MM-DD)
- `customer`: Mijoz nomi bo'yicha qidirish

### Bitta Buyurtmani Ko'rish
```http
GET /api/seller/orders/123
Authorization: Bearer {seller_token}
```

### Buyurtma Elementining Statusini Yangilash
```http
PATCH /api/seller/orders/123/items/456/status
Authorization: Bearer {seller_token}
Content-Type: application/json

{
  "status": "processing",
  "note": "Mahsulot tayyorlanmoqda"
}
```

### Buyurtma Statistikasi
```http
GET /api/seller/orders/statistics?period=30
Authorization: Bearer {seller_token}
```

---

## 👤 Profil Boshqaruvi

### Profil Ma'lumotlarini Olish
```http
GET /api/users/profile
Authorization: Bearer {seller_token}
```

### Profil Ma'lumotlarini Yangilash
```http
PUT /api/users/profile
Authorization: Bearer {seller_token}
Content-Type: multipart/form-data

{
  "fullName": "John Updated Seller",
  "phoneNumber": "998901234567",
  "preferredLanguage": "en",
  "preferredCurrency": "USD",
  "profileImage": file
}
```

### Seller Ma'lumotlarini Yangilash
```http
PUT /api/users/profile/seller-info
Authorization: Bearer {seller_token}
Content-Type: application/json

{
  "shopName": "John's Premium Electronics",
  "shopDescription": "We sell high-quality electronics with warranty",
  "shopAddress": "Toshkent shahar, Yunusobod tumani, Abdulla Qodiriy ko'chasi 1-uy"
}
```

### Parolni O'zgartirish
```http
PUT /api/users/profile/password
Authorization: Bearer {seller_token}
Content-Type: application/json

{
  "oldPassword": "current_password",
  "newPassword": "new_secure_password"
}
```

---

## 📈 Tahlil va Hisobotlar

### Sotuv Tahlili
```http
GET /api/seller/analytics/sales?period=30&groupBy=daily
Authorization: Bearer {seller_token}
```

**Query Parametrlari:**
- `period`: 7, 30, 90, 365 (kunlar)
- `groupBy`: daily, weekly, monthly

### Mahsulot Performance
```http
GET /api/seller/analytics/products?period=30&sortBy=revenue
Authorization: Bearer {seller_token}
```

### Mijozlar Tahlili
```http
GET /api/seller/analytics/customers?period=30
Authorization: Bearer {seller_token}
```

---

## 💰 Moliyaviy Ma'lumotlar

### 🌍 Real Valyuta Kurslari

Market App **real valyuta kurslari** bilan ishlaydi:

- **🔄 Har 30 daqiqada** avtomatik yangilanish
- **📡 Real API manbalar** (exchangerate-api.com, fixer.io)
- **💱 Avtomatik konvertatsiya** - mahsulot narxlari real kurslar bilan ko'rsatiladi
- **📊 Kurs tarixi** - valyuta o'zgarishlarini kuzatish

#### Qo'llab-quvvatlanadigan Valyutalar
```javascript
USD - US Dollar ($)
UZS - Uzbek Som (so'm)
RUB - Russian Ruble (₽)
EUR - Euro (€)
GBP - British Pound (£)
JPY - Japanese Yen (¥)
CNY - Chinese Yuan (¥)
KRW - South Korean Won (₩)
TRY - Turkish Lira (₺)
```

### 💱 Mahsulot Narxlari va Konvertatsiya

Mahsulot yaratganda narx avtomatik barcha valyutalarda ko'rsatiladi:

```json
{
  "price": 100.00,
  "currency": "USD",
  "convertedPrices": {
    "UZS": 1230000,    // Real kurs
    "RUB": 9250,       // Real kurs
    "EUR": 85.50,      // Real kurs
    "GBP": 73.20       // Real kurs
  },
  "lastUpdated": "2024-01-27T10:30:00.000Z"
}
```

### Daromad Hisoboti
```http
GET /api/seller/financial/revenue?period=30
Authorization: Bearer {seller_token}
```

**Javob:**
```json
{
  "totalRevenue": 15670000,
  "netRevenue": 14603100,
  "platformCommission": 1066900,
  "commissionRate": 6.8,
  "currency": "UZS",
  "breakdown": {
    "productSales": 15670000,
    "shipping": 0,
    "taxes": 0,
    "refunds": 0
  },
  "paymentStatus": "pending",
  "nextPaymentDate": "2024-02-01"
}
```

### To'lov Tarixi
```http
GET /api/seller/financial/payments?page=1&limit=20
Authorization: Bearer {seller_token}
```

### Komissiya Ma'lumotlari
```http
GET /api/seller/financial/commission
Authorization: Bearer {seller_token}
```

---

## 🔔 Bildirishnomalar

### Bildirishnomalarni Olish
```http
GET /api/notifications?page=1&limit=20&type=order
Authorization: Bearer {seller_token}
```

### Bildirishnomani O'qilgan Deb Belgilash
```http
PUT /api/notifications/123/read
Authorization: Bearer {seller_token}
```

---

## ⚙️ Sozlamalar

### Til Sozlamasini O'zgartirish
```http
PUT /api/users/profile/language
Authorization: Bearer {seller_token}
Content-Type: application/json

{
  "language": "en"
}
```

### Valyuta Sozlamasini O'zgartirish
```http
PUT /api/users/profile/currency
Authorization: Bearer {seller_token}
Content-Type: application/json

{
  "currency": "USD"
}
```

### Bildirishnoma Sozlamalari
```http
PUT /api/users/profile/settings
Authorization: Bearer {seller_token}
Content-Type: application/json

{
  "settings": {
    "notifications": {
      "email": true,
      "push": true,
      "sms": false,
      "orderUpdates": true,
      "promotions": false
    },
    "privacy": {
      "showProfile": true,
      "showActivity": false
    }
  }
}
```

---

## 📱 Mobil Qo'llab-quvvatlash

### Mobil API Endpoints
Barcha API endpoints mobil ilovalar uchun ham ishlatilishi mumkin. Qo'shimcha headers:

```http
User-Agent: MarketApp-Mobile/1.0 (iOS/Android)
X-Platform: mobile
X-App-Version: 1.0.0
```

### Push Bildirishnomalar
```http
POST /api/seller/push-token
Authorization: Bearer {seller_token}
Content-Type: application/json

{
  "token": "firebase_push_token",
  "platform": "ios" // yoki "android"
}
```

---

## 🔧 Muhim Maslahatlar

### Mahsulot Yaratish
1. **Sifatli rasmlar:** Kamida 3-5 ta yuqori sifatli rasm yuklang
2. **To'liq tavsif:** Mahsulot haqida batafsil ma'lumot bering
3. **To'g'ri kategoriya:** Mahsulotni to'g'ri kategoriyaga joylashtiring
4. **Narx strategiyasi:** Bozor narxlarini tahlil qiling
5. **Stok nazorati:** Mahsulot miqdorini muntazam yangilang

### Ko'p Til Qo'llab-quvvatlash
1. **Asosiy til:** Mahsulotni birinchi navbatda o'z tilingizda yarating
2. **Tarjimalar:** Eng ko'p ishlatiladigan tillarga tarjima qiling
3. **Sifat nazorati:** Tarjimalar to'g'ri va tushunarli ekanligini tekshiring
4. **Yangilanishlar:** Asosiy ma'lumot o'zgarganda tarjimalarni ham yangilang

### Buyurtmalar
1. **Tez javob:** Buyurtmalarga tezda javob bering
2. **Status yangilash:** Buyurtma holatini muntazam yangilang
3. **Mijoz bilan aloqa:** Kerak bo'lganda mijoz bilan bog'laning
4. **Sifat nazorati:** Yuborishdan oldin mahsulotni tekshiring

---

## 🆘 Yordam va Qo'llab-quvvatlash

### Texnik Yordam
- **Email:** seller-support@marketapp.uz
- **Telefon:** +998 90 123 45 68
- **Telegram:** @marketapp_seller_support
- **Ish vaqti:** 9:00 - 18:00 (Dushanba-Juma)

### Seller Markazi
- **Treninglar:** Onlayn va offline treninglar
- **Webinarlar:** Haftalik webinarlar
- **Seller Hamjamiyati:** Telegram guruh: @marketapp_sellers

### Foydali Resurslar
- **Seller Qo'llanmasi:** Bu fayl
- **Video Darslar:** YouTube kanali
- **FAQ:** Tez-tez so'raladigan savollar
- **Blog:** Seller uchun maslahatlar

### Moliyaviy Yordam
- **To'lov masalalari:** finance@marketapp.uz
- **Komissiya haqida:** Telefon orqali murojaat
- **Hisobot masalalari:** Seller panelida yordam bo'limi

---

## 📊 Muvaffaqiyat Ko'rsatkichlari

### Yaxshi Seller Bo'lish Uchun
1. **Mahsulot sifati:** 4.5+ reyting
2. **Tez yetkazib berish:** 24-48 soat ichida
3. **Mijoz xizmati:** Tez javob berish
4. **To'liq ma'lumot:** Batafsil mahsulot tavsiflari
5. **Muntazam yangilanish:** Yangi mahsulotlar qo'shish

### Daromadni Oshirish
1. **SEO optimizatsiya:** To'g'ri kalit so'zlar
2. **Chegirmalar:** Vaqti-vaqti bilan aksiyalar
3. **Cross-selling:** Qo'shimcha mahsulotlar taklif qilish
4. **Mijoz fikrlari:** Ijobiy sharhlar olish
5. **Brending:** O'z brendingizni rivojlantiring

---

**© 2024 Market App - Professional E-commerce Platform**  
**Seller Success Team bilan birga!** 🚀