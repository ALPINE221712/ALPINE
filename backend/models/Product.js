const { pool } = require('../config/db');

const Product = {
  async findAll({ search = '', category_id = null, status = null } = {}) {
    let sql = `
      SELECT 
        p.id, 
        p.name, 
        p.sku, 
        p.category_id, 
        c.name AS category_name,
        p.unit_of_measure, 
        p.reorder_level, 
        p.status, 
        p.created_at, 
        p.updated_at,
        COALESCE(SUM(i.quantity), 0) AS total_stock
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY p.id ORDER BY p.name ASC';

    const [rows] = await pool.query(sql, params);
    return rows.map((r) => ({
      ...r,
      total_stock: parseFloat(r.total_stock) || 0,
      reorder_level: parseFloat(r.reorder_level) || 0,
    }));
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        p.sku, 
        p.category_id, 
        c.name AS category_name,
        p.unit_of_measure, 
        p.reorder_level, 
        p.status, 
        p.created_at, 
        p.updated_at,
        COALESCE(SUM(i.quantity), 0) AS total_stock
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id]);

    if (!rows[0]) return null;

    return {
      ...rows[0],
      total_stock: parseFloat(rows[0].total_stock) || 0,
      reorder_level: parseFloat(rows[0].reorder_level) || 0,
    };
  },

  async findBySku(sku) {
    const [rows] = await pool.query(
      'SELECT id, name, sku, category_id, status FROM products WHERE sku = ?',
      [sku.trim().toUpperCase()]
    );
    return rows[0] || null;
  },

  async findLocationBreakdown(productId) {
    const [rows] = await pool.query(`
      SELECT 
        i.id AS inventory_id,
        i.quantity,
        l.id AS location_id,
        l.name AS location_name,
        l.code AS location_code,
        w.id AS warehouse_id,
        w.name AS warehouse_name,
        w.code AS warehouse_code
      FROM inventory i
      INNER JOIN locations l ON l.id = i.location_id
      INNER JOIN warehouses w ON w.id = l.warehouse_id
      WHERE i.product_id = ?
      ORDER BY w.code ASC, l.code ASC
    `, [productId]);

    return rows.map((r) => ({
      ...r,
      quantity: parseFloat(r.quantity) || 0,
    }));
  },

  async create({ name, sku, category_id, unit_of_measure = 'Units', reorder_level = 0, status = 'ACTIVE' }, client = pool) {
    const [result] = await client.query(
      `INSERT INTO products (name, sku, category_id, unit_of_measure, reorder_level, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), sku.trim().toUpperCase(), category_id, unit_of_measure.trim(), reorder_level, status]
    );
    return result.insertId;
  },

  async update(id, { name, sku, category_id, unit_of_measure = 'Units', reorder_level = 0, status = 'ACTIVE' }) {
    await pool.query(
      `UPDATE products 
       SET name = ?, sku = ?, category_id = ?, unit_of_measure = ?, reorder_level = ?, status = ? 
       WHERE id = ?`,
      [name.trim(), sku.trim().toUpperCase(), category_id, unit_of_measure.trim(), reorder_level, status, id]
    );
    return this.findById(id);
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = Product;
