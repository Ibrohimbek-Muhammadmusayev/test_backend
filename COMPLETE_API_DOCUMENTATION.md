# 🚀 Market App - Complete API Documentation

> **Version:** 4.0 (Enhanced with Banner Scheduling, Multi-Currency Products, Advanced Notifications & User Preferences)
> **Base URL:** `http://localhost:5000/api`
> **Authentication:** Bearer Token

---

## 📋 Table of Contents

1. [🔐 Authentication](#authentication)
2. [⚙️ Platform Settings](#platform-settings)
3. [💱 Currency Management](#currency-management)
4. [🌐 Language Management](#language-management)
5. [👑 Admin Panel](#admin-panel)
6. [🛍️ E-commerce Features](#e-commerce-features)
7. [📊 Analytics & Reports](#analytics-reports)
8. [🔄 Bulk Operations](#bulk-operations)
9. [📤 Export Functions](#export-functions)
10. [📁 File Management](#file-management)

---

## 🔐 Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "998901234567",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "phoneNumber": "998901234567",
    "status": "user",
    "profileImage": "/uploads/profile/user1.jpg"
  }
}
```

---

## ⚙️ Platform Settings

### Get Public Settings
```http
GET /api/settings/public
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "siteName": "Market App",
    "siteDescription": "Professional E-commerce Platform",
    "siteLogo": "/uploads/logo/logo.png",
    "defaultCurrency": "UZS",
    "supportedCurrencies": [
      {
        "code": "UZS",
        "name": "O'zbek so'mi",
        "symbol": "so'm",
        "rate": 1
      }
    ],
    "defaultLanguage": "uz",
    "supportedLanguages": [
      {
        "code": "uz",
        "name": "O'zbekcha",
        "flag": "🇺🇿"
      }
    ],
    "features": {
      "multiVendor": true,
      "coupons": true,
      "wishlist": true
    },
    "contactInfo": {
      "phone": "+998901234567",
      "email": "info@marketapp.uz",
      "address": "Toshkent, O'zbekiston"
    },
    "socialMedia": {
      "facebook": "https://facebook.com/marketapp",
      "instagram": "https://instagram.com/marketapp",
      "telegram": "https://t.me/marketapp"
    }
  }
}
```

### Admin: Get Platform Settings
```http
GET /api/settings/admin
Authorization: Bearer {admin_token}
```

### Admin: Update Platform Settings
```http
PUT /api/settings/admin
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

{
  "siteName": "My Market App",
  "siteDescription": "Updated description",
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
    "instagram": "https://instagram.com/marketapp"
  },
  "features": {
    "multiVendor": true,
    "coupons": true,
    "flashSales": true,
    "loyaltyProgram": false
  }
}
```

---

## 💱 Currency Management

### Get Public Currencies
```http
GET /api/settings/currencies
```

**Response:**
```json
{
  "success": true,
  "currencies": [
    {
      "code": "UZS",
      "name": "O'zbek so'mi",
      "symbol": "so'm",
      "rate": 1.0,
      "isDefault": true,
      "position": "after",
      "decimalPlaces": 0
    },
    {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$",
      "rate": 0.000082,
      "isDefault": false,
      "position": "before",
      "decimalPlaces": 2
    }
  ]
}
```

### Admin: Manage Currencies
```http
# Get all currencies
GET /api/settings/admin/currencies
Authorization: Bearer {admin_token}

# Create currency
POST /api/settings/admin/currencies
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "code": "EUR",
  "name": "Euro",
  "symbol": "€",
  "rate": 0.000076,
  "isDefault": false,
  "position": "before",
  "decimalPlaces": 2
}

# Update currency
PUT /api/settings/admin/currencies/EUR
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "rate": 0.000078,
  "isActive": true
}

# Delete currency
DELETE /api/settings/admin/currencies/EUR
Authorization: Bearer {admin_token}
```

---

## 🌐 Language Management

### Get Public Languages
```http
GET /api/settings/languages
```

### Get Translations
```http
GET /api/settings/translations/uz
```

**Response:**
```json
{
  "success": true,
  "translations": {
    "welcome": "Xush kelibsiz",
    "home": "Bosh sahifa",
    "products": "Mahsulotlar",
    "cart": "Savatcha",
    "login": "Kirish",
    "register": "Ro'yxatdan o'tish"
  }
}
```

### Admin: Manage Languages
```http
# Get all languages
GET /api/settings/admin/languages
Authorization: Bearer {admin_token}

# Create language
POST /api/settings/admin/languages
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "code": "fr",
  "name": "Français",
  "nativeName": "Français",
  "flag": "🇫🇷",
  "isDefault": false,
  "direction": "ltr",
  "translations": {
    "welcome": "Bienvenue",
    "home": "Accueil"
  }
}

# Update translations
PUT /api/settings/admin/translations/uz
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "translations": {
    "welcome": "Xush kelibsiz",
    "new_key": "Yangi kalit"
  }
}
```

---

## 👑 Admin Panel

### Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer {admin_token}
```

**Response:**
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
  "topSellers": [...]
}
```

### Analytics
```http
GET /api/admin/analytics?period=30
Authorization: Bearer {admin_token}
```

### System Statistics
```http
GET /api/admin/statistics
Authorization: Bearer {admin_token}
```

---

## 🛍️ E-commerce Features

### Products with Currency & Language Support
```http
GET /api/products?page=1&limit=10
Headers:
  X-Currency: USD
  X-Language: en
  Accept-Language: en-US,en;q=0.9
