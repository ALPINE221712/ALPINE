const { pool } = require('../config/db');

const Transfer = {
  async findAll({ source_warehouse_id = null, destination_warehouse_id = null, status = null, search = '' } = {}) {
    let sql = `
      SELECT 
        t.id,
        t.transfer_number,
        t.source_warehouse_id,
        sw.name AS source_warehouse_name,
        sw.code AS source_warehouse_code,
        t.source_location_id,
        sl.name AS source_location_name,
        sl.code AS source_location_code,
        t.destination_warehouse_id,
        dw.name AS destination_warehouse_name,
        dw.code AS destination_warehouse_code,
        t.destination_location_id,
        dl.name AS destination_location_name,
        dl.code AS destination_location_code,
        t.status,
        t.created_by,
        u.name AS created_by_name,
        t.created_at,
        t.updated_at,
        COUNT(ti.id) AS total_lines,
        COALESCE(SUM(ti.quantity), 0) AS total_quantity
      FROM transfers t
      INNER JOIN warehouses sw ON sw.id = t.source_warehouse_id
      INNER JOIN locations sl ON sl.id = t.source_location_id
      INNER JOIN warehouses dw ON dw.id = t.destination_warehouse_id
      INNER JOIN locations dl ON dl.id = t.destination_location_id
      INNER JOIN users u ON u.id = t.created_by
      LEFT JOIN transfer_items ti ON ti.transfer_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (source_warehouse_id) {
      sql += ' AND t.source_warehouse_id = ?';
      params.push(source_warehouse_id);
    }

    if (destination_warehouse_id) {
      sql += ' AND t.destination_warehouse_id = ?';
      params.push(destination_warehouse_id);
    }

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      sql += ' AND t.transfer_number LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    sql += ' GROUP BY t.id ORDER BY t.created_at DESC';

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
        t.id,
        t.transfer_number,
        t.source_warehouse_id,
        sw.name AS source_warehouse_name,
        sw.code AS source_warehouse_code,
        t.source_location_id,
        sl.name AS source_location_name,
        sl.code AS source_location_code,
        t.destination_warehouse_id,
        dw.name AS destination_warehouse_name,
        dw.code AS destination_warehouse_code,
        t.destination_location_id,
        dl.name AS destination_location_name,
        dl.code AS destination_location_code,
        t.status,
        t.created_by,
        u.name AS created_by_name,
        t.created_at,
        t.updated_at
      FROM transfers t
      INNER JOIN warehouses sw ON sw.id = t.source_warehouse_id
      INNER JOIN locations sl ON sl.id = t.source_location_id
      INNER JOIN warehouses dw ON dw.id = t.destination_warehouse_id
      INNER JOIN locations dl ON dl.id = t.destination_location_id
      INNER JOIN users u ON u.id = t.created_by
      WHERE t.id = ?`,
      [id]
    );

    if (!rows[0]) return null;

    const items = await this.findItems(id, client);
    return {
      ...rows[0],
      items,
    };
  },

  async findItems(transferId, client = pool) {
    const [rows] = await client.query(
      `SELECT 
        ti.id,
        ti.transfer_id,
        ti.product_id,
        p.name AS product_name,
        p.sku,
        p.unit_of_measure,
        ti.quantity,
        ti.created_at
      FROM transfer_items ti
      INNER JOIN products p ON p.id = ti.product_id
      WHERE ti.transfer_id = ?
      ORDER BY ti.id ASC`,
      [transferId]
    );

    return rows.map((r) => ({
      ...r,
      quantity: parseFloat(r.quantity) || 0,
    }));
  },

  async findByNumber(transferNumber) {
    const [rows] = await pool.query(
      'SELECT id, transfer_number, status FROM transfers WHERE transfer_number = ?',
      [transferNumber.trim().toUpperCase()]
    );
    return rows[0] || null;
  },

  async create(
    {
      transfer_number,
      source_warehouse_id,
      source_location_id,
      destination_warehouse_id,
      destination_location_id,
      status = 'DRAFT',
      created_by,
    },
    client = pool
  ) {
    const [result] = await client.query(
      `INSERT INTO transfers (
        transfer_number,
        source_warehouse_id,
        source_location_id,
        destination_warehouse_id,
        destination_location_id,
        status,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        transfer_number.trim().toUpperCase(),
        source_warehouse_id,
        source_location_id,
        destination_warehouse_id,
        destination_location_id,
        status,
        created_by,
      ]
    );
    return result.insertId;
  },

  async addItem({ transfer_id, product_id, quantity }, client = pool) {
    const [result] = await client.query(
      `INSERT INTO transfer_items (transfer_id, product_id, quantity)
       VALUES (?, ?, ?)`,
      [transfer_id, product_id, quantity]
    );
    return result.insertId;
  },

  async update(id, updates = {}, client = pool) {
    const fields = [];
    const values = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const [result] = await client.query(
      `UPDATE transfers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },
};

module.exports = Transfer;
