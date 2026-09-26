const { pool } = require('../config/db');

const User = {
  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, role, status, created_at, updated_at FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, email, passwordHash, role = 'INVENTORY_MANAGER', status = 'ACTIVE' }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), passwordHash, role, status]
    );
    return this.findById(result.insertId);
  },

  async updatePassword(id, passwordHash) {
    const [result] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );
    return result.affectedRows > 0;
  },

  async createPasswordReset(email, otpCode, expiresAt) {
    // Invalidate previous unused resets for this email
    await pool.query(
      'UPDATE password_resets SET used = 1 WHERE email = ? AND used = 0',
      [email.toLowerCase().trim()]
    );

    const [result] = await pool.query(
      'INSERT INTO password_resets (email, otp_code, expires_at, used) VALUES (?, ?, ?, 0)',
      [email.toLowerCase().trim(), otpCode, expiresAt]
    );
    return result.insertId;
  },

  async findValidPasswordReset(email, otpCode) {
    const [rows] = await pool.query(
      `SELECT id, email, otp_code, expires_at, used 
       FROM password_resets 
       WHERE email = ? AND otp_code = ? AND used = 0 AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase().trim(), otpCode.trim()]
    );
    return rows[0] || null;
  },

  async markPasswordResetUsed(id) {
    const [result] = await pool.query(
      'UPDATE password_resets SET used = 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = User;
