const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authService = {
  /**
   * Register a new operator / user
   */
  async signup({ name, email, password, role = 'INVENTORY_MANAGER' }) {
    if (!name || !name.trim()) {
      const err = new Error('Full name is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!email || !email.trim()) {
      const err = new Error('Work email is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      const err = new Error('Please provide a valid work email format (e.g., user@company.com).');
      err.statusCode = 400;
      throw err;
    }

    if (!password || password.length < 6) {
      const err = new Error('Password must be at least 6 characters in length.');
      err.statusCode = 400;
      throw err;
    }

    const allowedRoles = ['INVENTORY_MANAGER', 'WAREHOUSE_STAFF'];
    const assignedRole = allowedRoles.includes(role) ? role : 'INVENTORY_MANAGER';

    // Duplicate check
    const existing = await User.findByEmail(email);
    if (existing) {
      const err = new Error('An account with this email address already exists.');
      err.statusCode = 409;
      throw err;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await User.create({
      name: name.trim(),
      email: email.trim(),
      passwordHash,
      role: assignedRole,
      status: 'ACTIVE',
    });

    const token = generateToken(newUser);

    // Sanitize user object (omit password_hash)
    const { password_hash, ...safeUser } = newUser;

    return { user: safeUser, token };
  },

  /**
   * Authenticate user credentials
   */
  async login({ email, password }) {
    if (!email || !email.trim()) {
      const err = new Error('Operator email is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!password) {
      const err = new Error('Password is required.');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    if (user.status !== 'ACTIVE') {
      const err = new Error('Account is inactive. Please contact your system administrator.');
      err.statusCode = 403;
      throw err;
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    return { user: safeUser, token };
  },

  /**
   * Generate OTP for password recovery
   */
  async forgotPassword(email) {
    if (!email || !email.trim()) {
      const err = new Error('Registered email is required.');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findByEmail(email);
    if (!user) {
      const err = new Error('No active account found with this email address.');
      err.statusCode = 404;
      throw err;
    }

    // Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    await User.createPasswordReset(email, otpCode, expiresAt);

    return {
      message: `A 6-digit verification code has been dispatched to ${email.trim()}.`,
      dev_otp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    };
  },

  /**
   * Verify provided OTP code
   */
  async verifyOtp(email, otp) {
    if (!email || !otp) {
      const err = new Error('Email and OTP code are required.');
      err.statusCode = 400;
      throw err;
    }

    const resetRecord = await User.findValidPasswordReset(email, otp);
    if (!resetRecord) {
      const err = new Error('Invalid or expired verification code. Please request a new OTP.');
      err.statusCode = 400;
      throw err;
    }

    return { valid: true };
  },

  /**
   * Reset user password using verified OTP
   */
  async resetPassword(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
      const err = new Error('Email, verification code, and new password are required.');
      err.statusCode = 400;
      throw err;
    }

    if (newPassword.length < 6) {
      const err = new Error('New password must be at least 6 characters in length.');
      err.statusCode = 400;
      throw err;
    }

    const resetRecord = await User.findValidPasswordReset(email, otp);
    if (!resetRecord) {
      const err = new Error('Invalid or expired verification code.');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findByEmail(email);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await User.updatePassword(user.id, newPasswordHash);
    await User.markPasswordResetUsed(resetRecord.id);

    return { message: 'Password has been successfully updated. Please sign in.' };
  },
};

module.exports = authService;
