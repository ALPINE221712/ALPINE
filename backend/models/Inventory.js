const { pool } = require('../config/db');

const Inventory = {
  async findAll({ product_id = null, location_id = null, warehouse_id = null } = {}) {
    let sql = `
      SELECT 
        i.id,
        i.product_id,
        p.name AS product_name,
        p.sku,
        p.unit_of_measure,
        i.location_id,
        l.name AS location_name,
        l.code AS location_code,
        w.id AS warehouse_id,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        i.quantity,
        i.created_at,
        i.updated_at
      FROM inventory i
      INNER JOIN products p ON p.id = i.product_id
      INNER JOIN locations l ON l.id = i.location_id
      INNER JOIN warehouses w ON w.id = l.warehouse_id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      sql += ' AND i.product_id = ?';
      params.push(product_id);
    }

    if (location_id) {
      sql += ' AND i.location_id = ?';
      params.push(location_id);
    }

    if (warehouse_id) {
      sql += ' AND w.id = ?';
      params.push(warehouse_id);
    }

    sql += ' ORDER BY p.name ASC, w.code ASC, l.code ASC';

    const [rows] = await pool.query(sql, params);
    return rows.map((r) => ({
      ...r,
      quantity: parseFloat(r.quantity) || 0,
    }));
  },

  async findByProductAndLocation(productId, locationId) {
    const [rows] = await pool.query(
      'SELECT id, product_id, location_id, quantity, created_at, updated_at FROM inventory WHERE product_id = ? AND location_id = ?',
      [productId, locationId]
    );
    if (!rows[0]) return null;
    return {
      ...rows[0],
      quantity: parseFloat(rows[0].quantity) || 0,
    };
  },

  async findByProductId(productId) {
    return this.findAll({ product_id: productId });
  },

  async findByLocationId(locationId) {
    return this.findAll({ location_id: locationId });
  },

  async findLowStock() {
    const [rows] = await pool.query(`
      SELECT 
        p.id AS product_id, 
        p.name AS product_name, 
        p.sku, 
        c.name AS category_name, 
        p.unit_of_measure,
        p.reorder_level, 
        COALESCE(SUM(i.quantity), 0) AS total_stock,
        CASE 
          WHEN COALESCE(SUM(i.quantity), 0) = 0 THEN 'OUT_OF_STOCK'
          ELSE 'LOW_STOCK'
        END AS stock_status
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE p.status = 'ACTIVE'
      GROUP BY p.id
      HAVING total_stock <= p.reorder_level
      ORDER BY total_stock ASC, p.name ASC
    `);

    return rows.map((r) => ({
      ...r,
      total_stock: parseFloat(r.total_stock) || 0,
      reorder_level: parseFloat(r.reorder_level) || 0,
    }));
  },

  async setQuantity(productId, locationId, quantity, client = pool) {
    const [result] = await client.query(
      `INSERT INTO inventory (product_id, location_id, quantity) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
      [productId, locationId, quantity]
    );
    return result;
  },

  async adjustQuantity(productId, locationId, delta, client = pool) {
    const [result] = await client.query(
      `INSERT INTO inventory (product_id, location_id, quantity) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [productId, locationId, delta]
    );
    return result;
  },
};

module.exports = Inventory;
