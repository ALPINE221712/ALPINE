# StockSense Enterprise IMS

A professional, full-stack **Inventory Management System (IMS)** designed to digitize and streamline inventory operations across products, warehouses, locations, receipts, deliveries, internal transfers, stock adjustments, and stock movement history.

StockSense provides a centralized interface for inventory operators and warehouse staff to manage stock movement and maintain accurate inventory records across multiple facilities.

---

## Overview

StockSense Enterprise IMS manages the complete inventory lifecycle:

```text
Products
   ↓
Incoming Receipts
   ↓
Inventory
   ↓
Internal Transfers
   ↓
Outbound Deliveries
   ↓
Stock Adjustments
   ↓
Immutable Stock Ledger
```

The system supports:

* Product and SKU management
* Category management
* Multi-warehouse inventory
* Storage locations
* Incoming stock receipts
* Outbound delivery orders
* Picking and dispatch validation
* Internal stock transfers
* Physical stock adjustments
* Low-stock detection
* Stock movement history
* Operator authentication
* OTP-based password recovery
* Role-aware access control
* Dashboard inventory monitoring

---

# Features

## 1. Authentication & Account Management

StockSense provides secure operator authentication with:

* User registration
* Login and logout
* HttpOnly cookie-based authentication
* Protected API routes
* Current-user/session verification
* OTP-based password recovery
* OTP verification
* Password reset
* Operator roles

Supported operator roles include:

* `INVENTORY_MANAGER`
* `WAREHOUSE_STAFF`

Authentication is handled by the Express backend and persisted through secure session cookies.

---

## 2. Dashboard

### Route

```text
/dashboard
```

The dashboard provides an operational overview of the inventory system.

It includes:

* Inventory valuation
* Active SKU information
* Low-stock monitoring
* Pending inbound receipts
* Outbound delivery status
* Warehouse capacity information
* Catalog overview
* Recent stock operations
* Inventory activity
* CSV export functionality

The dashboard retrieves inventory information through the backend API rather than relying exclusively on static frontend data.

---

## 3. Product Management

### Route

```text
/products
```

The Product Catalog provides centralized management of inventory items.

Each product can contain:

* Product name
* SKU / product code
* Category
* Unit of measure
* Reorder level
* Status
* Initial stock
* Initial storage location

Supported operations:

* Create product
* Update product
* View product details
* Search products
* Filter products
* View total stock
* View stock by location
* Monitor stock status
* Delete products when inventory constraints allow

Stock statuses include:

* `AVAILABLE`
* `LOW_STOCK`
* `OUT_OF_STOCK`

Initial inventory allocation is processed using a transactional backend operation.

---

## 4. Categories

StockSense provides category management for organizing the product catalog.

Supported operations:

* List categories
* Create categories
* Update categories
* Delete categories where permitted
* View active product counts

Categories are associated with products through the backend database.

---

## 5. Inventory & Stock Availability

The inventory module maintains stock balances across products and storage locations.

Inventory can be queried by:

* Product
* Location
* Warehouse

The system also provides:

```text
GET /api/inventory/low-stock
```

to identify products whose total stock is at or below their configured reorder level.

Inventory information includes:

* Product
* SKU
* Category
* Unit of measure
* Reorder level
* Total stock
* Stock status
* Location allocation

---

# 6. Incoming Receipts

### Route

```text
/receipts
```

Receipts are used to record incoming goods from suppliers.

The receiving workflow supports:

1. Create receipt
2. Add supplier information
3. Add products
4. Enter expected/received quantities
5. Review receiving information
6. Validate the receipt

When a receipt is validated:

```text
Receipt Validation
        ↓
Inventory Increased
        ↓
Stock Movement Recorded
```

The corresponding stock movement is recorded in the immutable stock ledger.

### Backend endpoints

```text
GET    /api/receipts
GET    /api/receipts/:id
POST   /api/receipts
PUT    /api/receipts/:id
POST   /api/receipts/:id/validate
```

---

# 7. Outbound Delivery Orders

### Route

```text
/deliveries
```

Delivery orders manage outgoing inventory.

The fulfillment workflow supports:

```text
Delivery Order
      ↓
Pick
      ↓
Pack
      ↓
Validate / Dispatch
      ↓
Inventory Decrease
      ↓
Stock Movement Logged
```