```

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Premium Smartphone",
      "description": "High-end smartphone with advanced features",
      "shortDescription": "Latest flagship smartphone",
      "brand": "TechBrand",
      "tags": ["smartphone", "premium", "5G"],
      "priceRange": {
        "min": "$599.99",
        "max": "$799.99"
      },
      "currency": {
        "code": "USD",
        "symbol": "$",
        "position": "before"
      },
      "translations": {
        "name": "Premium Smartphone",
        "description": "High-end smartphone with advanced features",
        "shortDescription": "Latest flagship smartphone"
      },
      "availableLanguages": ["en", "uz", "ru"]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 50,
    "totalProducts": 500
  }
}
```

### Get Product in Specific Language
```http
GET /api/products/123/language/uz
```

**Response:**
```json
{
  "id": 123,
  "name": "Premium Smartfon",
  "description": "Ilg'or xususiyatlarga ega yuqori darajadagi smartfon",
  "shortDescription": "Eng so'nggi flagman smartfon",
  "brand": "TechBrand",
  "tags": ["smartfon", "premium", "5G"],
  "priceRange": {
    "min": "7,320,000 so'm",
    "max": "9,760,000 so'm"
  },
  "availableLanguages": ["en", "uz", "ru"]
}
```

### Product Translation Management
```http
# Get product translations
GET /api/products/123/translations

# Add/Update product translation
POST /api/products/123/translations
Authorization: Bearer {seller_or_admin_token}
Content-Type: application/json

{
  "language": "uz",
  "name": "Premium Smartfon",
  "description": "Ilg'or xususiyatlarga ega yuqori darajadagi smartfon",
  "shortDescription": "Eng so'nggi flagman smartfon"
}

# Delete product translation
DELETE /api/products/123/translations/uz
Authorization: Bearer {seller_or_admin_token}
```

### Like Product
```http
POST /api/products/123/like
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "message": "Product liked successfully",
  "likes": 156
}
```

### User's Liked Products
```http
GET /api/users/profile/my-liked-products
Authorization: Bearer {user_token}
```

### Categories with Multi-language Support
```http
# Get all categories
GET /api/categories
Headers:
  X-Language: uz

# Get category in specific language
GET /api/categories/5/language/uz

# Get category translations
GET /api/categories/5/translations
```

**Response:**
```json
{
  "id": 5,
  "name": "Elektronika",
  "description": "Barcha turdagi elektron qurilmalar",
  "image": "/uploads/categories/electronics.jpg",
  "sortOrder": 1,
  "availableLanguages": ["en", "uz", "ru"],
  "parentCategory": {
    "id": 1,
    "name": "Texnologiya"
  }
}
```

