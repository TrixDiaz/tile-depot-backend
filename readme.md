# Backend Authentication System

A secure backend authentication system built with Node.js, Express, and PostgreSQL. This system provides user registration, OTP-based authentication, and JWT token management for a Multi-purpose Management System.

## 🚀 Features

- **User Registration**: Create new user accounts with email and name
- **OTP Authentication**: Secure one-time password verification system
- **OTP Regeneration**: Ability to regenerate OTPs when needed
- **JWT Tokens**: Access and refresh token management
- **Product Management**: Complete CRUD operations for products
- **Advanced Product Filtering**: Search, pagination, sorting, and filtering
- **Image Upload**: Multiple image support with thumbnail and gallery images
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Database**: PostgreSQL with Drizzle ORM
- **Email Integration**: Resend for OTP delivery
- **RESTful API**: Well-structured API endpoints with comprehensive documentation

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Package manager (npm or pnpm)
- Email service credentials (Gmail, Outlook, etc.)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend-authentication
   ```

2. **Install dependencies**

   **Using pnpm (recommended):**

   ```bash
   pnpm install
   ```

   **Using npm:**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Server Configuration
   SERVER_HOST=localhost
   SERVER_PORT=3000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name

   # Email Configuration (Resend)
   RESEND_API_KEY=re_your-resend-api-key
   MAIL_FROM_EMAIL=noreply@yourdomain.com
   MAIL_FROM_NAME=Your App Name
   ADMIN_EMAIL=admin@yourdomain.com
   ```

4. **Set up the database**

   **Using pnpm:**

   ```bash
   # Generate migration files
   pnpm drizzle-kit generate

   # Run migrations
   pnpm drizzle-kit migrate
   ```

   **Using npm:**

   ```bash
   # Generate migration files
   npm run drizzle-kit generate

   # Run migrations
   npm run drizzle-kit migrate
   ```

5. **Start the development server**

   **Using pnpm:**

   ```bash
   pnpm dev
   ```

   **Using npm:**

   ```bash
   npm run dev
   ```

   **For production:**

   ```bash
   # Using pnpm
   pnpm start

   # Using npm
   npm start
   ```

## 🔧 Environment Variables

| Variable                 | Description                         | Required | Example                               |
| ------------------------ | ----------------------------------- | -------- | ------------------------------------- |
| `SERVER_HOST`            | Server host address                 | Yes      | `localhost`                           |
| `SERVER_PORT`            | Server port number                  | Yes      | `3000`                                |
| `NODE_ENV`               | Environment mode                    | Yes      | `development` or `production`         |
| `JWT_SECRET`             | Secret key for JWT access tokens    | Yes      | `your-secret-key`                     |
| `JWT_REFRESH_SECRET`     | Secret key for JWT refresh tokens   | Yes      | `your-refresh-secret`                 |
| `JWT_EXPIRES_IN`         | Access token expiration time        | Yes      | `15m`                                 |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration time       | Yes      | `7d`                                  |
| `DATABASE_URL`           | PostgreSQL connection string        | Yes      | `postgresql://user:pass@host:port/db` |
| `RESEND_API_KEY`         | Resend API key for email service    | Yes      | `re_your-resend-api-key`              |
| `MAIL_FROM_EMAIL`        | Email address to send from          | Yes      | `noreply@yourdomain.com`              |
| `MAIL_FROM_NAME`         | Display name for sender             | No       | `Your App Name`                       |
| `ADMIN_EMAIL`            | Admin email for contact form        | Yes      | `admin@yourdomain.com`                |

## 📚 API Documentation

### Base URLs

- **Authentication API**: `http://localhost:3000/api/v1/auth`
- **User Management API**: `http://localhost:3000/api/v1/users`
- **Product Management API**: `http://localhost:3000/api/products`
- **Health Check**: `http://localhost:3000/`

### Authentication Endpoints

#### 1. User Registration

**POST** `/api/v1/auth/signup`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "isVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `400` - Missing required fields (email and name are required)
- `409` - Email already taken

---

#### 2. Generate OTP

**POST** `/api/v1/auth/generate-otp`

