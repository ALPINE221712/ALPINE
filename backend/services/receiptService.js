const { withTransaction, pool } = require('../config/db');
const Receipt = require('../models/Receipt');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

const receiptService = {
  async getAllReceipts(filters) {
    return Receipt.findAll(filters);
  },

  async getReceiptById(id) {
    const receipt = await Receipt.findById(id);
    if (!receipt) {
      const err = new Error('Receipt not found.');
      err.statusCode = 404;
      throw err;
    }
    return receipt;
  },

  async createReceipt({ receipt_number, supplier_name, warehouse_id, location_id, items = [] }, userId) {
    if (!warehouse_id) {
      const err = new Error('Warehouse ID is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!location_id) {
      const err = new Error('Receiving location ID is required.');
      err.statusCode = 400;
      throw err;
    }

    // Verify warehouse & location
    const warehouse = await Warehouse.findById(warehouse_id);
    if (!warehouse) {
      const err = new Error(`Warehouse with ID ${warehouse_id} does not exist.`);
      err.statusCode = 400;
      throw err;
    }

    const location = await Location.findById(location_id);
    if (!location) {
      const err = new Error(`Receiving location with ID ${location_id} does not exist.`);
      err.statusCode = 400;
      throw err;
    }

    if (location.warehouse_id !== parseInt(warehouse_id, 10)) {
      const err = new Error(`Receiving location "${location.code}" does not belong to warehouse "${warehouse.name}".`);
      err.statusCode = 400;
      throw err;
    }

    if (!items || items.length === 0) {
      const err = new Error('A receipt must contain at least one product line item.');
      err.statusCode = 400;
      throw err;
    }

    // Generate or format receipt number
    const recNumber = receipt_number
      ? receipt_number.trim().toUpperCase()
      : `REC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 899)}`;

    const existingRec = await Receipt.findByNumber(recNumber);
    if (existingRec) {
      const err = new Error(`Receipt number "${recNumber}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    // Validate items
    for (const item of items) {
      if (!item.product_id) {
        const err = new Error('Each line item must have a valid product_id.');
        err.statusCode = 400;
        throw err;
      }
      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        const err = new Error('Line item quantities must be greater than zero.');
        err.statusCode = 400;
        throw err;
      }
      const product = await Product.findById(item.product_id);
      if (!product) {
        const err = new Error(`Product with ID ${item.product_id} does not exist.`);
        err.statusCode = 400;
        throw err;
      }
    }

    return withTransaction(async (conn) => {
      const receiptId = await Receipt.create(
        {
          receipt_number: recNumber,
          supplier_name: supplier_name ? supplier_name.trim() : null,
          warehouse_id,
          location_id,
          status: 'DRAFT',
          created_by: userId,
        },
        conn
      );

      for (const item of items) {
        await Receipt.addItem(
          {
            receipt_id: receiptId,
            product_id: item.product_id,
            quantity: parseFloat(item.quantity),
            location_id: item.location_id || location_id,
          },
          conn
        );
      }

      return Receipt.findById(receiptId, conn);
    });
  },

  async updateReceipt(id, updates) {
    const existing = await Receipt.findById(id);
    if (!existing) {
      const err = new Error('Receipt not found.');
      err.statusCode = 404;
      throw err;
    }

    if (existing.status === 'DONE') {
      const err = new Error('Cannot modify a validated/completed receipt.');
      err.statusCode = 400;
      throw err;
    }

    await Receipt.update(id, updates);
    return Receipt.findById(id);
  },

  /**
   * Validate and post inbound shipment to physical inventory
   * ATOMIC TRANSACTION:
   * 1. Locks receipt row
   * 2. Checks not already DONE
   * 3. For each item: locks inventory row, increments quantity, logs immutable movement
   * 4. Updates receipt status to DONE
   */
  async validateReceipt(id, userId) {
    return withTransaction(async (conn) => {
      // 1. Lock receipt row
      const [receiptRows] = await conn.query(
        'SELECT * FROM receipts WHERE id = ? FOR UPDATE',
        [id]
      );

      if (receiptRows.length === 0) {
        const err = new Error('Receipt not found.');
        err.statusCode = 404;
        throw err;
      }

      const receipt = receiptRows[0];

      if (receipt.status === 'DONE') {
        const err = new Error(`Receipt "${receipt.receipt_number}" has already been validated and posted to inventory.`);
        err.statusCode = 409;
        throw err;
      }

      if (receipt.status === 'CANCELED') {
        const err = new Error('Cannot validate a canceled receipt.');
        err.statusCode = 400;
        throw err;
      }

      // 2. Fetch line items
      const items = await Receipt.findItems(id, conn);
      if (items.length === 0) {
        const err = new Error('Cannot validate a receipt with no line items.');
        err.statusCode = 400;
        throw err;
      }

      // 3. Process each line item
      for (const item of items) {
        const targetLocationId = item.location_id || receipt.location_id;
        const qtyToAdd = parseFloat(item.quantity);

        // Lock inventory row
        const [invRows] = await conn.query(
          'SELECT quantity FROM inventory WHERE product_id = ? AND location_id = ? FOR UPDATE',
          [item.product_id, targetLocationId]
        );

        const currentQty = invRows.length > 0 ? parseFloat(invRows[0].quantity) : 0;
        const newQty = currentQty + qtyToAdd;

        // Upsert inventory
        await Inventory.setQuantity(item.product_id, targetLocationId, newQty, conn);

        // Append immutable Stock Ledger movement record
        await StockMovement.create(
          {
            product_id: item.product_id,
            warehouse_id: receipt.warehouse_id,
            location_id: targetLocationId,
            movement_type: 'RECEIPT',
            reference_type: 'RECEIPT',
            reference_id: receipt.id,
            quantity_before: currentQty,
            quantity_change: qtyToAdd,
            quantity_after: newQty,
            user_id: userId,
            metadata: {
              receipt_number: receipt.receipt_number,
              supplier_name: receipt.supplier_name,
            },
          },
          conn
        );
      }

      // 4. Mark receipt as DONE
      await Receipt.update(id, { status: 'DONE' }, conn);

      return Receipt.findById(id, conn);
    });
  },
};

module.exports = receiptService;
