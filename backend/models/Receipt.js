const { pool } = require('../config/db');

const Receipt = {
  async findAll({ warehouse_id = null, status = null, search = '' } = {}) {
    let sql = `
      SELECT 
        r.id,
        r.receipt_number,
        r.supplier_name,
        r.warehouse_id,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        r.location_id,
        l.name AS location_name,
        l.code AS location_code,
        r.status,
        r.created_by,
        u.name AS created_by_name,
        r.created_at,
        r.updated_at,
        COUNT(ri.id) AS total_lines,
        COALESCE(SUM(ri.quantity), 0) AS total_quantity
      FROM receipts r
      INNER JOIN warehouses w ON w.id = r.warehouse_id
      INNER JOIN locations l ON l.id = r.location_id
      INNER JOIN users u ON u.id = r.created_by
      LEFT JOIN receipt_items ri ON ri.receipt_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (warehouse_id) {
      sql += ' AND r.warehouse_id = ?';
      params.push(warehouse_id);
    }

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      sql += ' AND (r.receipt_number LIKE ? OR r.supplier_name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    sql += ' GROUP BY r.id ORDER BY r.created_at DESC';

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
        r.id,
        r.receipt_number,
        r.supplier_name,
        r.warehouse_id,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        r.location_id,
        l.name AS location_name,
        l.code AS location_code,
        r.status,
        r.created_by,
        u.name AS created_by_name,
        r.created_at,
        r.updated_at
      FROM receipts r
      INNER JOIN warehouses w ON w.id = r.warehouse_id
      INNER JOIN locations l ON l.id = r.location_id
      INNER JOIN users u ON u.id = r.created_by
      WHERE r.id = ?`,
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

  async findItems(receiptId, client = pool) {
    const [rows] = await client.query(
      `SELECT 
        ri.id,
        ri.receipt_id,
        ri.product_id,
        p.name AS product_name,
        p.sku,
        p.unit_of_measure,
        ri.quantity,
        ri.location_id,
        COALESCE(l.name, rl.name) AS location_name,
        COALESCE(l.code, rl.code) AS location_code,
        ri.created_at
      FROM receipt_items ri
      INNER JOIN products p ON p.id = ri.product_id
      INNER JOIN receipts r ON r.id = ri.receipt_id
      INNER JOIN locations rl ON rl.id = r.location_id
      LEFT JOIN locations l ON l.id = ri.location_id
      WHERE ri.receipt_id = ?
      ORDER BY ri.id ASC`,
      [receiptId]
    );

    return rows.map((r) => ({
      ...r,
      quantity: parseFloat(r.quantity) || 0,
    }));
  },

  async findByNumber(receiptNumber) {
    const [rows] = await pool.query(
      'SELECT id, receipt_number, status FROM receipts WHERE receipt_number = ?',
      [receiptNumber.trim().toUpperCase()]
    );
    return rows[0] || null;
  },

  async create({ receipt_number, supplier_name = null, warehouse_id, location_id, status = 'DRAFT', created_by }, client = pool) {
    const [result] = await client.query(
      `INSERT INTO receipts (receipt_number, supplier_name, warehouse_id, location_id, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [receipt_number.trim().toUpperCase(), supplier_name, warehouse_id, location_id, status, created_by]
    );
    return result.insertId;
  },

  async addItem({ receipt_id, product_id, quantity, location_id = null }, client = pool) {
    const [result] = await client.query(
      `INSERT INTO receipt_items (receipt_id, product_id, quantity, location_id)
       VALUES (?, ?, ?, ?)`,
      [receipt_id, product_id, quantity, location_id]
    );
    return result.insertId;
  },

  async update(id, updates = {}, client = pool) {
    const fields = [];
    const values = [];

    if (updates.supplier_name !== undefined) {
      fields.push('supplier_name = ?');
      values.push(updates.supplier_name);
    }
    if (updates.warehouse_id !== undefined) {
      fields.push('warehouse_id = ?');
      values.push(updates.warehouse_id);
    }
    if (updates.location_id !== undefined) {
      fields.push('location_id = ?');
      values.push(updates.location_id);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const [result] = await client.query(
      `UPDATE receipts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },
};

module.exports = Receipt;
