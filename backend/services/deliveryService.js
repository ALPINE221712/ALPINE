const { withTransaction, pool } = require('../config/db');
const Delivery = require('../models/Delivery');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

const deliveryService = {
  async getAllDeliveries(filters) {
    return Delivery.findAll(filters);
  },

  async getDeliveryById(id) {
    const delivery = await Delivery.findById(id);
    if (!delivery) {
      const err = new Error('Delivery order not found.');
      err.statusCode = 404;
      throw err;
    }
    return delivery;
  },

  async createDelivery({ delivery_number, customer_name, warehouse_id, items = [] }, userId) {
    if (!warehouse_id) {
      const err = new Error('Warehouse ID is required.');
      err.statusCode = 400;
      throw err;
    }

    const warehouse = await Warehouse.findById(warehouse_id);
    if (!warehouse) {
      const err = new Error(`Warehouse with ID ${warehouse_id} does not exist.`);
      err.statusCode = 400;
      throw err;
    }

    if (!items || items.length === 0) {
      const err = new Error('A delivery order must contain at least one line item.');
      err.statusCode = 400;
      throw err;
    }

    const delNumber = delivery_number
      ? delivery_number.trim().toUpperCase()
      : `DEL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 899)}`;

    const existingDel = await Delivery.findByNumber(delNumber);
    if (existingDel) {
      const err = new Error(`Delivery order "${delNumber}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    // Validate each line item
    for (const item of items) {
      if (!item.product_id) {
        const err = new Error('Each line item must have a valid product_id.');
        err.statusCode = 400;
        throw err;
      }
      if (!item.location_id) {
        const err = new Error('Each line item must specify a source location_id.');
        err.statusCode = 400;
        throw err;
      }

      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        const err = new Error('Delivery quantities must be greater than zero.');
        err.statusCode = 400;
        throw err;
      }

      const product = await Product.findById(item.product_id);
      if (!product) {
        const err = new Error(`Product with ID ${item.product_id} does not exist.`);
        err.statusCode = 400;
        throw err;
      }

      const location = await Location.findById(item.location_id);
      if (!location) {
        const err = new Error(`Location with ID ${item.location_id} does not exist.`);
        err.statusCode = 400;
        throw err;
      }

      if (location.warehouse_id !== parseInt(warehouse_id, 10)) {
        const err = new Error(`Source location "${location.code}" does not belong to warehouse "${warehouse.name}".`);
        err.statusCode = 400;
        throw err;
      }
    }

    return withTransaction(async (conn) => {
      const deliveryId = await Delivery.create(
        {
          delivery_number: delNumber,
          customer_name: customer_name ? customer_name.trim() : null,
          warehouse_id,
          status: 'DRAFT',
          stage: 'PENDING',
          created_by: userId,
        },
        conn
      );

      for (const item of items) {
        await Delivery.addItem(
          {
            delivery_id: deliveryId,
            product_id: item.product_id,
            location_id: item.location_id,
            quantity: parseFloat(item.quantity),
          },
          conn
        );
      }

      return Delivery.findById(deliveryId, conn);
    });
  },

  async updateDelivery(id, updates) {
    const existing = await Delivery.findById(id);
    if (!existing) {
      const err = new Error('Delivery order not found.');
      err.statusCode = 404;
      throw err;
    }

    if (existing.status === 'DONE') {
      const err = new Error('Cannot modify a validated/completed delivery order.');
      err.statusCode = 400;
      throw err;
    }

    await Delivery.update(id, updates);
    return Delivery.findById(id);
  },

  /**
   * Transition stage to PICKED (does not decrease stock)
   */
  async pickDelivery(id) {
    const existing = await Delivery.findById(id);
    if (!existing) {
      const err = new Error('Delivery order not found.');
      err.statusCode = 404;
      throw err;
    }

    if (existing.status === 'DONE') {
      const err = new Error('Delivery has already been completed.');
      err.statusCode = 400;
      throw err;
    }

    await Delivery.update(id, { stage: 'PICKED', status: 'WAITING' });
    return Delivery.findById(id);
  },

  /**
   * Transition stage to PACKED (does not decrease stock)
   */
  async packDelivery(id) {
    const existing = await Delivery.findById(id);
    if (!existing) {
      const err = new Error('Delivery order not found.');
      err.statusCode = 404;
      throw err;
    }

    if (existing.status === 'DONE') {
      const err = new Error('Delivery has already been completed.');
      err.statusCode = 400;
      throw err;
    }

    await Delivery.update(id, { stage: 'PACKED', status: 'READY' });
    return Delivery.findById(id);
  },

  /**
   * Validate Delivery & Decrease Stock with Strict Negative Stock Guard
   * ATOMIC TRANSACTION:
   * 1. Locks delivery row
   * 2. Checks not already DONE
   * 3. For each item: locks inventory row with SELECT ... FOR UPDATE
   * 4. Verifies available >= requested for ALL items
   * 5. If ANY item fails: ROLLS BACK EVERYTHING
   * 6. Decreases inventory, appends immutable DELIVERY movements
   * 7. Updates status to DONE, stage to DISPATCHED
   */
  async validateDelivery(id, userId) {
    return withTransaction(async (conn) => {
      // 1. Lock delivery row
      const [delRows] = await conn.query(
        'SELECT * FROM deliveries WHERE id = ? FOR UPDATE',
        [id]
      );

      if (delRows.length === 0) {
        const err = new Error('Delivery order not found.');
        err.statusCode = 404;
        throw err;
      }

      const delivery = delRows[0];

      if (delivery.status === 'DONE') {
        const err = new Error(`Delivery order "${delivery.delivery_number}" has already been dispatched and validated.`);
        err.statusCode = 409;
        throw err;
      }

      if (delivery.status === 'CANCELED') {
        const err = new Error('Cannot validate a canceled delivery order.');
        err.statusCode = 400;
        throw err;
      }

      // 2. Fetch items
      const items = await Delivery.findItems(id, conn);
      if (items.length === 0) {
        const err = new Error('Cannot validate a delivery order with no line items.');
        err.statusCode = 400;
        throw err;
      }

      // 3. Pre-validate stock with FOR UPDATE lock across all items
      const itemInventoryMap = [];

      for (const item of items) {
        const [invRows] = await conn.query(
          'SELECT quantity FROM inventory WHERE product_id = ? AND location_id = ? FOR UPDATE',
          [item.product_id, item.location_id]
        );

        const currentQty = invRows.length > 0 ? parseFloat(invRows[0].quantity) : 0;
        const requestedQty = parseFloat(item.quantity);

        if (currentQty < requestedQty) {
          const err = new Error(
            `Insufficient stock for product "${item.product_name}" (SKU: ${item.sku}) at location "${item.location_code}". Available: ${currentQty}, Requested: ${requestedQty}.`
          );
          err.statusCode = 400;
          throw err;
        }

        itemInventoryMap.push({
          item,
          currentQty,
          requestedQty,
          newQty: currentQty - requestedQty,
        });
      }

      // 4. All stock checks passed — execute stock decrements and movement logs
      for (const { item, currentQty, requestedQty, newQty } of itemInventoryMap) {
        await Inventory.setQuantity(item.product_id, item.location_id, newQty, conn);

        await StockMovement.create(
          {
            product_id: item.product_id,
            warehouse_id: delivery.warehouse_id,
            location_id: item.location_id,
            movement_type: 'DELIVERY',
            reference_type: 'DELIVERY',
            reference_id: delivery.id,
            quantity_before: currentQty,
            quantity_change: -requestedQty,
            quantity_after: newQty,
            user_id: userId,
            metadata: {
              delivery_number: delivery.delivery_number,
              customer_name: delivery.customer_name,
            },
          },
          conn
        );
      }

      // 5. Mark delivery as completed
      await Delivery.update(id, { status: 'DONE', stage: 'DISPATCHED' }, conn);

      return Delivery.findById(id, conn);
    });
  },
};

module.exports = deliveryService;
