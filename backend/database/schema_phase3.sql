-- ============================================================================
-- StockSense Enterprise IMS — Phase 3 Database Schema
-- Transaction Engine & Immutable Stock Ledger
-- ============================================================================

USE stocksense_db;

-- ----------------------------------------------------------------------------
-- 1. Receipts (Inbound PO Shipments)
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
-- 2. Receipt Items (Inbound Line Items)
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
-- 3. Deliveries (Outbound Customer Orders)
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
-- 4. Delivery Items (Outbound Line Items)
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
-- 5. Transfers (Internal Movements between bays/warehouses)
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
-- 6. Transfer Items (Internal Relocation Items)
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
-- 7. Stock Adjustments (Cycle Count Discrepancy Reconciliation)
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
-- 8. Stock Movements (Immutable Movement Ledger / Audit History)
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
