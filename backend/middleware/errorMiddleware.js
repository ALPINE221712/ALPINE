const { sendError, HTTP_STATUS } = require('../utils/responseHandler');

/**
 * 404 Not Found Middleware
 */
function notFoundHandler(req, res, next) {
  return sendError(res, `Endpoint not found: ${req.method} ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND);
}

/**
 * Centralized Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  // Log server-side error
  console.error(`[Server Error] ${req.method} ${req.url}:`, err);

  // MySQL specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'A record with this identifier already exists (duplicate entry).', HTTP_STATUS.CONFLICT);
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    return sendError(
      res,
      'Cannot execute operation due to foreign key constraint relationship.',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (err.code === 'ECONNREFUSED') {
    return sendError(res, 'Database connection is temporarily unavailable.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const statusCode = err.status || err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, process.env.NODE_ENV !== 'production' ? err.stack : undefined);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
