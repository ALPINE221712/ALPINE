const { withTransaction, pool } = require('../config/db');
const Transfer = require('../models/Transfer');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

const transferService = {
  async getAllTransfers(filters) {
    return Transfer.findAll(filters);
  },

  async getTransferById(id) {
    const transfer = await Transfer.findById(id);
    if (!transfer) {
      const err = new Error('Transfer order not found.');
      err.statusCode = 404;
      throw err;
    }
    return transfer;
  },

  async createTransfer(
    {
      transfer_number,
      source_warehouse_id,
      source_location_id,
      destination_warehouse_id,
      destination_location_id,
      items = [],
    },
    userId
  ) {
    if (!source_warehouse_id || !source_location_id) {
      const err = new Error('Source warehouse and source location IDs are required.');
      err.statusCode = 400;
      throw err;
    }

    if (!destination_warehouse_id || !destination_location_id) {
      const err = new Error('Destination warehouse and destination location IDs are required.');
      err.statusCode = 400;
      throw err;
    }

    if (source_location_id === destination_location_id) {
      const err = new Error('Source location and destination location must be different.');
      err.statusCode = 400;
      throw err;
    }

    const srcLoc = await Location.findById(source_location_id);
    if (!srcLoc || srcLoc.warehouse_id !== parseInt(source_warehouse_id, 10)) {
      const err = new Error('Source location does not exist or does not belong to source warehouse.');
      err.statusCode = 400;
      throw err;
    }

    const destLoc = await Location.findById(destination_location_id);
    if (!destLoc || destLoc.warehouse_id !== parseInt(destination_warehouse_id, 10)) {
      const err = new Error('Destination location does not exist or does not belong to destination warehouse.');
      err.statusCode = 400;
      throw err;
    }

    if (!items || items.length === 0) {
      const err = new Error('A transfer must contain at least one product item.');
      err.statusCode = 400;
      throw err;
    }

    const trNumber = transfer_number
      ? transfer_number.trim().toUpperCase()
      : `TR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 899)}`;

    const existingTr = await Transfer.findByNumber(trNumber);
    if (existingTr) {
      const err = new Error(`Transfer order "${trNumber}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    for (const item of items) {
      if (!item.product_id) {
        const err = new Error('Each item must specify a product_id.');
        err.statusCode = 400;
        throw err;
      }
      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        const err = new Error('Transfer quantities must be greater than zero.');
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
      const transferId = await Transfer.create(
        {
          transfer_number: trNumber,
          source_warehouse_id,
          source_location_id,
          destination_warehouse_id,
          destination_location_id,
          status: 'DRAFT',
          created_by: userId,
        },
        conn
      );

      for (const item of items) {
        await Transfer.addItem(
          {
            transfer_id: transferId,
            product_id: item.product_id,
            quantity: parseFloat(item.quantity),
          },
          conn
        );
      }

      return Transfer.findById(transferId, conn);
    });
  },

  async updateTransfer(id, updates) {
    const existing = await Transfer.findById(id);
    if (!existing) {
      const err = new Error('Transfer order not found.');
      err.statusCode = 404;
      throw err;
    }

    if (existing.status === 'DONE') {
      const err = new Error('Cannot modify a completed transfer.');
      err.statusCode = 400;
      throw err;
    }

    await Transfer.update(id, updates);
    return Transfer.findById(id);
  },

  /**
   * Validate and execute internal inventory relocation
   * ATOMIC TRANSACTION:
   * 1. Lock transfer row
   * 2. Lock source inventory rows with FOR UPDATE
   * 3. Verify sufficient source stock for ALL items
   * 4. If ANY item lacks stock: ROLLBACK EVERYTHING
   * 5. Decrement source, increment destination
   * 6. Log TRANSFER_OUT and TRANSFER_IN movements
   * 7. Total enterprise stock is 100% conserved (invariant)
   * 8. Mark transfer DONE
   */
  async validateTransfer(id, userId) {
    return withTransaction(async (conn) => {
      const [transferRows] = await conn.query(
        'SELECT * FROM transfers WHERE id = ? FOR UPDATE',
        [id]
      );

      if (transferRows.length === 0) {
        const err = new Error('Transfer order not found.');
        err.statusCode = 404;
        throw err;
      }

      const transfer = transferRows[0];

      if (transfer.status === 'DONE') {
        const err = new Error(`Transfer "${transfer.transfer_number}" has already been completed.`);
        err.statusCode = 409;
        throw err;
      }

      if (transfer.status === 'CANCELED') {
        const err = new Error('Cannot validate a canceled transfer.');
        err.statusCode = 400;
        throw err;
      }

      const items = await Transfer.findItems(id, conn);
      if (items.length === 0) {
        const err = new Error('Cannot validate a transfer with no items.');
        err.statusCode = 400;
        throw err;
      }

      // Step A: Pre-lock and validate source stock for ALL items
      const transferPlan = [];

      for (const item of items) {
        const [srcInvRows] = await conn.query(
          'SELECT quantity FROM inventory WHERE product_id = ? AND location_id = ? FOR UPDATE',
          [item.product_id, transfer.source_location_id]
        );

        const srcAvailable = srcInvRows.length > 0 ? parseFloat(srcInvRows[0].quantity) : 0;
        const requestedQty = parseFloat(item.quantity);

        if (srcAvailable < requestedQty) {
          const err = new Error(
            `Insufficient stock at source location for product "${item.product_name}" (SKU: ${item.sku}). Available: ${srcAvailable}, Transfer Requested: ${requestedQty}. Entire transfer canceled.`
          );
          err.statusCode = 400;
          throw err;
        }

        // Lock destination inventory row as well
        const [destInvRows] = await conn.query(
          'SELECT quantity FROM inventory WHERE product_id = ? AND location_id = ? FOR UPDATE',
          [item.product_id, transfer.destination_location_id]
        );

        const destAvailable = destInvRows.length > 0 ? parseFloat(destInvRows[0].quantity) : 0;

        transferPlan.push({
          item,
          requestedQty,
          srcBefore: srcAvailable,
          srcAfter: srcAvailable - requestedQty,
          destBefore: destAvailable,
          destAfter: destAvailable + requestedQty,
        });
      }

      // Step B: Execute atomic transfer adjustments & dual-ledger logging
      for (const plan of transferPlan) {
        const { item, requestedQty, srcBefore, srcAfter, destBefore, destAfter } = plan;

        // 1. Decrement source inventory
        await Inventory.setQuantity(item.product_id, transfer.source_location_id, srcAfter, conn);

        // 2. Increment destination inventory
        await Inventory.setQuantity(item.product_id, transfer.destination_location_id, destAfter, conn);

        // 3. Append TRANSFER_OUT ledger record
        await StockMovement.create(
          {
            product_id: item.product_id,
            warehouse_id: transfer.source_warehouse_id,
            location_id: transfer.source_location_id,
            movement_type: 'TRANSFER_OUT',
            reference_type: 'TRANSFER',
            reference_id: transfer.id,
            quantity_before: srcBefore,
            quantity_change: -requestedQty,
            quantity_after: srcAfter,
            user_id: userId,
            metadata: {
              transfer_number: transfer.transfer_number,
              to_warehouse_id: transfer.destination_warehouse_id,
              to_location_id: transfer.destination_location_id,
            },
          },
          conn
        );

        // 4. Append TRANSFER_IN ledger record
        await StockMovement.create(
          {
            product_id: item.product_id,
            warehouse_id: transfer.destination_warehouse_id,
            location_id: transfer.destination_location_id,
            movement_type: 'TRANSFER_IN',
            reference_type: 'TRANSFER',
            reference_id: transfer.id,
            quantity_before: destBefore,
            quantity_change: requestedQty,
            quantity_after: destAfter,
            user_id: userId,
            metadata: {
              transfer_number: transfer.transfer_number,
              from_warehouse_id: transfer.source_warehouse_id,
              from_location_id: transfer.source_location_id,
            },
          },
          conn
        );
      }

      // Step C: Mark transfer as DONE
      await Transfer.update(id, { status: 'DONE' }, conn);

      return Transfer.findById(id, conn);
    });
  },
};

module.exports = transferService;
