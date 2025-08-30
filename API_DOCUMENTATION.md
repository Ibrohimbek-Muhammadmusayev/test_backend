# 🚀 Market App API Documentation

> **✅ Yangilangan (2024):** API tuzilishi optimallashtirildi. Admin va Seller controller fayllari birlashtirildi.

## 📊 Seller Dashboard API

### Dashboard Overview
```http
GET /api/seller/dashboard
Authorization: Bearer {seller_token}
```

**Response:**
```json
{
  "overview": {
    "totalProducts": 25,
    "totalVariants": 78,
    "totalOrders": 156,
    "totalRevenue": 45670.50,
    "pendingOrders": 12,
    "completedOrders": 144,
    "averageRating": "4.3",
    "totalReviews": 89,
    "lowStockProducts": 5,
    "revenueGrowth": 15.2
  },
  "recentOrders": [...]
}
```

### Sales Analytics
```http
GET /api/seller/analytics/sales?period=30
Authorization: Bearer {seller_token}
```

### Product Analytics
```http
GET /api/seller/analytics/products
Authorization: Bearer {seller_token}
```

### Order Statistics
```http
GET /api/seller/orders/statistics
Authorization: Bearer {seller_token}
```

## 🛍️ Seller Product Management

### Get Products
```http
GET /api/seller/products?page=1&limit=10&search=shirt&category=clothing&status=active&sortBy=newest
Authorization: Bearer {seller_token}
```

### Create Product
```http
POST /api/seller/products
Authorization: Bearer {seller_token}
Content-Type: multipart/form-data

{
  "name": "Premium T-Shirt",
  "description": "High quality cotton t-shirt",
  "shortDescription": "Comfortable cotton tee",
  "brand": "MyBrand",
  "categoryId": 1,
  "tags": ["clothing", "casual", "cotton"],
  "variants": [
    {
      "size": "M",
      "color": "red",
      "price": 25.99,
      "discountPrice": 19.99,
      "countInStock": 50,
      "sku": "TSHIRT-M-RED"
    }
  ],
  "images": [file1, file2, file3]
}
```

### Update Product
```http
PUT /api/seller/products/:id
Authorization: Bearer {seller_token}
```

### Delete Product
```http
DELETE /api/seller/products/:id
Authorization: Bearer {seller_token}
```

### Toggle Product Status
```http
PATCH /api/seller/products/:id/toggle-status
Authorization: Bearer {seller_token}
```

## 📦 Seller Order Management

### Get Orders
```http
GET /api/seller/orders?page=1&limit=10&status=pending&search=customer_name&startDate=2024-01-01&endDate=2024-12-31&sortBy=newest
Authorization: Bearer {seller_token}
```

### Get Single Order
```http
GET /api/seller/orders/:id
Authorization: Bearer {seller_token}
```

### Update Order Item Status
```http
PATCH /api/seller/orders/:orderId/items/:itemId/status
Authorization: Bearer {seller_token}

{
  "status": "shipped",
  "trackingNumber": "TRK123456789",
  "notes": "Shipped via DHL"
}
```

### Order Statistics
```http
GET /api/seller/orders/statistics?period=30
Authorization: Bearer {seller_token}
```

## 👑 Admin Dashboard API

> **🔄 Optimallashtirildi:** Barcha admin funksiyalari bitta controller faylida birlashtirildi.

### Dashboard Overview
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
    "totalRevenue": 234567.89,
    "pendingOrders": 45,
    "completedOrders": 5625,
    "totalReviews": 3456,
    "averageRating": "4.2",
    "activeProducts": 2280,
    "lowStockProducts": 67,
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

### Admin Analytics
```http
GET /api/admin/analytics?period=30
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "period": 30,
  "dailyStats": [
    {
      "date": "2024-01-01",
      "orders": 45,
      "revenue": 2340.50
    }
  ],
  "userRegistrations": [...],
  "productCreations": [...],
  "topCategories": [...],
  "orderStatusDistribution": [...]
}
```

### Seller Performance
```http
GET /api/admin/sellers/performance?period=30&limit=20
Authorization: Bearer {admin_token}
```