Generate an OTP for user authentication. Note: This endpoint requires the user to be verified.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Account Found and User is verified",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "otp": "123456",
  "expiresAt": "2024-01-01T00:15:00.000Z"
}
```

**Error Responses:**

- `404` - Account not found
- `409` - Account found but user is not verified OR OTP already exists for this user

---

#### 3. Regenerate OTP

**POST** `/api/v1/auth/regenerate-otp`

Delete existing OTP and generate a new one.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP regenerated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "otp": "654321",
  "expiresAt": "2024-01-01T00:15:00.000Z"
}
```

**Error Responses:**

- `404` - User not found

---

#### 4. Verify OTP

**POST** `/api/v1/auth/verify-user-otp`

Verify OTP and authenticate user. Returns access and refresh tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User logged in successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400` - Missing required fields (email and otp are required) OR invalid or expired OTP
- `404` - User not found OR OTP not found or expired

---

#### 5. Refresh Token

**POST** `/api/v1/auth/refresh-token`

Refresh access token using refresh token.

**Headers:**

```
Authorization: Bearer <refresh_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `401` - Refresh token is required OR invalid or expired refresh token OR user not found

---

### User Management Endpoints

> **Note**: All user management endpoints require authentication. Include the access token in the Authorization header: `Authorization: Bearer <access_token>`

#### 1. Get All Users

**GET** `/api/v1/users`

Get a paginated list of users with optional search functionality.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of users per page (default: 10)
- `search` (optional): Search term for email or name

**Example:**

```
GET /api/v1/users?page=1&limit=5&search=john
```

**Response:**