## Dispatch Guard

Before dispatching an order, StockSense checks available inventory.

If requested quantity exceeds available stock:

* Dispatch is blocked
* The user receives an error/warning
* Negative inventory is prevented
* The delivery cannot be incorrectly completed

This protects inventory integrity during outbound operations.

### Backend endpoints

```text
GET    /api/deliveries
GET    /api/deliveries/:id
POST   /api/deliveries
PUT    /api/deliveries/:id
POST   /api/deliveries/:id/pick
POST   /api/deliveries/:id/pack
POST   /api/deliveries/:id/validate
```

---

# 8. Internal Stock Transfers

### Route

```text
/transfers
```

Internal transfers move inventory between warehouses or storage locations.

Examples:

```text
Warehouse 1 → Warehouse 2
Main Store  → Production Area
Rack A      → Rack B
```

A transfer contains source and destination information and the products/quantities being moved.

When a transfer is validated:

```text
Source Inventory
      ↓
Stock Decreased
      ↓
Destination Inventory
      ↓
Stock Increased
      ↓
Movement Recorded
```

The overall enterprise stock quantity remains consistent while the physical location allocation changes.

### Backend endpoints

```text
GET    /api/transfers
GET    /api/transfers/:id
POST   /api/transfers
PUT    /api/transfers/:id
POST   /api/transfers/:id/validate
```

---

# 9. Stock Adjustments & Cycle Counts

### Route

```text
/adjustments
```

Stock adjustments are used to reconcile recorded inventory with physical inventory counts.

The workflow follows:

```text
Recorded
   ↓
Counted
   ↓
Difference
   ↓
Adjust Stock
   ↓
Updated
   ↓
Logged
```

The system calculates inventory variance and applies the physical count when the adjustment is committed.

The resulting stock movement is recorded in the stock ledger.

### Backend endpoints

```text
GET    /api/adjustments
GET    /api/adjustments/:id
POST   /api/adjustments
PUT    /api/adjustments/:id
POST   /api/adjustments/:id/apply
```

---

# 10. Stock Ledger & Movement History

### Route

```text
/ledger
```

The Stock Ledger provides a chronological history of inventory movements.

It records operations such as:

* Receipts
* Deliveries
* Internal transfers
* Stock adjustments

Each movement can contain information such as:

* Product
* SKU
* Movement type
* Quantity
* Quantity before movement
* Quantity after movement
* Source location
* Destination location
* Warehouse
* Reference
* Timestamp

## Immutable Ledger

The ledger is intentionally read-only.

Direct creation, modification, or deletion of stock ledger records through the ledger API is blocked.

Inventory movements are generated by the corresponding business workflows instead.

This ensures that the ledger acts as a historical record of inventory activity.

### Backend endpoints

```text
GET /api/ledger
GET /api/ledger/:id
```

Direct:

```text
POST
PUT
PATCH
DELETE
```

operations on ledger records are rejected.

---

# 11. Warehouses

### Route

```text
/warehouses
```

StockSense supports multiple warehouse/facility records.

A warehouse can contain:

* Name
* Warehouse code
* Address
* Status
* Storage locations
* Inventory allocations

Warehouse-level inventory can be queried and managed through the backend.

### Backend endpoints

```text
GET    /api/warehouses
GET    /api/warehouses/:id
POST   /api/warehouses
PUT    /api/warehouses/:id
DELETE /api/warehouses/:id
```

---

# 12. Storage Locations

Storage locations represent physical inventory areas within warehouses.

Examples include:

```text
Bay A
Rack B
Production Floor
Storage Bin 01
```

Locations are associated with warehouses and can be used to track product quantities at a more granular level.

### Backend endpoints

```text
GET    /api/locations
GET    /api/locations/:id
POST   /api/locations
PUT    /api/locations/:id
DELETE /api/locations/:id
```

Locations can also be filtered by warehouse:

```text
GET /api/locations?warehouse_id=1
```

---

# 13. Global Command Palette

StockSense includes a global command palette accessible through:

```text
Ctrl + K
```

or

```text
⌘ K
```

It provides a centralized way to navigate and access inventory operations.

The command interface is designed to provide quick access to:

* Products
* Receipts
* Deliveries
* Transfers
* Stock counts
* Ledger
* Warehouse operations

---

# 14. Profile & Operator Settings