### Category Translation Management (Admin Only)
```http
# Add/Update category translation
POST /api/categories/5/translations
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "language": "uz",
  "name": "Elektronika",
  "description": "Barcha turdagi elektron qurilmalar"
}

# Delete category translation
DELETE /api/categories/5/translations/uz
Authorization: Bearer {admin_token}
```

---

## 📊 Analytics & Reports

### Order Status Management
```http
# Update order status
PUT /api/admin/orders/123/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "shipped"
}

# Bulk update order status
PUT /api/admin/orders/bulk/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "ids": [1, 2, 3, 4, 5],
  "status": "processing"
}

# Get order status statistics
GET /api/admin/orders/status/stats?period=30
Authorization: Bearer {admin_token}
```

### Seller Performance
```http
GET /api/admin/sellers/performance?period=30&limit=20
Authorization: Bearer {admin_token}
```

---

## 🔄 Bulk Operations

### Bulk User Management
```http
# Bulk delete users
DELETE /api/admin/users/bulk
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "ids": [1, 2, 3, 4, 5]
}

# Bulk update user status
PUT /api/admin/users/bulk/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "ids": [1, 2, 3],
  "status": "seller"
}
```

### Bulk Product Management
```http
# Bulk update product status
PUT /api/admin/products/bulk/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "ids": [1, 2, 3, 4, 5],
  "status": "active"
}

# Bulk delete products
DELETE /api/admin/products/bulk
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "ids": [1, 2, 3]
}

# Bulk update product category
PUT /api/admin/products/bulk/category
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "ids": [1, 2, 3, 4, 5],
  "categoryId": 10
}
```

### Bulk Notifications
```http
# Send notifications to specific users
POST /api/admin/notifications/bulk
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "userIds": [1, 2, 3, 4, 5],
  "title": "Special Offer",
  "message": "Get 50% off on all products!",
  "type": "promotion",
  "link": "/promotions/special-offer"
}

# Broadcast notification to all users
POST /api/admin/notifications/broadcast
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "The system will be under maintenance from 2 AM to 4 AM",
  "type": "general",
  "userType": "all"
}
```

---

## 📤 Export Functions

### Export Users
```http
GET /api/admin/export/users?format=csv&status=user&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {admin_token}
```

### Export Products
```http
GET /api/admin/export/products?format=csv&category=electronics&status=active
Authorization: Bearer {admin_token}
```

### Export Orders
```http
GET /api/admin/export/orders?format=csv&status=completed&startDate=2024-01-01
Authorization: Bearer {admin_token}
```

### Export Sales Report
```http
GET /api/admin/export/sales?format=csv&groupBy=monthly&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {admin_token}
```

---

## 📁 File Management

### Upload Files
```http
POST /api/admin/upload
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

files: [file1, file2, file3]
```

**Response:**
```json
{
  "success": true,
  "message": "3 files uploaded successfully",
  "files": [
    {
      "originalName": "product1.jpg",
      "fileName": "upload-1640995200000-123456.webp",
      "filePath": "/uploads/upload-1640995200000-123456.webp",
      "size": 245760,
      "mimetype": "image/webp"
    }
  ]
}
```

### List Files
```http
GET /api/admin/files?page=1&limit=20&type=images
Authorization: Bearer {admin_token}
```

### Delete File
```http
DELETE /api/admin/files
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "filePath": "/uploads/old-image.jpg"
}
```

### Cleanup Unused Files
```http
DELETE /api/admin/files/cleanup?dryRun=true
Authorization: Bearer {admin_token}
```

---

## 🌍 Multi-language & Multi-currency Usage

### Using Currency Headers
```http
GET /api/products
Headers:
  X-Currency: USD
  X-Language: en
```

### Using Query Parameters
```http
GET /api/products?currency=EUR&lang=ru
```

### Translation Management Examples

#### Frontend Translation Usage
```javascript
// Get product with translations
const getProductWithTranslation = async (productId, language = 'en') => {
  const response = await fetch(`/api/products/${productId}/language/${language}`);
  return response.json();
};

// Add translation to product (seller/admin)
const addProductTranslation = async (productId, translationData) => {
  const response = await fetch(`/api/products/${productId}/translations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(translationData)
  });
  return response.json();
};

