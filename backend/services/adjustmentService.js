const { withTransaction, pool } = require('../config/db');
const Adjustment = require('../models/Adjustment');
const Product = require('../models/Product');
const Location = require('../models/Location');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

const adjustmentService = {
  async getAllAdjustments(filters) {
    return Adjustment.findAll(filters);
  },

  async getAdjustmentById(id) {
    const adj = await Adjustment.findById(id);
    if (!adj) {
      const err = new Error('Stock adjustment not found.');
      err.statusCode = 404;
      throw err;
    }
    return adj;
  },

  async createAdjustment({ adjustment_number, product_id, location_id, counted_quantity, reason }, userId) {
    if (!product_id) {
      const err = new Error('Product ID is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!location_id) {
      const err = new Error('Location ID is required.');
      err.statusCode = 400;
      throw err;
    }

    const numCounted = parseFloat(counted_quantity);
    if (isNaN(numCounted) || numCounted < 0) {
      const err = new Error('Counted physical quantity must be a non-negative number.');
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findById(product_id);
    if (!product) {
      const err = new Error(`Product with ID ${product_id} does not exist.`);
      err.statusCode = 400;
      throw err;
    }

    const location = await Location.findById(location_id);
    if (!location) {
      const err = new Error(`Location with ID ${location_id} does not exist.`);
      err.statusCode = 400;
      throw err;
    }

    // Look up current recorded quantity on hand
    const inv = await Inventory.findByProductAndLocation(product_id, location_id);
    const recordedQty = inv ? inv.quantity : 0;
    const difference = numCounted - recordedQty;

    const adjNumber = adjustment_number
      ? adjustment_number.trim().toUpperCase()
      : `ADJ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 899)}`;

    const existingAdj = await Adjustment.findByNumber(adjNumber);
    if (existingAdj) {
      const err = new Error(`Adjustment number "${adjNumber}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    const newId = await Adjustment.create({
      adjustment_number: adjNumber,
      product_id,
      location_id,
      recorded_quantity: recordedQty,
      counted_quantity: numCounted,
      difference,
      reason: reason ? reason.trim() : null,
      status: 'DRAFT',
      created_by: userId,
    });

    return Adjustment.findById(newId);
  },

  async updateAdjustment(id, updates) {
    const existing = await Adjustment.findById(id);
    if (!existing) {
      const err = new Error('Stock adjustment not found.');
      err.statusCode = 404;
      throw err;
    }

    if (existing.status === 'APPLIED') {
      const err = new Error('Cannot modify an already applied stock adjustment.');
      err.statusCode = 400;
      throw err;
    }

    if (updates.counted_quantity !== undefined) {
      const numCounted = parseFloat(updates.counted_quantity);
      if (isNaN(numCounted) || numCounted < 0) {
        const err = new Error('Counted physical quantity must be a non-negative number.');
        err.statusCode = 400;
        throw err;
      }
      updates.difference = numCounted - existing.recorded_quantity;
    }

    await Adjustment.update(id, updates);
    return Adjustment.findById(id);
  },

  /**
   * Apply stock adjustment & reconcile inventory to counted count
   * ATOMIC TRANSACTION:
   * 1. Lock adjustment row
   * 2. Lock inventory row
   * 3. Compute difference against latest locked inventory
   * 4. Update inventory to counted_quantity
   * 5. Log ADJUSTMENT movement
   * 6. Mark status as APPLIED
   */
  async applyAdjustment(id, userId) {
    return withTransaction(async (conn) => {
      const [adjRows] = await conn.query(
        'SELECT * FROM stock_adjustments WHERE id = ? FOR UPDATE',
        [id]
      );

      if (adjRows.length === 0) {
        const err = new Error('Stock adjustment not found.');
        err.statusCode = 404;
        throw err;
      }

      const adjustment = adjRows[0];

      if (adjustment.status === 'APPLIED') {
        const err = new Error(`Stock adjustment "${adjustment.adjustment_number}" has already been applied.`);
        err.statusCode = 409;
        throw err;
      }

      if (adjustment.status === 'CANCELED') {
        const err = new Error('Cannot apply a canceled stock adjustment.');
        err.statusCode = 400;
        throw err;
      }

      // Lock current inventory row
      const [invRows] = await conn.query(
        'SELECT quantity FROM inventory WHERE product_id = ? AND location_id = ? FOR UPDATE',
        [adjustment.product_id, adjustment.location_id]
      );

      const currentQty = invRows.length > 0 ? parseFloat(invRows[0].quantity) : 0;
      const targetQty = parseFloat(adjustment.counted_quantity);
      const diff = targetQty - currentQty;

      // Update inventory directly to physical counted count
      await Inventory.setQuantity(adjustment.product_id, adjustment.location_id, targetQty, conn);

      // Get warehouse for location
      const [locRows] = await conn.query(
        'SELECT warehouse_id FROM locations WHERE id = ?',
        [adjustment.location_id]
      );
      const warehouseId = locRows[0].warehouse_id;

      // Append immutable movement record
      await StockMovement.create(
        {
          product_id: adjustment.product_id,
          warehouse_id: warehouseId,
          location_id: adjustment.location_id,
          movement_type: 'ADJUSTMENT',
          reference_type: 'ADJUSTMENT',
          reference_id: adjustment.id,
          quantity_before: currentQty,
          quantity_change: diff,
          quantity_after: targetQty,
          user_id: userId,
          metadata: {
            adjustment_number: adjustment.adjustment_number,
            reason: adjustment.reason,
            recorded_quantity: currentQty,
            physical_count: targetQty,
          },
        },
        conn
      );

      // Mark adjustment APPLIED
      await Adjustment.update(id, { status: 'APPLIED', difference: diff }, conn);

      return Adjustment.findById(id, conn);
    });
  },
};

module.exports = adjustmentService;
