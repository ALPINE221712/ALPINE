# StockSense Enterprise IMS — Backend API (Phase 1 & Phase 2)

Enterprise REST API backend for the **StockSense Enterprise Inventory Management System**. Built with Node.js, Express, MySQL 8.0, and secure HttpOnly cookie session authentication.

---

## Architecture Overview

```
backend/
├── config/
│   └── db.js                 # MySQL2 connection pool & transaction helper
├── controllers/
│   ├── authController.js     # Auth, session, and OTP password recovery
│   ├── categoryController.js # Category management
│   ├── productController.js  # Product management with total stock aggregation
│   ├── warehouseController.js# Multi-facility management
│   ├── locationController.js # Bay / aisle / location management
│   └── inventoryController.js# Real-time stock balances and low-stock detection
├── database/
│   └── schema.sql            # MySQL schema definition (users, products, inventory, etc.)
├── middleware/
│   ├── authMiddleware.js     # requireAuth and requireRole RBAC guards
│   └── errorMiddleware.js    # Centralized error and 404 handler
├── models/
│   ├── User.js
│   ├── Category.js
│   ├── Product.js
│   ├── Warehouse.js
│   ├── Location.js
│   └── Inventory.js
├── routes/
│   ├── authRoutes.js
│   ├── categoryRoutes.js
│   ├── productRoutes.js
│   ├── warehouseRoutes.js
│   ├── locationRoutes.js
│   └── inventoryRoutes.js
├── services/
│   ├── authService.js
│   ├── productService.js
│   └── inventoryService.js
├── utils/
│   └── responseHandler.js    # Standardized JSON response format
├── .env.example
├── app.js
├── server.js
├── test_suite.js             # Automated end-to-end integration test suite
└── package.json
```

---

## 1. Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MySQL Server**: v8.0 or higher

### Environment Configuration
Copy `.env.example` to `.env` and configure your credentials:

```bash
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
AUTH_COOKIE_NAME=stocksense_token
JWT_SECRET=your_secure_random_jwt_secret_key_here
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=stocksense_db
DB_CONNECTION_LIMIT=10
```

### Database Initialization
Execute the schema migration script in MySQL:

```bash
mysql -u root -p < database/schema.sql
```

### Install Dependencies & Start

```bash
cd backend
npm install
npm start          # Production start
npm run dev        # Development with nodemon
npm test           # Execute automated integration test suite
```

---

## 2. API Response Standard

All endpoints return a predictable JSON payload:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional operational feedback"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 3. Endpoints Documentation

### 3.1 Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `POST` | `/api/auth/signup` | Public | Register a new operator (`INVENTORY_MANAGER` or `WAREHOUSE_STAFF`). Sets HttpOnly cookie. |
| `POST` | `/api/auth/login` | Public | Authenticate operator credentials. Sets HttpOnly cookie. |
| `POST` | `/api/auth/logout` | Public | Invalidate and clear HttpOnly cookie. |
| `GET` | `/api/auth/me` | Protected | Retrieve active operator profile (`requireAuth`). |
| `POST` | `/api/auth/forgot-password`| Public | Dispatch 6-digit OTP code to registered email. |
| `POST` | `/api/auth/verify-otp` | Public | Verify 6-digit OTP code against unexpired record. |
| `POST` | `/api/auth/reset-password` | Public | Define new password using verified OTP code. |

#### Example: Signup Request
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "Marcus Vance",
  "email": "m.vance@stocksense.corp",
  "password": "enterprise2024",
  "role": "INVENTORY_MANAGER"
}
```

#### Example: Signup Response (201 Created)
```json
{
  "success": true,
  "message": "Operator account created successfully.",
  "data": {
    "user": {
      "id": 1,
      "name": "Marcus Vance",
      "email": "m.vance@stocksense.corp",
      "role": "INVENTORY_MANAGER",
      "status": "ACTIVE",
      "created_at": "2026-09-26T05:48:08.000Z",
      "updated_at": "2026-09-26T05:48:08.000Z"
    }
  }
}
```

---

### 3.2 Categories (`/api/categories`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/categories` | Public | List categories with active product count. |
| `GET` | `/api/categories/:id` | Public | Retrieve single category by ID. |
| `POST` | `/api/categories` | Protected | Create category (`name`, `description`). |
| `PUT` | `/api/categories/:id` | Protected | Update category details. |
| `DELETE`| `/api/categories/:id` | Manager | Delete category (blocked if referenced by products). |

---