// Usage example
const translationData = {
  language: 'uz',
  name: 'Premium Smartfon',
  description: 'Ilg\'or xususiyatlarga ega smartfon',
  shortDescription: 'Eng so\'nggi flagman smartfon'
};

await addProductTranslation(123, translationData);
```

#### Category Translation Management
```javascript
// Get category with translation
const getCategoryWithTranslation = async (categoryId, language = 'en') => {
  const response = await fetch(`/api/categories/${categoryId}/language/${language}`);
  return response.json();
};

// Add category translation (admin only)
const addCategoryTranslation = async (categoryId, translationData) => {
  const response = await fetch(`/api/categories/${categoryId}/translations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(translationData)
  });
  return response.json();
};
```

### Currency Conversion Example
```javascript
// Frontend JavaScript example
const convertPrice = (amount, fromCurrency, toCurrency, rates) => {
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  return (amount / fromRate) * toRate;
};

// Format price with currency
const formatPrice = (amount, currency) => {
  const currencies = {
    'UZS': { symbol: 'so\'m', position: 'after', decimals: 0 },
    'USD': { symbol: '$', position: 'before', decimals: 2 },
    'EUR': { symbol: '€', position: 'before', decimals: 2 }
  };
  
  const curr = currencies[currency] || currencies['UZS'];
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: curr.decimals,
    maximumFractionDigits: curr.decimals
  });
  
  return curr.position === 'before'
    ? `${curr.symbol}${formatted}`
    : `${formatted} ${curr.symbol}`;
};
```

### Multi-language Content Creation Workflow

#### For Sellers
1. **Create Product**: Create product with default language content
2. **Add Translations**: Add translations for supported languages
3. **Manage Translations**: Update or delete translations as needed

```javascript
// Step 1: Create product
const productData = {
  name: 'Premium Smartphone',
  description: 'High-end smartphone with advanced features',
  shortDescription: 'Latest flagship smartphone',
  brand: 'TechBrand',
  tags: ['smartphone', 'premium', '5G'],
  category: 5,
  variants: [
    {
      price: 599.99,
      discountPrice: 549.99,
      countInStock: 50,
      size: '128GB',
      color: 'Black'
    }
  ]
};

// Step 2: Add translations
const translations = {
  uz: {
    name: 'Premium Smartfon',
    description: 'Ilg\'or xususiyatlarga ega yuqori darajadagi smartfon',
    shortDescription: 'Eng so\'nggi flagman smartfon'
  },
  ru: {
    name: 'Премиум Смартфон',
    description: 'Высококлассный смартфон с передовыми функциями',
    shortDescription: 'Новейший флагманский смартфон'
  }
};

// Add each translation
for (const [language, translation] of Object.entries(translations)) {
  await addProductTranslation(productId, { language, ...translation });
}
```

#### For Admins
1. **Manage Categories**: Create categories with multi-language support
2. **Platform Settings**: Configure supported languages and currencies
3. **Content Moderation**: Review and approve translations

```javascript
// Category with translations
const categoryData = {
  name: 'Electronics',
  description: 'All types of electronic devices',
  translations: {
    uz: {
      name: 'Elektronika',
      description: 'Barcha turdagi elektron qurilmalar'
    },
    ru: {
      name: 'Электроника',
      description: 'Все виды электронных устройств'
    }
  }
};
```

---

## 🔧 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=market_app
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Server
PORT=5000
NODE_ENV=development
```

### 3. Database Setup
```bash
# Run migrations (if using Sequelize CLI)
npm run db:migrate

# Run multi-language support migration
npx sequelize-cli db:migrate --name 20250127-add-multilanguage-support.js

# Seed platform data
npm run seed:platform

# Seed product attributes
npm run seed:attributes

# Seed all data
npm run seed:all
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

---

## 📋 Available Scripts

```bash
# Development
npm run dev                 # Start development server with nodemon

# Production
npm start                   # Start production server

# Database Seeding
npm run seed:platform       # Seed platform settings, currencies, languages
npm run seed:attributes     # Seed product attributes
npm run seed:all           # Seed all data

# Legacy seeders
npm run data:import         # Import legacy data
npm run data:destroy        # Destroy legacy data
```

---

## 🚨 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": 400,
    "details": "Detailed error information"
  }
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "siteName",
      "message": "Site name is required"
    }
  ]
}
```

---

## 📈 Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `422` | Validation Error |
| `500` | Internal Server Error |

---

## 🎯 Key Features Implemented

### ✅ Platform Management
- Dynamic site configuration
- Multi-currency support with real-time conversion
- Multi-language support with translations
- Commission/fee system
- Feature flags for enabling/disabling functionality

### ✅ Enhanced Admin Panel
- Complete dashboard with analytics
- Bulk operations for users, products, orders
- Export functionality (CSV format)
- File management with cleanup
- Order status management
- Advanced reporting
- Translation management for products and categories

### ✅ E-commerce Features
- Product like/unlike system
- User liked products management
- Currency-aware pricing
- Language-aware content
- Advanced search and filtering
- **Multi-language product support**
- **Multi-language category support**
- **Translation management for sellers**

### ✅ Multi-language System
- **Product translations** (name, description, shortDescription)
- **Category translations** (name, description)
- **Language-specific content retrieval**
- **Translation CRUD operations**
- **Available languages tracking**
- **Seller translation management**
- **Admin translation oversight**

### ✅ Developer Experience
- Comprehensive API documentation
- Seeder scripts for easy setup
- Middleware for localization
- Error handling and validation
- RESTful API design
- Database migrations for multi-language support

---

## 🔮 Future Enhancements

- Real-time currency exchange rates integration
- **Advanced translation management UI**
- **Automatic translation services integration**
- **Translation quality scoring**
- **Content localization workflows**
- A/B testing framework
- Advanced analytics and reporting
- Mobile app API optimization
- GraphQL API support
- Microservices architecture
- Redis caching layer
- Elasticsearch integration
- Advanced security features
- **Multi-language SEO optimization**
- **Translation version control**

---

**© 2024 Market App - Professional E-commerce Platform**
---

## 🆕 New Features in Version 4.0

### 🎯 Enhanced Banner System with Time Scheduling

#### Get Active Banners by Position
```http
GET /api/banners/active/top?language=uz
```

**Response:**
```json
{
  "banners": [
    {
      "id": 1,
      "title": "Yangi yil chegirmalari",
      "description": "50% gacha chegirma",
      "image": "/uploads/banners/banner1.jpg",
      "type": "product",
      "position": "top",
      "priority": 10,
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z",
      "isExpired": false,
      "isScheduledActive": true,
      "clickThroughRate": "3.45",
      "typeData": {
        "groupId": 1
      },
      "translations": {
        "title": "Yangi yil chegirmalari",
        "description": "50% gacha chegirma"
      }
    }
  ]
}
```

#### Admin: Create Scheduled Banner
```http
POST /api/admin/banners
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

