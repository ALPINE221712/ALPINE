const { pool } = require('../config/db');

const Adjustment = {
  async findAll({ location_id = null, product_id = null, status = null, search = '' } = {}) {
    let sql = `
      SELECT 
        sa.id,
        sa.adjustment_number,
        sa.product_id,
        p.name AS product_name,
        p.sku,
        p.unit_of_measure,
        sa.location_id,
        l.name AS location_name,
        l.code AS location_code,
        w.id AS warehouse_id,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        sa.recorded_quantity,
        sa.counted_quantity,
        sa.difference,
        sa.reason,
        sa.status,
        sa.created_by,
        u.name AS created_by_name,
        sa.created_at,
        sa.updated_at
      FROM stock_adjustments sa
      INNER JOIN products p ON p.id = sa.product_id
      INNER JOIN locations l ON l.id = sa.location_id
      INNER JOIN warehouses w ON w.id = l.warehouse_id
      INNER JOIN users u ON u.id = sa.created_by
      WHERE 1=1
    `;
    const params = [];

    if (location_id) {
      sql += ' AND sa.location_id = ?';
      params.push(location_id);
    }

    if (product_id) {
      sql += ' AND sa.product_id = ?';
      params.push(product_id);
    }

    if (status) {
      sql += ' AND sa.status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      sql += ' AND (sa.adjustment_number LIKE ? OR p.name LIKE ? OR p.sku LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY sa.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows.map((r) => ({
      ...r,
      recorded_quantity: parseFloat(r.recorded_quantity) || 0,
      counted_quantity: parseFloat(r.counted_quantity) || 0,
      difference: parseFloat(r.difference) || 0,
    }));
  },

  async findById(id, client = pool) {
    const [rows] = await client.query(
      `SELECT 
        sa.id,
        sa.adjustment_number,
        sa.product_id,
        p.name AS product_name,
        p.sku,
        p.unit_of_measure,
        sa.location_id,
        l.name AS location_name,
        l.code AS location_code,
        w.id AS warehouse_id,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        sa.recorded_quantity,
        sa.counted_quantity,
        sa.difference,
        sa.reason,
        sa.status,
        sa.created_by,
        u.name AS created_by_name,
        sa.created_at,
        sa.updated_at
      FROM stock_adjustments sa
      INNER JOIN products p ON p.id = sa.product_id
      INNER JOIN locations l ON l.id = sa.location_id
      INNER JOIN warehouses w ON w.id = l.warehouse_id
      INNER JOIN users u ON u.id = sa.created_by
      WHERE sa.id = ?`,
      [id]
    );

    if (!rows[0]) return null;

    return {
      ...rows[0],
      recorded_quantity: parseFloat(rows[0].recorded_quantity) || 0,
      counted_quantity: parseFloat(rows[0].counted_quantity) || 0,
      difference: parseFloat(rows[0].difference) || 0,
    };
  },

  async findByNumber(adjustmentNumber) {
    const [rows] = await pool.query(
      'SELECT id, adjustment_number, status FROM stock_adjustments WHERE adjustment_number = ?',
      [adjustmentNumber.trim().toUpperCase()]
    );
    return rows[0] || null;
  },

  async create(
    {
      adjustment_number,
      product_id,
      location_id,
      recorded_quantity,
      counted_quantity,
      difference,
      reason = null,
      status = 'DRAFT',
      created_by,
    },
    client = pool
  ) {
    const [result] = await client.query(
      `INSERT INTO stock_adjustments (
        adjustment_number,
        product_id,
        location_id,
        recorded_quantity,
        counted_quantity,
        difference,
        reason,
        status,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adjustment_number.trim().toUpperCase(),
        product_id,
        location_id,
        recorded_quantity,
        counted_quantity,
        difference,
        reason,
        status,
        created_by,
      ]
    );
    return result.insertId;
  },

  async update(id, updates = {}, client = pool) {
    const fields = [];
    const values = [];

    if (updates.counted_quantity !== undefined) {
      fields.push('counted_quantity = ?');
      values.push(updates.counted_quantity);
    }
    if (updates.difference !== undefined) {
      fields.push('difference = ?');
      values.push(updates.difference);
    }
    if (updates.reason !== undefined) {
      fields.push('reason = ?');
      values.push(updates.reason);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const [result] = await client.query(
      `UPDATE stock_adjustments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },
};

module.exports = Adjustment;
