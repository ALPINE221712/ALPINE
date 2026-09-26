const { pool } = require('../config/db');

const Location = {
  async findAll(warehouseId = null) {
    let sql = `
      SELECT 
        l.id, 
        l.warehouse_id, 
        l.name, 
        l.code, 
        l.status, 
        l.created_at, 
        l.updated_at,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        COUNT(i.id) AS sku_count,
        COALESCE(SUM(i.quantity), 0) AS total_units
      FROM locations l
      INNER JOIN warehouses w ON w.id = l.warehouse_id
      LEFT JOIN inventory i ON i.location_id = l.id
    `;
    const params = [];

    if (warehouseId) {
      sql += ' WHERE l.warehouse_id = ?';
      params.push(warehouseId);
    }

    sql += ' GROUP BY l.id ORDER BY w.code ASC, l.code ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        l.id, 
        l.warehouse_id, 
        l.name, 
        l.code, 
        l.status, 
        l.created_at, 
        l.updated_at,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        COUNT(i.id) AS sku_count,
        COALESCE(SUM(i.quantity), 0) AS total_units
      FROM locations l
      INNER JOIN warehouses w ON w.id = l.warehouse_id
      LEFT JOIN inventory i ON i.location_id = l.id
      WHERE l.id = ?
      GROUP BY l.id
    `, [id]);
    return rows[0] || null;
  },

  async findByWarehouseAndCode(warehouseId, code) {
    const [rows] = await pool.query(
      'SELECT id, warehouse_id, name, code, status FROM locations WHERE warehouse_id = ? AND code = ?',
      [warehouseId, code.trim().toUpperCase()]
    );
    return rows[0] || null;
  },

  async countInventory(id) {
    const [rows] = await pool.query(
      'SELECT COALESCE(SUM(quantity), 0) AS total_units FROM inventory WHERE location_id = ?',
      [id]
    );
    return parseFloat(rows[0].total_units) || 0;
  },

  async create({ warehouse_id, name, code, status = 'ACTIVE' }) {
    const [result] = await pool.query(
      'INSERT INTO locations (warehouse_id, name, code, status) VALUES (?, ?, ?, ?)',
      [warehouse_id, name.trim(), code.trim().toUpperCase(), status]
    );
    return this.findById(result.insertId);
  },

  async update(id, { warehouse_id, name, code, status = 'ACTIVE' }) {
    await pool.query(
      'UPDATE locations SET warehouse_id = ?, name = ?, code = ?, status = ? WHERE id = ?',
      [warehouse_id, name.trim(), code.trim().toUpperCase(), status, id]
    );
    return this.findById(id);
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM locations WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = Location;
