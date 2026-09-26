-- ============================================================================
-- StockSense Enterprise Inventory Management System (IMS)
-- Database Schema Definition (Phase 1 & Phase 2)
-- Engine: MySQL 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS stocksense_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE stocksense_db;

-- ----------------------------------------------------------------------------
-- 1. Users Table (Authentication & RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('INVENTORY_MANAGER', 'WAREHOUSE_STAFF') NOT NULL DEFAULT 'INVENTORY_MANAGER',
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Password Resets Table (Secure OTP Verification)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_resets_email (email),
  INDEX idx_password_resets_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Categories Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Warehouses Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  address TEXT,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_warehouses_code (code),
  INDEX idx_warehouses_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Locations Table (Specific bays/aisles/shelves inside a warehouse)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_locations_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY uq_location_wh_code (warehouse_id, code),
  INDEX idx_locations_warehouse (warehouse_id),
  INDEX idx_locations_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Products Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  category_id INT NOT NULL,
  unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'Units',
  reorder_level DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_products_sku (sku),
  INDEX idx_products_name (name),
  INDEX idx_products_category (category_id),
  INDEX idx_products_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. Inventory Table (Product Stock at Specific Location)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  location_id INT NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY uq_inventory_product_location (product_id, location_id),
  INDEX idx_inventory_product (product_id),
  INDEX idx_inventory_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. Receipts (Inbound PO Shipments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_number VARCHAR(100) NOT NULL UNIQUE,
  supplier_name VARCHAR(255) DEFAULT NULL,
  warehouse_id INT NOT NULL,
  location_id INT NOT NULL,
  status ENUM('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED') NOT NULL DEFAULT 'DRAFT',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_receipts_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_receipts_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_receipts_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_receipts_number (receipt_number),
  INDEX idx_receipts_status (status),
  INDEX idx_receipts_warehouse (warehouse_id),
  INDEX idx_receipts_location (location_id),
  INDEX idx_receipts_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. Receipt Items (Inbound Line Items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receipt_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  location_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_receipt_items_receipt
    FOREIGN KEY (receipt_id) REFERENCES receipts(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_receipt_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_receipt_items_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_receipt_items_receipt (receipt_id),
  INDEX idx_receipt_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. Deliveries (Outbound Customer Orders)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_number VARCHAR(100) NOT NULL UNIQUE,
  customer_name VARCHAR(255) DEFAULT NULL,
  warehouse_id INT NOT NULL,
  status ENUM('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED') NOT NULL DEFAULT 'DRAFT',
  stage ENUM('PENDING', 'PICKED', 'PACKED', 'DISPATCHED') NOT NULL DEFAULT 'PENDING',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_deliveries_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_deliveries_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_deliveries_number (delivery_number),
  INDEX idx_deliveries_status (status),
  INDEX idx_deliveries_stage (stage),
  INDEX idx_deliveries_warehouse (warehouse_id),
  INDEX idx_deliveries_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. Delivery Items (Outbound Line Items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_id INT NOT NULL,
  product_id INT NOT NULL,
  location_id INT NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_delivery_items_delivery
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_items_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_delivery_items_delivery (delivery_id),
  INDEX idx_delivery_items_product (product_id),
  INDEX idx_delivery_items_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. Transfers (Internal Movements between bays/warehouses)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transfer_number VARCHAR(100) NOT NULL UNIQUE,
  source_warehouse_id INT NOT NULL,
  source_location_id INT NOT NULL,
  destination_warehouse_id INT NOT NULL,
  destination_location_id INT NOT NULL,
  status ENUM('DRAFT', 'READY', 'DONE', 'CANCELED') NOT NULL DEFAULT 'DRAFT',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transfers_src_wh
    FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transfers_src_loc
    FOREIGN KEY (source_location_id) REFERENCES locations(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transfers_dest_wh
    FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transfers_dest_loc
    FOREIGN KEY (destination_location_id) REFERENCES locations(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transfers_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_transfers_number (transfer_number),
  INDEX idx_transfers_status (status),
  INDEX idx_transfers_src (source_warehouse_id, source_location_id),
  INDEX idx_transfers_dest (destination_warehouse_id, destination_location_id),
  INDEX idx_transfers_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. Transfer Items (Internal Relocation Items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transfer_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transfer_items_transfer
    FOREIGN KEY (transfer_id) REFERENCES transfers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_transfer_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_transfer_items_transfer (transfer_id),
  INDEX idx_transfer_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. Stock Adjustments (Cycle Count Discrepancy Reconciliation)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adjustment_number VARCHAR(100) NOT NULL UNIQUE,
  product_id INT NOT NULL,
  location_id INT NOT NULL,
  recorded_quantity DECIMAL(12, 2) NOT NULL,
  counted_quantity DECIMAL(12, 2) NOT NULL,
  difference DECIMAL(12, 2) NOT NULL,
  reason TEXT DEFAULT NULL,
  status ENUM('DRAFT', 'APPLIED', 'CANCELED') NOT NULL DEFAULT 'DRAFT',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_adjustments_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_adjustments_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_adjustments_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_adjustments_number (adjustment_number),
  INDEX idx_adjustments_status (status),
  INDEX idx_adjustments_prod_loc (product_id, location_id),
  INDEX idx_adjustments_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. Stock Movements (Immutable Movement Ledger / Audit History)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  location_id INT NOT NULL,
  movement_type ENUM('RECEIPT', 'DELIVERY', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT') NOT NULL,
  reference_type ENUM('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT') NOT NULL,
  reference_id INT NOT NULL,
  quantity_before DECIMAL(12, 2) NOT NULL,
  quantity_change DECIMAL(12, 2) NOT NULL,
  quantity_after DECIMAL(12, 2) NOT NULL,
  user_id INT NOT NULL,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movements_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_movements_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_movements_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_movements_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_movements_product (product_id),
  INDEX idx_movements_warehouse (warehouse_id),
  INDEX idx_movements_location (location_id),
  INDEX idx_movements_type (movement_type),
  INDEX idx_movements_ref (reference_type, reference_id),
  INDEX idx_movements_user (user_id),
  INDEX idx_movements_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