### Route

```text
/profile
```

The profile section provides operator information and configuration.

It includes:

* Operator profile
* Facility assignment
* Account information
* Inventory-related preferences
* Alert threshold preferences

Authentication and operator information are retrieved from the backend session.

---

# Technology Stack

## Frontend

* React 18
* TypeScript
* Vite 6
* React Router
* Tailwind CSS
* Lucide React
* Context API
* Fetch API

## Backend

* Node.js
* Express.js
* MySQL
* mysql2
* JWT
* HttpOnly cookies
* bcryptjs
* CORS
* dotenv
* Nodemon

## Database

StockSense uses MySQL for persistent storage.

The backend database schema includes entities for:

* Users
* Products
* Categories
* Warehouses
* Locations
* Inventory
* Receipts
* Deliveries
* Transfers
* Adjustments
* Stock Movements

---

# Architecture

StockSense follows a frontend/backend architecture:

```text
┌─────────────────────────────┐
│        React Frontend       │
│                             │
│ Dashboard                   │
│ Products                    │
│ Receipts                    │
│ Deliveries                  │
│ Transfers                   │
│ Adjustments                 │
│ Ledger                      │
│ Warehouses                  │
│ Profile                     │
└──────────────┬──────────────┘
               │
               │ REST API
               │ HttpOnly Cookie
               ▼
┌─────────────────────────────┐
│      Express Backend        │
│                             │
│ Routes                      │
│ Controllers                 │
│ Services                    │
│ Middleware                  │
│ Authentication              │
└──────────────┬──────────────┘
               │
               │ mysql2
               ▼
┌─────────────────────────────┐
│          MySQL              │
│                             │
│ Users                       │
│ Products                    │
│ Inventory                   │
│ Warehouses                  │
│ Locations                   │
│ Receipts                    │
│ Deliveries                  │
│ Transfers                   │
│ Adjustments                 │
│ Stock Movements             │
└─────────────────────────────┘
```

---

# API Client

The frontend uses a centralized API client located at:

```text
src/lib/api.ts
```

The API client:

* Uses `VITE_API_URL`
* Sends credentials with requests
* Communicates with the Express backend
* Provides domain-specific API services
* Handles API errors consistently

The default development API URL is:

```text
http://localhost:5000/api
```

---

# Project Structure

```text
StockSense Enterprise IMS
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── adjustmentController.js
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── deliveryController.js
│   │   ├── inventoryController.js
│   │   ├── ledgerController.js
│   │   ├── locationController.js
│   │   ├── productController.js
│   │   ├── receiptController.js
│   │   ├── transferController.js
│   │   └── warehouseController.js
│   │
│   ├── database/
│   │   ├── schema.sql
│   │   └── schema_phase3.sql
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   │
│   ├── models/
│   │   ├── Adjustment.js
│   │   ├── Category.js
│   │   ├── Delivery.js
│   │   ├── Inventory.js
│   │   ├── Location.js
│   │   ├── Product.js
│   │   ├── Receipt.js
│   │   ├── StockMovement.js
│   │   ├── Transfer.js
│   │   ├── User.js
│   │   └── Warehouse.js
│   │
│   ├── routes/
│   │   ├── adjustmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── deliveryRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── ledgerRoutes.js
│   │   ├── locationRoutes.js
│   │   ├── productRoutes.js
│   │   ├── receiptRoutes.js
│   │   ├── transferRoutes.js
│   │   └── warehouseRoutes.js
│   │
│   ├── services/
│   │   ├── adjustmentService.js
│   │   ├── authService.js
│   │   ├── deliveryService.js
│   │   ├── inventoryService.js
│   │   ├── productService.js
│   │   ├── receiptService.js
│   │   └── transferService.js
│   │
│   ├── utils/
│   │   └── responseHandler.js
│   │
│   ├── app.js
│   ├── server.js
│   ├── test_suite.js
│   ├── .env.example
│   └── package.json
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── search/
│   │
│   ├── data/
│   ├── layouts/
│   ├── lib/
│   │   └── api.ts
│   │
│   ├── pages/
│   │   ├── adjustments/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── deliveries/
│   │   ├── landing/
│   │   ├── ledger/
│   │   ├── products/
│   │   ├── profile/
│   │   ├── receipts/
│   │   ├── transfers/
│   │   └── warehouses/
│   │
│   ├── store/
│   │   └── inventoryStore.tsx
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── .env.example
```

