const { pool } = require('../config/db');

const Category = {
  async findAll() {
    const [rows] = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.created_at, 
        c.updated_at,
        COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.created_at, 
        c.updated_at,
        COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);
    return rows[0] || null;
  },

  async findByName(name) {
    const [rows] = await pool.query(
      'SELECT id, name, description FROM categories WHERE name = ?',
      [name.trim()]
    );
    return rows[0] || null;
  },

  async countProducts(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM products WHERE category_id = ?',
      [id]
    );
    return rows[0].count;
  },

  async create({ name, description = null }) {
    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name.trim(), description]
    );
    return this.findById(result.insertId);
  },

  async update(id, { name, description = null }) {
    await pool.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name.trim(), description, id]
    );
    return this.findById(id);
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = Category;