### 3.3 Warehouses (`/api/warehouses`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/warehouses` | Public | List warehouses with location count and total stock units. |
| `GET` | `/api/warehouses/:id` | Public | Retrieve warehouse by ID. |
| `POST` | `/api/warehouses` | Protected | Create warehouse (`name`, `code`, `address`, `status`). |
| `PUT` | `/api/warehouses/:id` | Protected | Update warehouse. |
| `DELETE`| `/api/warehouses/:id` | Manager | Delete warehouse (blocked if locations exist). |

---

### 3.4 Locations (`/api/locations`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/locations` | Public | List locations. Supports query `?warehouse_id=1`. |
| `GET` | `/api/locations/:id` | Public | Retrieve location by ID. |
| `POST` | `/api/locations` | Protected | Create location (`warehouse_id`, `name`, `code`, `status`). |
| `PUT` | `/api/locations/:id` | Protected | Update location. |
| `DELETE`| `/api/locations/:id` | Manager | Delete location (blocked if active inventory > 0). |

---

### 3.5 Products (`/api/products`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/products` | Public | List products with computed `total_stock`. Filters: `?search=term`, `?category_id=1`, `?status=ACTIVE`. |
| `GET` | `/api/products/:id` | Public | Retrieve product with location breakdown. |
| `POST` | `/api/products` | Protected | Create product with optional `initial_stock` and `initial_location_id`. |
| `PUT` | `/api/products/:id` | Protected | Update product details. |
| `DELETE`| `/api/products/:id` | Manager | Delete product (blocked if on-hand stock > 0). |

#### Example: Create Product with Initial Stock
```http
POST /api/products
Content-Type: application/json

{
  "name": "Aluminium Structural Angle 40x40mm",
  "sku": "SKU-AL-4401",
  "category_id": 1,
  "unit_of_measure": "Meters",
  "reorder_level": 50,
  "status": "ACTIVE",
  "initial_stock": 120,
  "initial_location_id": 1
}
```

*Note: Initial stock creation runs in an atomic MySQL transaction (`withTransaction`) that inserts the product record and creates the location allocation simultaneously.*

---

### 3.6 Inventory Balances (`/api/inventory`)

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| `GET` | `/api/inventory` | Public | List inventory balances. Filters: `?product_id=1`, `?location_id=2`, `?warehouse_id=1`. |
| `GET` | `/api/inventory/product/:productId` | Public | Location breakdown for a specific product. |
| `GET` | `/api/inventory/location/:locationId`| Public | List all SKU quantities stored in a specific location. |
| `GET` | `/api/inventory/low-stock` | Public | List products where `total_stock <= reorder_level`. |

#### Example: Low-Stock Response
```json
{
  "success": true,
  "data": [
    {
      "product_id": 2,
      "product_name": "Hydraulic Pressure Seals",
      "sku": "SKU-SEAL-01",
      "category_name": "Industrial Components",
      "unit_of_measure": "Pieces",
      "reorder_level": 25.00,
      "total_stock": 4.00,
      "stock_status": "LOW_STOCK"
    },
    {
      "product_id": 5,
      "product_name": "O-Ring Kit Metric",
      "sku": "SKU-ORING-99",
      "category_name": "Industrial Components",
      "unit_of_measure": "Kits",
      "reorder_level": 10.00,
      "total_stock": 0.00,
      "stock_status": "OUT_OF_STOCK"
    }
  ]
}
```

---

## 4. Frontend Integration Plan (Future Phase 3)

The existing React/Vite frontend uses `src/store/inventoryStore.tsx` with mock data and `localStorage`. When connecting to the backend, the following replacements will be made:

| Frontend Store Function | Backend API Call |
|:---|:---|
| `login(email, password)` | `POST /api/auth/login` |
| `signup(name, email, role)` | `POST /api/auth/signup` |
| `logout()` | `POST /api/auth/logout` |
| `init / check auth` | `GET /api/auth/me` |
| `forgotPassword` flow | `POST /api/auth/forgot-password`, `verify-otp`, `reset-password` |
| `products` load | `GET /api/products` |
| `createProduct(product)` | `POST /api/products` |
| `updateProduct(id, data)` | `PUT /api/products/:id` |
| `warehouses` load | `GET /api/warehouses` |
| `locations` load | `GET /api/locations` |
| `lowStock` alerts | `GET /api/inventory/low-stock` |
| Receipts, Deliveries, Transfers, Adjustments | Phase 3 Backend APIs |
