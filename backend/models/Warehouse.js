const { pool } = require('../config/db');

const Warehouse = {
  async findAll() {
    const [rows] = await pool.query(`
      SELECT 
        w.id, 
        w.name, 
        w.code, 
        w.address, 
        w.status, 
        w.created_at, 
        w.updated_at,
        COUNT(l.id) AS location_count,
        COALESCE(SUM(i.quantity), 0) AS total_inventory_units
      FROM warehouses w
      LEFT JOIN locations l ON l.warehouse_id = w.id
      LEFT JOIN inventory i ON i.location_id = l.id
      GROUP BY w.id
      ORDER BY w.code ASC
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        w.id, 
        w.name, 
        w.code, 
        w.address, 
        w.status, 
        w.created_at, 
        w.updated_at,
        COUNT(l.id) AS location_count,
        COALESCE(SUM(i.quantity), 0) AS total_inventory_units
      FROM warehouses w
      LEFT JOIN locations l ON l.warehouse_id = w.id
      LEFT JOIN inventory i ON i.location_id = l.id
      WHERE w.id = ?
      GROUP BY w.id
    `, [id]);
    return rows[0] || null;
  },

  async findByCode(code) {
    const [rows] = await pool.query(
      'SELECT id, name, code, address, status FROM warehouses WHERE code = ?',
      [code.trim().toUpperCase()]
    );
    return rows[0] || null;
  },

  async countLocations(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM locations WHERE warehouse_id = ?',
      [id]
    );
    return rows[0].count;
  },

  async create({ name, code, address = null, status = 'ACTIVE' }) {
    const [result] = await pool.query(
      'INSERT INTO warehouses (name, code, address, status) VALUES (?, ?, ?, ?)',
      [name.trim(), code.trim().toUpperCase(), address, status]
    );
    return this.findById(result.insertId);
  },

  async update(id, { name, code, address = null, status = 'ACTIVE' }) {
    await pool.query(
      'UPDATE warehouses SET name = ?, code = ?, address = ?, status = ? WHERE id = ?',
      [name.trim(), code.trim().toUpperCase(), address, status, id]
    );
    return this.findById(id);
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM warehouses WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = Warehouse;
