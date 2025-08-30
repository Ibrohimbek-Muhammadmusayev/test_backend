

# 👑 Admin Panel - To'liq Qo'llanma

> **Market App Admin Panel** - Professional E-commerce Platform boshqaruvi  
> **Version:** 3.0 (Enhanced with Multi-language & Multi-currency Support)  
> **Base URL:** `http://localhost:5000/api`  

---

## 📋 Mundarija

1. [🚀 Kirish va Autentifikatsiya](#kirish-va-autentifikatsiya)
2. [📊 Dashboard va Statistika](#dashboard-va-statistika)
3. [⚙️ Platform Sozlamalari](#platform-sozlamalari)
4. [💱 Valyuta Boshqaruvi](#valyuta-boshqaruvi)
5. [🌐 Til Boshqaruvi](#til-boshqaruvi)
6. [👥 Foydalanuvchilar Boshqaruvi](#foydalanuvchilar-boshqaruvi)
7. [🛍️ Mahsulotlar Boshqaruvi](#mahsulotlar-boshqaruvi)
8. [📂 Kategoriyalar Boshqaruvi](#kategoriyalar-boshqaruvi)
9. [📦 Buyurtmalar Boshqaruvi](#buyurtmalar-boshqaruvi)
10. [🏪 Seller Arizalari Boshqaruvi](#seller-arizalari-boshqaruvi)
11. [🔄 Bulk Operatsiyalar](#bulk-operatsiyalar)
12. [📤 Export Funksiyalari](#export-funksiyalari)
13. [📁 Fayl Boshqaruvi](#fayl-boshqaruvi)
14. [🌐 Ko'p Tilni Boshqarish](#kop-tilni-boshqarish)
15. [📈 Hisobotlar va Tahlil](#hisobotlar-va-tahlil)

---

## 🚀 Kirish va Autentifikatsiya

### Admin Kirish
```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "998901234567",
  "password": "admin_password"
}
```

**Javob:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "Admin User",
    "phoneNumber": "998901234567",
    "status": "admin",
    "preferredLanguage": "uz",
    "preferredCurrency": "UZS"
  }
}
```

### Token Yangilash
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📊 Dashboard va Statistika

### Asosiy Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer {admin_token}
```

**Javob:**
```json
{
  "overview": {
    "totalUsers": 1250,
    "totalSellers": 89,
    "totalProducts": 2340,
    "totalOrders": 5670,
    "totalRevenue": 234567890,
    "pendingOrders": 45,
    "completedOrders": 5625,
    "growth": {
      "users": 12.5,
      "orders": 8.3,
      "revenue": 15.7
    }
  },
  "recentUsers": [...],
  "recentOrders": [...],
  "topSellers": [...],
  "popularProducts": [...],
  "salesChart": {
    "labels": ["Yan", "Fev", "Mar", "Apr", "May"],
    "data": [120000, 150000, 180000, 200000, 250000]
  }
}
```

### Tahlil va Statistika
```http
GET /api/admin/analytics?period=30
Authorization: Bearer {admin_token}
```

### Tizim Statistikasi
```http
GET /api/admin/statistics
Authorization: Bearer {admin_token}
```

---

## ⚙️ Platform Sozlamalari

### Umumiy Sozlamalarni Olish
```http
GET /api/settings/admin
Authorization: Bearer {admin_token}
```

### Platform Sozlamalarini Yangilash
```http
PUT /api/settings/admin
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

{
  "siteName": "Market App",
  "siteDescription": "Professional E-commerce Platform",
  "platformCommission": 7.5,
  "minOrderAmount": 15000,
  "freeShippingThreshold": 150000,
  "defaultCurrency": "UZS",
  "defaultLanguage": "uz",
  "maintenanceMode": false,
  "registrationEnabled": true,
  "contactInfo": {
    "phone": "+998901234567",
    "email": "info@marketapp.uz",
    "address": "Toshkent, O'zbekiston",
    "workingHours": "9:00 - 18:00"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/marketapp",
    "instagram": "https://instagram.com/marketapp",
    "telegram": "https://t.me/marketapp"
  },
  "features": {
    "multiVendor": true,
    "coupons": true,
    "flashSales": true,
    "loyaltyProgram": false,
    "wishlist": true,
    "reviews": true,
    "chat": false
  }
}
```

---

## 💱 Valyuta Boshqaruvi

### 🌍 Real Valyuta Kurslari Tizimi

Market App **real valyuta kurslari** bilan ishlaydi va avtomatik yangilanadi:

- **🔄 Har 30 daqiqada** real API'lardan kurslar yangilanadi
- **📡 exchangerate-api.com** - asosiy API manba
- **🔄 fixer.io** - backup API manba
- **💾 1 soat cache** - tezlik va samaradorlik uchun
- **🛡️ Fallback tizimi** - API ishlamasa database'dagi oxirgi kurslar ishlatiladi

#### Real Kurslar Manbasi
```javascript
// Qo'llab-quvvatlanadigan API'lar:
- exchangerate-api.com (asosiy)
- fixer.io (backup)
- Fallback: database kurslar
- Hard-coded: oxirgi chora
```

### Barcha Valyutalarni Olish
```http
GET /api/settings/admin/currencies
Authorization: Bearer {admin_token}
```

**Javob:**
```json
{
  "currencies": [
    {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$",
      "rate": 1.0,
      "isDefault": false,
      "position": "before",
      "decimalPlaces": 2,
      "isActive": true,
      "lastUpdated": "2024-01-27T10:30:00.000Z",
      "source": "exchangerate-api"
    },
    {
      "code": "UZS",
      "name": "Uzbek Som",
      "symbol": "so'm",
      "rate": 12300.0,
      "isDefault": true,
      "position": "after",
      "decimalPlaces": 0,
      "isActive": true,
      "lastUpdated": "2024-01-27T10:30:00.000Z",
      "source": "exchangerate-api"
    }
  ]
}
```

### 🔄 Valyuta Kurslarini Qo'lda Yangilash
```http
POST /api/settings/admin/currencies/update-rates
Authorization: Bearer {admin_token}
```

**Javob:**
```json
{
  "message": "Currency rates updated successfully",
  "updatedCurrencies": 9,
  "source": "exchangerate-api",
  "timestamp": "2024-01-27T10:30:00.000Z",
  "rates": {
    "USD": 1.0,
    "UZS": 12300.0,
    "RUB": 92.5,
    "EUR": 0.85,
    "GBP": 0.73
  }
}
```

### Yangi Valyuta Qo'shish
```http
POST /api/settings/admin/currencies
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "code": "EUR",
  "name": "Euro",
  "symbol": "€",
  "rate": 0.85,
  "isDefault": false,
  "position": "before",
  "decimalPlaces": 2,
  "isActive": true,
  "autoUpdate": true
}
```

### Valyutani Yangilash
```http
PUT /api/settings/admin/currencies/EUR
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "rate": 0.87,
  "isActive": true,
  "name": "Euro (Updated)",
  "autoUpdate": true
}
```

### 📊 Valyuta Kurslar Tarixi
```http
GET /api/settings/admin/currencies/EUR/history?days=30
Authorization: Bearer {admin_token}
```

**Javob:**
```json
{
  "currency": "EUR",
  "period": "30 days",
  "history": [
    {
      "date": "2024-01-27",
      "rate": 0.87,
      "source": "exchangerate-api"
    },
    {
      "date": "2024-01-26",
      "rate": 0.85,
      "source": "exchangerate-api"
    }
  ],
  "statistics": {
    "highest": 0.89,
    "lowest": 0.83,
    "average": 0.86,
    "volatility": 2.3
  }
}
```

### 🔧 Valyuta Sozlamalari
```http
PUT /api/settings/admin/currencies/settings
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "autoUpdateInterval": 30,
  "primaryApiSource": "exchangerate-api",
  "backupApiSource": "fixer",
  "cacheTimeout": 3600,
  "enableFallback": true,
  "apiKey": "your_api_key_here"
}
```

### Valyutani O'chirish
```http
DELETE /api/settings/admin/currencies/EUR
Authorization: Bearer {admin_token}
```

### 📈 Real Konvertatsiya Misoli
```javascript
// Middleware avtomatik real kurslar bilan ishlaydi
req.currency.convert(100, 'USD', 'UZS') // Real API dan
// Natija: 1,230,000 UZS (real kurs bo'yicha)

req.currency.convertSync(100, 'USD', 'UZS') // Database dan
// Natija: 1,230,000 UZS (tez konvertatsiya)
```

---

## 🌐 Til Boshqaruvi

### Barcha Tillarni Olish
```http
GET /api/settings/admin/languages
Authorization: Bearer {admin_token}
```

### Yangi Til Qo'shish
```http
POST /api/settings/admin/languages
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "code": "fr",
  "name": "French",
  "nativeName": "Français",
  "flag": "🇫🇷",
  "isDefault": false,
  "direction": "ltr",
  "isActive": true,
  "translations": {
    "welcome": "Bienvenue",
    "home": "Accueil",
    "products": "Produits",
    "cart": "Panier",
    "login": "Connexion"
  }
}
```

### Tarjimalarni Yangilash
```http
PUT /api/settings/admin/translations/uz
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "translations": {
    "welcome": "Xush kelibsiz",
    "home": "Bosh sahifa",
    "products": "Mahsulotlar",
    "new_feature": "Yangi xususiyat"
  }
}
```

---

## 👥 Foydalanuvchilar Boshqaruvi

### Barcha Foydalanuvchilarni Olish
```http
GET /api/admin/users?status=user&page=1&limit=20
Authorization: Bearer {admin_token}
```

**Query Parametrlari:**
- `status`: user, seller, admin
- `name`: Ism bo'yicha qidirish
- `phone`: Telefon raqami bo'yicha qidirish
- `page`: Sahifa raqami
- `limit`: Sahifadagi elementlar soni

### Foydalanuvchini Bloklash/Blokdan Chiqarish
```http
PUT /api/admin/users/123/block
Authorization: Bearer {admin_token}
```

### Foydalanuvchini Sellerga Aylantirish
```http
PUT /api/admin/123/make-seller
Authorization: Bearer {admin_token}
```

### Foydalanuvchini O'chirish
```http
DELETE /api/admin/users/delete/123
Authorization: Bearer {admin_token}
```

---

## 🛍️ Mahsulotlar Boshqaruvi

### Barcha Mahsulotlarni Olish
```http
GET /api/admin/products?page=1&limit=20&category=electronics
Authorization: Bearer {admin_token}
```

### Mahsulot Yaratish
```http
POST /api/admin/products
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

{
  "name": "iPhone 15 Pro Max",
  "description": "Latest Apple smartphone",
  "shortDescription": "Premium flagship phone",
  "brand": "Apple",
  "category": 5,
  "tags": ["smartphone", "premium", "5G"],
  "variants": [
    {
      "price": 1200,
      "discountPrice": 1100,
      "countInStock": 50,
      "size": "256GB",
      "color": "Natural Titanium"
    }
  ],
  "translations": {
    "uz": {
      "name": "iPhone 15 Pro Max",
      "description": "Apple kompaniyasining eng so'nggi smartfoni",
      "shortDescription": "Premium flagman telefon"
    }
  },
  "images": [file1, file2, file3]
}
```

### Mahsulot Tarjimalarini Boshqarish
```http
# Tarjimalarni olish
GET /api/admin/products/123/translations
Authorization: Bearer {admin_token}

# Tarjima qo'shish
POST /api/admin/products/123/translations
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "language": "ru",
  "name": "iPhone 15 Pro Max",
  "description": "Новейший смартфон Apple",
  "shortDescription": "Премиум флагманский телефон"
}

# Tarjimani o'chirish
DELETE /api/admin/products/123/translations/ru
Authorization: Bearer {admin_token}
```

---

## 📂 Kategoriyalar Boshqaruvi

### Barcha Kategoriyalarni Olish
```http
GET /api/admin/categories
Authorization: Bearer {admin_token}
```

### Kategoriya Yaratish
```http
POST /api/admin/categories
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

{
  "name": "Electronics",
  "description": "All electronic devices",
  "parentCategory": null,
  "sortOrder": 1,
  "translations": {
    "uz": {
      "name": "Elektronika",
      "description": "Barcha elektron qurilmalar"
    },
    "ru": {
      "name": "Электроника", 
      "description": "Все электронные устройства"
    }
  },
  "image": file
}
```

### Kategoriya Tarjimalarini Boshqarish
```http
# Tarjimalarni olish
GET /api/admin/categories/5/translations
Authorization: Bearer {admin_token}

# Tarjima qo'shish
POST /api/admin/categories/5/translations
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "language": "en",
  "name": "Electronics",
  "description": "All types of electronic devices"
}

# Tarjimani o'chirish
DELETE /api/admin/categories/5/translations/en
Authorization: Bearer {admin_token}
```

---

## 📦 Buyurtmalar Boshqaruvi

### Barcha Buyurtmalarni Olish
```http
GET /api/admin/orders?status=pending&page=1&limit=20
Authorization: Bearer {admin_token}
```

### Buyurtma Statusini Yangilash
```http
PUT /api/admin/orders/123/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "shipped"
}
```

### Buyurtma Status Statistikasi
```http
GET /api/admin/orders/status/stats?period=30
---

## 🏪 Seller Arizalari Boshqaruvi

### 📋 Seller Application Tizimi

Foydalanuvchilar seller bo'lish uchun ariza yuborishlari kerak. Admin bu arizalarni ko'rib chiqib, tasdiqlashi yoki rad etishi mumkin.

#### Ariza Statuslari:
- **pending** - Kutilmoqda (yangi ariza)
- **under_review** - Ko'rib chiqilmoqda
- **approved** - Tasdiqlangan
- **rejected** - Rad etilgan
- **additional_info_required** - Qo'shimcha ma'lumot kerak

### Barcha Arizalarni Olish
```http
GET /api/seller-applications/admin/all?status=pending&page=1&limit=20
Authorization: Bearer {admin_token}
```

**Query Parametrlari:**
- `status`: pending, under_review, approved, rejected, additional_info_required
- `businessType`: individual, company, entrepreneur
- `priority`: low, medium, high, urgent
- `page`: Sahifa raqami
- `limit`: Sahifadagi arizalar soni
- `search`: Biznes nomi yoki tavsif bo'yicha qidirish
- `sortBy`: createdAt, businessName, status
- `sortOrder`: ASC, DESC

**Javob:**
```json
{
  "applications": [
    {
      "id": 1,
      "businessName": "Tech Solutions",
      "businessType": "company",
      "businessDescription": "IT xizmatlar va dasturiy ta'minot",
      "businessAddress": {
        "region": "Toshkent",
        "district": "Chilonzor",
        "street": "Bunyodkor ko'chasi",
        "house": "12",
        "apartment": "45"
      },
      "contactInfo": {
        "phone": "+998901234567",
        "email": "info@techsolutions.uz",
        "website": "https://techsolutions.uz"
      },
      "expectedProducts": [
        {
          "category": "Electronics",
          "monthlyQuantity": 100,
          "averagePrice": 500000
        }
      ],
      "monthlyVolume": 50000000,
      "status": "pending",
      "priority": "medium",
      "source": "website",
      "applicant": {
        "id": 123,
        "fullName": "Akmal Karimov",
        "phoneNumber": "+998901234567",
        "email": "akmal@example.com",
        "profileImage": "/uploads/profile/user123.jpg"
      },
      "createdAt": "2024-01-27T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

### Bitta Arizani Ko'rish
```http
GET /api/seller-applications/admin/123
Authorization: Bearer {admin_token}
```

**Javob:**
```json
{
  "application": {
    "id": 123,
    "businessName": "Tech Solutions",
    "businessType": "company",
    "businessDescription": "IT xizmatlar va dasturiy ta'minot ishlab chiqarish",
    "businessAddress": {
      "region": "Toshkent",
      "district": "Chilonzor", 
      "street": "Bunyodkor ko'chasi",
      "house": "12",
      "apartment": "45",
      "landmark": "Metro yaqinida"
    },
    "contactInfo": {
      "phone": "+998901234567",
      "email": "info@techsolutions.uz",
      "website": "https://techsolutions.uz",
      "socialMedia": {
        "telegram": "@techsolutions",
        "instagram": "@techsolutions_uz"
      }
    },
    "documents": {
      "passport": "/uploads/documents/passport123.pdf",
      "license": "/uploads/documents/license123.pdf",
      "certificate": "/uploads/documents/cert123.pdf"
    },
    "bankDetails": {
      "bankName": "Milliy Bank",
      "accountNumber": "20208000123456789",
      "inn": "123456789",
      "mfo": "00014"
    },
    "expectedProducts": [
      {
        "category": "Electronics",
        "subcategory": "Smartphones",
        "monthlyQuantity": 100,
        "averagePrice": 500000
      }
    ],
    "experience": "5 yillik IT sohasida tajriba",
    "monthlyVolume": 50000000,
    "status": "pending",
    "priority": "medium",
    "applicant": {
      "id": 456,
      "fullName": "Akmal Karimov",
      "phoneNumber": "+998901234567",
      "email": "akmal@example.com",
      "profileImage": "/uploads/profile/user456.jpg",
      "createdAt": "2023-06-15T10:00:00.000Z"
    },
    "createdAt": "2024-01-27T10:00:00.000Z"
  }
}
```

### Arizani Tasdiqlash
```http
PUT /api/seller-applications/admin/123/approve
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "notes": "Barcha hujjatlar to'g'ri. Seller sifatida tasdiqlandi."
}
```

**Javob:**
```json
{
  "message": "Ariza muvaffaqiyatli tasdiqlandi",
  "application": {
    "id": 123,
    "status": "approved",
    "reviewedBy": 1,
    "reviewedAt": "2024-01-27T12:00:00.000Z",
    "approvedAt": "2024-01-27T12:00:00.000Z",
    "adminNotes": "Barcha hujjatlar to'g'ri. Seller sifatida tasdiqlandi."
  }
}
```

### Arizani Rad Etish
```http
PUT /api/seller-applications/admin/123/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Hujjatlar to'liq emas",
  "notes": "Passport va litsenziya hujjatlari aniq emas. Qayta yuklang."
}
```

**Javob:**
```json
{
  "message": "Ariza rad etildi",
  "application": {
    "id": 123,
    "status": "rejected",
    "reviewedBy": 1,
    "reviewedAt": "2024-01-27T12:00:00.000Z",
    "rejectionReason": "Hujjatlar to'liq emas",
    "adminNotes": "Passport va litsenziya hujjatlari aniq emas. Qayta yuklang."
  }
}
```

### Qo'shimcha Ma'lumot So'rash
```http
PUT /api/seller-applications/admin/123/request-info
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "notes": "Bank rekvizitlari va oylik savdo hajmi haqida qo'shimcha ma'lumot kerak."
}
```

**Javob:**
```json
{
  "message": "Qo'shimcha ma'lumot so'raldi",
  "application": {
    "id": 123,
    "status": "additional_info_required",
    "reviewedBy": 1,
    "reviewedAt": "2024-01-27T12:00:00.000Z",
    "adminNotes": "Bank rekvizitlari va oylik savdo hajmi haqida qo'shimcha ma'lumot kerak."
  }
}
```

### Ariza Prioritetini O'zgartirish
```http
PUT /api/seller-applications/admin/123/priority
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "priority": "high"
}
```

**Javob:**
```json
{
  "message": "Prioritet yangilandi",
  "application": {
    "id": 123,
    "priority": "high"
  }
}
```

### Arizalar Statistikasi
```http
GET /api/seller-applications/admin/stats
Authorization: Bearer {admin_token}
```

**Javob:**
```json
{
  "stats": {
    "pending": 15,
    "underReview": 5,
    "approved": 45,
    "rejected": 12,
    "additionalInfoRequired": 3,
    "last30Days": 25,
    "total": 80
  }
}
```

### 🔔 Avtomatik Bildirishnomalar

Seller arizalari tizimi avtomatik bildirishnomalar yuboradi:

#### Adminlarga:
- **Yangi ariza** - Foydalanuvchi yangi ariza yubordi
- **Ariza yangilandi** - Foydalanuvchi arizasini yangiladi

#### Foydalanuvchilarga:
- **Ariza tasdiqlandi** - Seller sifatida tasdiqlandi
- **Ariza rad etildi** - Ariza rad etildi va sababi
- **Qo'shimcha ma'lumot kerak** - Admin qo'shimcha ma'lumot so'radi

### 📊 Ariza Jarayoni

1. **Foydalanuvchi ariza yuboradi** → Status: `pending`
2. **Admin ko'rib chiqadi** → Status: `under_review`
3. **Admin qaror qabul qiladi:**
   - ✅ **Tasdiqlash** → Status: `approved` + User status: `seller`
   - ❌ **Rad etish** → Status: `rejected`
   - ℹ️ **Qo'shimcha ma'lumot** → Status: `additional_info_required`
4. **Shartnoma imzolash** → `contractSigned: true`

### 🔧 Muhim Eslatmalar

- Ariza tasdiqlanganda foydalanuvchi avtomatik `seller` statusiga o'tadi
- Barcha arizalar va o'zgarishlar logga yoziladi
- Hujjatlar xavfsiz serverda saqlanadi
- Bildirishnomalar real vaqtda yuboriladi
Authorization: Bearer {admin_token}
```

---

## 🔄 Bulk Operatsiyalar

### Foydalanuvchilarni Bulk Boshqarish
```http
# Bulk o'chirish
DELETE /api/admin/users/bulk
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "ids": [1, 2, 3, 4, 5]
}

# Bulk status yangilash
PUT /api/admin/users/bulk/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "ids": [1, 2, 3],
  "status": "seller"
}
```

### Mahsulotlarni Bulk Boshqarish
```http
# Bulk status yangilash
PUT /api/admin/products/bulk/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "ids": [1, 2, 3, 4, 5],
  "status": "active"
}

# Bulk kategoriya yangilash
PUT /api/admin/products/bulk/category
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "ids": [1, 2, 3, 4, 5],
  "categoryId": 10
}
```

### Bulk Bildirishnomalar
```http
# Tanlangan foydalanuvchilarga
POST /api/admin/notifications/bulk
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "userIds": [1, 2, 3, 4, 5],
  "title": "Maxsus Taklif",
  "message": "Barcha mahsulotlarga 50% chegirma!",
  "type": "promotion",
  "link": "/promotions/special-offer"
}

# Barcha foydalanuvchilarga
POST /api/admin/notifications/broadcast
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Tizim Texnik Xizmat",
  "message": "Tizim 02:00 dan 04:00 gacha texnik xizmatda bo'ladi",
  "type": "general",
  "userType": "all"
}
```

---

## 📤 Export Funksiyalari

### Foydalanuvchilarni Export Qilish
```http
GET /api/admin/export/users?format=csv&status=user&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {admin_token}
```

### Mahsulotlarni Export Qilish
```http
GET /api/admin/export/products?format=csv&category=electronics&status=active
Authorization: Bearer {admin_token}
```

### Buyurtmalarni Export Qilish
```http
GET /api/admin/export/orders?format=csv&status=completed&startDate=2024-01-01
Authorization: Bearer {admin_token}
```

### Sotuv Hisobotini Export Qilish
```http
GET /api/admin/export/sales?format=csv&groupBy=monthly&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {admin_token}
```

---

## 📁 Fayl Boshqaruvi

### Fayllarni Yuklash
```http
POST /api/admin/upload
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

files: [file1, file2, file3]
```

### Fayllar Ro'yxatini Olish
```http
GET /api/admin/files?page=1&limit=20&type=images
Authorization: Bearer {admin_token}
```

### Faylni O'chirish
```http
DELETE /api/admin/files
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "filePath": "/uploads/old-image.jpg"
}
```

### Ishlatilmagan Fayllarni Tozalash
```http
DELETE /api/admin/files/cleanup?dryRun=true
Authorization: Bearer {admin_token}
```

---

## 🌐 Ko'p Tilni Boshqarish

### Mahsulot Tarjimalarini Boshqarish

#### Barcha Tarjimalarni Ko'rish
```http
GET /api/admin/products/123/translations
Authorization: Bearer {admin_token}
```

#### Yangi Tarjima Qo'shish
```http
POST /api/admin/products/123/translations
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "language": "fr",
  "name": "iPhone 15 Pro Max",
  "description": "Le dernier smartphone d'Apple",
  "shortDescription": "Téléphone phare premium"
}
```

### Kategoriya Tarjimalarini Boshqarish

#### Kategoriya Tarjimasini Yangilash
```http
POST /api/admin/categories/5/translations
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "language": "de",
  "name": "Elektronik",
  "description": "Alle elektronischen Geräte"
}
```

### Til Sozlamalarini Boshqarish

#### Yangi Til Qo'shish
```http
POST /api/settings/admin/languages
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "code": "de",
  "name": "German",
  "nativeName": "Deutsch",
  "flag": "🇩🇪",
  "isDefault": false,
  "direction": "ltr",
  "isActive": true,
  "translations": {
    "welcome": "Willkommen",
    "home": "Startseite",
    "products": "Produkte"
  }
}
```

---

## 📈 Hisobotlar va Tahlil

### Seller Performance
```http
GET /api/admin/sellers/performance?period=30&limit=20
Authorization: Bearer {admin_token}
```

### Mahsulot Tahlili
```http
GET /api/admin/analytics/products?period=30
Authorization: Bearer {admin_token}
```

### Foydalanuvchi Tahlili
```http
GET /api/admin/analytics/users?period=30
Authorization: Bearer {admin_token}
```

---

## 🔧 Muhim Eslatmalar

### Xavfsizlik
- Barcha admin operatsiyalar uchun `admin` roli talab qilinadi
- Token muddati tugaganda avtomatik yangilanadi
- Barcha faoliyat logga yoziladi

### Til va Valyuta
- Default til: `uz` (O'zbekcha)
- Default valyuta: `UZS` (O'zbek so'mi)
- Barcha tarjimalar JSON formatda saqlanadi
- Valyuta kurslari real vaqtda yangilanishi mumkin

### Performance
- Bulk operatsiyalar katta ma'lumotlar uchun optimallashtirilgan
- Export funksiyalari CSV formatda ishlaydi
- Fayllar avtomatik optimizatsiya qilinadi

### Backup va Restore
- Ma'lumotlar bazasi muntazam backup olinadi
- Fayl tizimi ham backup qilinadi
- Restore jarayoni admin tomonidan boshqariladi

---

## 🆘 Yordam va Qo'llab-quvvatlash

### Texnik Yordam
- **Email:** admin@marketapp.uz
- **Telefon:** +998 90 123 45 67
- **Telegram:** @marketapp_support

### Dokumentatsiya
- **API Docs:** `/api/docs`
- **Admin Guide:** Bu fayl
- **Developer Docs:** `COMPLETE_API_DOCUMENTATION.md`

---

**© 2024 Market App - Professional E-commerce Platform**
## 🔐 Parol Tiklash Boshqaruvi

### Password Reset Requests Ko'rish

Adminlar barcha parol tiklash so'rovlarini ko'rish va boshqarish imkoniyatiga ega.

#### Barcha Password Reset Requests

**Endpoint:** `GET /api/admin/password-resets`

**Query Parameters:**
- `page` - Sahifa raqami (default: 1)
- `limit` - Har sahifadagi elementlar soni (default: 10)
- `phoneNumber` - Telefon raqami bo'yicha filter
- `status` - Holat bo'yicha filter (active, used, expired, blocked)
- `sortBy` - Saralash maydoni (createdAt, expiresAt, attempts)
- `sortOrder` - Saralash tartibi (asc, desc)

**Javob:**
```json
{
  "success": true,
  "data": {
    "passwordResets": [
      {
        "id": 1,
        "phoneNumber": "+998901234567",
        "resetCode": "123456",
        "isUsed": false,
        "expiresAt": "2024-01-15T11:40:00Z",
        "attempts": 0,
        "maxAttempts": 3,
        "isBlocked": false,
        "createdAt": "2024-01-15T11:30:00Z",
        "updatedAt": "2024-01-15T11:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

#### Password Reset Statistikalari

**Endpoint:** `GET /api/admin/password-resets/stats`

**Javob:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 5,
    "used": 120,
    "expired": 20,
    "blocked": 5,
    "todayRequests": 12,
    "weeklyRequests": 45,
    "monthlyRequests": 150,
    "successRate": 80.0,
    "averageResetTime": "5.2 minutes"
  }
}
```

### SMS Xizmati Boshqaruvi

#### SMS Xizmati Holati

**Endpoint:** `GET /api/admin/sms/status`

**Javob:**
```json
{
  "success": true,
  "data": {
    "testMode": true,
    "activeProvider": "eskiz",
    "providers": {
      "eskiz": {
        "status": "active",
        "balance": 1500.50,
        "lastCheck": "2024-01-15T11:00:00Z"
      },
      "playmobile": {
        "status": "inactive",
        "balance": 0,
        "lastCheck": "2024-01-15T10:00:00Z"
      }
    },
    "todaySent": 45,
    "weeklySent": 320,
    "monthlySent": 1250
  }
}
```

#### SMS Test Yuborish

**Endpoint:** `POST /api/admin/sms/test`

**So'rov tanasi:**
```json
{
  "phoneNumber": "+998901234567",
  "message": "Test SMS xabari",
  "provider": "eskiz"
}
```

**Javob:**
```json
{
  "success": true,
  "message": "Test SMS muvaffaqiyatli yuborildi.",
  "data": {
    "messageId": "test_1705315200000",
    "provider": "eskiz",
    "sentAt": "2024-01-15T12:00:00Z"
  }
}
```

### Muhim Eslatmalar

#### SMS Xizmati Sozlamalari

1. **Test Rejimi:** Hozirda SMS test rejimida (console.log)
2. **Real SMS:** Production uchun `.env` faylida SMS provider ma'lumotlarini to'ldiring:
   ```
   ESKIZ_EMAIL=your-email@example.com
   ESKIZ_PASSWORD=your-password
   PLAYMOBILE_LOGIN=your-login
   PLAYMOBILE_PASSWORD=your-password
   SMS_TEST_MODE=false
   ```

3. **Xavfsizlik:** 
   - Har 5 daqiqada faqat bitta SMS
   - Maksimal 3 marta noto'g'ri kod kiritish
   - 10 daqiqa kod amal qilish muddati

4. **Monitoring:** Barcha SMS so'rovlari va urinishlar loglanadi

---

## 📊 Hisobotlar va Statistika