```json
{
  "success": true,
  "message": "Users fetched successfully",
  "page": 1,
  "limit": 5,
  "total": 25,
  "users": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- `401` - Unauthorized access (no token provided, invalid token, or user not found)

---

#### 2. Get User by ID

**GET** `/api/v1/users/:id`

Get a specific user by their ID.

**Path Parameters:**

- `id`: User UUID

**Response:**

```json
{
  "success": true,
  "message": "User fetched successfully",
  "user": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- `401` - Unauthorized access (no token provided, invalid token, or user not found)

---

#### 3. Update User Name

**PUT** `/api/v1/users/:id`

Update a user's name.

**Path Parameters:**

- `id`: User UUID

**Request Body:**

```json
{
  "name": "New Name"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User name updated successfully",
  "user": {
    "name": "New Name",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `401` - Unauthorized access (no token provided, invalid token, or user not found)

---

#### 4. Delete User

**DELETE** `/api/v1/users/:id`

Delete a user account.

**Path Parameters:**

- `id`: User UUID

**Response:**

```json
{
  "success": true,
  "message": "User deleted successfully",
  "user": {
    "id": "uuid"
  }
}
```

**Error Responses:**

- `401` - Unauthorized access (no token provided, invalid token, or user not found)

---

### Product Management Endpoints

> **Note**: All product management endpoints support comprehensive querying with pagination, filtering, search, and sorting functionality.

#### 1. Get All Products

**GET** `/api/products`

Get products with advanced filtering, search, pagination, and sorting capabilities.

**Query Parameters:**

- `page` (number, default: 1) - Page number (minimum: 1)
- `limit` (number, default: 10) - Number of products per page (minimum: 1, maximum: 100)
- `search` (string) - Search across product name, description, and brand fields
- `category` (string) - Filter by product category
- `brand` (string) - Filter by product brand
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter
- `inStock` (boolean, default: true) - Filter products in stock
- `isNew` (boolean) - Filter new products
- `isBestSeller` (boolean) - Filter best seller products
- `isTopRated` (boolean) - Filter top rated products
- `isOnSale` (boolean) - Filter products on sale
- `isTrending` (boolean) - Filter trending products
- `isHot` (boolean) - Filter hot products
- `isFeatured` (boolean) - Filter featured products
- `sortBy` (string, default: 'createdAt') - Sort field (name, price, rating, createdAt, updatedAt, sold, stock)
- `sortOrder` (string, default: 'desc') - Sort order (asc, desc)

**Example Requests:**

```
# Basic pagination
GET /api/products?page=1&limit=20

# Search products
GET /api/products?search=iphone

# Filter by category and price range
GET /api/products?category=Electronics&minPrice=100&maxPrice=1000

# Complex query with multiple filters
GET /api/products?search=laptop&category=Electronics&minPrice=500&isNew=true&sortBy=rating&sortOrder=desc&page=1&limit=15
```

**Response:**

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Product Name",
        "description": "Product Description",
        "price": "99.99",
        "discount": false,
        "discountPrice": null,
        "stock": 50,
        "sold": 10,
        "category": "Electronics",
        "thumbnail": "uploads/products/thumbnail-01-27-2025-123456789-product.jpg",
        "images": [
          "uploads/products/image1.jpg",
          "uploads/products/image2.jpg"
        ],
        "brand": "Brand Name",
        "rating": "4.5",
        "isNew": true,
        "isBestSeller": false,
        "isTopRated": true,
        "isOnSale": false,
        "isTrending": false,
        "isHot": false,
        "isFeatured": true,
        "numReviews": 25,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 50,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10,
      "offset": 0
    },
    "filters": {
      "availableCategories": ["Electronics", "Clothing", "Books"],
      "availableBrands": ["Apple", "Samsung", "Nike"]
    },
    "appliedFilters": {
      "search": "laptop",
      "category": "Electronics",
      "brand": null,
      "minPrice": "500",
      "maxPrice": "2000",
      "isNew": "true",
      "isBestSeller": null,
      "isTopRated": null,
      "isOnSale": null,
      "isTrending": null,
      "isHot": null,
      "isFeatured": null,
      "inStock": "true",
      "sortBy": "rating",
      "sortOrder": "desc"
    }
  }
}
```

---

#### 2. Get Product by ID

**GET** `/api/products/:id`

Get a specific product by its ID.

**Path Parameters:**

- `id`: Product UUID

**Response:**

```json
{
  "success": true,
  "message": "Product fetched successfully",
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "description": "Product Description",
    "price": "99.99",
    "thumbnail": "uploads/products/thumbnail.jpg",
    "images": ["uploads/products/image1.jpg", "uploads/products/image2.jpg"],
    "category": "Electronics",
    "brand": "Brand Name",
    "stock": 50,
    "sold": 10,
    "rating": "4.5",
    "isNew": true,
    "isFeatured": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `404` - Product not found

---

#### 3. Create Product

**POST** `/api/products`

Create a new product with thumbnail and multiple images.

**Request Body (multipart/form-data):**

```
name: "iPhone 15 Pro"
price: "999.99"
category: "Electronics"
brand: "Apple"
description: "Latest iPhone with advanced features"
stock: 50
isNew: true
isFeatured: true
thumbnail: [file] (single file)
images: [files] (multiple files, max 10)
```

**File Requirements:**

- **Thumbnail**: Single file upload (jpeg, jpg, png, gif, jfif, webp)
- **Images**: Multiple file uploads (max 10 files)
- **File Size**: Maximum 5MB per file
- **Storage**: Files stored in `uploads/products/` directory

**Response:**

```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "id": "uuid",
    "name": "iPhone 15 Pro",
    "price": "999.99",
    "category": "Electronics",
    "brand": "Apple",
    "thumbnail": "uploads/products/thumbnail-01-27-2025-123456789-iphone.jpg",
    "images": ["uploads/products/images-01-27-2025-987654321-iphone-front.jpg"],
    "stock": 50,
    "isNew": true,
    "isFeatured": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `400` - Missing required fields (name and price are required)
- `400` - Only image files are allowed (for invalid file types)

---

#### 4. Update Product

**PUT** `/api/products/:id`

Update an existing product with optional new images.

**Path Parameters:**

- `id`: Product UUID

**Request Body (multipart/form-data):**

```
name: "Updated Product Name"
price: "899.99"
category: "Electronics"
thumbnail: [file] (optional new thumbnail)
images: [files] (optional new images)
```

**Response:**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "product": {
    "id": "uuid",
    "name": "Updated Product Name",
    "price": "899.99",
    "thumbnail": "uploads/products/new-thumbnail.jpg",
    "images": ["uploads/products/new-image1.jpg"],
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `404` - Product not found

---

#### 5. Delete Product

**DELETE** `/api/products/:id`

Delete a product and its associated image files.

**Path Parameters:**

- `id`: Product UUID

**Response:**

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Error Responses:**

- `404` - Product not found

---

### Image Management

#### Static File Serving

Product images are served as static files from the `uploads/products/` directory.

**Server Configuration:**

```javascript
// Express.js static file serving
app.use("/uploads", express.static("uploads"));
```

**Image URL Format:**

```
http://localhost:3000/uploads/products/thumbnail-01-27-2025-123456789-product-image.jpg
```

#### File Naming Convention

- **Original**: `product-image.jpg`
- **Stored as**: `thumbnail-01-27-2025-123456789-product-image.jpg`
- **Format**: `{fieldname}-{MM-DD-YYYY}-{randomNumber}-{originalName}.{extension}`

#### Frontend Integration Example

```javascript
// Fetch products with pagination and filters
const fetchProducts = async (page = 1, filters = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    ...filters,
  });

  const response = await fetch(`/api/products?${params}`);
  const data = await response.json();

  return data.data;
};

// Create product with images
const createProductWithImages = async (
  productData,
  thumbnailFile,
  imageFiles
) => {
  const formData = new FormData();

  // Add product data
  Object.keys(productData).forEach((key) => {
    formData.append(key, productData[key]);
  });

  // Add thumbnail (single file)
  if (thumbnailFile) {
    formData.append("thumbnail", thumbnailFile);
  }

  // Add multiple images
  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });
  }

  const response = await fetch("/api/products", {
    method: "POST",
    body: formData,
  });

  return await response.json();
};

// Display product images
products.products.forEach((product) => {
  // Display thumbnail
  const thumbnailUrl = `http://localhost:3000/${product.thumbnail}`;

  // Display additional images
  product.images.forEach((imagePath) => {
    const imageUrl = `http://localhost:3000/${imagePath}`;
    // Use imageUrl in your UI
  });
});
```

---

### Health Check

**GET** `/`

Check server status.

**Response:**

```json
{
  "message": "Backend Authentication Server is running!",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🗄️ Database Schema

### Users Table

| Column       | Type      | Description                  |
| ------------ | --------- | ---------------------------- |
| `id`         | UUID      | Primary key (auto-generated) |
| `email`      | TEXT      | User email (unique)          |
| `name`       | TEXT      | User full name               |
| `isVerified` | BOOLEAN   | Email verification status    |
| `createdAt`  | TIMESTAMP | Account creation time        |
| `updatedAt`  | TIMESTAMP | Last update time             |

### OTPs Table

| Column      | Type      | Description                  |
| ----------- | --------- | ---------------------------- |
| `id`        | UUID      | Primary key (auto-generated) |
| `userId`    | UUID      | Foreign key to users table   |
| `otp`       | TEXT      | One-time password            |
| `expiresAt` | TIMESTAMP | OTP expiration time          |
| `createdAt` | TIMESTAMP | OTP creation time            |
| `updatedAt` | TIMESTAMP | Last update time             |

### Products Table

| Column          | Type      | Description                            |
| --------------- | --------- | -------------------------------------- |
| `id`            | UUID      | Primary key (auto-generated)           |
| `name`          | TEXT      | Product name (required)                |
| `description`   | TEXT      | Product description                    |
| `price`         | DECIMAL   | Product price (required)               |
| `discount`      | BOOLEAN   | Whether product has discount           |
| `discountPrice` | DECIMAL   | Discounted price                       |
| `stock`         | INTEGER   | Available stock quantity               |
| `sold`          | INTEGER   | Number of items sold (default: 0)      |
| `category`      | TEXT      | Product category                       |
| `thumbnail`     | TEXT      | Single thumbnail image path            |
| `images`        | TEXT      | JSON array of multiple image paths     |
| `brand`         | TEXT      | Product brand                          |
| `rating`        | DECIMAL   | Product rating                         |
| `isNew`         | BOOLEAN   | New product flag (default: true)       |
| `isBestSeller`  | BOOLEAN   | Best seller flag (default: false)      |
| `isTopRated`    | BOOLEAN   | Top rated flag (default: false)        |
| `isOnSale`      | BOOLEAN   | On sale flag (default: false)          |
| `isTrending`    | BOOLEAN   | Trending flag (default: false)         |
| `isHot`         | BOOLEAN   | Hot product flag (default: false)      |
| `isFeatured`    | BOOLEAN   | Featured product flag (default: false) |
| `numReviews`    | INTEGER   | Number of reviews (default: 0)         |
| `createdAt`     | TIMESTAMP | Product creation time                  |
| `updatedAt`     | TIMESTAMP | Last update time                       |

## 🔐 Authentication Flow

### Complete User Authentication Process

1. **User Registration**

   - User provides email and name
   - Account is created with `isVerified: false`

2. **OTP Generation**

   - User requests OTP using their email
   - System checks if user exists and is verified
   - 6-digit OTP is generated and stored (expires in 10 minutes)
   - OTP is sent via email (currently commented out in code)

3. **OTP Verification**

   - User submits email and OTP
   - System validates OTP and expiration
   - Upon successful verification, access and refresh tokens are issued
   - OTP is deleted from database

4. **Token Management**

   - Access tokens expire in 15 minutes (configurable)
   - Refresh tokens expire in 7 days (configurable)
   - Use refresh token endpoint to get new access tokens

5. **Protected Routes**
   - All user management endpoints require valid access token
   - Include token in Authorization header: `Bearer <access_token>`

### Rate Limiting

- **Global Rate Limit**: 5 requests per 30 seconds per IP
- Applied to all endpoints to prevent abuse

### CORS Configuration

- **Allowed Origins**:
  - `http://localhost:3000` (React app)
  - `http://localhost:5000` (Postman)
  - `http://localhost:5173` (Vite)
  - `https://your-production-domain.com` (Production)
- **Credentials**: Enabled for authentication cookies
- **Methods**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS

## 🔒 Security Features

- **Helmet**: Security headers protection against XSS, clickjacking, and MIME sniffing
- **CORS**: Cross-origin resource sharing configuration with whitelist
- **Rate Limiting**: API request rate limiting (5 requests per 30 seconds)
- **Input Validation**: Request body validation for required fields
- **JWT Security**: Secure token generation and validation with separate secrets
- **OTP Expiration**: Time-limited OTP codes (10 minutes)
- **Token Rotation**: New refresh tokens issued on each refresh
- **Database Security**: UUID primary keys and proper foreign key relationships

## 🧪 API Testing & Integration

### Testing the Product API

You can test the Product API endpoints using various methods:

#### Using cURL

```bash
# Get all products with pagination
curl "http://localhost:3000/api/products?page=1&limit=10"

# Search products
curl "http://localhost:3000/api/products?search=phone&category=Electronics"

# Filter by price range
curl "http://localhost:3000/api/products?minPrice=100&maxPrice=500"

# Get featured products
curl "http://localhost:3000/api/products?isFeatured=true&sortBy=rating&sortOrder=desc"
```

#### Using JavaScript/Fetch

```javascript
// Fetch products with advanced filtering
const fetchProducts = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:3000/api/products?${params}`);
  return await response.json();
};