{
  "title": "Flash Sale Banner",
  "description": "Limited time offer",
  "type": "product",
  "position": "top",
  "priority": 5,
  "startDate": "2024-02-01T00:00:00Z",
  "duration": 7,
  "autoDeactivate": true,
  "typeData": {
    "groupId": 2
  },
  "translations": {
    "uz": {
      "title": "Tezkor sotish banneri",
      "description": "Cheklangan vaqt taklifi"
    },
    "en": {
      "title": "Flash Sale Banner",
      "description": "Limited time offer"
    }
  }
}
```

#### Track Banner Analytics
```http
# Track banner view
POST /api/banners/1/view

# Track banner click
POST /api/banners/1/click
```

#### Admin: Check Expired Banners
```http
POST /api/admin/banners/check-expired
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "message": "3 expired banners deactivated",
  "deactivatedCount": 3
}
```

---

### 💱 Enhanced Multi-Currency Product System

#### Get Product with Currency Support
```http
GET /api/products/1?currency=USD&language=en
```

**Response:**
```json
{
  "id": 1,
  "name": "Premium Smartphone",
  "description": "High-end smartphone with advanced features",
  "variants": [
    {
      "id": 1,
      "size": "128GB",
      "color": "Black",
      "price": 599.99,
      "discountPrice": 549.99,
      "currency": "USD",
      "effectivePrice": 549.99,
      "formattedPrice": "$549.99",
      "discountPercentage": 8,
      "countInStock": 25,
      "isAvailable": true,
      "attributes": {
        "storage": "128GB",
        "color": "Black",
        "material": "Aluminum"
      },
      "prices": {
        "UZS": 6750000,
        "EUR": 510.50,
        "RUB": 51000
      },
      "discountPrices": {
        "UZS": 6187500,
        "EUR": 469.50,
        "RUB": 46920
      }
    }
  ],
  "priceRange": {
    "min": 549.99,
    "max": 799.99,
    "currency": "USD",
    "isSinglePrice": false
  },
  "formattedPriceRange": "$549.99 - $799.99",
  "availableCurrencies": ["USD", "UZS", "EUR", "RUB"],
  "availableAttributes": {
    "storage": ["64GB", "128GB", "256GB"],
    "color": ["Black", "White", "Blue"],
    "material": ["Aluminum", "Glass"]
  }
}
```

#### Search Products with Currency
```http
GET /api/products/search?query=smartphone&currency=EUR&minPrice=400&maxPrice=800&language=en
```

---

### 🔔 Advanced Notification System

#### Get User Notifications with Filtering
```http
GET /api/users/notifications?page=1&limit=10&type=order&unreadOnly=true&language=uz
```

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "title": "Buyurtma tasdiqlandi",
      "message": "Sizning #12345 buyurtmangiz muvaffaqiyatli qabul qilindi",
      "type": "order",
      "priority": "high",
      "read": false,
      "category": "orders",
      "senderId": null,
      "senderType": "system",
      "relatedEntityType": "order",
      "relatedEntityId": 12345,
      "link": "/orders/12345",
      "actions": [
        {
          "label": "Buyurtmani ko'rish",
          "action": "navigate",
          "url": "/orders/12345"
        },
        {
          "label": "Buyurtmani kuzatish",
          "action": "track",
          "url": "/orders/12345/track"
        }
      ],
      "metadata": {
        "paymentMethod": "cash",
        "totalPrice": 150000,
        "itemCount": 3
      },
      "isExpired": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "unreadCount": 8
}
```

