/**
 * Standardized API Response Utilities
 * Ensures consistent JSON response structure across all endpoints.
 */

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Send a standardized success response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {number} statusCode
 * @param {string} [message]
 */
function sendSuccess(res, data = null, statusCode = HTTP_STATUS.OK, message = null) {
  const payload = { success: true };
  if (message) payload.message = message;
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
}

/**
 * Send a standardized error response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 * @param {any} [details]
 */
function sendError(res, message = 'An error occurred', statusCode = HTTP_STATUS.BAD_REQUEST, details = null) {
  const payload = {
    success: false,
    message,
  };
  if (details && process.env.NODE_ENV !== 'production') {
    payload.details = details;
  }
  return res.status(statusCode).json(payload);
}

module.exports = {
  HTTP_STATUS,
  sendSuccess,
  sendError,
};
