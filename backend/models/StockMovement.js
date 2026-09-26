const { pool } = require('../config/db');

/**
 * StockMovement Model — Immutable Stock Ledger Data Access
 *
 * CRITICAL RULE:
 * This model is strictly APPEND-ONLY.
 * No UPDATE or DELETE methods are implemented or permitted.
 */
const StockMovement = {
  /**
   * Append an immutable movement record within an active transaction connection
   */
  async create(
    {
      product_id,
      warehouse_id,
      location_id,
      movement_type,
      reference_type,
      reference_id,
      quantity_before,
      quantity_change,
      quantity_after,
      user_id,
      metadata = null,
    },
    client = pool
  ) {
    const metaJson = metadata ? JSON.stringify(metadata) : null;
    const [result] = await client.query(
      `INSERT INTO stock_movements (
        product_id,
        warehouse_id,
        location_id,
        movement_type,
        reference_type,
        reference_id,
        quantity_before,
        quantity_change,
        quantity_after,
        user_id,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        warehouse_id,
        location_id,
        movement_type,
        reference_type,
        reference_id,
        quantity_before,
        quantity_change,
        quantity_after,
        user_id,
        metaJson,
      ]
    );
    return result.insertId;
  },

  /**
   * Query chronological movement history with full entity joins & filters
   */
  async findAll({
    movement_type = null,
    product_id = null,
    warehouse_id = null,
    location_id = null,
    user_id = null,
    reference_type = null,
    from_date = null,
    to_date = null,
    search = '',
    limit = 100,
    offset = 0,
  } = {}) {
    let sql = `
      SELECT 
        sm.id,
        sm.product_id,
        p.name AS product_name,
        p.sku,
        p.unit_of_measure,
        sm.warehouse_id,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        sm.location_id,
        l.name AS location_name,
        l.code AS location_code,
        sm.movement_type,
        sm.reference_type,
        sm.reference_id,
        sm.quantity_before,
        sm.quantity_change,
        sm.quantity_after,
        sm.user_id,
        u.name AS user_name,
        u.email AS user_email,
        sm.metadata,
        sm.created_at
      FROM stock_movements sm
      INNER JOIN products p ON p.id = sm.product_id
      INNER JOIN warehouses w ON w.id = sm.warehouse_id
      INNER JOIN locations l ON l.id = sm.location_id
      INNER JOIN users u ON u.id = sm.user_id
      WHERE 1=1
    `;
    const params = [];

    if (movement_type) {
      sql += ' AND sm.movement_type = ?';
      params.push(movement_type);
    }

    if (product_id) {
      sql += ' AND sm.product_id = ?';
      params.push(product_id);
    }

    if (warehouse_id) {
      sql += ' AND sm.warehouse_id = ?';
      params.push(warehouse_id);
    }

    if (location_id) {
      sql += ' AND sm.location_id = ?';
      params.push(location_id);
    }

    if (user_id) {
      sql += ' AND sm.user_id = ?';
      params.push(user_id);
    }

    if (reference_type) {
      sql += ' AND sm.reference_type = ?';
      params.push(reference_type);
    }

    if (from_date) {
      sql += ' AND sm.created_at >= ?';
      params.push(from_date);
    }

    if (to_date) {
      sql += ' AND sm.created_at <= ?';
      params.push(to_date);
    }

    if (search && search.trim()) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR w.name LIKE ? OR l.name LIKE ? OR sm.movement_type LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY sm.created_at DESC, sm.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(sql, params);
    return rows.map((r) => ({
      ...r,
      quantity_before: parseFloat(r.quantity_before) || 0,
      quantity_change: parseFloat(r.quantity_change) || 0,
      quantity_after: parseFloat(r.quantity_after) || 0,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
    }));
  },

  /**
   * Find a single movement audit record by ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT 
        sm.id,
        sm.product_id,
        p.name AS product_name,
        p.sku,
        p.unit_of_measure,
        sm.warehouse_id,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        sm.location_id,
        l.name AS location_name,
        l.code AS location_code,
        sm.movement_type,
        sm.reference_type,
        sm.reference_id,
        sm.quantity_before,
        sm.quantity_change,
        sm.quantity_after,
        sm.user_id,
        u.name AS user_name,
        u.email AS user_email,
        sm.metadata,
        sm.created_at
      FROM stock_movements sm
      INNER JOIN products p ON p.id = sm.product_id
      INNER JOIN warehouses w ON w.id = sm.warehouse_id
      INNER JOIN locations l ON l.id = sm.location_id
      INNER JOIN users u ON u.id = sm.user_id
      WHERE sm.id = ?`,
      [id]
    );

    if (!rows[0]) return null;

    return {
      ...rows[0],
      quantity_before: parseFloat(rows[0].quantity_before) || 0,
      quantity_change: parseFloat(rows[0].quantity_change) || 0,
      quantity_after: parseFloat(rows[0].quantity_after) || 0,
      metadata: typeof rows[0].metadata === 'string' ? JSON.parse(rows[0].metadata) : rows[0].metadata,
    };
  },
};

module.exports = StockMovement;