// Example usage
const products = await fetchProducts({
  search: "laptop",
  category: "Electronics",
  minPrice: "500",
  maxPrice: "2000",
  isNew: "true",
  sortBy: "rating",
  sortOrder: "desc",
  page: "1",
  limit: "20",
});
```

#### Using Postman

1. Import the following collection structure:

   - `GET /api/products` - Get all products
   - `GET /api/products/:id` - Get product by ID
   - `POST /api/products` - Create product (with file upload)
   - `PUT /api/products/:id` - Update product
   - `DELETE /api/products/:id` - Delete product

2. Set up environment variables:
   - `base_url`: `http://localhost:3000`
   - `product_id`: `{product-uuid}`

### Frontend Integration Examples

#### React Integration

```jsx
import React, {useState, useEffect} from "react";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    try {
      const response = await fetch(
        `http://localhost:3000/api/products?${params}`
      );
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  return (
    <div>
      {/* Filter controls */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
        </select>
      </div>

      {/* Product grid */}
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img
              src={`http://localhost:3000/${product.thumbnail}`}
              alt={product.name}
            />
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            <p>{product.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### Vue.js Integration

```vue
<template>
  <div class="product-list">
    <div class="filters">
      <input v-model="searchTerm" placeholder="Search products..." />
      <select v-model="selectedCategory">
        <option value="">All Categories</option>
        <option value="Electronics">Electronics</option>
        <option value="Clothing">Clothing</option>
      </select>
    </div>

    <div class="products">
      <div v-for="product in products" :key="product.id" class="product">
        <img
          :src="`http://localhost:3000/${product.thumbnail}`"
          :alt="product.name"
        />
        <h3>{{ product.name }}</h3>
        <p>${{ product.price }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      products: [],
      searchTerm: "",
      selectedCategory: "",
    };
  },
  async mounted() {
    await this.fetchProducts();
  },
  methods: {
    async fetchProducts() {
      const params = new URLSearchParams();
      if (this.searchTerm) params.append("search", this.searchTerm);
      if (this.selectedCategory)
        params.append("category", this.selectedCategory);

      try {
        const response = await fetch(
          `http://localhost:3000/api/products?${params}`
        );
        const data = await response.json();
        if (data.success) {
          this.products = data.data.products;
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    },
  },
  watch: {
    searchTerm() {
      this.fetchProducts();
    },
    selectedCategory() {
      this.fetchProducts();
    },
  },
};
</script>
```

## 📦 Dependencies

### Production Dependencies

- `express` - Web framework
- `drizzle-orm` - TypeScript ORM
- `pg` - PostgreSQL client
- `jsonwebtoken` - JWT token handling
- `bcryptjs` - Password hashing
- `resend` - Email service
- `cors` - CORS middleware
- `helmet` - Security middleware
- `express-rate-limit` - Rate limiting
- `cookie-parser` - Cookie parsing
- `dotenv` - Environment variables
- `uuid` - UUID generation
- `multer` - File upload handling

### Development Dependencies

- `nodemon` - Development server
- `drizzle-kit` - Database migrations
- `@types/pg` - TypeScript types

## 🚀 Deployment

1. **Set production environment variables**
2. **Build the application** (if needed)
3. **Run database migrations**
4. **Start the production server**

**Using pnpm:**

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Run migrations
pnpm drizzle-kit migrate

# Start server
pnpm start
```

**Using npm:**

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Run migrations
npm run drizzle-kit migrate

# Start server
npm start
```

## 📝 Scripts

**Using pnpm:**

- `pnpm start` - Start production server
- `pnpm dev` - Start development server with nodemon
- `pnpm drizzle-kit generate` - Generate database migrations
- `pnpm drizzle-kit migrate` - Run database migrations

**Using npm:**

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run drizzle-kit generate` - Generate database migrations
- `npm run drizzle-kit migrate` - Run database migrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**John Carlien Trix Darlucio**

---

## 📧 Email Configuration

### Gmail Setup (Recommended)

1. **Sign up for Resend**: Go to [resend.com](https://resend.com) and create an account
2. **Get your API Key**:
   - Go to API Keys section in Resend dashboard
   - Create a new API key
   - Copy the API key (starts with `re_`)
3. **Verify your domain** (required for production):
   - Add your domain in Resend dashboard
   - Add the required DNS records
   - Wait for verification
4. **Configure in `.env` file**:
   ```env
   RESEND_API_KEY=re_your-resend-api-key
   MAIL_FROM_EMAIL=noreply@yourdomain.com
   MAIL_FROM_NAME=Your App Name
   ADMIN_EMAIL=admin@yourdomain.com
   ```

### Using Resend

- **Development**: You can use Resend's test domain for development
- **Production**: You must verify your own domain in Resend
- **API Limits**: Check Resend's pricing for sending limits

### Email Templates

The system includes HTML email templates for OTP delivery. Templates are located in `utils/email-format.js`.

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Verify `DATABASE_URL` is correct
   - Ensure PostgreSQL is running
   - Check database credentials
   - Run migrations: `pnpm drizzle-kit migrate`

2. **Email Service Error**

   - Verify `RESEND_API_KEY` is correct
   - Ensure `MAIL_FROM_EMAIL` is verified in Resend (for production)
   - Check Resend dashboard for API key status
   - Verify domain is properly configured in Resend (for production)

3. **JWT Token Error**

   - Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
   - Use strong, unique secret keys (at least 32 characters)
   - Check token expiration settings
   - Verify token format in Authorization header

4. **Port Already in Use**

   - Change `SERVER_PORT` in `.env`
   - Kill existing processes on the port
   - Use a different port number

5. **CORS Errors**

   - Add your frontend URL to `config/cors.js`
   - Ensure exact URL match (including protocol and port)
   - Check if credentials are enabled

6. **Rate Limit Exceeded**

   - Default limit: 5 requests per 30 seconds
   - Adjust settings in `config/rate-limit.js`
   - Implement proper error handling in frontend

7. **OTP Issues**
   - OTP expires in 10 minutes
   - Only one OTP per user at a time
   - Check if user is verified before generating OTP

### Development Tips

- Use Postman or similar tools to test API endpoints
- Check server logs for detailed error messages
- Verify environment variables are loaded correctly
- Test authentication flow step by step

### Support

For support and questions, please open an issue in the repository.
