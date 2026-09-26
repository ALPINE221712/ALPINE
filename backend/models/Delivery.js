const { pool } = require('../config/db');

const Delivery = {
  async findAll({ warehouse_id = null, status = null, stage = null, search = '' } = {}) {
    let sql = `
      SELECT 
        d.id,
        d.delivery_number,
        d.customer_name,
        d.warehouse_id,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        d.status,
        d.stage,
        d.created_by,
        u.name AS created_by_name,
        d.created_at,
        d.updated_at,
        COUNT(di.id) AS total_lines,
        COALESCE(SUM(di.quantity), 0) AS total_quantity
      FROM deliveries d
      INNER JOIN warehouses w ON w.id = d.warehouse_id
      INNER JOIN users u ON u.id = d.created_by
      LEFT JOIN delivery_items di ON di.delivery_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (warehouse_id) {
      sql += ' AND d.warehouse_id = ?';
      params.push(warehouse_id);
    }

    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    if (stage) {
      sql += ' AND d.stage = ?';
      params.push(stage);
    }

    if (search && search.trim()) {
      sql += ' AND (d.delivery_number LIKE ? OR d.customer_name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    sql += ' GROUP BY d.id ORDER BY d.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows.map((r) => ({
      ...r,
      total_lines: parseInt(r.total_lines, 10) || 0,
      total_quantity: parseFloat(r.total_quantity) || 0,
    }));
  },

  async findById(id, client = pool) {
    const [rows] = await client.query(
      `SELECT 
        d.id,
        d.delivery_number,
        d.customer_name,
        d.warehouse_id,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        d.status,
        d.stage,
        d.created_by,
        u.name AS created_by_name,
        d.created_at,
        d.updated_at
      FROM deliveries d
      INNER JOIN warehouses w ON w.id = d.warehouse_id
      INNER JOIN users u ON u.id = d.created_by
      WHERE d.id = ?`,
      [id]
    );

    if (!rows[0]) return null;

    const items = await this.findItems(id, client);
    const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    return {
      ...rows[0],
      line_count: items.length,
      total_lines: items.length,
      total_quantity: totalQuantity,
      items,
    };
  },

  async findItems(deliveryId, client = pool) {
    const [rows] = await client.query(
      `SELECT 
        di.id,
        di.delivery_id,
        di.product_id,
        p.name AS product_name,
        p.sku,
        p.unit_of_measure,
        di.location_id,
        l.name AS location_name,
        l.code AS location_code,
        di.quantity,
        di.created_at
      FROM delivery_items di
      INNER JOIN products p ON p.id = di.product_id
      INNER JOIN locations l ON l.id = di.location_id
      WHERE di.delivery_id = ?
      ORDER BY di.id ASC`,
      [deliveryId]
    );

    return rows.map((r) => ({
      ...r,
      quantity: parseFloat(r.quantity) || 0,
    }));
  },

  async findByNumber(deliveryNumber) {
    const [rows] = await pool.query(
      'SELECT id, delivery_number, status, stage FROM deliveries WHERE delivery_number = ?',
      [deliveryNumber.trim().toUpperCase()]
    );
    return rows[0] || null;
  },

  async create({ delivery_number, customer_name = null, warehouse_id, status = 'DRAFT', stage = 'PENDING', created_by }, client = pool) {
    const [result] = await client.query(
      `INSERT INTO deliveries (delivery_number, customer_name, warehouse_id, status, stage, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [delivery_number.trim().toUpperCase(), customer_name, warehouse_id, status, stage, created_by]
    );
    return result.insertId;
  },

  async addItem({ delivery_id, product_id, location_id, quantity }, client = pool) {
    const [result] = await client.query(
      `INSERT INTO delivery_items (delivery_id, product_id, location_id, quantity)
       VALUES (?, ?, ?, ?)`,
      [delivery_id, product_id, location_id, quantity]
    );
    return result.insertId;
  },

  async update(id, updates = {}, client = pool) {
    const fields = [];
    const values = [];

    if (updates.customer_name !== undefined) {
      fields.push('customer_name = ?');
      values.push(updates.customer_name);
    }
    if (updates.warehouse_id !== undefined) {
      fields.push('warehouse_id = ?');
      values.push(updates.warehouse_id);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.stage !== undefined) {
      fields.push('stage = ?');
      values.push(updates.stage);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const [result] = await client.query(
      `UPDATE deliveries SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },
};

module.exports = Delivery;
