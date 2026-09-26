const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { sendError, HTTP_STATUS } = require('../utils/responseHandler');

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'stocksense_token';
const JWT_SECRET = process.env.JWT_SECRET || 'stocksense_dev_fallback_secret_key_123';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT token for a user
 * @param {object} user
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Set HttpOnly cookie on response
 * @param {import('express').Response} res
 * @param {string} token
 */
function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  });
}

/**
 * Clear HttpOnly auth cookie
 * @param {import('express').Response} res
 */
function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
  });
}

/**
 * requireAuth middleware
 * Validates HttpOnly cookie or Authorization Bearer header
 */
async function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.[COOKIE_NAME];

    // Also support Authorization header for flexibility with external testing / curl
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please sign in.', HTTP_STATUS.UNAUTHORIZED);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return sendError(res, 'Invalid or expired authentication token. Please sign in again.', HTTP_STATUS.UNAUTHORIZED);
    }

    // Look up active user in DB
    const [rows] = await pool.query(
      'SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return sendError(res, 'User session not found.', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = rows[0];

    if (user.status !== 'ACTIVE') {
      return sendError(res, 'Account is inactive. Please contact your system administrator.', HTTP_STATUS.FORBIDDEN);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('[AuthMiddleware Error]:', error);
    return sendError(res, 'Authentication verification failed.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * requireRole middleware factory
 * @param  {...string} roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden: role "${req.user.role}" does not have permission for this resource.`,
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
}

module.exports = {
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  requireRole,
  COOKIE_NAME,
};