### System Statistics
```http
GET /api/admin/statistics
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "database": {
    "totalUsers": 1250,
    "totalSellers": 89,
    "totalProducts": 2340,
    "totalVariants": 7890,
    "totalOrders": 5670,
    "totalOrderItems": 12340,
    "totalReviews": 3456,
    "totalCategories": 25,
    "totalSearches": 45670,
    "totalCarts": 890
  },
  "storage": {
    "totalImages": 15670,
    "totalSize": 2147483648,
    "totalSizeMB": "2048.00"
  }
}
```

## 🔍 Enhanced Search API

### Advanced Search
```http
GET /api/search/advanced?keyword=shirt&category=clothing&minPrice=10&maxPrice=100&brand=nike&attributes={"color":"red","size":"M"}&inStock=true&sortBy=price_asc&page=1&limit=10
```

### Search Suggestions
```http
GET /api/search/suggestions?q=shi
```

**Response:**
```json
[
  {
    "text": "Shirt",
    "type": "product"
  },
  {
    "text": "Nike",
    "type": "brand"
  },
  {
    "text": "Shoes",
    "type": "category"
  }
]
```

## 🎨 Product Variants API

### Get Variant by ID
```http
GET /api/variants/:id
```

### Get Product Variants
```http
GET /api/products/:productId/variants?attributes={"color":"red"}&inStock=true&sortBy=price_asc
```

### Get Product Attributes
```http
GET /api/products/:productId/attributes
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "color",
    "displayName": "Rang",
    "type": "color",
    "unit": null,
    "values": [
      {
        "id": 1,
        "value": "red",
        "displayValue": "Qizil",
        "colorCode": "#FF0000",
        "imageUrl": null
      }
    ]
  }
]
```

### Find Variant by Attributes
```http
POST /api/products/:productId/variants/find

{
  "attributes": {
    "color": "red",
    "size": "M",
    "material": "cotton"
  }
}
```

### Check Variant Stock
```http
GET /api/variants/:id/stock
```

**Response:**
```json
{
  "variantId": 123,
  "countInStock": 25,
  "minStockLevel": 5,
  "inStock": true,
  "lowStock": false,
  "available": true
}
```

## 🛒 Enhanced Cart API

### Add to Cart (with Variants)
```http
POST /api/cart

{
  "productId": 123,
  "variantId": 456,
  "qty": 2
}
```

## 📈 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (Admin/Seller only)
- `404` - Not Found
- `500` - Internal Server Error

## 🔐 Authentication

All protected routes require Bearer token:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 👥 User Roles

- **admin** - Full system access
- **seller** - Own products and orders management
- **user** - Shopping and basic features

## 🚀 Getting Started

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Seed test data:**
   ```bash
   node seeders/productAttributesSeeder.js
   ```

3. **Test endpoints:**
   - Login as admin/seller to get token
   - Use token in Authorization header
   - Test dashboard endpoints

## 📊 Example Usage

### Seller Dashboard Flow:
1. `POST /api/auth/login` - Get seller token
2. `GET /api/seller/dashboard` - View overview
3. `GET /api/seller/products` - Manage products
4. `GET /api/seller/orders` - Handle orders
5. `GET /api/seller/analytics/sales` - View sales analytics
6. `GET /api/seller/analytics/products` - View product analytics
7. `GET /api/seller/orders/statistics` - View order statistics

### Admin Dashboard Flow:
1. `POST /api/auth/login` - Get admin token
2. `GET /api/admin/dashboard` - System overview
3. `GET /api/admin/analytics` - Platform analytics
4. `GET /api/admin/sellers/performance` - Seller metrics
5. `GET /api/admin/statistics` - System stats

## 🔄 Recent Updates

### Controller Optimization (2024):
- ✅ **Admin Controllers Merged**: `adminController.js` and `adminDashboardController.js` combined
- ✅ **Seller Routes Consolidated**: All seller functions in single router file
- ✅ **Removed Duplicate Routes**: Eliminated redundant dashboard route files
- ✅ **Fixed Database Issues**: Corrected column name mismatches (status → orderStatus, quantity → qty)
- ✅ **Optimized Queries**: Replaced complex Sequelize queries with raw SQL for better performance

### URL Structure:
- **Admin**: `/api/admin/` (dashboard, analytics, users, products, orders)
- **Seller**: `/api/seller/` (dashboard, products, orders, analytics)
- **User**: `/api/users/` (profile, orders, cart)