#### Get Notification Statistics
```http
GET /api/users/notifications/stats
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "byType": [
    {
      "type": "order",
      "count": 15,
      "unread": 3
    },
    {
      "type": "admin_message",
      "count": 8,
      "unread": 2
    },
    {
      "type": "promotion",
      "count": 12,
      "unread": 1
    }
  ],
  "total": {
    "count": 35,
    "unread": 6,
    "read": 29
  }
}
```

#### Admin: Send Notification to Specific User
```http
POST /api/users/notifications/admin
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "userId": 123,
  "title": "Important Account Update",
  "message": "Please verify your account information",
  "type": "admin_message",
  "priority": "high",
  "category": "account",
  "link": "/profile/verify",
  "actions": [
    {
      "label": "Verify Now",
      "action": "navigate",
      "url": "/profile/verify"
    }
  ],
  "expiresAt": "2024-02-15T23:59:59Z",
  "translations": {
    "uz": {
      "title": "Muhim hisob yangilanishi",
      "message": "Iltimos, hisob ma'lumotlaringizni tasdiqlang"
    }
  }
}
```

#### Admin: Broadcast to All Users
```http
POST /api/users/notifications/admin/broadcast
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "System Maintenance Notice",
  "message": "The system will be under maintenance on Sunday from 2 AM to 4 AM",
  "type": "admin_message",
  "priority": "urgent",
  "category": "system",
  "translations": {
    "uz": {
      "title": "Tizim texnik xizmat ko'rsatish haqida xabar",
      "message": "Yakshanba kuni soat 2:00 dan 4:00 gacha tizim texnik xizmat ko'rsatish rejimida bo'ladi"
    }
  }
}
```

---

### 👤 Enhanced User Preferences System

