# 👤 User Guide - To'liq Qo'llanma

> **Market App User Guide** - Professional E-commerce Platform foydalanuvchilar uchun
> **Version:** 3.0 (Enhanced with Real Currency Rates & Multi-language Support)
> **Base URL:** `http://localhost:5000/api`

---

## 📋 Mundarija

1. [🚀 Ro'yxatdan O'tish va Kirish](#royxatdan-otish-va-kirish)
2. [👤 Profil Boshqaruvi](#profil-boshqaruvi)
3. [🛍️ Mahsulotlarni Ko'rish va Qidirish](#mahsulotlarni-korish-va-qidirish)
4. [🌐 Til va Valyuta Sozlamalari](#til-va-valyuta-sozlamalari)
5. [🛒 Savatcha Boshqaruvi](#savatcha-boshqaruvi)
6. [❤️ Sevimli Mahsulotlar](#sevimli-mahsulotlar)
7. [📦 Buyurtma Berish](#buyurtma-berish)
8. [📋 Buyurtmalar Tarixi](#buyurtmalar-tarixi)
9. [🏪 Sotuvchi Bo'lish Uchun Ariza](#-sotuvchi-bolish-uchun-ariza)
10. [⭐ Sharh va Baholash](#sharh-va-baholash)
11. [🔔 Bildirishnomalar](#bildirishnomalar)
12. [⚙️ Sozlamalar](#sozlamalar)
13. [📱 Mobil Ilova](#mobil-ilova)
14. [🆘 Yordam va Qo'llab-quvvatlash](#yordam-va-qollab-quvvatlash)

---

## 🚀 Ro'yxatdan O'tish va Kirish

### Yangi Hisob Yaratish
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Ali Valiyev",
  "phoneNumber": "998901234567",
  "password": "secure_password123"
}
```

**Javob:**
```json
{
  "message": "User successfully registered",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "fullName": "Ali Valiyev",
    "phoneNumber": "998901234567",
    "status": "user",
    "preferredLanguage": "uz",
    "preferredCurrency": "UZS"
  }
}
```

### Tizimga Kirish
```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "998901234567",
  "password": "secure_password123"
}
```

### Parolni Unutdim (SMS orqali tiklash)

#### 1. Parolni tiklash uchun SMS kod so'rash

**Endpoint:** `POST /api/auth/forgot-password`

```json
{
  "phoneNumber": "998901234567"
}
```

**Javob:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi SMS orqali yuborildi.",
  "data": {
    "phoneNumber": "998901234567",
    "expiresIn": 10,
    "resetId": 1
  }
}
```

#### 2. SMS kodini tekshirish (ixtiyoriy)

**Endpoint:** `POST /api/auth/verify-reset-code`

```json
{
  "phoneNumber": "998901234567",
  "resetCode": "123456"
}
```

**Javob:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi to'g'ri.",
  "data": {
    "phoneNumber": "998901234567",
    "resetId": 1,
    "expiresAt": "2024-01-15T11:40:00Z"
  }
}
```

#### 3. Yangi parol o'rnatish

**Endpoint:** `POST /api/auth/reset-password`

```json
{
  "phoneNumber": "998901234567",
  "resetCode": "123456",
  "newPassword": "new_secure_password123"
}
```

**Javob:**
```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli yangilandi.",
  "data": {
    "phoneNumber": "998901234567",
    "fullName": "Ali Valiyev"
  }
}
```

#### Muhim Eslatmalar:

- **Kod muddati:** SMS kod 10 daqiqa davomida amal qiladi
- **Spam himoyasi:** Har 5 daqiqada faqat bitta SMS yuboriladi
- **Xavfsizlik:** Maksimal 3 marta noto'g'ri kod kiritish mumkin
- **Bloklanish:** 3 marta noto'g'ri kiritilsa, yangi kod so'rash kerak
- **Test rejimi:** Hozirda SMS test rejimida (console.log)

---

## 👤 Profil Boshqaruvi

### Profil Ma'lumotlarini Ko'rish
```http
GET /api/users/profile
Authorization: Bearer {user_token}
```

**Javob:**
```json
{
  "id": 123,
  "fullName": "Ali Valiyev",
  "phoneNumber": "998901234567",
  "status": "user",
  "isBlocked": false,
  "profileImage": "/uploads/profile/user123.jpg",
  "preferredLanguage": "uz",
  "preferredCurrency": "UZS",
  "settings": {
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "privacy": {
      "showProfile": true,
      "showActivity": false
    }
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T14:45:00Z"
}
```

### Profil Ma'lumotlarini Yangilash
```http
PUT /api/users/profile
Authorization: Bearer {user_token}
Content-Type: multipart/form-data

{
  "fullName": "Ali Valiyev Updated",
  "phoneNumber": "998901234567",
  "preferredLanguage": "en",
  "preferredCurrency": "USD",
  "profileImage": file
}
```

### Profil Rasmini Yangilash
```http
PUT /api/users/profile/image
Authorization: Bearer {user_token}
Content-Type: multipart/form-data

{
  "profileImage": file
}
```

### Parolni O'zgartirish
```http
PUT /api/users/profile/password
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "oldPassword": "current_password",
  "newPassword": "new_secure_password"
}
```

---

## 🛍️ Mahsulotlarni Ko'rish va Qidirish

### 🌍 Real Valyuta Kurslari

Market App **real valyuta kurslari** bilan ishlaydi:

- **💱 Avtomatik konvertatsiya** - barcha narxlar sizning tanlagan valyutangizda ko'rsatiladi
- **🔄 Har 30 daqiqada yangilanish** - eng so'nggi kurslar bilan
- **📊 Real vaqt kurslari** - exchangerate-api.com va fixer.io dan
- **💰 To'g'ri narxlar** - hech qanday yashirin to'lovlar yo'q

#### Qo'llab-quvvatlanadigan Valyutalar
```
🇺🇸 USD - US Dollar ($)
🇺🇿 UZS - Uzbek Som (so'm)
🇷🇺 RUB - Russian Ruble (₽)
🇪🇺 EUR - Euro (€)
🇬🇧 GBP - British Pound (£)
🇯🇵 JPY - Japanese Yen (¥)
🇨🇳 CNY - Chinese Yuan (¥)
🇰🇷 KRW - South Korean Won (₩)
🇹🇷 TRY - Turkish Lira (₺)
```

#### Valyuta Sozlamalari
Sizning afzal ko'rgan valyutangizni tanlang:

```http
PUT /api/users/language-currency
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "preferredCurrency": "USD",
  "preferredLanguage": "uz"
}
```

**Natija:** Barcha mahsulot narxlari avtomatik USD da ko'rsatiladi!

### Barcha Mahsulotlarni Ko'rish
```http
GET /api/products?page=1&limit=20
Headers:
  X-Language: uz
  X-Currency: UZS
```

**Query Parametrlari:**
- `page`: Sahifa raqami (default: 1)
- `limit`: Sahifadagi mahsulotlar soni (default: 10)
- `search`: Qidiruv so'zi
- `category`: Kategoriya nomi
- `minPrice`: Minimal narx
- `maxPrice`: Maksimal narx
- `minRating`: Minimal reyting
- `sortBy`: Saralash (price_asc, price_desc, top_rated, most_liked, name_asc, name_desc)
- `isFeatured`: Tavsiya etilgan mahsulotlar (true/false)
- `sellerId`: Sotuvchi ID si
- `brand`: Brend nomi
- `inStock`: Stokda mavjud (true/false)

### Mahsulotni Qidirish
```http
GET /api/products?search=iPhone&category=electronics&minPrice=1000000&maxPrice=15000000&sortBy=price_asc
Headers:
  X-Language: uz
  X-Currency: UZS
```

### Bitta Mahsulotni Ko'rish
```http
GET /api/products/123
Headers:
  X-Language: uz
  X-Currency: UZS
```

**Javob:**
```json
{
  "id": 123,
  "name": "iPhone 15 Pro Max",
  "description": "Apple kompaniyasining eng so'nggi smartfoni",
  "shortDescription": "Premium flagman telefon",
  "brand": "Apple",
  "tags": ["smartphone", "premium", "5G"],
  "images": [
    "/uploads/products/iphone15-1.jpg",
    "/uploads/products/iphone15-2.jpg"
  ],
  "rating": 4.8,
  "numReviews": 156,
  "likes": 89,
  "priceRange": {
    "min": "11,500,000 so'm",
    "max": "13,500,000 so'm"
  },
  "totalStock": 15,
  "variants": [
    {
      "id": 456,
      "size": "256GB",
      "color": "Natural Titanium",
      "price": "12,000,000 so'm",
      "discountPrice": "11,500,000 so'm",
      "countInStock": 10
    }
  ],
  "category": {
    "id": 5,
    "name": "Elektronika"
  },
  "seller": {
    "id": 2,
    "fullName": "John Electronics",
    "profileImage": "/uploads/sellers/john.jpg"
  },
  "availableLanguages": ["uz", "en", "ru"]
}
```

### Mahsulotni Ma'lum Tilda Ko'rish
```http
GET /api/products/123/language/en
```

### Kategoriyalarni Ko'rish
```http
GET /api/categories
Headers:
  X-Language: uz
```

---

## 🌐 Til va Valyuta Sozlamalari

### Til Sozlamasini O'zgartirish
```http
PUT /api/users/profile/language
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "language": "en"
}
```

**Qo'llab-quvvatlanadigan tillar:**
- `uz` - O'zbekcha
- `en` - English
- `ru` - Русский

### Valyuta Sozlamasini O'zgartirish
```http
PUT /api/users/profile/currency
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "currency": "USD"
}
```

**Qo'llab-quvvatlanadigan valyutalar:**
- `UZS` - O'zbek so'mi
- `USD` - US Dollar
- `EUR` - Euro

### Qo'llab-quvvatlanadigan Tillar va Valyutalarni Ko'rish
```http
GET /api/settings/public
```

---

## 🛒 Savatcha Boshqaruvi

### Savatchani Ko'rish
```http
GET /api/users/my-cart
Authorization: Bearer {user_token}
```

### Mahsulotni Savatchaga Qo'shish
```http
POST /api/cart/add
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "productId": 123,
  "variantId": 456,
  "quantity": 2
}
```

### Savatcha Elementini Yangilash
```http
PUT /api/cart/update
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "itemId": 789,
  "quantity": 3
}
```

### Mahsulotni Savatchadan O'chirish
```http
DELETE /api/cart/remove/789
Authorization: Bearer {user_token}
```

### Savatchani Tozalash
```http
DELETE /api/cart/clear
Authorization: Bearer {user_token}
```

---

## ❤️ Sevimli Mahsulotlar

### Sevimli Mahsulotlarni Ko'rish
```http
GET /api/users/profile/my-liked-products
Authorization: Bearer {user_token}
```

### Mahsulotni Yoqtirish
```http
POST /api/products/123/like
Authorization: Bearer {user_token}
```

### Mahsulotni Yoqtirmaslik
```http
DELETE /api/products/123/unlike
Authorization: Bearer {user_token}
```

---

## 📦 Buyurtma Berish

### Buyurtma Yaratish
```http
POST /api/orders
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "items": [
    {
      "productId": 123,
      "variantId": 456,
      "quantity": 1,
      "price": 11500000
    }
  ],
  "shippingAddress": {
    "fullName": "Ali Valiyev",
    "phoneNumber": "998901234567",
    "address": "Toshkent shahar, Yunusobod tumani",
    "city": "Toshkent",
    "postalCode": "100000"
  },
  "paymentMethod": "cash_on_delivery",
  "notes": "Iltimos, eshik oldiga qoldiring"
}
```

### Buyurtma To'lovi
```http
POST /api/orders/123/payment
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "paymentMethod": "card",
  "cardDetails": {
    "cardNumber": "8600123456789012",
    "expiryDate": "12/25",
    "cvv": "123",
    "cardholderName": "Ali Valiyev"
  }
}
```

---

## 🏪 Sotuvchi Bo'lish Uchun Ariza

### Sotuvchi Bo'lish Jarayoni

Agar siz platformada mahsulot sotmoqchi bo'lsangiz, avval sotuvchi bo'lish uchun ariza berishingiz kerak. Bu jarayon quyidagi bosqichlardan iborat:

#### 1. Ariza Berish

**Endpoint:** `POST /api/seller-applications`

**So'rov tanasi:**
```json
{
  "businessName": "Mening Biznesim",
  "businessType": "individual", // yoki "company"
  "businessDescription": "Biznes haqida qisqacha ma'lumot",
  "businessAddress": "Biznes manzili",
  "businessPhone": "+998901234567",
  "businessEmail": "business@example.com",
  "taxId": "123456789", // (ixtiyoriy)
  "bankAccount": "20208000123456789012", // (ixtiyoriy)
  "documents": [
    {
      "type": "passport",
      "url": "https://example.com/passport.pdf",
      "description": "Pasport nusxasi"
    },
    {
      "type": "business_license",
      "url": "https://example.com/license.pdf",
      "description": "Biznes litsenziyasi"
    }
  ],
  "additionalInfo": "Qo'shimcha ma'lumotlar"
}
```

**Javob:**
```json
{
  "success": true,
  "message": "Arizangiz muvaffaqiyatli yuborildi",
  "data": {
    "id": 1,
    "status": "pending",
    "businessName": "Mening Biznesim",
    "submittedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Ariza Holatini Kuzatish

**Endpoint:** `GET /api/seller-applications/my-applications`

**Javob:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "under_review",
      "businessName": "Mening Biznesim",
      "submittedAt": "2024-01-15T10:30:00Z",
      "reviewedAt": "2024-01-16T09:15:00Z",
      "adminNotes": "Hujjatlar ko'rib chiqilmoqda"
    }
  ]
}
```

#### 3. Ariza Holatlari

- **pending** - Ariza yuborildi, kutilmoqda
- **under_review** - Admin tomonidan ko'rib chiqilmoqda
- **additional_info_required** - Qo'shimcha ma'lumot talab qilinadi
- **approved** - Tasdiqlandi, siz endi sotuvchisiz
- **rejected** - Rad etildi

#### 4. Qo'shimcha Ma'lumot Yuborish

Agar admin qo'shimcha ma'lumot so'rasa:

**Endpoint:** `PUT /api/seller-applications/{id}`

```json
{
  "additionalInfo": "So'ralgan qo'shimcha ma'lumotlar",
  "documents": [
    {
      "type": "additional_document",
      "url": "https://example.com/additional.pdf",
      "description": "Qo'shimcha hujjat"
    }
  ]
}
```

#### 5. Ariza Tafsilotlarini Ko'rish

**Endpoint:** `GET /api/seller-applications/{id}`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "approved",
    "businessName": "Mening Biznesim",
    "businessType": "individual",
    "businessDescription": "Biznes haqida ma'lumot",
    "businessAddress": "Biznes manzili",
    "businessPhone": "+998901234567",
    "businessEmail": "business@example.com",
    "documents": [...],
    "submittedAt": "2024-01-15T10:30:00Z",
    "reviewedAt": "2024-01-17T14:20:00Z",
    "adminNotes": "Barcha talablar bajarildi. Tasdiqlandi.",
    "reviewedBy": {
      "id": 1,
      "name": "Admin User"
    }
  }
}
```

### Muhim Eslatmalar

1. **Hujjatlar:** Barcha hujjatlar aniq va o'qilishi mumkin bo'lishi kerak
2. **Ma'lumotlar:** Barcha majburiy maydonlarni to'ldiring
3. **Kutish vaqti:** Ariza ko'rib chiqilishi 3-5 ish kuni davom etishi mumkin
4. **Aloqa:** Savollar bo'lsa, admin bilan bog'laning
5. **Qayta ariza:** Rad etilgan taqdirda, kamchiliklarni bartaraf etib qayta ariza berishingiz mumkin

### Sotuvchi Bo'lgandan Keyin

Arizangiz tasdiqlangandan so'ng:
- Sizning hisobingiz avtomatik ravishda "seller" roliga o'tkaziladi
- Mahsulot qo'shish imkoniyati ochiladi
- Seller paneliga kirish huquqi beriladi
- Sotish statistikalarini ko'rish imkoniyati paydo bo'ladi

## 📋 Buyurtmalar Tarixi

### Barcha Buyurtmalarni Ko'rish
```http
GET /api/users/my-orders?page=1&limit=10
Authorization: Bearer {user_token}
```

### Bitta Buyurtmani Ko'rish
```http
GET /api/orders/123
Authorization: Bearer {user_token}
```

### Buyurtmani Bekor Qilish
```http
PUT /api/orders/123/cancel
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "reason": "Fikrimni o'zgartirdim"
}
```

---

## ⭐ Sharh va Baholash

### Mahsulotga Sharh Yozish
```http
POST /api/products/123/reviews
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "rating": 5,
  "comment": "Juda yaxshi mahsulot, tavsiya qilaman!",
  "title": "Ajoyib telefon"
}
```

### Sharhlarni Ko'rish
```http
GET /api/products/123/reviews?page=1&limit=10
```

### O'z Sharhimni Yangilash
```http
PUT /api/reviews/456
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "rating": 4,
  "comment": "Yangilangan sharh",
  "title": "Yaxshi mahsulot"
}
```

### Sharhni O'chirish
```http
DELETE /api/reviews/456
Authorization: Bearer {user_token}
```

---

## 🔔 Bildirishnomalar

### Bildirishnomalarni Ko'rish
```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer {user_token}
```

### Bildirishnomani O'qilgan Deb Belgilash
```http
PUT /api/notifications/123/read
Authorization: Bearer {user_token}
```

### Barcha Bildirishnomalarni O'qilgan Deb Belgilash
```http
PUT /api/notifications/mark-all-read
Authorization: Bearer {user_token}
```

---

## ⚙️ Sozlamalar

### Barcha Sozlamalarni Ko'rish
```http
GET /api/users/profile
Authorization: Bearer {user_token}
```

### Bildirishnoma Sozlamalari
```http
PUT /api/users/profile/settings
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "settings": {
    "notifications": {
      "email": true,
      "push": true,
      "sms": false,
      "orderUpdates": true,
      "promotions": false,
      "newProducts": true
    },
    "privacy": {
      "showProfile": true,
      "showActivity": false,
      "showPurchaseHistory": false
    },
    "preferences": {
      "autoSaveCart": true,
      "rememberPaymentMethod": false
    }
  }
}
```

---

## 📱 Mobil Ilova

### Mobil API Endpoints
Barcha API endpoints mobil ilovalar uchun ham ishlatilishi mumkin. Qo'shimcha headers:

```http
User-Agent: MarketApp-Mobile/1.0 (iOS/Android)
X-Platform: mobile
X-App-Version: 1.0.0
X-Device-ID: unique_device_id
```

### Push Bildirishnomalar
```http
POST /api/users/push-token
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "token": "firebase_push_token",
  "platform": "ios" // yoki "android"
}
```

### Offline Rejim
Mobil ilova offline rejimda ishlashi uchun:
- Sevimli mahsulotlar local saqlanadi
- Savatcha ma'lumotlari cache qilinadi
- Oxirgi ko'rilgan mahsulotlar saqlanadi

---

## 🔧 Foydali Maslahatlar

### Xavfsiz Xarid Qilish
1. **Parol xavfsizligi:** Kuchli parol ishlating
2. **Shaxsiy ma'lumotlar:** Shaxsiy ma'lumotlaringizni himoya qiling
3. **To'lov xavfsizligi:** Faqat ishonchli to'lov usullarini ishlating
4. **Seller tekshirish:** Sotuvchi reytingini tekshiring

### Yaxshi Xarid Tajribasi
1. **Mahsulot taqqoslash:** Bir nechta mahsulotni taqqoslang
2. **Sharhlarni o'qish:** Boshqa xaridorlar sharhlarini o'qing
3. **Narx kuzatish:** Narx o'zgarishlarini kuzatib boring
4. **Chegirmalar:** Aksiyalar va chegirmalardan foydalaning

### Til va Valyuta
1. **Til tanlash:** O'zingizga qulay tilni tanlang
2. **Valyuta:** Mahalliy valyutangizni tanlang
3. **Tarjima sifati:** Agar tarjima noto'g'ri bo'lsa, xabar bering
4. **Kurs farqi:** Valyuta kurslarini hisobga oling

---

## 🆘 Yordam va Qo'llab-quvvatlash

### Mijozlar Xizmati
- **Email:** support@marketapp.uz
- **Telefon:** +998 90 123 45 69
- **Telegram:** @marketapp_support
- **Live Chat:** Saytda mavjud
- **Ish vaqti:** 24/7

### Tez-tez So'raladigan Savollar

#### **Buyurtma haqida**
**S:** Buyurtmamni qanday kuzatishim mumkin?
**J:** "Mening buyurtmalarim" bo'limida buyurtma holatini ko'rishingiz mumkin.

**S:** Buyurtmani bekor qilish mumkinmi?
**J:** Ha, agar buyurtma hali jo'natilmagan bo'lsa, bekor qilishingiz mumkin.

#### **To'lov haqida**
**S:** Qanday to'lov usullari mavjud?
**J:** Naqd to'lov, bank kartalari, online to'lov tizimlari mavjud.

**S:** To'lov xavfsizmi?
**J:** Ha, barcha to'lovlar SSL shifrlash bilan himoyalangan.

#### **Yetkazib berish haqida**
**S:** Yetkazib berish qancha vaqt oladi?
**J:** Odatda 1-3 ish kuni ichida yetkazib beriladi.

**S:** Yetkazib berish narxi qancha?
**J:** 150,000 so'mdan yuqori xaridlarda bepul yetkazib berish.

### Shikoyat va Takliflar
- **Shikoyat:** complaint@marketapp.uz
- **Takliflar:** suggestions@marketapp.uz
- **Texnik muammolar:** tech-support@marketapp.uz

### Ijtimoiy Tarmoqlar
- **Facebook:** @MarketAppUz
- **Instagram:** @marketapp_uz
- **Telegram:** @marketapp_news
- **YouTube:** Market App Uzbekistan

---

## 📈 Bonuslar va Chegirmalar

### Loyalty Dasturi
- Har xarid uchun ball to'plang
- Balllarni keyingi xaridlarda ishlating
- VIP mijozlar uchun maxsus chegirmalar

### Referral Dasturi
- Do'stlaringizni taklif qiling
- Har bir yangi mijoz uchun bonus oling
- Ikki tomonlama foyda

### Maxsus Aksiyalar
- Haftalik chegirmalar
- Bayram aksiyalari
- Flash sale (tezkor sotuv)
- Brend aksiyalari

---

**© 2024 Market App - Professional E-commerce Platform**  
**Sizning ishonchli xarid hamkoringiz!** 🛍️