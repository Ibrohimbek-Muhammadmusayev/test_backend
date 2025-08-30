# 👑 Admin API Documentation

> **Market App - Admin Panel API**  
> **Version:** 2.0 (Optimized & Consolidated)  
> **Base URL:** `http://localhost:5000/api/admin`  
> **Authentication:** Bearer Token (Admin Role Required)

---

## 🔐 Authentication

All admin endpoints require authentication with admin privileges.

### Get Admin Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "998905843504",
  "password": "admin123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "Super Admin",
    "phoneNumber": "998905843504",
    "status": "admin",
    "profileImage": "/uploads/profile/default_profile_image.png"
  }
}
```

### Authorization Header
```
Authorization: Bearer {admin_token}
```

---

## 📊 Dashboard & Analytics

### 1. Admin Dashboard Overview
```http
GET /api/admin/dashboard
Authorization: Bearer {admin_token}
```

**Description:** Get comprehensive dashboard overview with statistics and growth metrics.

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
  "recentUsers": [
    {
      "id": 123,
      "fullName": "John Doe",
      "phoneNumber": "+998901234567",
      "status": "user",
      "profileImage": "/uploads/profile/user123.jpg",
      "joinedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "recentOrders": [
    {
      "id": 456,
      "customerName": "Jane Smith",
      "customerPhone": "+998907654321",
      "totalPrice": 125.50,
      "status": "pending",
      "createdAt": "2024-01-20T14:45:00.000Z"
    }
  ],
  "topSellers": [
    {
      "id": 789,
      "fullName": "Best Seller",
      "profileImage": "/uploads/profile/seller789.jpg",
      "productCount": 25,
      "totalRevenue": 15670.50
    }
  ]
}
```

### 2. Platform Analytics
```http
GET /api/admin/analytics?period=30
Authorization: Bearer {admin_token}
```