#### Get User Preferences with Full Details
```http
GET /api/users/profile/preferences
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "preferences": {
    "language": {
      "code": "uz",
      "name": "O'zbekcha",
      "nativeName": "O'zbekcha",
      "flag": "🇺🇿",
      "direction": "ltr"
    },
    "currency": {
      "code": "UZS",
      "name": "O'zbek so'mi",
      "symbol": "so'm",
      "position": "after"
    },
    "timezone": "Asia/Tashkent",
    "country": "UZ",
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "24h",
    "settings": {
      "notifications": {
        "email": true,
        "push": true,
        "sms": false,
        "orderUpdates": true,
        "promotions": true,
        "newsletter": false
      },
      "privacy": {
        "showProfile": true,
        "showActivity": false,
        "showPurchaseHistory": false
      },
      "display": {
        "theme": "light",
        "compactView": false,
        "showPricesInMultipleCurrencies": false
      },
      "shopping": {
        "savePaymentMethods": false,
        "autoApplyCoupons": true,
        "showRecommendations": true
      }
    }
  }
}
```

#### Update Language Preference (with validation)
```http
PUT /api/users/profile/language
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Language preference updated successfully",
  "language": {
    "code": "en",
    "name": "English",
    "nativeName": "English",
    "flag": "🇺🇸",
    "direction": "ltr"
  }
}
```

#### Update Currency Preference (with validation)
```http
PUT /api/users/profile/currency
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "currency": "USD"
}
```

#### Update Specific User Setting
```http
PUT /api/users/profile/settings/notifications.email
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "value": false
}
```

#### Get Available Preference Options (Public)
```http
GET /api/users/preferences/options
```

**Response:**
```json
{
  "success": true,
  "options": {
    "languages": [
      {
        "code": "uz",
        "name": "O'zbekcha",
        "nativeName": "O'zbekcha",
        "flag": "🇺🇿",
        "direction": "ltr"
      },
      {
        "code": "en",
        "name": "English",
        "nativeName": "English",
        "flag": "🇺🇸",
        "direction": "ltr"
      },
      {
        "code": "ru",
        "name": "Русский",
        "nativeName": "Русский",
        "flag": "🇷🇺",
        "direction": "ltr"
      }
    ],
    "currencies": [
      {
        "code": "UZS",
        "name": "O'zbek so'mi",
        "symbol": "so'm",
        "position": "after",
        "country": "UZ",
        "flag": "🇺🇿"
      },
      {
        "code": "USD",
        "name": "US Dollar",
        "symbol": "$",
        "position": "before",
        "country": "US",
        "flag": "🇺🇸"
      },
      {
        "code": "EUR",
        "name": "Euro",
        "symbol": "€",
        "position": "before",
        "country": "EU",
        "flag": "🇪🇺"
      }
    ]
  }
}
```

#### Admin: Get User Preference Statistics
```http
GET /api/users/preferences/stats
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "languages": [
      {
        "preferredLanguage": "uz",
        "userCount": 1250
      },
      {
        "preferredLanguage": "ru",
        "userCount": 340
      },
      {
        "preferredLanguage": "en",
        "userCount": 180
      }
    ],
    "currencies": [
      {
        "preferredCurrency": "UZS",
        "userCount": 1450
      },
      {
        "preferredCurrency": "USD",
        "userCount": 280
      },
      {
        "preferredCurrency": "RUB",
        "userCount": 40
      }
    ]
  }
}
```

---

### 🔧 Enhanced Currency Management

#### Admin: Create Currency with Advanced Options
```http
POST /api/settings/admin/currencies
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "code": "GBP",
  "name": "British Pound",
  "nativeName": "British Pound Sterling",
  "symbol": "£",
  "rate": 0.000067,
  "country": "GB",
  "flag": "🇬🇧",
  "position": "before",
  "decimalPlaces": 2,
  "thousandsSeparator": ",",
  "decimalSeparator": ".",
  "autoUpdate": true,
  "displayOrder": 4,
  "roundingMode": "round"
}
```

#### Currency Formatting Examples
```json
{
  "examples": {
    "UZS": {
      "amount": 150000,
      "formatted": "150,000so'm",
      "position": "after",
      "decimalPlaces": 0
    },
    "USD": {
      "amount": 12.50,
      "formatted": "$12.50",
      "position": "before",
      "decimalPlaces": 2
    },
    "EUR": {
      "amount": 10.75,
      "formatted": "€10.75",
      "position": "before",
      "decimalPlaces": 2
    }
  }
}
```

---

### 📱 Real-time Features