---

# Getting Started

## Prerequisites

Install:

* Node.js 18+
* npm
* MySQL 8.0+

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd ALPINE-main
```

---

# 2. Configure the Backend

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure the required environment variables.

Example:

```env
PORT=5000
NODE_ENV=development

CORS_ORIGIN=http://localhost:3000

AUTH_COOKIE_NAME=stocksense_token
JWT_SECRET=replace_with_a_secure_secret
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=stocksense_db
DB_CONNECTION_LIMIT=10
```

---

# 3. Initialize the Database

Create the MySQL database and execute the schema provided in:

```text
backend/database/schema.sql
```

Example:

```bash
mysql -u root -p < database/schema.sql
```

If additional phase-specific schema changes are required, apply the corresponding:

```text
backend/database/schema_phase3.sql
```

---

# 4. Start the Backend

From the `backend` directory:

```bash
npm start
```

For development:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

The API base URL is:

```text
http://localhost:5000/api
```

---

# 5. Configure the Frontend

Return to the project root:

```bash
cd ..
```

Install frontend dependencies:

```bash
npm install
```

Create the frontend environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set:

```env
VITE_API_URL=http://localhost:5000/api
```

---

# 6. Start the Frontend

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

The default Vite development port is normally:

```text
http://localhost:5173
```

If a different port is configured or available, use the URL displayed by Vite.

---

# Production Build

Build the frontend:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The backend can be started using:

```bash
cd backend
npm start
```

---

# Backend Testing

The backend includes an integration test suite.

From:

```text
backend/
```

run:

```bash
npm test
```

The test suite exercises core inventory workflows and backend operations.

---

# Security

StockSense includes several backend security mechanisms:

* HttpOnly authentication cookies
* Password hashing with bcrypt
* JWT-based sessions
* Protected API routes
* Role-aware authorization middleware
* Environment-based secrets
* Centralized error handling
* Database transactions for critical inventory operations
* Immutable stock ledger enforcement
* Negative inventory prevention during dispatch validation

Authentication cookies are sent through the frontend API client using:

```text
credentials: include
```

---

# Inventory Integrity

Inventory-changing operations are handled by dedicated backend services rather than directly manipulating frontend state.

Core inventory operations include:

```text
Receipt Validation
       ↓
Stock Increase

Delivery Validation
       ↓
Stock Decrease

Transfer Validation
       ↓
Source Decrease
Destination Increase

Adjustment Apply
       ↓
Physical Count Reconciliation
```

Each completed inventory movement is recorded in the stock movement ledger.

---

# API Overview

The backend exposes REST APIs under:

```text
/api
```

Main API groups include:

```text
/api/auth
/api/categories
/api/products
/api/warehouses
/api/locations
/api/inventory
/api/receipts
/api/deliveries
/api/transfers
/api/adjustments
/api/ledger
```

All protected endpoints require a valid authenticated session.

---

# Inventory Lifecycle

A typical inventory lifecycle in StockSense is:

```text
Supplier
   │
   ▼
Receipt
   │
   │ Validate
   ▼
Warehouse Inventory
   │
   ├───────────────┐
   │               │
   ▼               ▼
Transfer         Delivery
   │               │
   ▼               │
New Location      Dispatch
                   │
                   ▼
              Stock Decrease
                   
Physical Count
      │
      ▼
Adjustment
      │
      ▼
Updated Inventory

All inventory-changing operations
              │
              ▼
       Stock Movement Ledger
```

---

# Design Reference

StockSense was developed around the supplied inventory management workflow and UI/UX design specifications.

The system is designed around:

* High-density desktop inventory operations
* Warehouse-based stock management
* Product/SKU visibility
* Receipt and delivery workflows
* Internal stock movement
* Physical inventory reconciliation
* Centralized movement history

---

# Development Notes

The frontend contains reusable UI components for:

* KPI cards
* Status badges
* Modals
* Toast notifications
* Navigation
* Command palette
* Application layouts

The backend follows a layered structure:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Models / Database
```

This separation keeps HTTP handling, business logic, and persistence responsibilities distinct.

---

# License

This project is intended for development, demonstration, and educational purposes unless a separate license agreement applies.