**Parameters:**
- `period` (optional): Analysis period in days (default: 30)

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
  "userRegistrations": [
    {
      "date": "2024-01-01",
      "registrations": 12
    }
  ],
  "productCreations": [
    {
      "date": "2024-01-01",
      "products": 8
    }
  ],
  "topCategories": [
    {
      "id": 1,
      "name": "Electronics",
      "totalSales": 156,
      "totalRevenue": 45670.50
    }
  ],
  "orderStatusDistribution": [
    {
      "orderStatus": "pending",
      "count": 45
    },
    {
      "orderStatus": "completed",
      "count": 234
    }
  ]
}
```

### 3. Seller Performance Analytics
```http
GET /api/admin/sellers/performance?period=30&limit=20
Authorization: Bearer {admin_token}
```

**Parameters:**
- `period` (optional): Analysis period in days (default: 30)
- `limit` (optional): Number of sellers to return (default: 20)

**Response:**
```json
{
  "period": 30,
  "sellers": [
    {
      "id": 123,
      "fullName": "Top Seller",
      "profileImage": "/uploads/profile/seller123.jpg",
      "joinedAt": "2023-06-15T10:00:00.000Z",
      "metrics": {
        "totalProducts": 45,
        "totalOrders": 234,
        "totalRevenue": 25670.50,
        "averageRating": "4.5",
        "totalReviews": 89
      }
    }
  ]
}
```

### 4. System Statistics
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

---

## 👥 User Management

### 1. Get All Users
```http
GET /api/admin/users?status=user&name=john&phone=998&page=1&limit=10
Authorization: Bearer {admin_token}
```

**Parameters:**
- `status` (optional): Filter by user status (admin, seller, user)
- `name` (optional): Search by name
- `phone` (optional): Search by phone number
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "users": [
    {
      "id": 123,
      "fullName": "John Doe",
      "phoneNumber": "+998901234567",
      "status": "user",
      "isBlocked": false,
      "profileImage": "/uploads/profile/user123.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "sellerInfo": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 25,
    "totalUsers": 250,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Block/Unblock User
```http
PUT /api/admin/users/:id/block
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "message": "User John Doe is now blocked.",
  "user": {
    "id": 123,
    "fullName": "John Doe",
    "isBlocked": true
  }
}
```

### 3. Make User a Seller
```http
PUT /api/admin/:id/make-seller
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "message": "User John Doe is now a seller.",
  "user": {
    "id": 123,
    "fullName": "John Doe",
    "status": "seller"
  }
}
```

### 4. Delete User
```http
DELETE /api/admin/users/delete/:id
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "message": "User muvaffaqiyatli o'chirildi"
}
```

---

## 🛍️ Product Management

### 1. Get All Products
```http
GET /api/admin/products?page=1&limit=10&search=phone&category=electronics&sortBy=newest
Authorization: Bearer {admin_token}
```

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `category` (optional): Filter by category
- `sortBy` (optional): Sort order (newest, oldest, name_asc, name_desc, price_asc, price_desc)

**Response:**
```json
{
  "products": [
    {
      "id": 123,
      "name": "Premium Smartphone",
      "description": "High-end smartphone with advanced features",
      "shortDescription": "Premium smartphone",
      "images": ["/uploads/images/product123_1.jpg"],
      "rating": 4.5,
      "numReviews": 89,
      "likes": 156,
      "isActive": true,
      "brand": "TechBrand",
      "seller": {
        "id": 456,
        "fullName": "Tech Store",
        "profileImage": "/uploads/profile/seller456.jpg"
      },
      "category": {
        "id": 1,
        "name": "Electronics"
      },
      "priceRange": {
        "min": 599.99,
        "max": 799.99
      },
      "createdAt": "2024-01-10T08:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 50,
    "totalProducts": 500,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Get Single Product
```http
GET /api/admin/products/:id
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "id": 123,
  "name": "Premium Smartphone",
  "description": "High-end smartphone with advanced features",
  "shortDescription": "Premium smartphone",
  "images": ["/uploads/images/product123_1.jpg"],
  "rating": 4.5,
  "numReviews": 89,
  "likes": 156,
  "isActive": true,
  "brand": "TechBrand",
  "tags": ["electronics", "smartphone", "premium"],
  "seller": {
    "id": 456,
    "fullName": "Tech Store",
    "profileImage": "/uploads/profile/seller456.jpg"
  },
  "category": {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices and gadgets"
  },
  "variants": [
    {
      "id": 789,
      "size": "128GB",
      "color": "Black",
      "price": 599.99,
      "discountPrice": 549.99,
      "countInStock": 50,
      "sku": "PHONE-128-BLACK"
    }
  ],
  "reviews": [
    {
      "id": 101,
      "userName": "John Doe",
      "rating": 5,
      "comment": "Excellent product!",
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-10T08:00:00.000Z"
}
```

### 3. Create Product
```http
POST /api/admin/products
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

**Form Data:**
```
name: Premium Smartphone
description: High-end smartphone with advanced features
shortDescription: Premium smartphone
brand: TechBrand
categoryId: 1
tags: ["electronics", "smartphone", "premium"]
variants: [
  {
    "size": "128GB",
    "color": "Black",
    "price": 599.99,
    "discountPrice": 549.99,
    "countInStock": 50,
    "sku": "PHONE-128-BLACK"
  }
]
images: [file1, file2, file3]
```

**Response:**
```json
{
  "success": true,
  "message": "Mahsulot muvaffaqiyatli yaratildi",
  "product": {
    "id": 123,
    "name": "Premium Smartphone",
    "description": "High-end smartphone with advanced features",
    "images": ["/uploads/images/product123_1.jpg"],
    "variants": [
      {
        "id": 789,
        "size": "128GB",
        "color": "Black",
        "price": 599.99,
        "countInStock": 50
      }
    ]
  }
}
```

### 4. Update Product
```http
PUT /api/admin/products/:id
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

### 5. Delete Product
```http
DELETE /api/admin/products/:id
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Mahsulot muvaffaqiyatli o'chirildi"
}
```

---

## 📦 Order Management

### 1. Get All Orders
```http
GET /api/admin/orders?page=1&limit=10&status=pending&search=customer&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {admin_token}
```

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by order status (pending, processing, shipped, delivered, cancelled)
- `search` (optional): Search by customer name or phone
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "orders": [
    {
      "id": 123,
      "user": {
        "id": 456,
        "fullName": "John Doe",
        "phoneNumber": "+998901234567"
      },
      "orderItems": [
        {
          "id": 789,
          "productId": 101,
          "productName": "Premium Smartphone",
          "variantId": 202,
          "qty": 1,
          "price": 599.99,
          "seller": {
            "id": 303,
            "fullName": "Tech Store"
          }
        }
      ],
      "shippingAddress": {
        "address": "123 Main Street",
        "city": "Tashkent",
        "postalCode": "100000",
        "country": "Uzbekistan"
      },
      "paymentMethod": "card",
      "totalPrice": 599.99,
      "orderStatus": "pending",
      "isPaid": false,
      "isDelivered": false,
      "createdAt": "2024-01-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 100,
    "totalOrders": 1000,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Get Single Order
```http
GET /api/admin/orders/:id
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "id": 123,
  "user": {
    "id": 456,
    "fullName": "John Doe",
    "phoneNumber": "+998901234567",
    "profileImage": "/uploads/profile/user456.jpg"
  },
  "orderItems": [
    {
      "id": 789,
      "productId": 101,
      "productName": "Premium Smartphone",
      "productImage": "/uploads/images/product101_1.jpg",
      "variantId": 202,
      "size": "128GB",
      "color": "Black",
      "qty": 1,
      "price": 599.99,
      "seller": {
        "id": 303,
        "fullName": "Tech Store",
        "profileImage": "/uploads/profile/seller303.jpg"
      }
    }
  ],
  "shippingAddress": {
    "address": "123 Main Street",
    "city": "Tashkent",
    "postalCode": "100000",
    "country": "Uzbekistan"
  },
  "paymentMethod": "card",
  "paymentResult": {
    "id": "pay_123456",
    "status": "completed",
    "update_time": "2024-01-20T10:30:00.000Z"
  },
  "taxPrice": 59.99,
  "shippingPrice": 10.00,
  "totalPrice": 669.98,
  "orderStatus": "pending",
  "isPaid": true,
  "paidAt": "2024-01-20T10:30:00.000Z",
  "isDelivered": false,
  "deliveredAt": null,
  "createdAt": "2024-01-20T10:00:00.000Z"
}
```

---

## 🗂️ Category Management

### 1. Get All Categories
```http
GET /api/admin/categories
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "image": "/uploads/images/category1.jpg",
      "parentCategory": null,
      "subCategories": [
        {
          "id": 2,
          "name": "Smartphones",
          "description": "Mobile phones and accessories"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Create Category
```http
POST /api/admin/categories
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

**Form Data:**
```
name: Electronics
description: Electronic devices and gadgets
parentCategoryId: null
image: [file]
```

**Response:**
```json
{
  "success": true,
  "message": "Kategoriya muvaffaqiyatli yaratildi",
  "category": {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices and gadgets",
    "image": "/uploads/images/category1.jpg",
    "parentCategory": null
  }
}
```

### 3. Update Category
```http
PUT /api/admin/categories/:id
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

### 4. Delete Category
```http
DELETE /api/admin/categories/:id
Authorization: Bearer {admin_token}
```

---

## 🖼️ Banner Management

### 1. Get All Banners
```http
GET /api/admin/banners
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "banners": [
    {
      "id": 1,
      "title": "Summer Sale",
      "description": "Up to 50% off on all items",
      "image": "/uploads/images/banner1.jpg",
      "groupId": 1,
      "isActive": true,
      "link": "https://example.com/sale",
      "type": "reklama",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Create Banner
```http
POST /api/admin/banners
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

**Form Data:**
```
title: Summer Sale
description: Up to 50% off on all items
groupId: 1
isActive: true
link: https://example.com/sale
type: reklama
image: [file]
```

**Banner Types:**
- `reklama` - Advertisement banner
- `game` - Game banner
- `products` - Product banner

### 3. Update Banner
```http
PUT /api/admin/banners/:id
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

### 4. Delete Banner
```http
DELETE /api/admin/banners/:id
Authorization: Bearer {admin_token}
```

---

## 🏪 Seller Monitoring

### 1. Get All Sellers
```http
GET /api/admin/seller
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "sellers": [
    {
      "id": 123,
      "fullName": "Tech Store Owner",
      "phoneNumber": "+998901234567",
      "profileImage": "/uploads/profile/seller123.jpg",
      "status": "seller",
      "isBlocked": false,
      "sellerInfo": {
        "shopName": "Tech Store",
        "shopDescription": "We sell high quality electronics",
        "shopAddress": "123 Tech Street, Tashkent"
      },
      "createdAt": "2023-06-15T10:00:00.000Z"
    }
  ]
}
```

### 2. Get Seller Profile
```http
GET /api/admin/seller/:id
Authorization: Bearer {admin_token}
```

### 3. Get Seller Products
```http
GET /api/admin/seller/:id/products
Authorization: Bearer {admin_token}
```

---

## 🔍 Search Statistics

### 1. Popular Searches
```http
GET /api/admin/search/popular
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "popularSearches": [
    {
      "query": "smartphone",
      "count": 156,
      "lastSearched": "2024-01-20T15:30:00.000Z"
    },
    {
      "query": "laptop",
      "count": 89,
      "lastSearched": "2024-01-20T14:45:00.000Z"
    }
  ]
}
```

### 2. All Searches
```http
GET /api/admin/search/all
Authorization: Bearer {admin_token}
```

### 3. Search Statistics
```http
GET /api/admin/search/statistic
Authorization: Bearer {admin_token}
```

---

## 📱 Group Management

### 1. Get All Groups
```http
GET /api/admin/groups?page=1&limit=10&search=electronics
Authorization: Bearer {admin_token}
```

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term

**Response:**
```json
{
  "groups": [
    {
      "id": 1,
      "title": "Summer Collection",
      "products": [
        {
          "id": 123,
          "name": "Premium Smartphone",
          "images": ["/uploads/images/product123_1.jpg"],
          "priceRange": {
            "min": 599.99,
            "max": 799.99
          }
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalGroups": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Get Single Group
```http
GET /api/admin/groups/:id
Authorization: Bearer {admin_token}
```

### 3. Create Group
```http
POST /api/admin/groups
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Summer Collection",
  "productIds": [1, 2, 3, 4, 5]
}
```

### 4. Update Group
```http
PUT /api/admin/groups/:id
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Updated Collection",
  "productIds": [1, 2, 3, 6, 7]
}
```

### 5. Delete Group
```http
DELETE /api/admin/groups/:id
Authorization: Bearer {admin_token}
```

---

## 🔔 Notification Management

### Send Notification
```http
POST /api/admin/notification/send/
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "userId": 123,
  "title": "Yangi bildirishnoma",
  "message": "Bu sizga yuborilgan yangi bildirishnoma",
  "type": "general",
  "link": "/products/123",
  "image": "/uploads/images/notification.jpg"
}
```

**Notification Types:**
- `general` - General notification
- `order` - Order related
- `product` - Product related
- `promotion` - Promotion related

**Response:**
```json
{
  "success": true,
  "message": "Bildirishnoma muvaffaqiyatli yuborildi",
  "notification": {
    "id": 456,
    "userId": 123,
    "title": "Yangi bildirishnoma",
    "message": "Bu sizga yuborilgan yangi bildirishnoma",
    "type": "general",
    "read": false,
    "createdAt": "2024-01-20T16:00:00.000Z"
  }
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
| `403` | Forbidden (Admin access required) |
| `404` | Not Found |
| `422` | Validation Error |
| `500` | Internal Server Error |

---

## 🚨 Error Responses

### Standard Error Format
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

### Validation Error Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 💻 Code Examples

### JavaScript (Fetch API)
```javascript
// Get admin dashboard
const getAdminDashboard = async () => {
  try {
    const response = await fetch('/api/admin/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Dashboard data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Block user
const blockUser = async (userId) => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/block`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('User blocked:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Create product
const createProduct = async (productData) => {
  const formData = new FormData();
  
  // Add product data
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('categoryId', productData.categoryId);
  formData.append('variants', JSON.stringify(productData.variants));
  
  // Add images
  productData.images.forEach(image => {
    formData.append('images', image);
  });
  
  try {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: formData
    });
    
    const result = await response.json();
    console.log('Product created:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### cURL Examples
```bash
# Get dashboard
curl -X GET "http://localhost:5000/api/admin/dashboard" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get users
curl -X GET "http://localhost:5000/api/admin/users?status=seller" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Block user
curl -X PUT "http://localhost:5000/api/admin/users/123/block" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Create category
curl -X POST "http://localhost:5000/api/admin/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Electronics" \
  -F "description=Electronic devices" \
  -F "image=@category.jpg"

# Send notification
curl -X POST "http://localhost:5000/api/admin/notification/send/" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "title": "Yangi bildirishnoma",
    "message": "Bu sizga yuborilgan yangi bildirishnoma",
    "type": "general"
  }'
```

### Python (requests)
```python
import requests

# Admin token
headers = {
    'Authorization': f'Bearer {admin_token}',
    'Content-Type': 'application/json'
}

# Get dashboard
response = requests.get('http://localhost:5000/api/admin/dashboard', headers=headers)
dashboard_data = response.json()

# Get users
users_response = requests.get('http://localhost:5000/api/admin/users', headers=headers)
users_data = users_response.json()

# Block user
block_response = requests.put(
    f'http://localhost:5000/api/admin/users/{user_id}/block',
    headers=headers
)

# Send notification
notification_data = {
    'userId': 123,
    'title': 'Yangi bildirishnoma',
    'message': 'Bu sizga yuborilgan yangi bildirishnoma',
    'type': 'general'
}

notification_response = requests.post(
    'http://localhost:5000/api/admin/notification/send/',
    headers=headers,
    json=notification_data
)

print(f"Total users: {dashboard_data['overview']['totalUsers']}")
print(f"Total revenue: ${dashboard_data['overview']['totalRevenue']}")