#### WebSocket Connection for Notifications
```javascript
// Connect to WebSocket
const socket = io('http://localhost:5000');

// Join user's notification room
socket.emit('joinUserRoom', userId);

// Listen for real-time notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // Update UI with new notification
});

// Listen for order updates
socket.on('orderUpdate', (orderData) => {
  console.log('Order updated:', orderData);
  // Update order status in UI
});
```

---

### 🔄 Scheduled Tasks

The system now includes automated scheduled tasks:

- **Banner Expiration Check**: Runs every hour to deactivate expired banners
- **Daily Banner Cleanup**: Runs daily at midnight for comprehensive banner management
- **Currency Rate Updates**: Automatic exchange rate updates (configurable)
- **Notification Cleanup**: Removes expired notifications automatically

---

### 🛡️ Enhanced Security & Validation

#### Input Validation
- All currency codes validated against active currencies
- Language codes validated against supported languages
- Banner scheduling dates validated for logical consistency
- User preference updates validated against available options

#### Rate Limiting
- Enhanced rate limiting for preference updates
- Separate limits for admin operations
- Protection against notification spam

#### Data Integrity
- Foreign key constraints for user preferences
- Cascade deletion handling for related entities
- Transaction support for complex operations

---

### 📊 Analytics & Reporting

#### Banner Analytics
- View tracking with timestamps
- Click-through rate calculations
- Performance metrics by position and type
- A/B testing support for different banner versions

#### User Preference Analytics
- Language usage statistics
- Currency preference trends
- Setting adoption rates
- Geographic distribution insights

#### Notification Analytics
- Delivery success rates
- Read/unread statistics
- User engagement metrics
- Response time analysis

---

### 🔧 Developer Tools

#### Debug Endpoints (Development Only)
```http
# Check system health
GET /api/debug/health

# Validate all user preferences
GET /api/debug/validate-preferences

# Test notification delivery
POST /api/debug/test-notification

# Check scheduled tasks status
GET /api/debug/scheduled-tasks
```

#### Migration Support
- Automatic database schema updates
- Data migration scripts for existing installations
- Backward compatibility maintenance
- Rollback procedures for failed updates

---

## 🚀 Getting Started with New Features

### 1. Update Dependencies
```bash
npm install node-cron@^3.0.3
```

### 2. Run Database Migrations
```bash
npm run migrate
```

### 3. Seed Platform Data
```bash
npm run seed:platform
```

### 4. Start the Enhanced Server
```bash
npm run dev
```

### 5. Test New Features
- Visit `/api-docs` for interactive API documentation
- Test banner scheduling in admin panel
- Try multi-currency product browsing
- Configure user preferences
- Test real-time notifications

---

## 📝 Changelog

### Version 4.0 New Features:
- ✅ Banner system with time scheduling and auto-deactivation
- ✅ Multi-currency product variants with automatic conversion
- ✅ Advanced notification system with admin messaging
- ✅ User preference management with validation
- ✅ Enhanced currency management with formatting options
- ✅ Real-time WebSocket notifications
- ✅ Scheduled task automation
- ✅ Comprehensive analytics and reporting
- ✅ Improved security and validation
- ✅ Developer tools and debugging support

### Breaking Changes:
- Banner `type` enum values changed from `['reklama', 'game', 'products']` to `['product', 'game', 'advertisement']`
- User preferences now require foreign key validation
- Product variant structure enhanced with multi-currency support
- Notification schema significantly expanded

### Migration Notes:
- Existing banners will need type field updates
- User preference data will be migrated automatically
- Product variants will retain backward compatibility
- Notification data structure is backward compatible

---

## 🆘 Support & Troubleshooting

### Common Issues:

1. **Banner not showing**: Check `startDate`, `endDate`, and `isActive` status
2. **Currency conversion errors**: Verify exchange rates are updated
3. **Notification not delivered**: Check WebSocket connection and user room joining
4. **Preference update failed**: Ensure language/currency codes are valid and active

### Debug Commands:
```bash
# Check scheduled tasks
npm run debug:tasks

# Validate data integrity
npm run debug:validate

# Test notification system
npm run debug:notifications
```

For additional support, check the logs in `/logs` directory or contact the development team.